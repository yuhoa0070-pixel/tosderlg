import type { GeoCenter } from '../types';

export function parseGoogleMapsLink(url: string | null | undefined): GeoCenter | null {
  if (!url) return null;
  try {
    let normalized = url.trim();
    try {
      normalized = decodeURIComponent(normalized);
    } catch {
      // Keep the original text when a pasted URL contains a malformed escape.
    }

    const coordinates = (match: RegExpMatchArray | null): GeoCenter | null => {
      if (!match) return null;
      const lat = Number(match[1]);
      const lng = Number(match[2]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
      return { lat, lng };
    };

    const number = '(-?\\d{1,3}(?:\\.\\d+)?)';
    // Place URLs often contain both pairs: !3d/!4d is the selected place,
    // while @lat,lng is only the map camera center and can be kilometres away.
    let parsed = coordinates(normalized.match(new RegExp(`!3d${number}!4d${number}`, 'i')));
    if (parsed) return parsed;
    parsed = coordinates(normalized.match(new RegExp(`@${number},${number}`, 'i')));
    if (parsed) return parsed;
    parsed = coordinates(normalized.match(new RegExp(`/place/${number},${number}(?:[/@?]|$)`, 'i')));
    if (parsed) return parsed;
    parsed = coordinates(
      normalized.match(new RegExp(`[?&](?:q|query|ll|center|destination)=\\(?(?:loc:)?${number}\\s*,\\s*${number}`, 'i')),
    );
    if (parsed) return parsed;
  } catch {
    // ignore
  }
  return null;
}

export function isShortMapsLink(url: string): boolean {
  return /goo\.gl\/maps|maps\.app\.goo\.gl/i.test(url);
}

export async function resolveShortLink(url: string): Promise<string | null> {
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
      typeof data.url === 'string' &&
      parseGoogleMapsLink(data.url)
    ) {
      return data.url;
    }
    return null;
  } catch {
    return null;
  }
}
