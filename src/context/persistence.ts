import type { AppState, Language, Theme, Trip, ViewName } from '../types';

const NEW_KEY = 'waylo_trips_v1';
const OLD_KEY = 'waypoint_trips_v1';

interface PersistedShape {
  trips?: Trip[];
  currentTripId?: number | null;
  currentDay?: number;
  selectedStop?: number;
  profileName?: string;
  profilePhoto?: string | null;
  theme?: Theme;
  language?: Language;
  currentView?: ViewName;
  memoryReturnView?: ViewName;
  activeMomentGroup?: {
    tripId?: number;
    key?: string;
    time?: string;
    title?: string;
  } | null;
  viewingPhoto?: {
    key?: string;
    index?: number;
  } | null;
}

export type LoadedState = Pick<
  AppState,
  | 'trips'
  | 'currentTripId'
  | 'currentDay'
  | 'selectedStop'
  | 'profileName'
  | 'profilePhoto'
  | 'theme'
  | 'language'
  | 'currentView'
  | 'memoryReturnView'
  | 'activeMomentGroup'
  | 'viewingPhoto'
>;

const VIEW_NAMES = new Set<ViewName>([
  'home',
  'itinerary',
  'budget',
  'customize',
  'map',
  'all-photos',
  'memory',
  'recap',
  'mytrips',
  'profile',
  'budgetTracker',
  'tripDetails',
  'documents',
  'tripTemplates',
]);

const TRIP_VIEWS = new Set<ViewName>([
  'itinerary',
  'budget',
  'customize',
  'map',
  'all-photos',
  'memory',
  'recap',
  'tripDetails',
]);

function isViewName(value: unknown): value is ViewName {
  return typeof value === 'string' && VIEW_NAMES.has(value as ViewName);
}

function isIndex(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

export function loadState(defaults: LoadedState): LoadedState {
  try {
    const raw = localStorage.getItem(NEW_KEY) ?? localStorage.getItem(OLD_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as PersistedShape;
    const trips = Array.isArray(parsed.trips) ? parsed.trips : defaults.trips;
    const requestedTripId = typeof parsed.currentTripId === 'number' ? parsed.currentTripId : defaults.currentTripId;
    const activeTrip = trips.find((trip) => trip.id === requestedTripId);
    const currentTripId = activeTrip?.id ?? null;

    const requestedDay = isIndex(parsed.currentDay) ? parsed.currentDay : defaults.currentDay;
    const currentDay = activeTrip ? Math.min(requestedDay, Math.max(activeTrip.tripDays.length - 1, 0)) : 0;
    const requestedStop = isIndex(parsed.selectedStop) ? parsed.selectedStop : defaults.selectedStop;
    const stops = activeTrip?.tripDays[currentDay]?.stops ?? [];
    const selectedStop = activeTrip ? Math.min(requestedStop, Math.max(stops.length - 1, 0)) : 0;

    const moment = parsed.activeMomentGroup;
    const momentTrip = typeof moment?.tripId === 'number' ? trips.find((trip) => trip.id === moment.tripId) : undefined;
    const activeMomentGroup =
      momentTrip && typeof moment?.key === 'string'
        ? {
            tripId: momentTrip.id,
            key: moment.key,
            time: typeof moment.time === 'string' ? moment.time : '',
            title: typeof moment.title === 'string' ? moment.title : '',
            photos: momentTrip.photos[moment.key] ?? [],
          }
        : null;

    const savedPhoto = parsed.viewingPhoto;
    const viewingPhoto =
      activeTrip &&
      typeof savedPhoto?.key === 'string' &&
      isIndex(savedPhoto.index) &&
      activeTrip.photos[savedPhoto.key]?.[savedPhoto.index]
        ? { key: savedPhoto.key, index: savedPhoto.index }
        : null;

    let memoryReturnView = isViewName(parsed.memoryReturnView) ? parsed.memoryReturnView : defaults.memoryReturnView;
    if (memoryReturnView === 'all-photos' && !activeMomentGroup) memoryReturnView = activeTrip ? 'map' : 'home';

    let currentView = isViewName(parsed.currentView) ? parsed.currentView : defaults.currentView;
    if (TRIP_VIEWS.has(currentView) && !activeTrip) currentView = 'home';
    if (currentView === 'all-photos' && !activeMomentGroup) currentView = 'home';
    if (currentView === 'memory' && !viewingPhoto) currentView = memoryReturnView;

    return {
      trips,
      currentTripId,
      currentDay,
      selectedStop,
      profileName: parsed.profileName ?? defaults.profileName,
      profilePhoto: parsed.profilePhoto ?? defaults.profilePhoto,
      theme: parsed.theme ?? defaults.theme,
      language: parsed.language ?? defaults.language,
      currentView,
      memoryReturnView,
      activeMomentGroup,
      viewingPhoto,
    };
  } catch {
    return defaults;
  }
}

export function persistState(state: LoadedState): void {
  try {
    localStorage.setItem(
      NEW_KEY,
      JSON.stringify({
        trips: state.trips,
        currentTripId: state.currentTripId,
        currentDay: state.currentDay,
        selectedStop: state.selectedStop,
        profileName: state.profileName,
        profilePhoto: state.profilePhoto,
        theme: state.theme,
        language: state.language,
        currentView: state.currentView,
        memoryReturnView: state.memoryReturnView,
        activeMomentGroup: state.activeMomentGroup
          ? {
              tripId: state.activeMomentGroup.tripId,
              key: state.activeMomentGroup.key,
              time: state.activeMomentGroup.time,
              title: state.activeMomentGroup.title,
            }
          : null,
        viewingPhoto: state.viewingPhoto,
      }),
    );
  } catch {
    // storage unavailable — safe to skip
  }
}

/**
 * Wipes persisted state under both the current and legacy storage keys.
 * Used by the "Clear all data" flow — unlike persistState()/loadState(),
 * which deliberately keep the legacy key around as a migration fallback,
 * this is an explicit full wipe requested by the user.
 */
export function clearPersistedState(): void {
  try {
    localStorage.removeItem(NEW_KEY);
    localStorage.removeItem(OLD_KEY);
  } catch {
    // storage unavailable — safe to skip
  }
}
