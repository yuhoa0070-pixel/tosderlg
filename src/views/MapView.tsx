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
  const km = state.language === 'km';
  const selectedStopIndex = stops[state.selectedStop] ? state.selectedStop : 0;
  const selectedStop = stops[selectedStopIndex];
  const selectedStopUsesImage = !!selectedStop?.emoji && (
    selectedStop.emoji.startsWith('data:image') || selectedStop.emoji.startsWith('/emoji/')
  );

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
          const line = L.polyline(path, {
            color: '#2ECC71',
            weight: 5.5,
            opacity: 0.82,
            dashArray: '1 13',
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(map);
          routeLayersRef.current.push(line);
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
        <div className="map-route-summary">
          <span className="map-route-summary-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <circle cx="6" cy="18" r="2" />
              <circle cx="18" cy="6" r="2" />
              <path d="M7.5 16.5c2.5-1.2 2.8-3.2 3.2-5.1.5-2.4 1.3-4.2 5.3-4.8" />
            </svg>
          </span>
          <span className="map-route-summary-copy">
            <small>{km ? 'ផ្លូវរបស់ខ្ញុំ' : 'My route'}</small>
            <strong>{activeTrip?.destination || (km ? 'ដំណើររបស់អ្នក' : 'Your trip')}</strong>
            <span>
              {km
                ? `ថ្ងៃទី ${state.currentDay + 1} · ${stops.length} ទីកន្លែង`
                : `Day ${state.currentDay + 1} · ${stops.length} ${stops.length === 1 ? 'stop' : 'stops'}`}
            </span>
          </span>
          <button type="button" className="map-route-focus-btn" aria-label={km ? 'បង្ហាញទីកន្លែងទាំងអស់' : 'Show all stops'} onClick={recenterToStops}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
          </button>
        </div>
        {tileError && (
          <div className="map-tile-notice" role="status">
            Map is reconnecting…
          </div>
        )}
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
        {selectedStop && (
          <article className="map-selected-stop-card">
            <span className="map-selected-stop-art" aria-hidden="true">
              {selectedStopUsesImage ? (
                <img src={selectedStop.emoji} alt="" />
              ) : (
                <span>{selectedStop.emoji || '🏕️'}</span>
              )}
            </span>
            <span className="map-selected-stop-copy">
              <small>{km ? `ទីកន្លែងទី ${selectedStopIndex + 1}` : `Stop ${selectedStopIndex + 1}`}</small>
              <strong>{selectedStop.title}</strong>
              <span>{selectedStop.sub || (km ? 'បានរក្សាទុកក្នុងកាលវិភាគរបស់អ្នក' : 'Saved in your itinerary')}</span>
              <button type="button" onClick={() => dispatch({ type: 'NAVIGATE', view: 'itinerary' })}>
                {selectedStop.time || (km ? 'មើលផែនការ' : 'View plan')}
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
              </button>
            </span>
          </article>
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
