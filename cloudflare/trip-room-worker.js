const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_PATTERN = /^[A-Z2-9]{6}$/;
const MAX_BODY_BYTES = 220_000;
const MAX_TRIP_BYTES = 200_000;
const ROOM_TTL_MS = 180 * 24 * 60 * 60 * 1000;
const SHORT_MAP_HOSTS = new Set(['maps.app.goo.gl', 'goo.gl']);

function allowedOrigin(request, env) {
  const origin = request.headers.get('Origin');
  const configured = (env.ALLOWED_ORIGINS || '*')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (!origin || configured.includes('*')) return '*';
  return configured.includes(origin) ? origin : null;
}

function responseHeaders(origin) {
  return {
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Origin': origin,
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    Vary: 'Origin',
    'X-Content-Type-Options': 'nosniff',
  };
}

function sendJson(origin, body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: responseHeaders(origin) });
}

async function readJsonBody(request) {
  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (contentLength > MAX_BODY_BYTES) throw new Error('BODY_TOO_LARGE');
  if (!request.body) throw new Error('INVALID_BODY');

  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new Error('BODY_TOO_LARGE');
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new Error('INVALID_BODY');
  }
}

function normalizeCode(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

function makeCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join('');
}

function validTrip(trip) {
  return Boolean(
    trip &&
      typeof trip === 'object' &&
      typeof trip.destination === 'string' &&
      trip.destination.length > 0 &&
      trip.destination.length <= 200 &&
      typeof trip.label === 'string' &&
      Array.isArray(trip.tripDays) &&
      trip.center &&
      Number.isFinite(trip.center.lat) &&
      Number.isFinite(trip.center.lng),
  );
}

async function getRoom(request, env, origin) {
  const code = normalizeCode(new URL(request.url).searchParams.get('code'));
  if (!CODE_PATTERN.test(code)) {
    return sendJson(origin, { error: 'Enter a valid 6-character room code.' }, 400);
  }

  const room = await env.DB.prepare(
    `SELECT code, shared_by, trip_json, updated_at
     FROM trip_rooms
     WHERE code = ? AND expires_at > ?`,
  )
    .bind(code, Date.now())
    .first();

  if (!room) {
    return sendJson(origin, { error: 'Trip room not found. Check the code and try again.' }, 404);
  }

  let trip;
  try {
    trip = JSON.parse(room.trip_json);
  } catch {
    return sendJson(origin, { error: 'This trip room contains invalid data.' }, 502);
  }

  return sendJson(origin, {
    code: room.code,
    sharedBy: room.shared_by,
    trip,
    updatedAt: room.updated_at,
  });
}

