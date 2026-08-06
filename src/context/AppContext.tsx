import { createContext, useContext, useEffect, useReducer, useRef, type Dispatch, type ReactNode } from 'react';
import type { AppState } from '../types';
import { appReducer, initialState } from './appReducer';
import type { Action } from './actions';
import { loadState, persistState } from './persistence';
import { getTelegramUser, initTelegramWebApp, telegramUserDisplayName } from '../lib/telegram';
import { clearTripInviteFromUrl, readTripInviteFromUrl } from '../lib/tripInvite';
import { currentTripMember, getTripRoom, leaveTripRoom, saveTripRoom } from '../lib/tripRoom';
import {
  hasTelegramCloudStorage,
  loadTelegramCloudState,
  saveTelegramCloudState,
  telegramCloudStateFromApp,
  telegramCloudStateSignature,
} from '../lib/telegramCloudState';

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<Action>;
  removeTrip: (tripId: number) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

function init(base: AppState): AppState {
  const loaded = loadState({
    trips: base.trips,
    currentTripId: base.currentTripId,
    currentDay: base.currentDay,
    selectedStop: base.selectedStop,
    profileName: base.profileName,
    profilePhoto: base.profilePhoto,
    theme: base.theme,
    language: base.language,
    currentView: base.currentView,
    memoryReturnView: base.memoryReturnView,
    activeMomentGroup: base.activeMomentGroup,
    viewingPhoto: base.viewingPhoto,
  });
  return { ...base, ...loaded };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState, init);
  const lastOwnerSyncRef = useRef('');
  const cloudSyncReadyRef = useRef(false);
  const cloudStateExistsRef = useRef(false);
  const lastCloudSyncRef = useRef('');
  const initialCloudStateRef = useRef(telegramCloudStateFromApp({
    trips: state.trips,
    currentTripId: state.currentTripId,
    profileName: state.profileName,
    profilePhoto: state.profilePhoto,
  }));

  useEffect(() => {
    const invitedTrip = readTripInviteFromUrl();
    if (invitedTrip) dispatch({ type: 'IMPORT_SHARED_TRIP', trip: invitedTrip });
    clearTripInviteFromUrl();
  }, []);

  async function removeTrip(tripId: number): Promise<void> {
    const trip = state.trips.find((item) => item.id === tripId);
    if (!trip) return;

    if (trip.readOnly && trip.roomCode) {
      const member = currentTripMember(state.profileName, state.profilePhoto);
      await leaveTripRoom(trip.roomCode, member, trip.roomMemberId);
    }

    dispatch({ type: 'DELETE_TRIP', tripId });
  }

  useEffect(() => {
    if (!hasTelegramCloudStorage()) return;
    let cancelled = false;

    async function hydrateFromTelegram() {
      try {
        const cloudState = await loadTelegramCloudState();
        if (cancelled) return;

        if (cloudState) {
          cloudSyncReadyRef.current = true;
          cloudStateExistsRef.current = true;
          lastCloudSyncRef.current = telegramCloudStateSignature(cloudState);
          dispatch({ type: 'RESTORE_TELEGRAM_CLOUD_STATE', cloudState });
          return;
        }

        const localState = initialCloudStateRef.current;
        if (localState.trips.length > 0) {
          await saveTelegramCloudState(localState);
          if (cancelled) return;
          cloudStateExistsRef.current = true;
        }
        lastCloudSyncRef.current = telegramCloudStateSignature(localState);
        cloudSyncReadyRef.current = true;
      } catch (error) {
        console.warn('Telegram cloud sync could not start.', error);
      }
    }

    void hydrateFromTelegram();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    persistState({
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
      activeMomentGroup: state.activeMomentGroup,
      viewingPhoto: state.viewingPhoto,
    });
  }, [
    state.trips,
    state.currentTripId,
    state.currentDay,
    state.selectedStop,
    state.profileName,
    state.profilePhoto,
    state.theme,
    state.language,
    state.currentView,
    state.memoryReturnView,
    state.activeMomentGroup,
    state.viewingPhoto,
  ]);

  useEffect(() => {
    if (!cloudSyncReadyRef.current || !hasTelegramCloudStorage()) return;
    const cloudState = telegramCloudStateFromApp({
      trips: state.trips,
      currentTripId: state.currentTripId,
      profileName: state.profileName,
      profilePhoto: state.profilePhoto,
    });
    const signature = telegramCloudStateSignature(cloudState);
    if (signature === lastCloudSyncRef.current) return;
    if (!cloudStateExistsRef.current && cloudState.trips.length === 0) return;

    const timer = window.setTimeout(() => {
      void saveTelegramCloudState(cloudState)
        .then(() => {
          cloudStateExistsRef.current = true;
          lastCloudSyncRef.current = signature;
        })
        .catch((error) => {
          console.warn('Telegram cloud state could not be saved.', error);
        });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [state.trips, state.currentTripId, state.profileName, state.profilePhoto]);

  useEffect(() => {
    const ownerRooms = state.trips.filter((trip) => !trip.readOnly && trip.roomCode && trip.roomOwnerToken);
    const signature = JSON.stringify(
      ownerRooms.map(({ photos: _photos, roomUpdatedAt: _updatedAt, members: _members, ...trip }) => trip),
    ) + `|${state.profileName}`;
    if (signature === lastOwnerSyncRef.current) return;
    lastOwnerSyncRef.current = signature;
    if (ownerRooms.length === 0) return;

    const timer = window.setTimeout(() => {
      const telegramUser = getTelegramUser();
      const sharedBy = telegramUser ? telegramUserDisplayName(telegramUser) : state.profileName || 'A friend';
      const member = currentTripMember(state.profileName, state.profilePhoto);
      void Promise.allSettled(ownerRooms.map((trip) => {
        const existingOwner = trip.members?.find((roomMember) => roomMember.role === 'owner');
        const owner = existingOwner ? { ...member, id: existingOwner.id } : member;
        return saveTripRoom(trip, sharedBy, owner);
      }));
    }, 900);
    return () => window.clearTimeout(timer);
  }, [state.trips, state.profileName, state.profilePhoto]);

  const activeRoomTrip = state.trips.find(
    (trip) => trip.id === state.currentTripId && trip.roomCode,
  );
  const activeRoomTripId = activeRoomTrip?.id;
  const activeRoomCode = activeRoomTrip?.roomCode;
  const activeRoomReadOnly = activeRoomTrip?.readOnly === true;
  const activeRoomUpdatedAt = activeRoomTrip?.roomUpdatedAt ?? 0;

  useEffect(() => {
    if (!activeRoomCode || activeRoomTripId == null) return;
    const roomCode = activeRoomCode;
    const tripId = activeRoomTripId;
    let cancelled = false;

    async function refreshRoom() {
      try {
        const refreshed = await getTripRoom(roomCode);
        if (cancelled) return;
        dispatch({ type: 'SET_TRIP_MEMBERS', tripId, members: refreshed.members ?? [] });
        if (activeRoomReadOnly && (refreshed.roomUpdatedAt ?? 0) > activeRoomUpdatedAt) {
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
  }, [activeRoomCode, activeRoomReadOnly, activeRoomTripId, activeRoomUpdatedAt]);

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

  return <AppContext.Provider value={{ state, dispatch, removeTrip }}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within an AppProvider');
  return ctx;
}
