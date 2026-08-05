import type { AppState, Language, Theme, Trip } from '../types';

const NEW_KEY = 'waylo_trips_v1';
const OLD_KEY = 'waypoint_trips_v1';

interface PersistedShape {
  trips?: Trip[];
  currentTripId?: number | null;
  profileName?: string;
  profilePhoto?: string | null;
  theme?: Theme;
  language?: Language;
}

export type LoadedState = Pick<AppState, 'trips' | 'currentTripId' | 'profileName' | 'profilePhoto' | 'theme' | 'language'>;

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
      language: parsed.language ?? defaults.language,
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
        language: state.language,
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
