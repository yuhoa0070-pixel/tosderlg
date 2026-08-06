const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_PATTERN = /^[A-Z2-9]{6}$/;
const MAX_BODY_BYTES = 220_000;
const MAX_TRIP_BYTES = 200_000;
const MAX_MEMBERS_PER_ROOM = 50;
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

function normalizeMember(value) {
  if (!value || typeof value !== 'object') return null;
  const id = typeof value.id === 'string' ? value.id.trim() : '';
  const name = typeof value.name === 'string' ? value.name.trim().slice(0, 80) : '';
  if (!/^[A-Za-z0-9:_-]{8,100}$/.test(id) || !name) return null;

  let photoUrl = null;
  if (typeof value.photoUrl === 'string' && value.photoUrl.length <= 1000) {
    try {
      const url = new URL(value.photoUrl);
      if (url.protocol === 'https:') photoUrl = url.toString();
    } catch {
      // Invalid or non-HTTPS photos fall back to initials in the UI.
    }
  }
  return { id, name, photoUrl };
}

async function listRoomMembers(env, code) {
  try {
    const result = await env.DB.prepare(
      `SELECT member_id, display_name, photo_url, role, joined_at
       FROM trip_room_members
       WHERE room_code = ?
       ORDER BY CASE role WHEN 'owner' THEN 0 ELSE 1 END, joined_at ASC
       LIMIT ?`,
    )
      .bind(code, MAX_MEMBERS_PER_ROOM)
      .all();

    return (result.results || []).map((member) => ({
      id: member.member_id,
      name: member.display_name,
      photoUrl: member.photo_url || undefined,
      role: member.role,
      joinedAt: member.joined_at,
    }));
  } catch (error) {
    console.error(JSON.stringify({
      message: 'Trip room members could not be loaded',
      code,
      error: error instanceof Error ? error.message : String(error),
    }));
    return [];
  }
}

async function upsertRoomMember(env, code, member, role) {
  const now = Date.now();
  const existing = await env.DB.prepare(
    `SELECT role FROM trip_room_members WHERE room_code = ? AND member_id = ?`,
  )
    .bind(code, member.id)
    .first();

  if (!existing) {
    const count = await env.DB.prepare(
      `SELECT COUNT(*) AS total FROM trip_room_members WHERE room_code = ?`,
    )
      .bind(code)
      .first();
    if (Number(count?.total || 0) >= MAX_MEMBERS_PER_ROOM) throw new Error('ROOM_FULL');
  }

  await env.DB.prepare(
    `INSERT INTO trip_room_members
     (room_code, member_id, display_name, photo_url, role, joined_at, last_seen_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(room_code, member_id) DO UPDATE SET
       display_name = excluded.display_name,
       photo_url = excluded.photo_url,
       role = CASE WHEN trip_room_members.role = 'owner' THEN 'owner' ELSE excluded.role END,
       last_seen_at = excluded.last_seen_at`,
  )
    .bind(code, member.id, member.name, member.photoUrl, role, now, now)
    .run();
}

async function loadRoom(env, code) {
  const room = await env.DB.prepare(
    `SELECT code, shared_by, trip_json, updated_at
     FROM trip_rooms
     WHERE code = ? AND expires_at > ?`,
  )
    .bind(code, Date.now())
    .first();
  if (!room) return null;

  try {
    return { room, trip: JSON.parse(room.trip_json) };
  } catch {
    throw new Error('INVALID_ROOM_DATA');
  }
}

async function roomPayload(env, loaded) {
  return {
    code: loaded.room.code,
    sharedBy: loaded.room.shared_by,
    trip: loaded.trip,
    updatedAt: loaded.room.updated_at,
    members: await listRoomMembers(env, loaded.room.code),
  };
}

async function getRoom(request, env, origin) {
  const code = normalizeCode(new URL(request.url).searchParams.get('code'));
  if (!CODE_PATTERN.test(code)) {
    return sendJson(origin, { error: 'Enter a valid 6-character room code.' }, 400);
  }

  let loaded;
  try {
    loaded = await loadRoom(env, code);
  } catch {
    return sendJson(origin, { error: 'This trip room contains invalid data.' }, 502);
  }
  if (!loaded) {
    return sendJson(origin, { error: 'Trip room not found. Check the code and try again.' }, 404);
  }
  return sendJson(origin, await roomPayload(env, loaded));
}

