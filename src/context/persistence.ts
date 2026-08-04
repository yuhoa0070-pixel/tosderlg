import type { AppState, Theme, Trip } from '../types';

const NEW_KEY = 'waylo_trips_v1';
const OLD_KEY = 'waypoint_trips_v1';

interface PersistedShape {
  trips?: Trip[];
  currentTripId?: number | null;
  profileName?: string;
  profilePhoto?: string | null;
  theme?: Theme;
}

export type LoadedState = Pick<AppState, 'trips' | 'currentTripId' | 'profileName' | 'profilePhoto' | 'theme'>;

export function loadState(defaults: LoadedState): LoadedState {
  try {
    const raw = localStorage.getItem(NEW_KEY) ?? localStorage.getItem(OLD_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as PersistedShape;
    return {
      trips: parsed.trips ?? defaults.trips,
      currentTripId: parsed.currentTripId ?? defaults.currentTripId,
      profileName: parsed.profileName ?? defaults.profileName,
      profilePhoto: parsed.profilePhoto ?? defaults.profilePhoto,
      theme: parsed.theme ?? defaults.theme,
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
        profileName: state.profileName,
        profilePhoto: state.profilePhoto,
        theme: state.theme,
      }),
    );
  } catch {
    // storage unavailable — safe to skip
  }
}
