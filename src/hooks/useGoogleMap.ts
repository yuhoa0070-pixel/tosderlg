import { useEffect, useRef, useState, type RefObject } from 'react';
import type { GeoCenter, Stop, Theme } from '../types';
import {
  loadGoogleMaps,
  type GoogleCircleInstance,
  type GoogleMapInstance,
  type GoogleMapsApi,
  type GoogleMarkerInstance,
  type GooglePolylineInstance,
} from '../lib/googleMaps';

export interface LiveLocationMapController {
  clearUserLocation(): void;
  distanceFromCenter(lat: number, lng: number): number;
  focusUserLocation(lat: number, lng: number, accuracy: number | null, first: boolean): void;
  updateUserLocation(lat: number, lng: number, accuracy: number | null): void;
}

interface UseGoogleMapOptions {
  center: GeoCenter;
  stops: Stop[];
  selectedStop: number;
  theme: Theme;
  onSelectStop: (index: number) => void;
  onMapClick: (lat: number, lng: number) => void;
}

interface UseGoogleMapResult {
  mapRef: RefObject<GoogleMapInstance | null>;
  locationControllerRef: RefObject<LiveLocationMapController | null>;
  invalidateSize(): void;
  recenterToStops(): void;
  flyToStop(lat: number, lng: number): void;
  showSearchLocation(lat: number, lng: number, title: string): void;
  clearSearchLocation(): void;
  drawRoutes(paths: Array<Array<[number, number]>>): void;
  tileError: boolean;
}

