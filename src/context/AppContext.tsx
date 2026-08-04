import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from 'react';
import type { AppState } from '../types';
import { appReducer, initialState } from './appReducer';
import type { Action } from './actions';
import { loadState, persistState } from './persistence';
import { initTelegramWebApp } from '../lib/telegram';

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
  });
  return { ...base, ...loaded };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState, init);

  useEffect(() => {
    persistState({
      trips: state.trips,
      currentTripId: state.currentTripId,
      profileName: state.profileName,
      profilePhoto: state.profilePhoto,
      theme: state.theme,
    });
  }, [state.trips, state.currentTripId, state.profileName, state.profilePhoto, state.theme]);

  useEffect(() => {
    document.body.dataset.theme = state.theme;
  }, [state.theme]);

  useEffect(() => {
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