async function saveRoom(request, env, origin) {
  let body;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    const tooLarge = error instanceof Error && error.message === 'BODY_TOO_LARGE';
    return sendJson(origin, { error: tooLarge ? 'Trip data is too large.' : 'Valid trip data is required.' }, 400);
  }

  if (!body || typeof body !== 'object' || !validTrip(body.trip)) {
    return sendJson(origin, { error: 'Valid trip data is required.' }, 400);
  }

  const tripJson = JSON.stringify(body.trip);
  if (tripJson.length > MAX_TRIP_BYTES) {
    return sendJson(origin, { error: 'Trip data is too large.' }, 400);
  }

  const requestedCode = normalizeCode(body.code);
  const requestedToken = typeof body.ownerToken === 'string' ? body.ownerToken : '';
  const sharedBy = typeof body.sharedBy === 'string' && body.sharedBy.trim()
    ? body.sharedBy.trim().slice(0, 80)
    : 'A friend';
  const updatedAt = Date.now();
  const expiresAt = updatedAt + ROOM_TTL_MS;

  if (requestedCode || requestedToken) {
    if (!CODE_PATTERN.test(requestedCode) || !requestedToken || requestedToken.length > 100) {
      return sendJson(origin, { error: 'Invalid room credentials.' }, 403);
    }

    const result = await env.DB.prepare(
      `UPDATE trip_rooms
       SET shared_by = ?, trip_json = ?, updated_at = ?, expires_at = ?
       WHERE code = ? AND owner_token = ? AND expires_at > ?`,
    )
      .bind(sharedBy, tripJson, updatedAt, expiresAt, requestedCode, requestedToken, updatedAt)
      .run();

    if (!result.success || (result.meta?.changes || 0) < 1) {
      return sendJson(origin, { error: 'You no longer have permission to update this room.' }, 403);
    }

    return sendJson(origin, { code: requestedCode, ownerToken: requestedToken, updatedAt });
  }

  const ownerToken = crypto.randomUUID();
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = makeCode();
    const result = await env.DB.prepare(
      `INSERT OR IGNORE INTO trip_rooms
       (code, owner_token, shared_by, trip_json, updated_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
      .bind(code, ownerToken, sharedBy, tripJson, updatedAt, expiresAt)
      .run();

    if (result.success && (result.meta?.changes || 0) > 0) {
      return sendJson(origin, { code, ownerToken, updatedAt });
    }
  }

  return sendJson(origin, { error: 'Could not create a unique room code. Try again.' }, 503);
}

function allowedShortMapUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !SHORT_MAP_HOSTS.has(url.hostname)) return null;
    if (url.hostname === 'goo.gl' && !url.pathname.startsWith('/maps/')) return null;
    return url;
  } catch {
    return null;
  }
}

function isExpandedGoogleMapsUrl(value) {
  try {
    const url = new URL(value);
    const isGoogleHost = url.hostname === 'google.com' || url.hostname.endsWith('.google.com');
    return url.protocol === 'https:' && isGoogleHost &&
      (url.pathname.startsWith('/maps') || url.hostname === 'maps.google.com');
  } catch {
    return false;
  }
}

async function resolveMapLink(request, origin) {
  if (request.method !== 'GET') {
    return sendJson(origin, { error: 'Method not allowed.' }, 405);
  }

  const rawUrl = new URL(request.url).searchParams.get('url');
  if (!rawUrl || rawUrl.length > 2048) {
    return sendJson(origin, { error: 'A Google Maps short link is required.' }, 400);
  }

  const shortUrl = allowedShortMapUrl(rawUrl);
  if (!shortUrl) {
    return sendJson(origin, { error: 'Only Google Maps short links are supported.' }, 400);
  }

  try {
    const expandedResponse = await fetch(shortUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Waylo/1.0; +https://waylo.app)',
        'Accept-Language': 'en',
      },
    });
    const expandedUrl = expandedResponse.url;
    if (expandedResponse.body) await expandedResponse.body.cancel();
    if (!expandedResponse.ok || !expandedUrl || !isExpandedGoogleMapsUrl(expandedUrl)) {
      return sendJson(origin, { error: 'Google Maps did not return a usable location.' }, 422);
    }
    return sendJson(origin, { url: expandedUrl });
  } catch (error) {
    console.error(JSON.stringify({
      message: 'Google Maps short-link resolution failed',
      error: error instanceof Error ? error.message : String(error),
    }));
    return sendJson(origin, { error: 'Could not resolve this Google Maps link.' }, 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = allowedOrigin(request, env);
    if (!origin) return sendJson('null', { error: 'Origin not allowed.' }, 403);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: responseHeaders(origin) });

    try {
      if (url.pathname === '/api/trip-room') {
        if (request.method === 'GET') return await getRoom(request, env, origin);
        if (request.method === 'POST') return await saveRoom(request, env, origin);
        return sendJson(origin, { error: 'Method not allowed.' }, 405);
      }
      if (url.pathname === '/api/resolve-map-link') return await resolveMapLink(request, origin);
      return sendJson(origin, { error: 'API route not found.' }, 404);
    } catch (error) {
      console.error(JSON.stringify({
        message: 'Waylo API request failed',
        method: request.method,
        path: url.pathname,
        error: error instanceof Error ? error.message : String(error),
      }));
      return sendJson(origin, { error: 'Waylo services are temporarily unavailable.' }, 502);
    }
  },
};
