import { randomBytes, randomUUID } from 'node:crypto';

interface ApiRequest {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  setHeader: (name: string, value: string) => void;
  json: (body: unknown) => void;
}

interface StoredRoom {
  code: string;
  ownerToken: string;
  sharedBy: string;
  trip: Record<string, unknown>;
  updatedAt: number;
}

const ROOM_TTL_SECONDS = 60 * 60 * 24 * 180;
const ROOM_PREFIX = 'waylo:trip-room:';
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function sendJson(response: ApiResponse, body: unknown, status = 200) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.status(status).json(body);
}

function redisConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}

async function redis(command: Array<string | number>): Promise<unknown> {
  const config = redisConfig();
  if (!config) throw new Error('ROOM_STORAGE_NOT_CONFIGURED');
  const response = await fetch(config.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  if (!response.ok) throw new Error('ROOM_STORAGE_FAILED');
  const body = (await response.json()) as { result?: unknown; error?: string };
  if (body.error) throw new Error('ROOM_STORAGE_FAILED');
  return body.result;
}

function normalizeCode(value: unknown): string {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

function makeCode(): string {
  const bytes = randomBytes(6);
  return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join('');
}

async function getRoom(code: string): Promise<StoredRoom | null> {
  const value = await redis(['GET', `${ROOM_PREFIX}${code}`]);
  if (typeof value !== 'string') return null;
  try {
    return JSON.parse(value) as StoredRoom;
  } catch {
    return null;
  }
}

async function storeRoom(room: StoredRoom): Promise<void> {
  await redis(['SET', `${ROOM_PREFIX}${room.code}`, JSON.stringify(room), 'EX', ROOM_TTL_SECONDS]);
}

function parseBody(body: unknown): Record<string, unknown> | null {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return body && typeof body === 'object' ? (body as Record<string, unknown>) : null;
}

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  if (!redisConfig()) {
    sendJson(response, { error: 'Trip rooms need Redis storage connected in Vercel.' }, 503);
    return;
  }

  try {
    if (request.method === 'GET') {
      const queryCode = request.query?.code;
      const code = normalizeCode(Array.isArray(queryCode) ? queryCode[0] : queryCode);
      if (!/^[A-Z2-9]{6}$/.test(code)) {
        sendJson(response, { error: 'Enter a valid 6-character room code.' }, 400);
        return;
      }
      const room = await getRoom(code);
      if (!room) {
        sendJson(response, { error: 'Trip room not found. Check the code and try again.' }, 404);
        return;
      }
      sendJson(response, {
        code: room.code,
        sharedBy: room.sharedBy,
        trip: room.trip,
        updatedAt: room.updatedAt,
      });
      return;
    }

    if (request.method === 'POST') {
      const body = parseBody(request.body);
      const trip = body?.trip;
      const serializedTrip = trip ? JSON.stringify(trip) : '';
      if (!body || !trip || typeof trip !== 'object' || serializedTrip.length > 200_000) {
        sendJson(response, { error: 'Valid trip data is required.' }, 400);
        return;
      }

      const requestedCode = normalizeCode(body.code);
      const requestedToken = typeof body.ownerToken === 'string' ? body.ownerToken : '';
      let code = requestedCode;
      let ownerToken = requestedToken;

      if (code || ownerToken) {
        if (!/^[A-Z2-9]{6}$/.test(code) || !ownerToken) {
          sendJson(response, { error: 'Invalid room credentials.' }, 403);
          return;
        }
        const existing = await getRoom(code);
        if (!existing || existing.ownerToken !== ownerToken) {
          sendJson(response, { error: 'You no longer have permission to update this room.' }, 403);
          return;
        }
      } else {
        for (let attempt = 0; attempt < 8; attempt += 1) {
          const candidate = makeCode();
          if (!(await getRoom(candidate))) {
            code = candidate;
            break;
          }
        }
        if (!code) throw new Error('ROOM_CODE_FAILED');
        ownerToken = randomUUID();
      }

      const updatedAt = Date.now();
      await storeRoom({
        code,
        ownerToken,
        sharedBy: typeof body.sharedBy === 'string' ? body.sharedBy.slice(0, 80) : 'A friend',
        trip: trip as Record<string, unknown>,
        updatedAt,
      });
      sendJson(response, { code, ownerToken, updatedAt });
      return;
    }

    sendJson(response, { error: 'Method not allowed' }, 405);
  } catch (error) {
    console.error(
      JSON.stringify({
        message: 'Trip room request failed',
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    sendJson(response, { error: 'Trip rooms are temporarily unavailable.' }, 502);
  }
}
