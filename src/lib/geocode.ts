import type { GeoCenter } from '../types';
import { DEFAULT_CENTER } from './constants';

export interface PlaceSearchResult extends GeoCenter {
  id: string;
  name: string;
  address: string;
  category: string;
}

interface NominatimSearchItem {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  type?: string;
}

export async function searchPlaces(query: string, language: 'en' | 'km' = 'en'): Promise<PlaceSearchResult[]> {
  const normalized = query.trim();
  if (normalized.length < 2) return [];

  const endpoint = new URL('https://nominatim.openstreetmap.org/search');
  endpoint.searchParams.set('format', 'jsonv2');
  endpoint.searchParams.set('limit', '5');
  endpoint.searchParams.set('addressdetails', '1');
  endpoint.searchParams.set('accept-language', language === 'km' ? 'km,en' : 'en');
  endpoint.searchParams.set('q', normalized);

  const response = await fetch(endpoint.toString(), { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('Place search is unavailable');

  const items = await response.json() as NominatimSearchItem[];
  return items.flatMap((item) => {
    const lat = Number(item.lat);
    const lng = Number(item.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];

    const parts = item.display_name.split(',').map((part) => part.trim()).filter(Boolean);
    return [{
      id: String(item.place_id),
      name: item.name?.trim() || parts[0] || normalized,
      address: parts.slice(1).join(', ') || item.display_name,
      category: item.type?.replaceAll('_', ' ') || 'place',
      lat,
      lng,
    }];
  });
}

export async function geocodeCity(dest: string): Promise<GeoCenter> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(dest)}`,
    );
    const data = await res.json();
    if (data && data[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch {
    // ignore — fall through to default center
  }
  return DEFAULT_CENTER;
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=17`,
    );
    const data = await res.json();
    if (data && data.address) {
      const a = data.address;
      return (
        a.amenity ||
        a.shop ||
        a.tourism ||
        a.building ||
        a.road ||
        (data.display_name ? data.display_name.split(',')[0] : null)
      );
    }
  } catch {
    // ignore
  }
  return null;
}
