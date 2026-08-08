import { useEffect, useRef, useState, type RefObject } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GeoCenter, Stop } from '../types';

/**
 * Emoji can be a unicode glyph, a legacy inline `data:image/...` value (old
 * persisted trips), or the new `/emoji/*.png` chip path — see
 * StopFormModal.tsx's EMOJI_CHIPS and StopCard.tsx's isImgIcon() for the
 * other two places this same 3-way check applies.
 */
function isImgEmoji(emoji: string | undefined): boolean {
  return !!emoji && (emoji.startsWith('data:image') || emoji.startsWith('/emoji/'));
}

function escapeMarkerText(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    };
    return entities[character];
  });
}

// Circular stop artwork keeps the map readable while the selected stop's
// full details live in the map card at the bottom of the screen.
export function pinDivIcon(number: number, active: boolean, emoji: string | undefined): L.DivIcon {
  const isImg = isImgEmoji(emoji);
  const markerWidth = active ? 78 : 50;
  const markerHeight = active ? 86 : 58;
  const safeEmoji = emoji ? escapeMarkerText(emoji) : '';
  const icon = emoji
    ? isImg
      ? `<img src="${safeEmoji}" alt=""/>`
      : `<span aria-hidden="true">${safeEmoji}</span>`
    : `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="m4 25 8-12 5 7 5-10 7 15H4Z"/><path d="m9 18 3-5 3 4M19 15l3-5 3 6"/></svg>`;

  return L.divIcon({
    className: 'map-stop-marker',
    html: `<div class="map-photo-marker${active ? ' active' : ''}">
      <span class="map-photo-marker-media">${icon}</span>
      <span class="map-photo-marker-number">${number}</span>
    </div>`,
    iconSize: [markerWidth, markerHeight],
    iconAnchor: [markerWidth / 2, markerHeight],
  });
}

// Search-result marker — same teardrop artwork as an active stop pin, minus
// the numbered badge since it isn't part of the itinerary yet.
function searchDivIcon(): L.DivIcon {
  return L.divIcon({
    className: 'map-stop-marker',
    html: `<div class="map-photo-marker active">
      <span class="map-photo-marker-media"><span aria-hidden="true">🧭</span></span>
    </div>`,
    iconSize: [78, 86],
    iconAnchor: [39, 86],
  });
}

// Ported verbatim from the original's meDotIcon().
export function meDotIcon(): L.DivIcon {
  return L.divIcon({ className: '', html: '<div class="me-dot"></div>', iconSize: [16, 16], iconAnchor: [8, 8] });
}

function isValidCoord(stop: Stop): boolean {
  return typeof stop.lat === 'number' && typeof stop.lng === 'number' && !Number.isNaN(stop.lat) && !Number.isNaN(stop.lng);
}

export interface LiveLocationMapController {
  clearUserLocation(): void;
  distanceFromCenter(lat: number, lng: number): number;
  focusUserLocation(lat: number, lng: number, accuracy: number | null, first: boolean): void;
  updateUserLocation(lat: number, lng: number, accuracy: number | null): void;
}

interface UseLeafletMapOptions {
  center: GeoCenter;
  stops: Stop[];
  selectedStop: number;
  onSelectStop: (index: number) => void;
  onMapClick: (lat: number, lng: number) => void;
}

interface UseLeafletMapResult {
  mapRef: RefObject<L.Map | null>;
  locationControllerRef: RefObject<LiveLocationMapController | null>;
  invalidateSize: () => void;
  recenterToStops: () => void;
  flyToStop: (lat: number, lng: number) => void;
  showSearchLocation: (lat: number, lng: number, title: string) => void;
  clearSearchLocation: () => void;
  drawRoutes: (paths: Array<Array<[number, number]>>) => void;
  tileError: boolean;
}

/**
 * Imperative Leaflet wrapper — not react-leaflet. Ports renderMapView(),
 * pinDivIcon() and selectStop() from the original's vanilla script.
 */
