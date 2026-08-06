import type { GeoCenter } from '../types';

export interface ResolvedMapLink {
  url: string;
  coords: GeoCenter;
}

export function parseGoogleMapsLink(url: string | null | undefined): GeoCenter | null {
  if (!url) return null;
  try {
    let normalized = url.trim();
    try {
      normalized = decodeURIComponent(normalized);
    } catch {
      // Keep the original text when a pasted URL contains a malformed escape.
    }

    const coordinateValues = (latValue: string, lngValue: string): GeoCenter | null => {
      const lat = Number(latValue);
      const lng = Number(lngValue);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
      return { lat, lng };
    };

    const coordinates = (match: RegExpMatchArray | null): GeoCenter | null =>
      match ? coordinateValues(match[1], match[2]) : null;

    const lastCoordinates = (pattern: RegExp): GeoCenter | null => {
      const matches = Array.from(normalized.matchAll(pattern));
      for (let index = matches.length - 1; index >= 0; index -= 1) {
        const parsed = coordinates(matches[index]);
        if (parsed) return parsed;
      }
      return null;
    };

    const number = '(-?\\d{1,3}(?:\\.\\d+)?)';
    // Explicit destination/query coordinates represent the shared destination,
    // so they must win over an @lat,lng camera position.
    let parsed = coordinates(
      normalized.match(new RegExp(`[?&]destination=\\(?(?:loc:)?${number}\\s*,\\s*${number}`, 'i')),
    );
    if (parsed) return parsed;
    parsed = coordinates(
      normalized.match(new RegExp(`[?&](?:q|query|ll|center)=\\(?(?:loc:)?${number}\\s*,\\s*${number}`, 'i')),
    );
    if (parsed) return parsed;
    parsed = coordinates(normalized.match(new RegExp(`/place/${number},${number}(?:[/@?]|$)`, 'i')));
    if (parsed) return parsed;

    // Google place URLs can contain several !3d/!4d pairs. The destination is
    // the last pair; the first can belong to a viewport or intermediate result.
    parsed = lastCoordinates(new RegExp(`!3d${number}!4d${number}`, 'gi'));
    if (parsed) return parsed;

    // Some older links encode longitude before latitude.
    const reversedMatches = Array.from(normalized.matchAll(new RegExp(`!2d${number}!3d${number}`, 'gi')));
    for (let index = reversedMatches.length - 1; index >= 0; index -= 1) {
      const match = reversedMatches[index];
      parsed = coordinateValues(match[2], match[1]);
      if (parsed) return parsed;
    }

    // @lat,lng is only the map camera center, so use it as the final fallback.
    parsed = coordinates(normalized.match(new RegExp(`@${number},${number}`, 'i')));
    if (parsed) return parsed;
  } catch {
    // ignore
  }
  return null;
}

export function isShortMapsLink(url: string): boolean {
  return /goo\.gl\/maps|maps\.app\.goo\.gl/i.test(url);
}

export async function resolveShortLink(url: string): Promise<ResolvedMapLink | null> {
  try {
    const endpoint = new URL('/api/resolve-map-link', window.location.origin);
    endpoint.searchParams.set('url', url);
    const res = await fetch(endpoint);
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (
      typeof data === 'object' &&
      data !== null &&
      'url' in data &&
      typeof data.url === 'string'
    ) {
      const responseCoords =
        'lat' in data &&
        'lng' in data &&
        typeof data.lat === 'number' &&
        typeof data.lng === 'number' &&
        Number.isFinite(data.lat) &&
        Number.isFinite(data.lng) &&
        Math.abs(data.lat) <= 90 &&
        Math.abs(data.lng) <= 180
          ? { lat: data.lat, lng: data.lng }
          : parseGoogleMapsLink(data.url);
      if (responseCoords) return { url: data.url, coords: responseCoords };
    }
    return null;
  } catch {
    return null;
  }
}
