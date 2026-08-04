import type { GeoCenter } from '../types';
import { DEFAULT_CENTER } from './constants';

export type LatLngTuple = [number, number];

export function haversine(a: LatLngTuple, b: LatLngTuple): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export function pathDistanceKm(path: LatLngTuple[]): number {
  let d = 0;
  for (let i = 1; i < path.length; i++) d += haversine(path[i - 1], path[i]);
  return d;
}

export function jitteredCoords(center: GeoCenter | null | undefined): GeoCenter {
  const c = center || DEFAULT_CENTER;
  return { lat: c.lat + (Math.random() - 0.5) * 0.02, lng: c.lng + (Math.random() - 0.5) * 0.02 };
}

export async function fetchWalkingRoute(a: GeoCenter, b: GeoCenter): Promise<LatLngTuple[]> {
  try {
    const url = `https://router.project-osrm.org/route/v1/foot/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometry=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    const coords: [number, number][] | undefined = data?.routes?.[0]?.geometry?.coordinates;
    if (!coords || !coords.length) throw new Error('no route');
    return coords.map((c) => [c[1], c[0]] as LatLngTuple); // to [lat,lng]
  } catch {
    return [
      [a.lat, a.lng],
      [b.lat, b.lng],
    ]; // fallback: straight segment
  }
}
