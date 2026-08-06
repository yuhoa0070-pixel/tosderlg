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
  language: 'en',
  currentView: 'home',
  memoryReturnView: 'map',
  activeModal: null,
  editingStopIndex: null,
  activeMomentGroup: null,
  viewingPhoto: null,
  pendingTapCoords: null,
  pendingFlyToCoords: null,
};

function mapTrip(state: AppState, tripId: number | null, fn: (trip: Trip) => Trip): Trip[] {
  return state.trips.map((t) => (t.id === tripId && !t.readOnly ? fn(t) : t));
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

    case 'SET_ACTIVE_MOMENT_GROUP': {
      const group = action.group;
      // Sample groups (no tripId) and closing the group (null) don't touch
      // trip context. Real groups mirror the original's
      // openMemoryFromHome()/goAllPhotos(): switch the active trip + day/stop
      // so MemoryView/ConfirmDeletePhotoModal (which key off currentTripId)
      // resolve the right trip even when opened from Home, not the map.
      if (!group || group.tripId == null) {
        return { ...state, activeMomentGroup: group };
      }
      const trip = state.trips.find((t) => t.id === group.tripId);
      if (!trip) return { ...state, activeMomentGroup: group };
      let currentDay = state.currentDay;
      let selectedStop = state.selectedStop;
      const m = group.key ? group.key.match(/^d(\d+)-s(\d+)$/) : null;
      if (m) {
        currentDay = parseInt(m[1], 10);
        selectedStop = parseInt(m[2], 10);
      }
      return { ...state, activeMomentGroup: group, currentTripId: trip.id, currentDay, selectedStop };
    }

    case 'SET_VIEWING_PHOTO':
      return { ...state, viewingPhoto: action.photo };

    case 'SET_PENDING_TAP_COORDS':
      return { ...state, pendingTapCoords: action.coords };

    case 'SET_PENDING_FLY_TO_COORDS':
      return { ...state, pendingFlyToCoords: action.coords };

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

    case 'IMPORT_SHARED_TRIP': {
      const existing = state.trips.find(
        (trip) =>
          trip.readOnly &&
          ((action.trip.roomCode && trip.roomCode === action.trip.roomCode) ||
            (action.trip.shareId && trip.shareId === action.trip.shareId)),
      );
      const importedTrip = { ...action.trip, id: existing?.id ?? action.trip.id, readOnly: true };
      const trips = existing
        ? state.trips.map((trip) => (trip.id === existing.id ? importedTrip : trip))
        : [...state.trips, importedTrip];
      return {
        ...state,
        trips,
        currentTripId: importedTrip.id,
        currentDay: 0,
        selectedStop: 0,
        currentView: 'itinerary',
      };
    }

    case 'REFRESH_SHARED_TRIP': {
      const existing = state.trips.find(
        (trip) => trip.readOnly && action.trip.roomCode && trip.roomCode === action.trip.roomCode,
      );
      if (!existing) return state;
      const refreshedTrip = { ...action.trip, id: existing.id, readOnly: true };
      return {
        ...state,
        trips: state.trips.map((trip) => (trip.id === existing.id ? refreshedTrip : trip)),
      };
    }

    case 'SET_TRIP_SHARE_ID':
      return {
        ...state,
        trips: mapTrip(state, action.tripId, (trip) => ({ ...trip, shareId: action.shareId })),
      };

    case 'SET_TRIP_ROOM':
      return {
        ...state,
        trips: mapTrip(state, action.tripId, (trip) => ({
          ...trip,
          roomCode: action.code,
          roomOwnerToken: action.ownerToken,
          roomUpdatedAt: action.updatedAt,
          members: action.members,
        })),
      };

    case 'SET_TRIP_MEMBERS':
      return {
        ...state,
        trips: state.trips.map((trip) => (trip.id === action.tripId ? { ...trip, members: action.members } : trip)),
      };

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

    case 'ADD_PACKING_ITEM':
      return {
        ...state,
        trips: mapTrip(state, state.currentTripId, (trip) => ({
          ...trip,
          packingItems: [...(trip.packingItems ?? []), action.item],
        })),
      };

    case 'TOGGLE_PACKING_ITEM':
      return {
        ...state,
        trips: mapTrip(state, state.currentTripId, (trip) => ({
          ...trip,
          packingItems: (trip.packingItems ?? []).map((item) =>
            item.id === action.itemId ? { ...item, packed: !item.packed } : item,
          ),
        })),
      };

    case 'REMOVE_PACKING_ITEM':
      return {
        ...state,
        trips: mapTrip(state, state.currentTripId, (trip) => ({
          ...trip,
          packingItems: (trip.packingItems ?? []).filter((item) => item.id !== action.itemId),
        })),
      };

    case 'SET_PROFILE_NAME':
      return { ...state, profileName: action.name };

    case 'SET_PROFILE_PHOTO':
      return { ...state, profilePhoto: action.photo };

    case 'SET_THEME':
      return { ...state, theme: action.theme };

    case 'SET_LANGUAGE':
      return { ...state, language: action.language };

    case 'CLEAR_ALL_DATA':
      return {
        ...initialState,
        theme: state.theme,
        language: state.language,
      };

    default:
      return state;
  }
}
