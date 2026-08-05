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

// City-level reverse geocode, for filling a trip's Destination field from
// GPS coordinates — unlike reverseGeocode() below (zoom=17, tuned for POI/
// street-level stop names), this asks for city-level detail and prefers
// "City, Country" over a street address.
export async function reverseGeocodeCity(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
    );
    const data = await res.json();
    const a = data?.address;
    if (!a) return null;
    const city = a.city || a.town || a.village || a.municipality || a.county;
    if (city && a.country) return `${city}, ${a.country}`;
    return city || a.country || (data.display_name ? data.display_name.split(',')[0] : null);
  } catch {
    return null;
  }
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
