import { createContext, useContext, useEffect, useReducer, useRef, type Dispatch, type ReactNode } from 'react';
import type { AppState } from '../types';
import { appReducer, initialState } from './appReducer';
import type { Action } from './actions';
import { loadState, persistState } from './persistence';
import { getTelegramUser, initTelegramWebApp, telegramUserDisplayName } from '../lib/telegram';
import { clearTripInviteFromUrl, readTripInviteFromUrl } from '../lib/tripInvite';
import { joinTripRoom, saveTripRoom } from '../lib/tripRoom';

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | null>(null);

function init(base: AppState): AppState {
  const loaded = loadState({
    trips: base.trips,
    currentTripId: base.currentTripId,
    profileName: base.profileName,
    profilePhoto: base.profilePhoto,
    theme: base.theme,
    language: base.language,
  });
  return { ...base, ...loaded };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState, init);
  const lastOwnerSyncRef = useRef('');

  useEffect(() => {
    const invitedTrip = readTripInviteFromUrl();
    if (invitedTrip) dispatch({ type: 'IMPORT_SHARED_TRIP', trip: invitedTrip });
    clearTripInviteFromUrl();
  }, []);

  useEffect(() => {
    persistState({
      trips: state.trips,
      currentTripId: state.currentTripId,
      profileName: state.profileName,
      profilePhoto: state.profilePhoto,
      theme: state.theme,
      language: state.language,
    });
  }, [state.trips, state.currentTripId, state.profileName, state.profilePhoto, state.theme, state.language]);

  useEffect(() => {
    const ownerRooms = state.trips.filter((trip) => !trip.readOnly && trip.roomCode && trip.roomOwnerToken);
    const signature = JSON.stringify(
      ownerRooms.map(({ photos: _photos, roomUpdatedAt: _updatedAt, ...trip }) => trip),
    ) + `|${state.profileName}`;
    if (signature === lastOwnerSyncRef.current) return;
    lastOwnerSyncRef.current = signature;
    if (ownerRooms.length === 0) return;

    const timer = window.setTimeout(() => {
      const telegramUser = getTelegramUser();
      const sharedBy = telegramUser ? telegramUserDisplayName(telegramUser) : state.profileName || 'A friend';
      void Promise.allSettled(ownerRooms.map((trip) => saveTripRoom(trip, sharedBy)));
    }, 900);
    return () => window.clearTimeout(timer);
  }, [state.trips, state.profileName]);

  const activeSharedTrip = state.trips.find(
    (trip) => trip.id === state.currentTripId && trip.readOnly && trip.roomCode,
  );
  const sharedRoomCode = activeSharedTrip?.roomCode;
  const sharedRoomUpdatedAt = activeSharedTrip?.roomUpdatedAt ?? 0;

  useEffect(() => {
    if (!sharedRoomCode) return;
    const roomCode = sharedRoomCode;
    let cancelled = false;

    async function refreshRoom() {
      try {
        const refreshed = await joinTripRoom(roomCode);
        if (!cancelled && (refreshed.roomUpdatedAt ?? 0) > sharedRoomUpdatedAt) {
          dispatch({ type: 'REFRESH_SHARED_TRIP', trip: refreshed });
        }
      } catch {
        // Keep the last downloaded copy available while offline.
      }
    }

    void refreshRoom();
    const interval = window.setInterval(() => void refreshRoom(), 6_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [sharedRoomCode, sharedRoomUpdatedAt]);

  useEffect(() => {
    document.body.dataset.theme = state.theme;
  }, [state.theme]);

  useEffect(() => {
    document.body.dataset.language = state.language;
    document.documentElement.lang = state.language === 'km' ? 'km' : 'en';
  }, [state.language]);

  useEffect(() => {
    // Only auto-fill from Telegram if the user hasn't already set a profile
    // themselves (e.g. via Edit Profile) — never overwrite a manual edit.
    if (!state.profileName) {
      const tgUser = getTelegramUser();
      if (tgUser) {
        const name = telegramUserDisplayName(tgUser);
        if (name) dispatch({ type: 'SET_PROFILE_NAME', name });
        if (tgUser.photo_url && !state.profilePhoto) {
          dispatch({ type: 'SET_PROFILE_PHOTO', photo: tgUser.photo_url });
        }
      }
    }
    return initTelegramWebApp((theme) => dispatch({ type: 'SET_THEME', theme }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within an AppProvider');
  return ctx;
}
