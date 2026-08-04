import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import L from 'leaflet';
import { meDotIcon } from './useLeafletMap';

/**
 * Ports the original's live-location tracking (startLiveTracking /
 * stopLiveTracking / meDotIcon) using navigator.geolocation.watchPosition.
 */
export function useLiveLocation(mapRef: RefObject<L.Map | null>, onStatus: (msg: string) => void) {
  const [active, setActive] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const meMarkerRef = useRef<L.Marker | null>(null);
  const hasCenteredRef = useRef(false);
  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setActive(false);
  }, []);

  const start = useCallback(() => {
    if (!navigator.geolocation) {
      onStatusRef.current("Location isn't available in this browser");
      return;
    }
    hasCenteredRef.current = false;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const map = mapRef.current;
        if (!map) return;
        if (meMarkerRef.current) {
          meMarkerRef.current.setLatLng([latitude, longitude]);
        } else {
          meMarkerRef.current = L.marker([latitude, longitude], { icon: meDotIcon(), zIndexOffset: 1000 }).addTo(map);
        }
        if (!hasCenteredRef.current) {
          map.flyTo([latitude, longitude], 16, { animate: true, duration: 0.8 });
          hasCenteredRef.current = true;
          onStatusRef.current('Tracking your location');
        }
      },
      () => {
        stop();
        onStatusRef.current('Could not get your location — check location access is allowed for this page');
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    setActive(true);
  }, [mapRef, stop]);

  const toggle = useCallback(() => {
    if (watchIdRef.current !== null) stop();
    else start();
  }, [start, stop]);

  // Clean up any active watch + the "me" marker on unmount (map view swap).
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (meMarkerRef.current) {
        meMarkerRef.current.remove();
        meMarkerRef.current = null;
      }
    };
  }, []);

  return { active, toggle };
}
