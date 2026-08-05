import { getTelegramLocation, hasTelegramLocationManager } from './telegram';

const BROWSER_GEOLOCATION_TIMEOUT_MS = 10000;

function getBrowserLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: BROWSER_GEOLOCATION_TIMEOUT_MS, maximumAge: 30000 },
    );
  });
}

/**
 * One-shot current position, trying Telegram's LocationManager first (more
 * reliable inside the Mini App WebView) and falling back to browser
 * geolocation — same cascade as useLiveLocation.ts, but a single fetch
 * rather than continuous tracking.
 */
export async function getCurrentLocationCoords(): Promise<{ lat: number; lng: number } | null> {
  if (hasTelegramLocationManager()) {
    const loc = await getTelegramLocation();
    if (loc) return loc;
  }
  return getBrowserLocation();
}
