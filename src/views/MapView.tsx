import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import L from 'leaflet';
import { useAppContext } from '../context/AppContext';
import { useActiveTrip } from '../hooks/useActiveTrip';
import { useLeafletMap } from '../hooks/useLeafletMap';
import { useLiveLocation } from '../hooks/useLiveLocation';
import { fetchWalkingRoute, pathDistanceKm } from '../lib/geo';
import { keyFor } from '../lib/tripUtils';
import { DEFAULT_CENTER } from '../lib/constants';
import MemoryGrid from '../components/shared/MemoryGrid';
import StopCard from '../components/shared/StopCard';
import TripSummaryHeader from '../components/shared/TripSummaryHeader';
import LocationConsentModal from '../components/modals/LocationConsentModal';

export default function MapView() {
  const { state, dispatch } = useAppContext();
  const activeTrip = useActiveTrip();
  const readOnly = activeTrip?.readOnly === true;
  const tripDays = activeTrip?.tripDays ?? [];
  const stops = tripDays[state.currentDay]?.stops ?? [];
  const selectedStop = state.selectedStop;
  const stop = stops[selectedStop];

  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const routeLayersRef = useRef<L.Polyline[]>([]);
  const [statsText, setStatsText] = useState('—');
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [locationConsentOpen, setLocationConsentOpen] = useState(false);

  function handleSelectStop(i: number) {
    dispatch({ type: 'SET_SELECTED_STOP', index: i });
  }

  function handleSelectDay(day: number) {
    dispatch({ type: 'SET_CURRENT_DAY', day });
    dispatch({ type: 'SET_SELECTED_STOP', index: 0 });
  }

  function handleRemoveStop(i: number) {
    if (readOnly) return;
    if (selectedStop >= i) {
      dispatch({ type: 'SET_SELECTED_STOP', index: Math.max(0, Math.min(selectedStop - 1, stops.length - 2)) });
    }
    dispatch({ type: 'REMOVE_STOP', dayIndex: state.currentDay, stopIndex: i });
  }

  function handleMapClick(lat: number, lng: number) {
    if (readOnly) return;
    dispatch({ type: 'SET_PENDING_TAP_COORDS', coords: { lat, lng } });
    dispatch({ type: 'OPEN_MODAL', modal: 'stopForm', editingStopIndex: null });
  }

  const { mapRef, invalidateSize, recenterToStops, flyToStop, tileError } = useLeafletMap(containerRef, {
    center: activeTrip?.center ?? DEFAULT_CENTER,
    stops,
    selectedStop,
    onSelectStop: handleSelectStop,
    onMapClick: handleMapClick,
  });

  // After adding a stop via "Paste a Google Maps link", fly the map to it so
  // the user immediately sees where their link landed, instead of staying
  // wherever the map happened to be pointed.
  useEffect(() => {
    const coords = state.pendingFlyToCoords;
    if (!coords) return;
    flyToStop(coords.lat, coords.lng);
    dispatch({ type: 'SET_PENDING_FLY_TO_COORDS', coords: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.pendingFlyToCoords]);

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

  // Settle map sizing shortly after mount — the container's real dimensions
  // may not be final at the instant L.map() is created. Mirrors goMap()'s
  // setTimeout(...,150) in the original.
  useEffect(() => {
    const t = setTimeout(() => invalidateSize(), 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mirrors applyTheme()'s setTimeout(...,50) — re-measure after a theme
  // flip in case it shifts layout while this view is mounted.
  useEffect(() => {
    const t = setTimeout(() => invalidateSize(), 50);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.theme]);

  // Draw walking routes between stops + update the stats pill. Mirrors
  // drawRoutes(); runs whenever the stop list itself changes.
  useEffect(() => {
    let cancelled = false;

    async function drawRoutes() {
      const map = mapRef.current;
      if (!map) return;
      routeLayersRef.current.forEach((l) => map.removeLayer(l));
      routeLayersRef.current = [];
      const validStops = stops.filter(
        (s) => typeof s.lat === 'number' && typeof s.lng === 'number' && !Number.isNaN(s.lat) && !Number.isNaN(s.lng),
      );
      if (validStops.length < 2) {
        setStatsText(validStops.length ? `${validStops.length} stop` : 'No stops yet');
        return;
      }
      const segments = await Promise.all(
        validStops.slice(0, -1).map((s, i) => fetchWalkingRoute(s, validStops[i + 1])),
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
          // ignore
        }
      });
      const totalKm = segments.reduce((sum, path) => sum + pathDistanceKm(path), 0);
      const mins = Math.max(1, Math.round((totalKm / 5) * 60));
      setStatsText(`${validStops.length} stops · ${totalKm.toFixed(1)} km · ~${mins} min walk`);
    }

    drawRoutes();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops]);

  function triggerUpload(stopIdx: number) {
    if (readOnly) return;
    dispatch({ type: 'SET_SELECTED_STOP', index: stopIdx });
    fileInputRef.current?.click();
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const key = keyFor(state.currentDay, selectedStop);
      dispatch({ type: 'ADD_PHOTO', key, photo: { src: ev.target?.result as string, caption: '' } });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function openPhoto(idx: number) {
    const key = keyFor(state.currentDay, selectedStop);
    dispatch({ type: 'SET_VIEWING_PHOTO', photo: { key, index: idx } });
    dispatch({ type: 'SET_MEMORY_RETURN_VIEW', view: 'map' });
    dispatch({ type: 'NAVIGATE', view: 'memory' });
  }

  const photos = activeTrip ? activeTrip.photos[keyFor(state.currentDay, selectedStop)] || [] : [];

  return (
    <section id="view-map" className="active">
      <TripSummaryHeader trip={activeTrip} />

      <div className="itinerary-mode-tabs" aria-label={state.language === 'km' ? 'ជ្រើសរើសទិដ្ឋភាព' : 'Choose itinerary view'}>
        <button type="button" onClick={() => dispatch({ type: 'NAVIGATE', view: 'itinerary' })}>
          {state.language === 'km' ? 'ផែនការ' : 'Plan'}
        </button>
        <button type="button" className="active">
          {state.language === 'km' ? 'ផែនទី' : 'Map'}
        </button>
      </div>
      <p className="eyebrow">Map explorer with photo memory integration</p>
      <div className="map-frame">
        <div id="leafletMap" ref={containerRef} />
        {tileError && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: 12,
              padding: '0 24px',
              textAlign: 'center',
              background: 'var(--card)',
              zIndex: 400,
            }}
          >
            Map tiles couldn't load — check your connection and reopen the file.
          </div>
        )}
        <div className="map-stats-pill" id="mapStatsPill">
          <span className="dot" />
          <span id="mapStatsText">{statsText}</span>
        </div>
        <div className="map-recenter-btn" id="mapRecenterBtn" title="Recenter" onClick={recenterToStops}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        </div>
        <div
          className={`map-live-btn${liveActive ? ' active' : ''}`}
          id="liveLocationBtn"
          title="Track my location"
          onClick={handleToggleLiveLocation}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 21s7-6.3 7-11.8a7 7 0 1 0-14 0C5 14.7 12 21 12 21z" />
            <circle cx="12" cy="9.2" r="2.4" fill="currentColor" stroke="none" />
          </svg>
        </div>
      </div>
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

      <div className="map-itinerary-section">
        <div className="map-itinerary-heading">
          <h2>{state.language === 'km' ? 'កាលវិភាគ' : 'Itinerary'}</h2>
          <span>{state.language === 'km' ? `ថ្ងៃទី ${state.currentDay + 1}` : `Day ${state.currentDay + 1}`}</span>
        </div>
        <div className="day-tabs map-day-tabs">
          {tripDays.map((_, i) => (
            <button
              type="button"
              key={i}
              className={`day-tab${i === state.currentDay ? ' active' : ''}`}
              onClick={() => handleSelectDay(i)}
            >
              {state.language === 'km' ? `ថ្ងៃទី ${i + 1}` : `Day ${i + 1}`}
            </button>
          ))}
        </div>
        <div className="map-itinerary-list">
          {stops.length === 0 ? (
            <div className="map-itinerary-empty">
              {state.language === 'km' ? 'មិនទាន់មានទីកន្លែងសម្រាប់ថ្ងៃនេះទេ។' : 'No stops yet for this day.'}
            </div>
          ) : (
            stops.map((itineraryStop, i) => (
              <div
                key={`${itineraryStop.time}-${itineraryStop.title}-${i}`}
                className={`map-itinerary-item${i === selectedStop ? ' active' : ''}`}
                onClick={() => handleSelectStop(i)}
              >
                <StopCard stop={itineraryStop} mode="readonly" />
              </div>
            ))
          )}
        </div>
      </div>

      <div className="chip-row" id="stopChips">
        {stops.map((s, i) => (
          <div key={i} className={`chip${i === selectedStop ? ' active' : ''}`} onClick={() => handleSelectStop(i)}>
            {s.title}
            {!readOnly && (
              <button
                type="button"
                className="chip-close"
                title={`Remove ${s.title}`}
                aria-label={`Remove ${s.title}`}
                onClick={(event) => {
                  event.stopPropagation();
                  handleRemoveStop(i);
                }}
              >
                &times;
              </button>
            )}
          </div>
        ))}
      </div>
      {!readOnly && (
        <>
          <button
            className="btn btn-ghost"
            style={{ marginBottom: 8 }}
            onClick={() => dispatch({ type: 'OPEN_MODAL', modal: 'pasteLink' })}
          >
            + Paste a Google Maps link
          </button>
          <p className="note" style={{ marginTop: 0, marginBottom: 16 }}>
            Or tap anywhere on the map to drop a pin there
          </p>
        </>
      )}

      <div className="detail-card">
        <div className="detail-head">
          <div>
            <div className="detail-title" id="detailTitle">
              {stop ? stop.title : '—'}
            </div>
            <div className="detail-sub" id="detailSub">
              {stop ? `${stop.time} · ${stop.sub}` : '—'}
            </div>
          </div>
          {!readOnly && (
            <div className="icon-btn" title="Add memory" onClick={() => triggerUpload(selectedStop)}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.2-2h6.6l1.2 2h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
            </div>
          )}
        </div>
        <div className="memories-label">Memories</div>
        <MemoryGrid photos={photos} onPhotoClick={openPhoto} onAddClick={readOnly ? undefined : () => triggerUpload(selectedStop)} gridId="detailGrid" />
      </div>
      <p className="note">
        Photos and trip data save to this browser via local storage. In the in-chat preview panel, storage may be
        sandboxed — open the file directly in a regular browser tab for it to persist across refreshes.
      </p>
      {!readOnly && <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />}
      <LocationConsentModal
        isOpen={locationConsentOpen}
        language={state.language}
        onClose={() => setLocationConsentOpen(false)}
        onAllow={handleAllowLocationTracking}
      />
    </section>
  );
}