const LIGHT_MAP_STYLES = [
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'landscape', stylers: [{ color: '#F2F5EF' }] },
  { featureType: 'water', stylers: [{ color: '#CDEDE3' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
];

const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#172A27' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#A8B8AF' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#172A27' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0C2B32' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#29413C' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1D342E' }] },
];

function validStop(stop: Stop): boolean {
  return Number.isFinite(stop.lat) && Number.isFinite(stop.lng);
}

function liveLocationIcon(maps: GoogleMapsApi): Record<string, unknown> {
  return {
    path: maps.SymbolPath.CIRCLE,
    fillColor: '#2ECC71',
    fillOpacity: 1,
    strokeColor: '#FFFFFF',
    strokeWeight: 4,
    scale: 11,
  };
}

function stopEmojiAnchorIcon(maps: GoogleMapsApi, active: boolean): Record<string, unknown> {
  return {
    path: maps.SymbolPath.CIRCLE,
    fillOpacity: 0,
    strokeOpacity: 0,
    scale: active ? 25 : 20,
  };
}

const IMAGE_EMOJI_FALLBACKS: Record<string, string> = {
  '/emoji/map.png': '🗺️',
  '/emoji/coffee.png': '☕',
  '/emoji/wave.png': '🌊',
  '/emoji/temple.png': '🛕',
};

function markerEmoji(stop: Stop): string {
  const emoji = stop.emoji?.trim();
  if (!emoji) return '📍';
  if (IMAGE_EMOJI_FALLBACKS[emoji]) return IMAGE_EMOJI_FALLBACKS[emoji];
  if (emoji.startsWith('/emoji/') || emoji.startsWith('data:image')) return '🧭';
  return emoji;
}

function markerLabel(stop: Stop, active: boolean) {
  return {
    text: markerEmoji(stop),
    className: `map-stop-emoji-label${active ? ' active' : ''}`,
    color: '#071A0F',
    fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
    fontSize: active ? '38px' : '30px',
    fontWeight: '400',
  };
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

export function useGoogleMap(
  containerRef: RefObject<HTMLDivElement | null>,
  opts: UseGoogleMapOptions,
): UseGoogleMapResult {
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const mapsApiRef = useRef<GoogleMapsApi | null>(null);
  const markersRef = useRef<Record<number, GoogleMarkerInstance>>({});
  const searchMarkerRef = useRef<GoogleMarkerInstance | null>(null);
  const routeLayersRef = useRef<GooglePolylineInstance[]>([]);
  const userMarkerRef = useRef<GoogleMarkerInstance | null>(null);
  const accuracyCircleRef = useRef<GoogleCircleInstance | null>(null);
  const locationControllerRef = useRef<LiveLocationMapController | null>(null);
  const optsRef = useRef(opts);
  const [tileError, setTileError] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  optsRef.current = opts;

  useEffect(() => {
    let cancelled = false;
    let clickListener: { remove(): void } | null = null;

    async function initialize() {
      if (!containerRef.current || mapRef.current) return;
      try {
        const maps = await loadGoogleMaps();
        if (cancelled || !containerRef.current) return;
        mapsApiRef.current = maps;
        const map = new maps.Map(containerRef.current, {
          center: optsRef.current.center,
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: 'greedy',
          styles: optsRef.current.theme === 'dark' ? DARK_MAP_STYLES : LIGHT_MAP_STYLES,
        });
        mapRef.current = map;
        clickListener = map.addListener('click', (event) => {
          const latLng = event.latLng;
          if (latLng) optsRef.current.onMapClick(latLng.lat(), latLng.lng());
        });

        locationControllerRef.current = {
          clearUserLocation() {
            userMarkerRef.current?.setMap(null);
            accuracyCircleRef.current?.setMap(null);
            userMarkerRef.current = null;
            accuracyCircleRef.current = null;
          },
          distanceFromCenter(lat, lng) {
            const center = map.getCenter();
            return center ? distanceMeters(center.lat(), center.lng(), lat, lng) : 0;
          },
          focusUserLocation(lat, lng, accuracy, first) {
            const position = { lat, lng };
            if (first && accuracyCircleRef.current && accuracy !== null && accuracy > 100) {
              const bounds = accuracyCircleRef.current.getBounds();
              if (bounds) map.fitBounds(bounds, 28);
              return;
            }
            if (first) {
              map.setCenter(position);
              map.setZoom(16);
            } else {
              map.panTo(position);
            }
          },
          updateUserLocation(lat, lng, accuracy) {
            const position = { lat, lng };
            if (userMarkerRef.current) {
              userMarkerRef.current.setPosition(position);
            } else {
              userMarkerRef.current = new maps.Marker({
                map,
                position,
                title: 'Your live location',
                icon: liveLocationIcon(maps),
                zIndex: 1000,
              });
            }
            if (accuracy !== null) {
              if (accuracyCircleRef.current) {
                accuracyCircleRef.current.setCenter(position);
                accuracyCircleRef.current.setRadius(accuracy);
              } else {
                accuracyCircleRef.current = new maps.Circle({
                  map,
                  center: position,
                  radius: accuracy,
                  strokeColor: '#2ECC71',
                  strokeOpacity: 0.55,
                  strokeWeight: 1,
                  fillColor: '#2ECC71',
                  fillOpacity: 0.1,
                  clickable: false,
                });
              }
            } else if (accuracyCircleRef.current) {
              accuracyCircleRef.current.setMap(null);
              accuracyCircleRef.current = null;
            }
          },
        };
        setTileError(false);
        setMapReady(true);
      } catch {
        if (!cancelled) setTileError(true);
      }
    }

    void initialize();
    return () => {
      cancelled = true;
      clickListener?.remove();
      Object.values(markersRef.current).forEach((marker) => marker.setMap(null));
      routeLayersRef.current.forEach((line) => line.setMap(null));
      searchMarkerRef.current?.setMap(null);
      locationControllerRef.current?.clearUserLocation();
      markersRef.current = {};
      routeLayersRef.current = [];
      searchMarkerRef.current = null;
      locationControllerRef.current = null;
      mapRef.current = null;
    };
  }, [containerRef]);

  useEffect(() => {
    const map = mapRef.current;
    const maps = mapsApiRef.current;
    if (!mapReady || !map || !maps) return;
    map.setOptions({ styles: opts.theme === 'dark' ? DARK_MAP_STYLES : LIGHT_MAP_STYLES });
  }, [mapReady, opts.theme]);

  useEffect(() => {
    const map = mapRef.current;
    const maps = mapsApiRef.current;
    if (!mapReady || !map || !maps) return;

    Object.values(markersRef.current).forEach((marker) => marker.setMap(null));
    markersRef.current = {};
    const bounds = new maps.LatLngBounds();
    let validCount = 0;
    opts.stops.forEach((stop, index) => {
      if (!validStop(stop)) return;
      const active = index === opts.selectedStop;
      const marker = new maps.Marker({
        map,
        position: { lat: stop.lat, lng: stop.lng },
        title: stop.title,
        label: markerLabel(stop, active),
        icon: stopEmojiAnchorIcon(maps, active),
        zIndex: active ? 100 : index,
      });
      marker.addListener('click', () => optsRef.current.onSelectStop(index));
      markersRef.current[index] = marker;
      bounds.extend({ lat: stop.lat, lng: stop.lng });
      validCount += 1;
    });
    if (validCount > 1) map.fitBounds(bounds, { top: 110, right: 70, bottom: 190, left: 70 });
    else if (validCount === 1) {
      const stop = opts.stops.find(validStop);
      if (stop) {
        map.setCenter({ lat: stop.lat, lng: stop.lng });
        map.setZoom(16);
      }
    }
  }, [mapReady, opts.selectedStop, opts.stops]);

  useEffect(() => {
    const maps = mapsApiRef.current;
    if (!mapReady || !maps) return;
    Object.entries(markersRef.current).forEach(([key, marker]) => {
      const index = Number(key);
      const active = index === opts.selectedStop;
      marker.setIcon(stopEmojiAnchorIcon(maps, active));
      const stop = opts.stops[index];
      if (stop) marker.setLabel(markerLabel(stop, active));
      marker.setZIndex(active ? 100 : index);
    });
  }, [mapReady, opts.selectedStop, opts.stops]);

  function invalidateSize() {
    const map = mapRef.current;
    const center = map?.getCenter();
    if (map && center) map.setCenter({ lat: center.lat(), lng: center.lng() });
  }

  function recenterToStops() {
    const map = mapRef.current;
    const maps = mapsApiRef.current;
    if (!map || !maps) return;
    const validStops = optsRef.current.stops.filter(validStop);
    if (validStops.length === 0) return;
    if (validStops.length === 1) {
      map.setCenter({ lat: validStops[0].lat, lng: validStops[0].lng });
      map.setZoom(16);
      return;
    }
    const bounds = new maps.LatLngBounds();
    validStops.forEach((stop) => bounds.extend({ lat: stop.lat, lng: stop.lng }));
    map.fitBounds(bounds, { top: 110, right: 70, bottom: 190, left: 70 });
  }

  function flyToStop(lat: number, lng: number) {
    const map = mapRef.current;
    if (!map) return;
    map.panTo({ lat, lng });
    map.setZoom(16);
  }

  function showSearchLocation(lat: number, lng: number, title: string) {
    const map = mapRef.current;
    const maps = mapsApiRef.current;
    if (!map || !maps) return;
    searchMarkerRef.current?.setMap(null);
    searchMarkerRef.current = new maps.Marker({
      map,
      position: { lat, lng },
      title,
      zIndex: 1200,
    });
    map.panTo({ lat, lng });
    map.setZoom(16);
  }

  function clearSearchLocation() {
    searchMarkerRef.current?.setMap(null);
    searchMarkerRef.current = null;
  }

  function drawRoutes(paths: Array<Array<[number, number]>>) {
    const map = mapRef.current;
    const maps = mapsApiRef.current;
    if (!map || !maps) return;
    routeLayersRef.current.forEach((line) => line.setMap(null));
    routeLayersRef.current = paths.map((path) => new maps.Polyline({
      map,
      path: path.map(([lat, lng]) => ({ lat, lng })),
      strokeColor: '#2ECC71',
      strokeOpacity: 0,
      strokeWeight: 5,
      icons: [{ icon: { path: maps.SymbolPath.CIRCLE, fillColor: '#2ECC71', fillOpacity: 0.85, scale: 2 }, offset: '0', repeat: '14px' }],
    }));
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
