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

// Ported verbatim from the original's pinDivIcon().
export function pinDivIcon(number: number, active: boolean, emoji: string | undefined): L.DivIcon {
  const isImg = isImgEmoji(emoji);

  if (emoji) {
    const size = active ? 46 : 34;
    const glow = active
      ? `<circle cx="20" cy="20" r="19" fill="none" stroke="#F2A488" stroke-width="1.5" opacity="0.55"><animate attributeName="r" values="18;23;18" dur="1.8s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.55;0;0.55" dur="1.8s" repeatCount="indefinite"/></circle>`
      : '';
    const content = isImg
      ? `<image href="${emoji}" x="4" y="4" width="32" height="32" preserveAspectRatio="xMidYMid meet"/>`
      : `<text x="20" y="29" text-anchor="middle" font-size="32">${emoji}</text>`;
    return L.divIcon({
      className: 'pin-marker',
      html: `<svg width="${size}" height="${size}" viewBox="0 0 40 40" style="overflow:visible;filter:drop-shadow(0 3px 4px rgba(0,0,0,0.5));">
        ${glow}
        ${content}
      </svg>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  const size = active ? 40 : 28;
  const fill = active ? '#F2A488' : '#c48a94';
  const glow = active
    ? `<circle cx="16" cy="16" r="15" fill="none" stroke="#F2A488" stroke-width="1.5" opacity="0.55"><animate attributeName="r" values="14;19;14" dur="1.8s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.55;0;0.55" dur="1.8s" repeatCount="indefinite"/></circle>`
    : '';
  const label = `<text x="16" y="21" text-anchor="middle" font-size="13" font-weight="600" fill="${fill}" font-family="Inter,sans-serif">${number}</text>`;
  return L.divIcon({
    className: 'pin-marker',
    html: `<svg width="${size}" height="${size * 1.28}" viewBox="0 0 32 41" style="overflow:visible;">
      ${glow}
      <path d="M16 0C7.2 0 0 7.2 0 16c0 11 16 25 16 25s16-14 16-25C32 7.2 24.8 0 16 0z" fill="${fill}"/>
      <circle cx="16" cy="16" r="10.5" fill="#101010"/>
      ${label}
    </svg>`,
    iconSize: [size, size * 1.28],
    iconAnchor: [size / 2, size * 1.28],
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
    const map = L.map(containerRef.current, { zoomControl: false, attributionControl: false });
    L.control.zoom({ position: 'topright' }).addTo(map);
    map.setView([optsRef.current.center.lat, optsRef.current.center.lng], 14);
    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    let tileFailCount = 0;
    tiles.on('tileerror', () => {
      tileFailCount++;
      if (tileFailCount === 6) setTileError(true);
    });
    map.on('click', (e: L.LeafletMouseEvent) => optsRef.current.onMapClick(e.latlng.lat, e.latlng.lng));
    mapRef.current = map;

    return () => {
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
        }).addTo(map);
      } catch {
        return;
      }
      marker.bindTooltip(stop.title, { permanent: true, direction: 'top', offset: [0, -36], className: 'map-label-pill' });
      marker.on('click', () => optsRef.current.onSelectStop(i));
      markersRef.current[i] = marker;
      latlngs.push([stop.lat, stop.lng]);
    });
    if (latlngs.length) map.fitBounds(latlngs, { padding: [30, 30] });
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
    if (latlngs.length) map.fitBounds(latlngs, { padding: [30, 30] });
  }

  function flyToStop(lat: number, lng: number) {
    mapRef.current?.flyTo([lat, lng], 16, { animate: true, duration: 0.8 });
  }

  return { mapRef, invalidateSize, recenterToStops, flyToStop, tileError };
}