export function useLeafletMap(
  containerRef: RefObject<HTMLDivElement | null>,
  opts: UseLeafletMapOptions,
): UseLeafletMapResult {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<number, L.Marker>>({});
  const searchMarkerRef = useRef<L.Marker | null>(null);
  const routeLayersRef = useRef<L.Polyline[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const locationControllerRef = useRef<LiveLocationMapController | null>(null);
  const [tileError, setTileError] = useState(false);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  // Create the map once. Torn down on unmount (this component tree mounts
  // fresh each time the user navigates to the map view, unlike the
  // original's single persistent `leafletMap` global).
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const container = containerRef.current;
    const map = L.map(container, { zoomControl: false, attributionControl: false });
    L.control.zoom({ position: 'topright' }).addTo(map);
    map.setView([optsRef.current.center.lat, optsRef.current.center.lng], 14);
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
      crossOrigin: true,
      updateWhenIdle: true,
      keepBuffer: 3,
    }).addTo(map);
    let tileFailCount = 0;
    tiles.on('tileerror', () => {
      tileFailCount++;
      if (tileFailCount >= 8) setTileError(true);
    });
    tiles.on('tileload', () => {
      tileFailCount = 0;
      setTileError(false);
    });
    map.on('click', (e: L.LeafletMouseEvent) => optsRef.current.onMapClick(e.latlng.lat, e.latlng.lng));
    mapRef.current = map;

    locationControllerRef.current = {
      clearUserLocation() {
        userMarkerRef.current?.remove();
        accuracyCircleRef.current?.remove();
        userMarkerRef.current = null;
        accuracyCircleRef.current = null;
      },
      distanceFromCenter(lat, lng) {
        return map.getCenter().distanceTo([lat, lng]);
      },
      focusUserLocation(lat, lng, accuracy, first) {
        const position: L.LatLngExpression = [lat, lng];
        if (first && accuracyCircleRef.current && accuracy !== null && accuracy > 100) {
          map.fitBounds(accuracyCircleRef.current.getBounds(), { padding: [28, 28], maxZoom: 16, animate: true, duration: 0.8 });
        } else if (first) {
          map.flyTo(position, 16, { animate: true, duration: 0.8 });
        } else {
          map.panTo(position, { animate: true, duration: 0.55, easeLinearity: 0.2 });
        }
      },
      updateUserLocation(lat, lng, accuracy) {
        const position = L.latLng(lat, lng);
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng(position);
        } else {
          userMarkerRef.current = L.marker(position, { icon: meDotIcon(), zIndexOffset: 1000 }).addTo(map);
        }
        if (accuracy !== null) {
          if (accuracyCircleRef.current) {
            accuracyCircleRef.current.setLatLng(position).setRadius(accuracy);
          } else {
            accuracyCircleRef.current = L.circle(position, {
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
      },
    };

    // Telegram's iOS WebView often changes width/height several times while
    // expanding. Leaflet otherwise keeps the first (sometimes zero-width)
    // measurement and paints a blank map until the page is reopened.
    const refreshSize = () => window.requestAnimationFrame(() => map.invalidateSize({ pan: false }));
    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(refreshSize);
    resizeObserver?.observe(container);
    window.visualViewport?.addEventListener('resize', refreshSize);
    window.addEventListener('orientationchange', refreshSize);
    const settleTimers = [0, 120, 360, 900].map((delay) => window.setTimeout(refreshSize, delay));

    return () => {
      settleTimers.forEach((timer) => window.clearTimeout(timer));
      resizeObserver?.disconnect();
      window.visualViewport?.removeEventListener('resize', refreshSize);
      window.removeEventListener('orientationchange', refreshSize);
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
      searchMarkerRef.current = null;
      routeLayersRef.current = [];
      locationControllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Full marker rebuild — mirrors renderMapView(): fires when the stop list
  // itself changes (day switch, add/edit/remove/reorder), not on every
  // selection change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    Object.values(markersRef.current).forEach((m) => map.removeLayer(m));
    markersRef.current = {};
    const latlngs: [number, number][] = [];
    opts.stops.forEach((stop, i) => {
      if (!isValidCoord(stop)) return;
      let marker: L.Marker;
      try {
        marker = L.marker([stop.lat, stop.lng], {
          icon: pinDivIcon(i + 1, i === optsRef.current.selectedStop, stop.emoji),
          title: stop.title,
          alt: stop.title,
        }).addTo(map);
      } catch {
        return;
      }
      marker.on('click', () => optsRef.current.onSelectStop(i));
      markersRef.current[i] = marker;
      latlngs.push([stop.lat, stop.lng]);
    });
    if (latlngs.length) {
      map.fitBounds(latlngs, {
        paddingTopLeft: [78, 72],
        paddingBottomRight: [78, 150],
        maxZoom: 16,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.stops]);

  // Selection-only update — mirrors selectStop(): just swap the active/inactive
  // icon on the two affected markers, no map movement.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    Object.entries(markersRef.current).forEach(([idxStr, marker]) => {
      const idx = Number(idxStr);
      const stop = opts.stops[idx];
      if (!stop) return;
      marker.setIcon(pinDivIcon(idx + 1, idx === opts.selectedStop, stop.emoji));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.selectedStop]);

  function invalidateSize() {
    mapRef.current?.invalidateSize();
  }

  function recenterToStops() {
    const map = mapRef.current;
    if (!map) return;
    const latlngs = optsRef.current.stops.filter(isValidCoord).map((s) => [s.lat, s.lng] as [number, number]);
    if (latlngs.length) {
      map.fitBounds(latlngs, {
        paddingTopLeft: [78, 72],
        paddingBottomRight: [78, 150],
        maxZoom: 16,
      });
    }
  }

  function flyToStop(lat: number, lng: number) {
    mapRef.current?.flyTo([lat, lng], 16, { animate: true, duration: 0.8 });
  }

  function showSearchLocation(lat: number, lng: number, title: string) {
    const map = mapRef.current;
    if (!map) return;
    searchMarkerRef.current?.remove();
    searchMarkerRef.current = L.marker([lat, lng], { icon: searchDivIcon(), title, zIndexOffset: 1200 }).addTo(map);
    map.flyTo([lat, lng], 16, { animate: true, duration: 0.8 });
  }

  function clearSearchLocation() {
    searchMarkerRef.current?.remove();
    searchMarkerRef.current = null;
  }

  function drawRoutes(paths: Array<Array<[number, number]>>) {
    const map = mapRef.current;
    if (!map) return;
    routeLayersRef.current.forEach((line) => line.remove());
    routeLayersRef.current = paths.flatMap((path) => {
      try {
        return [L.polyline(path, {
          color: '#2ECC71',
          weight: 5.5,
          opacity: 0.82,
          dashArray: '1 13',
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map)];
      } catch {
        // A failed route segment should not prevent the rest of the map rendering.
        return [];
      }
    });
  }

  return {
    mapRef,
    locationControllerRef,
    invalidateSize,
    recenterToStops,
    flyToStop,
    showSearchLocation,
    clearSearchLocation,
    drawRoutes,
    tileError,
  };
}
