import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import L from 'leaflet';
import { meDotIcon } from './useLeafletMap';
import { getTelegramLocation, hasTelegramLocationManager, openTelegramLocationSettings } from '../lib/telegram';

const TELEGRAM_POLL_MS = 4000;

/**
 * Ports the original's live-location tracking (startLiveTracking /
 * stopLiveTracking / meDotIcon) using navigator.geolocation.watchPosition.
 * Inside Telegram's Mini App, navigator.geolocation can be blocked or
 * unreliable in the WebView, so this uses Telegram's own LocationManager
 * when available instead — it has no native "watch" API, so continuous
 * tracking is done by polling getLocation() on an interval.
 */
export function useLiveLocation(mapRef: RefObject<L.Map | null>, onStatus: (msg: string) => void) {
  const [active, setActive] = useState(false);
  const [canOpenSettings, setCanOpenSettings] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const meMarkerRef = useRef<L.Marker | null>(null);
  const hasCenteredRef = useRef(false);
  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;

  const applyPosition = useCallback(
    (latitude: number, longitude: number) => {
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
    [mapRef],
  );

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (pollIntervalRef.current !== null) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setActive(false);
  }, []);

  const startBrowserGeolocation = useCallback(() => {
    setCanOpenSettings(false);
    if (!navigator.geolocation) {
      onStatusRef.current("Location isn't available in this browser");
      return;
    }
    hasCenteredRef.current = false;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => applyPosition(pos.coords.latitude, pos.coords.longitude),
      () => {
        stop();
        onStatusRef.current('Could not get your location — check location access is allowed for this page');
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    setActive(true);
  }, [applyPosition, stop]);

  // A Telegram LocationManager object can exist but be non-functional (e.g.
  // older client versions log "LocationManager is not supported" instead of
  // just being absent), so this only commits to the Telegram path once the
  // first getLocation() call actually succeeds — otherwise it falls back to
  // browser geolocation rather than surfacing an error.
  const startTelegramPolling = useCallback(async () => {
    hasCenteredRef.current = false;
    const first = await getTelegramLocation();
    if (first.status === 'denied') {
      setCanOpenSettings(true);
      onStatusRef.current('Location access is off for Waylo. Open settings to allow it.');
      return;
    }
    if (first.status === 'unavailable') {
      startBrowserGeolocation();
      return;
    }
    setCanOpenSettings(false);
    applyPosition(first.lat, first.lng);
    pollIntervalRef.current = setInterval(async () => {
      const loc = await getTelegramLocation();
      if (loc.status === 'success') {
        applyPosition(loc.lat, loc.lng);
      } else {
        stop();
        const denied = loc.status === 'denied';
        setCanOpenSettings(denied);
        onStatusRef.current(
          denied
            ? 'Location access is off for Waylo. Open settings to allow it.'
            : 'Could not get your location — check location services are available on this device',
        );
      }
    }, TELEGRAM_POLL_MS);
    setActive(true);
  }, [applyPosition, stop, startBrowserGeolocation]);

  const start = useCallback(() => {
    if (hasTelegramLocationManager()) {
      void startTelegramPolling();
    } else {
      startBrowserGeolocation();
    }
  }, [startTelegramPolling, startBrowserGeolocation]);

  const toggle = useCallback(() => {
    if (watchIdRef.current !== null || pollIntervalRef.current !== null) stop();
    else start();
  }, [start, stop]);

  const openSettings = useCallback(() => {
    if (openTelegramLocationSettings()) {
      onStatusRef.current('Allow location access, then return and tap the location button again.');
    } else {
      onStatusRef.current('Open Telegram settings and allow location access for Waylo.');
    }
  }, []);

  // Clean up any active watch/poll + the "me" marker on unmount (map view swap).
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (pollIntervalRef.current !== null) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (meMarkerRef.current) {
        meMarkerRef.current.remove();
        meMarkerRef.current = null;
      }
    };
  }, []);

  return { active, toggle, canOpenSettings, openSettings };
}
