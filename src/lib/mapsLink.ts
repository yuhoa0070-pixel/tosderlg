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
    const res = await fetch('https://corsproxy.io/?url=' + encodeURIComponent(url));
    if (!res.ok) return null;
    const finalUrl = res.url;
    if (finalUrl && finalUrl !== url) return finalUrl;
    const text = await res.text();
    const m = text.match(/https:\/\/www\.google\.com\/maps[^"'\s]*/);
    return m ? m[0] : null;
  } catch {
    return null;
  }
}