async function joinRoom(request, env, origin) {
  let body;
  try {
    body = await readJsonBody(request);
  } catch {
    return sendJson(origin, { error: 'Valid member data is required.' }, 400);
  }

  const code = normalizeCode(body?.code);
  const member = normalizeMember(body?.member);
  if (!CODE_PATTERN.test(code) || !member) {
    return sendJson(origin, { error: 'A valid room code and profile are required.' }, 400);
  }

  let loaded;
  try {
    loaded = await loadRoom(env, code);
  } catch {
    return sendJson(origin, { error: 'This trip room contains invalid data.' }, 502);
  }
  if (!loaded) {
    return sendJson(origin, { error: 'Trip room not found. Check the code and try again.' }, 404);
  }

  try {
    await upsertRoomMember(env, code, member, 'member');
  } catch (error) {
    if (error instanceof Error && error.message === 'ROOM_FULL') {
      return sendJson(origin, { error: 'This trip room is full.' }, 409);
    }
    throw error;
  }
  return sendJson(origin, await roomPayload(env, loaded));
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
  const owner = normalizeMember(body.member);
  if (!owner) return sendJson(origin, { error: 'A valid owner profile is required.' }, 400);
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

    await upsertRoomMember(env, requestedCode, owner, 'owner');
    return sendJson(origin, {
      code: requestedCode,
      ownerToken: requestedToken,
      updatedAt,
      members: await listRoomMembers(env, requestedCode),
    });
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
      await upsertRoomMember(env, code, owner, 'owner');
      return sendJson(origin, {
        code,
        ownerToken,
        updatedAt,
        members: await listRoomMembers(env, code),
      });
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

function googleMapsCoordinates(value) {
  if (typeof value !== 'string' || !value) return null;
  let normalized = value.trim();
  try {
    normalized = decodeURIComponent(normalized);
  } catch {
    // Keep the original value when Google includes a malformed escape.
  }

  const number = '(-?\\d{1,3}(?:\\.\\d+)?)';
  const valid = (latValue, lngValue) => {
    const lat = Number(latValue);
    const lng = Number(lngValue);
    return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
      ? { lat, lng }
      : null;
  };
  const directPatterns = [
    new RegExp(`[?&]destination=\\(?(?:loc:)?${number}\\s*,\\s*${number}`, 'i'),
    new RegExp(`[?&](?:q|query|ll|center)=\\(?(?:loc:)?${number}\\s*,\\s*${number}`, 'i'),
    new RegExp(`/place/${number},${number}(?:[/@?]|$)`, 'i'),
  ];
  for (const pattern of directPatterns) {
    const match = normalized.match(pattern);
    const coords = match ? valid(match[1], match[2]) : null;
    if (coords) return coords;
  }

  const placeMatches = Array.from(normalized.matchAll(new RegExp(`!3d${number}!4d${number}`, 'gi')));
  for (let index = placeMatches.length - 1; index >= 0; index -= 1) {
    const coords = valid(placeMatches[index][1], placeMatches[index][2]);
    if (coords) return coords;
  }

  const reversedMatches = Array.from(normalized.matchAll(new RegExp(`!2d${number}!3d${number}`, 'gi')));
  for (let index = reversedMatches.length - 1; index >= 0; index -= 1) {
    const coords = valid(reversedMatches[index][2], reversedMatches[index][1]);
    if (coords) return coords;
  }

  const camera = normalized.match(new RegExp(`@${number},${number}`, 'i'));
  return camera ? valid(camera[1], camera[2]) : null;
}

function googleMapsUrlFromRedirect(value, baseUrl) {
  try {
    const candidate = new URL(value, baseUrl);
    if (isExpandedGoogleMapsUrl(candidate.href) || allowedShortMapUrl(candidate.href)) return candidate;

    // Google may route through its consent page. The continue parameter is
    // still validated as a Google Maps URL before it is followed or returned.
    if (candidate.hostname === 'consent.google.com') {
      const continued = candidate.searchParams.get('continue');
      if (continued && isExpandedGoogleMapsUrl(continued)) return new URL(continued);
    }
  } catch {
    // Invalid or non-Google redirect targets are intentionally ignored.
  }
  return null;
}

function googleMapsUrlFromHtml(html, baseUrl) {
  const normalized = html
    .replaceAll('\\/', '/')
    .replaceAll('\\u0026', '&')
    .replaceAll('&amp;', '&');
  const candidates = normalized.match(/https:\/\/(?:www\.)?(?:google\.com\/maps|maps\.google\.com\/)[^"'<>\s]+/gi) || [];
  for (const candidate of candidates) {
    const url = googleMapsUrlFromRedirect(candidate, baseUrl);
    if (url && isExpandedGoogleMapsUrl(url.href)) return url;
  }
  return null;
}

async function expandGoogleMapsShortUrl(shortUrl) {
  let current = shortUrl;
  for (let hop = 0; hop < 6; hop += 1) {
    const response = await fetch(current, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        // A normal mobile browser user-agent avoids Google returning a bot
        // preview page that hides the actual Maps redirect.
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    const location = response.headers.get('Location');
    if (location) {
      if (response.body) await response.body.cancel();
      const next = googleMapsUrlFromRedirect(location, current.href);
      if (!next) return null;
      if (isExpandedGoogleMapsUrl(next.href)) return next.href;
      current = next;
      continue;
    }

    if (isExpandedGoogleMapsUrl(response.url)) {
      if (response.body) await response.body.cancel();
      return response.url;
    }

    if (response.ok) {
      const html = await response.text();
      const embedded = googleMapsUrlFromHtml(html.slice(0, 750_000), current.href);
      if (embedded) return embedded.href;
    } else if (response.body) {
      await response.body.cancel();
    }
    return null;
  }
  return null;
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
    const expandedUrl = await expandGoogleMapsShortUrl(shortUrl);
    if (!expandedUrl) {
      return sendJson(origin, { error: 'Google Maps did not return a usable location.' }, 422);
    }
    const coords = googleMapsCoordinates(expandedUrl);
    if (!coords) {
      return sendJson(origin, { error: 'Google Maps did not include coordinates for this place.' }, 422);
    }
    return sendJson(origin, { url: expandedUrl, lat: coords.lat, lng: coords.lng });
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
      if (url.pathname === '/api/trip-room/join') {
        if (request.method === 'POST') return await joinRoom(request, env, origin);
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
