import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useAppContext } from '../context/AppContext';
import { useActiveTrip } from '../hooks/useActiveTrip';
import { useLeafletMap } from '../hooks/useLeafletMap';
import { useLiveLocation } from '../hooks/useLiveLocation';
import { fetchWalkingRoute } from '../lib/geo';
import { DEFAULT_CENTER } from '../lib/constants';
import LocationConsentModal from '../components/modals/LocationConsentModal';

export default function MapView() {
  const { state, dispatch } = useAppContext();
  const activeTrip = useActiveTrip();
  const stops = activeTrip?.tripDays[state.currentDay]?.stops ?? [];
  const containerRef = useRef<HTMLDivElement | null>(null);
  const routeLayersRef = useRef<L.Polyline[]>([]);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [locationConsentOpen, setLocationConsentOpen] = useState(false);

  const { mapRef, invalidateSize, recenterToStops, flyToStop, tileError } = useLeafletMap(containerRef, {
    center: activeTrip?.center ?? DEFAULT_CENTER,
    stops,
    selectedStop: state.selectedStop,
    onSelectStop: (index) => dispatch({ type: 'SET_SELECTED_STOP', index }),
    onMapClick: () => undefined,
  });

  const {
    active: liveActive,
    toggle: toggleLiveLocation,
    canOpenSettings: canOpenLocationSettings,
    openSettings: openLocationSettings,
  } = useLiveLocation(mapRef, setLocationNotice);

  function handleToggleLiveLocation() {
    if (!liveActive) {
      setLocationConsentOpen(true);
      return;
    }
    setLocationNotice(null);
    toggleLiveLocation();
  }

  function handleAllowLocationTracking() {
    setLocationConsentOpen(false);
    setLocationNotice(null);
    toggleLiveLocation();
  }

  useEffect(() => {
    const coords = state.pendingFlyToCoords;
    if (!coords) return;
    flyToStop(coords.lat, coords.lng);
    dispatch({ type: 'SET_PENDING_FLY_TO_COORDS', coords: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.pendingFlyToCoords]);

  useEffect(() => {
    const timers = [0, 120, 360].map((delay) => window.setTimeout(() => invalidateSize(), delay));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.theme]);

  useEffect(() => {
    let cancelled = false;

    async function drawRoutes() {
      const map = mapRef.current;
      if (!map) return;
      routeLayersRef.current.forEach((layer) => map.removeLayer(layer));
      routeLayersRef.current = [];

      const validStops = stops.filter(
        (stop) => Number.isFinite(stop.lat) && Number.isFinite(stop.lng),
      );
      if (validStops.length < 2) return;

      const segments = await Promise.all(
        validStops.slice(0, -1).map((stop, index) => fetchWalkingRoute(stop, validStops[index + 1])),
      );
      if (cancelled) return;

      segments.forEach((path) => {
        try {
          const halo = L.polyline(path, { color: '#000', weight: 6, opacity: 0.25 }).addTo(map);
          const line = L.polyline(path, {
            color: '#F2A488',
            weight: 3.5,
            opacity: 0.9,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(map);
          routeLayersRef.current.push(halo, line);
        } catch {
          // A failed route segment should not prevent the rest of the map rendering.
        }
      });
    }

    void drawRoutes();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops]);

  return (
    <section id="view-map" className="active map-only-view">
      <div className="map-frame map-fullscreen-frame">
        <div id="leafletMap" ref={containerRef} />
        {tileError && (
          <div className="map-tile-notice" role="status">
            Map is reconnecting…
          </div>
        )}
        <button type="button" className="map-recenter-btn" title="Recenter stops" aria-label="Recenter map to stops" onClick={recenterToStops}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        </button>
        <button
          type="button"
          className={`map-live-btn${liveActive ? ' active' : ''}`}
          title="Track my location"
          aria-label={liveActive ? 'Stop tracking my location' : 'Track my location'}
          onClick={handleToggleLiveLocation}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 21s7-6.3 7-11.8a7 7 0 1 0-14 0C5 14.7 12 21 12 21z" />
            <circle cx="12" cy="9.2" r="2.4" fill="currentColor" stroke="none" />
          </svg>
        </button>
        {locationNotice && (
          <div className="note map-location-notice" role="status">
            <span>{locationNotice}</span>
            {canOpenLocationSettings && (
              <button type="button" onClick={openLocationSettings}>
                {state.language === 'km' ? 'បើកការកំណត់' : 'Open settings'}
              </button>
            )}
          </div>
        )}
      </div>

      <LocationConsentModal
        isOpen={locationConsentOpen}
        language={state.language}
        onClose={() => setLocationConsentOpen(false)}
        onAllow={handleAllowLocationTracking}
      />
    </section>
  );
}
