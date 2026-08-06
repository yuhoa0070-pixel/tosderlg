import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import L from 'leaflet';
import { meDotIcon } from './useLeafletMap';
import { getTelegramLocation, hasTelegramLocationManager, openTelegramLocationSettings } from '../lib/telegram';

const TELEGRAM_POLL_MS = 4000;
const MAX_USABLE_ACCURACY_METERS = 750;

interface AcceptedPosition {
  lat: number;
  lng: number;
  accuracy: number | null;
}

function validCoordinates(latitude: number, longitude: number): boolean {
  return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
}

function accuracyMessage(accuracy: number | null): string {
  if (accuracy === null) return 'Tracking your location';
  return `Tracking your location · accurate to about ${Math.max(1, Math.round(accuracy))} m`;
}

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
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const lastPositionRef = useRef<AcceptedPosition | null>(null);
  const hasCenteredRef = useRef(false);
  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;

  const applyPosition = useCallback(
    (latitude: number, longitude: number, rawAccuracy: number | null) => {
      const map = mapRef.current;
      if (!map || !validCoordinates(latitude, longitude)) {
        onStatusRef.current('The device returned an invalid location. Try again.');
        return false;
      }

      const accuracy = rawAccuracy !== null && Number.isFinite(rawAccuracy) && rawAccuracy > 0 ? rawAccuracy : null;
      if (accuracy !== null && accuracy > MAX_USABLE_ACCURACY_METERS) {
        onStatusRef.current(
          `GPS accuracy is too low (${Math.round(accuracy)} m). Move near a window or enable Precise Location.`,
        );
        return false;
      }

      const previous = lastPositionRef.current;
      const nextLatLng = L.latLng(latitude, longitude);
      if (previous) {
        const jumpMeters = nextLatLng.distanceTo([previous.lat, previous.lng]);
        const previousAccuracy = previous.accuracy ?? MAX_USABLE_ACCURACY_METERS;
        const nextAccuracy = accuracy ?? MAX_USABLE_ACCURACY_METERS;
        if (jumpMeters > 3000 && nextAccuracy >= previousAccuracy) {
          onStatusRef.current('Ignoring an inaccurate GPS jump while finding a better signal.');
          return false;
        }
      }

      if (meMarkerRef.current) {
        meMarkerRef.current.setLatLng(nextLatLng);
      } else {
        meMarkerRef.current = L.marker(nextLatLng, { icon: meDotIcon(), zIndexOffset: 1000 }).addTo(map);
      }

      if (accuracy !== null) {
        if (accuracyCircleRef.current) {
          accuracyCircleRef.current.setLatLng(nextLatLng).setRadius(accuracy);
        } else {
          accuracyCircleRef.current = L.circle(nextLatLng, {
            radius: accuracy,
            color: '#2ecc71',
            weight: 1,
            opacity: 0.5,
            fillColor: '#2ecc71',
            fillOpacity: 0.1,
            interactive: false,
          }).addTo(map);
        }
      } else if (accuracyCircleRef.current) {
        accuracyCircleRef.current.remove();
        accuracyCircleRef.current = null;
      }

      const centerDistance = map.getCenter().distanceTo(nextLatLng);
      if (!hasCenteredRef.current) {
        map.flyTo(nextLatLng, 16, { animate: true, duration: 0.8 });
        hasCenteredRef.current = true;
      } else if (centerDistance > Math.max(40, (accuracy ?? 30) * 0.75)) {
        map.panTo(nextLatLng, { animate: true, duration: 0.55, easeLinearity: 0.2 });
      }
      lastPositionRef.current = { lat: latitude, lng: longitude, accuracy };
      onStatusRef.current(accuracyMessage(accuracy));
      return true;
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
    if (meMarkerRef.current) {
      meMarkerRef.current.remove();
      meMarkerRef.current = null;
    }
    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.remove();
      accuracyCircleRef.current = null;
    }
    lastPositionRef.current = null;
    hasCenteredRef.current = false;
    setActive(false);
  }, []);

  const startBrowserGeolocation = useCallback(() => {
    setCanOpenSettings(false);
    if (!navigator.geolocation) {
      onStatusRef.current("Location isn't available in this browser");
      return;
    }
    hasCenteredRef.current = false;
    lastPositionRef.current = null;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => applyPosition(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
      (error) => {
        stop();
        onStatusRef.current(
          error.code === error.PERMISSION_DENIED
            ? 'Location access is off. Allow it in your device settings and try again.'
            : 'Could not get a reliable location. Check that GPS and Precise Location are enabled.',
        );
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
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
    lastPositionRef.current = null;
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
    const firstApplied = applyPosition(first.lat, first.lng, first.accuracy);
    setCanOpenSettings(!firstApplied && first.accuracy !== null && first.accuracy > MAX_USABLE_ACCURACY_METERS);
    pollIntervalRef.current = setInterval(async () => {
      const loc = await getTelegramLocation();
      if (loc.status === 'success') {
        const applied = applyPosition(loc.lat, loc.lng, loc.accuracy);
        setCanOpenSettings(!applied && loc.accuracy !== null && loc.accuracy > MAX_USABLE_ACCURACY_METERS);
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
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.remove();
        accuracyCircleRef.current = null;
      }
    };
  }, []);

  return { active, toggle, canOpenSettings, openSettings };
}
