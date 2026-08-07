import type { PlaceSearchResult } from './geocode';

export interface GoogleLatLngLiteral {
  lat: number;
  lng: number;
}

export interface GoogleLatLng {
  lat(): number;
  lng(): number;
}

export interface GoogleMapsListener {
  remove(): void;
}

export interface GoogleMapInstance {
  addListener(eventName: string, handler: (event: { latLng?: GoogleLatLng | null }) => void): GoogleMapsListener;
  fitBounds(bounds: GoogleLatLngBounds, padding?: number | { top: number; right: number; bottom: number; left: number }): void;
  getCenter(): GoogleLatLng | undefined;
  panTo(position: GoogleLatLngLiteral): void;
  setCenter(position: GoogleLatLngLiteral): void;
  setOptions(options: Record<string, unknown>): void;
  setZoom(zoom: number): void;
}

export interface GoogleLatLngBounds {
  extend(position: GoogleLatLngLiteral): void;
}

export interface GoogleMarkerInstance {
  addListener(eventName: string, handler: () => void): GoogleMapsListener;
  setIcon(icon: unknown): void;
  setLabel(label: string | {
    text: string;
    className?: string;
    color?: string;
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
  }): void;
  setMap(map: GoogleMapInstance | null): void;
  setPosition(position: GoogleLatLngLiteral): void;
  setZIndex(zIndex: number | undefined): void;
}

export interface GoogleCircleInstance {
  getBounds(): GoogleLatLngBounds | null;
  setCenter(position: GoogleLatLngLiteral): void;
  setMap(map: GoogleMapInstance | null): void;
  setRadius(radius: number): void;
}

export interface GooglePolylineInstance {
  setMap(map: GoogleMapInstance | null): void;
}

interface GooglePlace {
  id?: string;
  displayName?: string;
  formattedAddress?: string;
  location?: GoogleLatLng;
  fetchFields(options: { fields: string[] }): Promise<void>;
}

interface GooglePlacePrediction {
  placeId: string;
  text: { toString(): string };
  mainText?: { text: string };
  secondaryText?: { text: string };
  types?: string[];
  toPlace(): GooglePlace;
}

interface GoogleAutocompleteSuggestion {
  placePrediction?: GooglePlacePrediction;
}

interface GooglePlacesApi {
  AutocompleteSessionToken: new () => object;
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions(options: {
      input: string;
      language?: string;
      region?: string;
      locationBias?: { center: GoogleLatLngLiteral; radius: number };
      sessionToken: object;
    }): Promise<{ suggestions: GoogleAutocompleteSuggestion[] }>;
  };
}

export interface GoogleMapsApi {
  Map: new (element: HTMLElement, options: Record<string, unknown>) => GoogleMapInstance;
  Marker: new (options: Record<string, unknown>) => GoogleMarkerInstance;
  Circle: new (options: Record<string, unknown>) => GoogleCircleInstance;
  Polyline: new (options: Record<string, unknown>) => GooglePolylineInstance;
  LatLngBounds: new () => GoogleLatLngBounds;
  SymbolPath: { CIRCLE: unknown };
  places: GooglePlacesApi;
}

interface GoogleMapsWindow extends Window {
  google?: { maps: GoogleMapsApi };
  __wayloGoogleMapsReady?: () => void;
}

export interface GooglePlaceSuggestion {
  id: string;
  name: string;
  address: string;
  category: string;
  resolve(): Promise<PlaceSearchResult>;
}

let loadPromise: Promise<GoogleMapsApi> | null = null;
let autocompleteToken: object | null = null;

export function hasGoogleMapsKey(): boolean {
  return Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim());
}

export function loadGoogleMaps(): Promise<GoogleMapsApi> {
  const googleWindow = window as GoogleMapsWindow;
  if (googleWindow.google?.maps) return Promise.resolve(googleWindow.google.maps);
  if (loadPromise) return loadPromise;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey) return Promise.reject(new Error('Google Maps API key is missing'));

  loadPromise = new Promise<GoogleMapsApi>((resolve, reject) => {
    googleWindow.__wayloGoogleMapsReady = () => {
      delete googleWindow.__wayloGoogleMapsReady;
      const maps = googleWindow.google?.maps;
      if (maps) resolve(maps);
      else reject(new Error('Google Maps did not initialize'));
    };

    const script = document.createElement('script');
    script.id = 'waylo-google-maps-script';
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&libraries=places&loading=async&callback=__wayloGoogleMapsReady`;
    script.onerror = () => {
      delete googleWindow.__wayloGoogleMapsReady;
      loadPromise = null;
      reject(new Error('Google Maps could not load'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function resetGoogleAutocompleteSession(): void {
  autocompleteToken = null;
}

export async function fetchGooglePlaceSuggestions(
  input: string,
  language: 'en' | 'km',
  center?: GoogleLatLngLiteral,
): Promise<GooglePlaceSuggestion[]> {
  const maps = await loadGoogleMaps();
  autocompleteToken ??= new maps.places.AutocompleteSessionToken();
  const response = await maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
    input,
    language: language === 'km' ? 'km' : 'en',
    region: 'kh',
    ...(center ? { locationBias: { center, radius: 250000 } } : {}),
    sessionToken: autocompleteToken,
  });

  return response.suggestions.flatMap((suggestion) => {
    const prediction = suggestion.placePrediction;
    if (!prediction) return [];
    const fullText = prediction.text.toString();
    const name = prediction.mainText?.text || fullText.split(',')[0]?.trim() || fullText;
    const address = prediction.secondaryText?.text || fullText.split(',').slice(1).join(',').trim();
    return [{
      id: prediction.placeId,
      name,
      address,
      category: prediction.types?.[0]?.replaceAll('_', ' ') || 'Google Maps',
      async resolve(): Promise<PlaceSearchResult> {
        const place = prediction.toPlace();
        await place.fetchFields({ fields: ['id', 'displayName', 'formattedAddress', 'location'] });
        if (!place.location) throw new Error('Google did not return coordinates for this place');
        resetGoogleAutocompleteSession();
        return {
          id: place.id || prediction.placeId,
          name: place.displayName || name,
          address: place.formattedAddress || address,
          category: prediction.types?.[0]?.replaceAll('_', ' ') || 'Google Maps',
          lat: place.location.lat(),
          lng: place.location.lng(),
        };
      },
    }];
  });
}
