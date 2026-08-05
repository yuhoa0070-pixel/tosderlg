import type { GeoCenter } from '../types';

export function parseGoogleMapsLink(url: string | null | undefined): GeoCenter | null {
  if (!url) return null;
  try {
    let m = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
    m = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
    m = url.match(/[?&](?:q|query|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
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
