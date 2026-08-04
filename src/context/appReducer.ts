import type { AppState, Trip } from '../types';
import { isPastTrip } from '../lib/tripUtils';
import type { Action } from './actions';

export const initialState: AppState = {
  trips: [],
  currentTripId: null,
  currentDay: 0,
  selectedStop: 0,
  profileName: '',
  profilePhoto: null,
  theme: 'dark',
  currentView: 'home',
  memoryReturnView: 'map',
  activeModal: null,
  editingStopIndex: null,
  activeMomentGroup: null,
  viewingPhoto: null,
  pendingTapCoords: null,
};

function mapTrip(state: AppState, tripId: number | null, fn: (trip: Trip) => Trip): Trip[] {
  return state.trips.map((t) => (t.id === tripId ? fn(t) : t));
}

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'NAVIGATE':
      return { ...state, currentView: action.view };

    case 'SET_CURRENT_DAY':
      return { ...state, currentDay: action.day };

    case 'SET_SELECTED_STOP':
      return { ...state, selectedStop: action.index };

    case 'SET_MEMORY_RETURN_VIEW':
      return { ...state, memoryReturnView: action.view };

    case 'SET_ACTIVE_MOMENT_GROUP':
      return { ...state, activeMomentGroup: action.group };

    case 'SET_VIEWING_PHOTO':
      return { ...state, viewingPhoto: action.photo };

    case 'SET_PENDING_TAP_COORDS':
      return { ...state, pendingTapCoords: action.coords };

    case 'OPEN_MODAL':
      return {
        ...state,
        activeModal: action.modal,
        editingStopIndex: action.editingStopIndex ?? null,
      };

    case 'CLOSE_MODAL':
      return { ...state, activeModal: null, editingStopIndex: null };

    case 'CREATE_TRIP':
      return {
        ...state,
        trips: [...state.trips, action.trip],
        currentTripId: action.trip.id,
        currentDay: 0,
        currentView: 'customize',
      };

    case 'LOAD_TRIP': {
      const trip = state.trips.find((t) => t.id === action.tripId);
      if (!trip) return state;
      return {
        ...state,
        currentTripId: trip.id,
        currentDay: 0,
        currentView: isPastTrip(trip) ? 'recap' : 'itinerary',
      };
    }

    case 'DELETE_TRIP': {
      const trips = state.trips.filter((t) => t.id !== action.tripId);
      const wasActive = state.currentTripId === action.tripId;
      return {
        ...state,
        trips,
        currentTripId: wasActive ? null : state.currentTripId,
        currentDay: wasActive ? 0 : state.currentDay,
        currentView: wasActive ? 'home' : state.currentView,
      };
    }

    case 'ADD_STOP':
      return {
        ...state,
        trips: mapTrip(state, state.currentTripId, (trip) => {
          const tripDays = trip.tripDays.map((day, i) =>
            i === action.dayIndex ? { stops: [...day.stops, action.stop] } : day,
          );
          return { ...trip, tripDays };
        }),
      };

    case 'UPDATE_STOP':
      return {
        ...state,
        trips: mapTrip(state, state.currentTripId, (trip) => {
          const tripDays = trip.tripDays.map((day, i) => {
            if (i !== action.dayIndex) return day;
            const stops = day.stops.map((s, si) => (si === action.stopIndex ? action.stop : s));
            return { stops };
          });
          return { ...trip, tripDays };
        }),
      };

    case 'REMOVE_STOP':
      return {
        ...state,
        trips: mapTrip(state, state.currentTripId, (trip) => {
          const tripDays = trip.tripDays.map((day, i) => {
            if (i !== action.dayIndex) return day;
            return { stops: day.stops.filter((_, si) => si !== action.stopIndex) };
          });
          return { ...trip, tripDays };
        }),
      };

    case 'REORDER_STOPS':
      return {
        ...state,
        trips: mapTrip(state, state.currentTripId, (trip) => {
          const tripDays = trip.tripDays.map((day, i) => {
            if (i !== action.dayIndex) return day;
            const stops = day.stops.slice();
            const [moved] = stops.splice(action.oldIndex, 1);
            stops.splice(action.newIndex, 0, moved);
            return { stops };
          });
          return { ...trip, tripDays };
        }),
      };

    case 'ADD_PHOTO':
      return {
        ...state,
        trips: mapTrip(state, state.currentTripId, (trip) => {
          const existing = trip.photos[action.key] || [];
          return { ...trip, photos: { ...trip.photos, [action.key]: [...existing, action.photo] } };
        }),
      };

    case 'UPDATE_PHOTO_CAPTION':
      return {
        ...state,
        trips: mapTrip(state, state.currentTripId, (trip) => {
          const existing = trip.photos[action.key] || [];
          const updated = existing.map((p, i) => (i === action.index ? { ...p, caption: action.caption } : p));
          return { ...trip, photos: { ...trip.photos, [action.key]: updated } };
        }),
      };

    case 'DELETE_PHOTO':
      return {
        ...state,
        trips: mapTrip(state, state.currentTripId, (trip) => {
          const existing = trip.photos[action.key] || [];
          const updated = existing.filter((_, i) => i !== action.index);
          return { ...trip, photos: { ...trip.photos, [action.key]: updated } };
        }),
      };

    case 'SET_PROFILE_NAME':
      return { ...state, profileName: action.name };

    case 'SET_PROFILE_PHOTO':
      return { ...state, profilePhoto: action.photo };

    case 'SET_THEME':
      return { ...state, theme: action.theme };

    case 'CLEAR_ALL_DATA':
      return {
        ...initialState,
        theme: state.theme,
      };

    default:
      return state;
  }
}
