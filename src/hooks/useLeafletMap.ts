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

// Ported verbatim from the original's meDotIcon().
export function meDotIcon(): L.DivIcon {
  return L.divIcon({ className: '', html: '<div class="me-dot"></div>', iconSize: [16, 16], iconAnchor: [8, 8] });
}

function isValidCoord(stop: Stop): boolean {
  return typeof stop.lat === 'number' && typeof stop.lng === 'number' && !Number.isNaN(stop.lat) && !Number.isNaN(stop.lng);
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
  invalidateSize: () => void;
  recenterToStops: () => void;
  flyToStop: (lat: number, lng: number) => void;
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

  return { mapRef, invalidateSize, recenterToStops, flyToStop, tileError };
}
