import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { LiveLocationMapController } from './useLeafletMap';
import { getTelegramLocation, hasTelegramLocationManager, openTelegramLocationSettings } from '../lib/telegram';

const TELEGRAM_POLL_MS = 4000;
const PRECISE_LOCATION_THRESHOLD_METERS = 750;

interface AcceptedPosition {
  lat: number;
  lng: number;
  accuracy: number | null;
}

function validCoordinates(latitude: number, longitude: number): boolean {
  return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
}

function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = toRadians(bLat - aLat);
  const dLng = toRadians(bLng - aLng);
  const lat1 = toRadians(aLat);
  const lat2 = toRadians(bLat);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function accuracyMessage(accuracy: number | null): string {
  if (accuracy === null) return 'Tracking your location';
  if (accuracy > PRECISE_LOCATION_THRESHOLD_METERS) {
    return `Tracking an approximate location · accurate to about ${Math.round(accuracy)} m. Enable Precise Location for a better result.`;
  }
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
export function useLiveLocation(mapRef: RefObject<LiveLocationMapController | null>, onStatus: (msg: string) => void) {
  const [active, setActive] = useState(false);
  const [canOpenSettings, setCanOpenSettings] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackingRequestedRef = useRef(false);
  const telegramRequestInFlightRef = useRef(false);
  const telegramMissesRef = useRef(0);
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

      const previous = lastPositionRef.current;
      if (previous) {
        const jumpMeters = distanceMeters(previous.lat, previous.lng, latitude, longitude);
        const previousAccuracy = previous.accuracy ?? PRECISE_LOCATION_THRESHOLD_METERS;
        const nextAccuracy = accuracy ?? PRECISE_LOCATION_THRESHOLD_METERS;
        if (jumpMeters > 3000 && nextAccuracy >= previousAccuracy) {
          onStatusRef.current('Ignoring an inaccurate GPS jump while finding a better signal.');
          return false;
        }
      }

      map.updateUserLocation(latitude, longitude, accuracy);
      const centerDistance = map.distanceFromCenter(latitude, longitude);
      if (!hasCenteredRef.current) {
        map.focusUserLocation(latitude, longitude, accuracy, true);
        hasCenteredRef.current = true;
      } else if (centerDistance > Math.max(40, (accuracy ?? 30) * 0.75)) {
        map.focusUserLocation(latitude, longitude, accuracy, false);
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
    mapRef.current?.clearUserLocation();
    lastPositionRef.current = null;
    hasCenteredRef.current = false;
    trackingRequestedRef.current = false;
    telegramRequestInFlightRef.current = false;
    telegramMissesRef.current = 0;
    setActive(false);
  }, [mapRef]);

  const startBrowserGeolocation = useCallback(() => {
    setCanOpenSettings(false);
    if (!navigator.geolocation) {
      trackingRequestedRef.current = false;
      setActive(false);
      onStatusRef.current("Location isn't available in this browser");
      return;
    }
    trackingRequestedRef.current = true;
    hasCenteredRef.current = false;
    lastPositionRef.current = null;

    const beginWatch = (highAccuracy: boolean) => {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => applyPosition(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
        (error) => {
          if (watchIdRef.current !== watchId) return;
          if (error.code === error.PERMISSION_DENIED) {
            stop();
            onStatusRef.current('Location access is off. Allow it in your device settings and try again.');
            return;
          }
          if (highAccuracy) {
            navigator.geolocation.clearWatch(watchId);
            watchIdRef.current = null;
            onStatusRef.current('GPS is taking longer than expected. Trying the best available live location…');
            beginWatch(false);
            return;
          }
          onStatusRef.current('Still waiting for a location. Keep GPS on and move near a window.');
        },
        highAccuracy
          ? { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
          : { enableHighAccuracy: false, maximumAge: 15000, timeout: 30000 },
      );
      watchIdRef.current = watchId;
    };

    beginWatch(true);
    setActive(true);
  }, [applyPosition, stop]);

  // A Telegram LocationManager object can exist but be non-functional (e.g.
  // older client versions log "LocationManager is not supported" instead of
  // just being absent), so this only commits to the Telegram path once the
  // first getLocation() call actually succeeds — otherwise it falls back to
  // browser geolocation rather than surfacing an error.
  const startTelegramPolling = useCallback(async () => {
    trackingRequestedRef.current = true;
    setActive(true);
    hasCenteredRef.current = false;
    lastPositionRef.current = null;
    const first = await getTelegramLocation();
    if (!trackingRequestedRef.current) return;
    if (first.status === 'denied') {
      stop();
      setCanOpenSettings(true);
      onStatusRef.current('Location access is off for Waylo. Open settings to allow it.');
      return;
    }
    if (first.status === 'unavailable') {
      startBrowserGeolocation();
      return;
    }
    setCanOpenSettings(false);
    applyPosition(first.lat, first.lng, first.accuracy);
    telegramMissesRef.current = 0;
    setCanOpenSettings(first.accuracy !== null && first.accuracy > PRECISE_LOCATION_THRESHOLD_METERS);
    pollIntervalRef.current = setInterval(async () => {
      if (telegramRequestInFlightRef.current) return;
      telegramRequestInFlightRef.current = true;
      const loc = await getTelegramLocation();
      telegramRequestInFlightRef.current = false;
      if (!trackingRequestedRef.current || pollIntervalRef.current === null) return;
      if (loc.status === 'success') {
        telegramMissesRef.current = 0;
        applyPosition(loc.lat, loc.lng, loc.accuracy);
        setCanOpenSettings(loc.accuracy !== null && loc.accuracy > PRECISE_LOCATION_THRESHOLD_METERS);
      } else {
        const denied = loc.status === 'denied';
        if (denied) {
          stop();
          setCanOpenSettings(true);
          onStatusRef.current('Location access is off for Waylo. Open settings to allow it.');
          return;
        }
        telegramMissesRef.current += 1;
        if (telegramMissesRef.current < 3) {
          onStatusRef.current('Android GPS is reconnecting… Live tracking will continue automatically.');
          return;
        }
        if (pollIntervalRef.current !== null) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        onStatusRef.current('Telegram location paused. Switching to device GPS…');
        startBrowserGeolocation();
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
    if (trackingRequestedRef.current) stop();
    else start();
  }, [start, stop]);

  const openSettings = useCallback(() => {
    if (openTelegramLocationSettings()) {
      onStatusRef.current('Allow location access, then return and tap the location button again.');
    } else {
      onStatusRef.current('Open Telegram settings and allow location access for Waylo.');
    }
  }, []);

  // Clean up any active watch/poll on unmount. The map hook owns marker cleanup.
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
    };
  }, []);

  return { active, toggle, canOpenSettings, openSettings };
}
