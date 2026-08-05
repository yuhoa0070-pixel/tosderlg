import type { GeoCenter } from '../types';
import { DEFAULT_CENTER } from './constants';

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
