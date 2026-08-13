import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useAppContext } from '../context/AppContext';
import { useActiveTrip } from '../hooks/useActiveTrip';
import { useLeafletMap } from '../hooks/useLeafletMap';
import { useLiveLocation } from '../hooks/useLiveLocation';
import { fetchWalkingRoute } from '../lib/geo';
import { searchPlaces, type PlaceSearchResult } from '../lib/geocode';
import { DEFAULT_CENTER } from '../lib/constants';
import { keyFor } from '../lib/tripUtils';
import LocationConsentModal from '../components/modals/LocationConsentModal';

function SearchMatch({ text, query }: { text: string; query: string }) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matchIndex = text.toLocaleLowerCase().indexOf(normalizedQuery);
  if (!normalizedQuery || matchIndex < 0) return text;

  return (
    <>
      {text.slice(0, matchIndex)}
      <mark>{text.slice(matchIndex, matchIndex + normalizedQuery.length)}</mark>
      {text.slice(matchIndex + normalizedQuery.length)}
    </>
  );
}

export default function MapView() {
  const { state, dispatch } = useAppContext();
  const activeTrip = useActiveTrip();
  const stops = activeTrip?.tripDays[state.currentDay]?.stops ?? [];
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchRequestRef = useRef(0);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [, setLocationNotice] = useState<string | null>(null);
  const [locationConsentOpen, setLocationConsentOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchedPlace, setSearchedPlace] = useState<PlaceSearchResult | null>(null);
  const [placeGalleryOpen, setPlaceGalleryOpen] = useState(false);
  const km = state.language === 'km';
  const selectedStopIndex = stops[state.selectedStop] ? state.selectedStop : 0;
  const selectedStop = stops[selectedStopIndex];
  const selectedStopKey = keyFor(state.currentDay, selectedStopIndex);
  const selectedStopPhotos = activeTrip?.photos[selectedStopKey] ?? [];
  const selectedStopUsesImage = !!selectedStop?.emoji && (
    selectedStop.emoji.startsWith('data:image') || selectedStop.emoji.startsWith('/emoji/')
  );
  const savedPlaceSuggestions = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    if (query.length < 2) return [];

    const results: PlaceSearchResult[] = [];
    const seen = new Set<string>();
    const addResult = (result: PlaceSearchResult) => {
      const haystack = `${result.name} ${result.address} ${result.category}`.toLocaleLowerCase();
      const identity = `${result.name.toLocaleLowerCase()}-${result.lat.toFixed(5)}-${result.lng.toFixed(5)}`;
      if (!haystack.includes(query) || seen.has(identity)) return;
      seen.add(identity);
      results.push(result);
    };

    state.trips.forEach((trip) => {
      addResult({
        id: `trip-${trip.id}`,
        name: trip.destination,
        address: trip.label || (km ? 'គោលដៅដំណើរ' : 'Trip destination'),
        category: km ? 'ដំណើរ' : 'trip',
        lat: trip.center.lat,
        lng: trip.center.lng,
      });
      trip.tripDays.forEach((day, dayIndex) => {
        day.stops.forEach((stop, stopIndex) => addResult({
          id: `saved-${trip.id}-${dayIndex}-${stopIndex}`,
          name: stop.title,
          address: stop.sub || trip.destination,
          category: km ? 'បានរក្សាទុក' : 'saved stop',
          lat: stop.lat,
          lng: stop.lng,
        }));
      });
    });

    return results.slice(0, 5);
  }, [km, searchQuery, state.trips]);
  const trimmedSearchQuery = searchQuery.trim();
  const searchHasInput = trimmedSearchQuery.length >= 2;
  const visibleSearchResults = searchResults.length > 0 ? searchResults : savedPlaceSuggestions;
  const showingSavedSuggestions = searchResults.length === 0 && savedPlaceSuggestions.length > 0;

  const {
    locationControllerRef,
    invalidateSize,
    recenterToStops,
    flyToStop,
    showSearchLocation,
    clearSearchLocation,
    drawRoutes,
    tileError,
  } = useLeafletMap(containerRef, {
    center: activeTrip?.center ?? DEFAULT_CENTER,
    stops,
    selectedStop: state.selectedStop,
    onSelectStop: (index) => {
      setSearchedPlace(null);
      setPlaceGalleryOpen(true);
      dispatch({ type: 'SET_SELECTED_STOP', index });
    },
    onMapClick: (lat, lng) => {
      setPlaceGalleryOpen(false);
      if (searchOpen) closeSearch();
      // A tap on empty map (not a marker — those have their own click
      // handler and don't bubble here) drops a pin at that spot, reusing
      // the same "search result" card + Add to plan flow already used for
      // search results, so the user can name and save it as a stop.
      showSearchResultOnMap(
        {
          id: `tap-${lat.toFixed(5)}-${lng.toFixed(5)}`,
          name: km ? 'ទីតាំងដែលបានចុច' : 'Dropped pin',
          address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          category: km ? 'ចំណុចថ្មី' : 'new point',
          lat,
          lng,
        },
        false,
      );
    },
  });

  const {
    active: liveActive,
    toggle: toggleLiveLocation,
  } = useLiveLocation(locationControllerRef, setLocationNotice);

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

  async function handleMapSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchError(km ? 'សូមវាយបញ្ចូលយ៉ាងហោចណាស់ ២ តួអក្សរ។' : 'Enter at least 2 characters.');
      return;
    }

    const requestId = ++searchRequestRef.current;
    setSearching(true);
    setSearchError('');
    try {
      const results = await searchPlaces(query, state.language);
      if (requestId !== searchRequestRef.current) return;
      setSearchResults(results);
      if (results.length === 0) {
        setSearchError(km ? 'រកមិនឃើញទីកន្លែងនេះទេ។ សាកល្បងឈ្មោះផ្សេង។' : 'No places found. Try a different name.');
      } else {
        showSearchResultOnMap(results[0], false);
      }
    } catch {
      if (requestId !== searchRequestRef.current) return;
      setSearchResults([]);
      setSearchError(km ? 'មិនអាចស្វែងរកបានឥឡូវនេះទេ។ សូមព្យាយាមម្ដងទៀត។' : 'Search is unavailable right now. Try again.');
    } finally {
      if (requestId === searchRequestRef.current) setSearching(false);
    }
  }

  function showSearchResultOnMap(result: PlaceSearchResult, closePanel: boolean) {
    showSearchLocation(result.lat, result.lng, result.name);
    setSearchedPlace(result);
    setPlaceGalleryOpen(false);
    if (closePanel) setSearchOpen(false);
  }

  function selectSearchResult(result: PlaceSearchResult) {
    showSearchResultOnMap(result, true);
    setSearchQuery(result.name);
  }

  function showTripStops() {
    clearSearchLocation();
    setSearchedPlace(null);
    setPlaceGalleryOpen(false);
    recenterToStops();
  }

  function addSearchedPlace() {
    if (!searchedPlace) return;
    clearSearchLocation();
    dispatch({ type: 'SET_PENDING_TAP_COORDS', coords: { lat: searchedPlace.lat, lng: searchedPlace.lng } });
    dispatch({ type: 'SET_PENDING_STOP_INSERT_FIRST', value: false });
    dispatch({ type: 'OPEN_MODAL', modal: 'stopForm', editingStopIndex: null });
    setSearchedPlace(null);
  }

  // Offered only on a freshly dropped pin (not a search result) — sets it as
  // Day 1's first stop instead of appending wherever the itinerary is now.
  function startTripHere() {
    if (!searchedPlace) return;
    clearSearchLocation();
    dispatch({ type: 'SET_CURRENT_DAY', day: 0 });
    dispatch({ type: 'SET_PENDING_TAP_COORDS', coords: { lat: searchedPlace.lat, lng: searchedPlace.lng } });
    dispatch({ type: 'SET_PENDING_STOP_INSERT_FIRST', value: true });
    dispatch({ type: 'OPEN_MODAL', modal: 'stopForm', editingStopIndex: null });
    setSearchedPlace(null);
  }

  function closeSearch() {
    searchRequestRef.current += 1;
    setSearching(false);
    setSearchOpen(false);
    setSearchError('');
  }

  function openDestinationSearch() {
    setSearchOpen(true);
    setSearchError('');
    setSearchResults([]);
  }

  function clearSearchText() {
    searchRequestRef.current += 1;
    setSearchQuery('');
    setSearchResults([]);
    setSearchError('');
    setSearching(false);
    window.requestAnimationFrame(() => searchInputRef.current?.focus());
  }

  function openSelectedStopGallery() {
    if (!activeTrip || !selectedStop || selectedStopPhotos.length === 0) return;
    dispatch({
      type: 'SET_ACTIVE_MOMENT_GROUP',
      group: {
        tripId: activeTrip.id,
        key: selectedStopKey,
        time: selectedStop.time,
        title: selectedStop.title,
        photos: selectedStopPhotos,
      },
    });
    dispatch({ type: 'OPEN_MODAL', modal: 'memoryCollection' });
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
    setPlaceGalleryOpen(false);
  }, [state.currentDay, activeTrip?.id]);

  useEffect(() => {
    let cancelled = false;

    async function loadRoutes() {
      const validStops = stops.filter(
        (stop) => Number.isFinite(stop.lat) && Number.isFinite(stop.lng),
      );
      if (validStops.length < 2) {
        drawRoutes([]);
        return;
      }

      const segments = await Promise.all(
        validStops.slice(0, -1).map((stop, index) => fetchWalkingRoute(stop, validStops[index + 1])),
      );
      if (cancelled) return;
      drawRoutes(segments);
    }

    void loadRoutes();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops]);

  return (
    <section id="view-map" className="active map-only-view">
      <div className={`map-frame map-fullscreen-frame${placeGalleryOpen && !searchedPlace ? ' place-gallery-open' : ''}`}>
        <div id="leafletMap" ref={containerRef} />
        <form
          className={`map-search-panel ${searchOpen ? 'is-open' : 'is-closed'}`}
          role="search"
          onSubmit={handleMapSearch}
        >
          {!searchOpen ? (
            <button
              type="button"
              className="map-search-launch"
              aria-label={km ? 'ស្វែងរកទីកន្លែង' : 'Search places'}
              aria-expanded="false"
              onClick={openDestinationSearch}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="10.8" cy="10.8" r="6.3" />
                <path d="m15.5 15.5 4.2 4.2" />
              </svg>
            </button>
          ) : (
            <>
            <div className="map-search-input-row">
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setSearchResults([]);
                  setSearchError('');
                }}
                placeholder={km ? 'ស្វែងរកទីកន្លែង…' : 'Search for a place…'}
                aria-label={km ? 'ស្វែងរកទីកន្លែង' : 'Search for a place'}
                aria-autocomplete="list"
                aria-controls="mapSearchSuggestions"
                aria-expanded={searchHasInput || searching}
                autoComplete="off"
                autoFocus
              />
              <button
                type={searchQuery ? 'button' : 'submit'}
                className={`map-search-submit${searchQuery ? ' is-clear' : ''}`}
                aria-label={searchQuery ? (km ? 'លុបអត្ថបទស្វែងរក' : 'Clear search text') : (km ? 'ស្វែងរក' : 'Search')}
                onClick={searchQuery ? clearSearchText : undefined}
              >
                {searching ? <span className="map-search-spinner" /> : (
                  searchQuery ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.3"/><path d="m15.5 15.5 4.2 4.2"/></svg>
                  )
                )}
              </button>
            </div>
            {(searchHasInput || searching || searchError) && (
              <div className="map-search-results" id="mapSearchSuggestions" role="list" aria-live="polite">
                {visibleSearchResults.length > 0 && (
                  <div className="map-search-results-label">
                    {showingSavedSuggestions
                      ? (km ? 'ទីកន្លែងដែលបានរក្សាទុក' : 'From your trips')
                      : (km ? 'លទ្ធផលផែនទី' : 'Map results')}
                  </div>
                )}
                {searchError && <p className="map-search-error">{searchError}</p>}
                {visibleSearchResults.map((result) => (
                  <button
                    type="button"
                    className={`map-search-result${searchedPlace?.id === result.id ? ' active' : ''}`}
                    key={result.id}
                    onClick={() => selectSearchResult(result)}
                  >
                    <span className="map-search-result-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24"><path d="M12 21s6.5-5.9 6.5-11.1a6.5 6.5 0 1 0-13 0C5.5 15.1 12 21 12 21Z"/><circle cx="12" cy="9.8" r="2.1"/></svg>
                    </span>
                    <span className="map-search-result-copy">
                      <strong><SearchMatch text={result.name} query={searchQuery} /></strong>
                      <small><SearchMatch text={result.address} query={searchQuery} /></small>
                    </span>
                    <span className="map-search-result-type">{result.category}</span>
                  </button>
                ))}
                {searching ? (
                  <div className="map-search-loading" role="status">
                    <span className="map-search-spinner" />
                    {km ? 'កំពុងស្វែងរកទីកន្លែងដែលត្រូវគ្នា…' : 'Finding matching locations…'}
                  </div>
                ) : searchResults.length === 0 && searchHasInput ? (
                  <button type="submit" className="map-search-query-action">
                    <span className="map-search-query-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.3"/><path d="m15.5 15.5 4.2 4.2"/></svg>
                    </span>
                    <span>
                      <small>{km ? 'ស្វែងរកនៅលើផែនទី' : 'Search the map for'}</small>
                      <strong>“{trimmedSearchQuery}”</strong>
                    </span>
                    <svg className="map-search-query-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                ) : null}
              </div>
            )}
            </>
          )}
        </form>
        {tileError && (
          <div className="map-tile-notice" role="status">
            Map is reconnecting…
          </div>
        )}
        <button type="button" className="map-recenter-btn" title="Recenter stops" aria-label={km ? 'បង្ហាញទីកន្លែងទាំងអស់' : 'Show all stops'} onClick={showTripStops}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
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
        {searchedPlace ? (
          <article className="map-selected-stop-card map-searched-place-card">
            <span className="map-selected-stop-art" aria-hidden="true"><span>🧭</span></span>
            <span className="map-selected-stop-copy">
              <small>
                {searchedPlace.id.startsWith('tap-')
                  ? (km ? 'ចំណុចដែលបានចុច' : 'Dropped pin')
                  : (km ? 'លទ្ធផលស្វែងរក' : 'Search result')}
              </small>
              <strong>{searchedPlace.name}</strong>
              <span>{searchedPlace.address}</span>
              {searchedPlace.id.startsWith('tap-') ? (
                <span className="map-pin-actions">
                  <button type="button" className="primary" onClick={startTripHere}>
                    {km ? 'ចាប់ផ្ដើមដំណើរទីនេះ' : 'Start trip here'}
                  </button>
                  <button type="button" onClick={addSearchedPlace}>
                    {km ? 'បន្ថែមទៅផែនការ' : 'Add to plan'}
                  </button>
                </span>
              ) : (
                <button type="button" onClick={addSearchedPlace}>
                  {km ? 'បន្ថែមទៅផែនការ' : 'Add to plan'}
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                </button>
              )}
            </span>
          </article>
        ) : selectedStop && placeGalleryOpen ? (
          <article className="map-place-gallery-card" aria-label={km ? 'ព័ត៌មាន និងរូបថតទីកន្លែង' : 'Place details and photos'}>
            <header className="map-place-gallery-head">
              <span className="map-place-gallery-title">
                <small>{km ? `ទីកន្លែងទី ${selectedStopIndex + 1}` : `Stop ${selectedStopIndex + 1}`}</small>
                <strong>{selectedStop.title}</strong>
                <span>{selectedStop.sub || (km ? 'បានរក្សាទុកក្នុងកាលវិភាគរបស់អ្នក' : 'Saved in your itinerary')}</span>
              </span>
              <button
                type="button"
                className="map-place-gallery-close"
                onClick={() => setPlaceGalleryOpen(false)}
                aria-label={km ? 'បិទព័ត៌មានទីកន្លែង' : 'Close place details'}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
              </button>
            </header>

            <div className="map-place-gallery-meta">
              <span>
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg>
                {selectedStop.time || (km ? 'មិនទាន់កំណត់ម៉ោង' : 'Time not set')}
              </span>
              <button type="button" onClick={() => dispatch({ type: 'NAVIGATE', view: 'itinerary' })}>
                {km ? 'មើលកាលវិភាគ' : 'View itinerary'}
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
              </button>
            </div>

            {selectedStopPhotos.length > 0 ? (
              <button type="button" className="map-place-gallery-strip" onClick={openSelectedStopGallery} aria-label={km ? 'បើករូបថតទាំងអស់' : 'Open all place photos'}>
                {selectedStopPhotos.slice(0, 3).map((photo, index) => (
                  <span className="map-place-gallery-photo" key={`${photo.src}-${index}`}>
                    <img src={photo.src} alt={photo.caption || `${selectedStop.title} ${index + 1}`} />
                    {index === 2 && selectedStopPhotos.length > 3 ? <b>+{selectedStopPhotos.length - 3}</b> : null}
                  </span>
                ))}
              </button>
            ) : (
              <div className="map-place-gallery-empty">
                <span className="map-place-gallery-empty-art" aria-hidden="true">
                  {selectedStopUsesImage ? <img src={selectedStop.emoji} alt="" /> : <span>{selectedStop.emoji || '🏕️'}</span>}
                </span>
                <span>
                  <strong>{km ? 'វិចិត្រសាលទីកន្លែង' : 'Place gallery'}</strong>
                  <small>{km ? 'រូបថតដែលបានរក្សាទុកនឹងបង្ហាញនៅទីនេះ។' : 'Saved photos from this stop will appear here.'}</small>
                </span>
              </div>
            )}
          </article>
        ) : null}
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
