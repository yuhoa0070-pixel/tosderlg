import type { GeoCenter, Language, ModalName, MomentGroup, PackingItem, Photo, Stop, TelegramCloudState, Theme, Trip, TripBudget, TripDocument, TripMember, ViewingPhoto, ViewName } from '../types';

export type Action =
  | { type: 'NAVIGATE'; view: ViewName }
  | { type: 'SET_CURRENT_DAY'; day: number }
  | { type: 'SET_SELECTED_STOP'; index: number }
  | { type: 'SET_MEMORY_RETURN_VIEW'; view: ViewName }
  | { type: 'SET_ACTIVE_MOMENT_GROUP'; group: MomentGroup | null }
  | { type: 'SET_VIEWING_PHOTO'; photo: ViewingPhoto | null }
  | { type: 'SET_PENDING_TAP_COORDS'; coords: GeoCenter | null }
  | { type: 'SET_PENDING_FLY_TO_COORDS'; coords: GeoCenter | null }
  | { type: 'SET_NEW_TRIP_DESTINATION'; destination: string }
  | { type: 'OPEN_MODAL'; modal: ModalName; editingStopIndex?: number | null }
  | { type: 'CLOSE_MODAL' }
  | { type: 'CREATE_TRIP'; trip: Trip }
  | { type: 'UPDATE_TRIP_DATES'; tripId: number; startDate: string; endDate: string }
  | { type: 'LOAD_TRIP'; tripId: number }
  | { type: 'DESELECT_TRIP' }
  | { type: 'IMPORT_SHARED_TRIP'; trip: Trip }
  | { type: 'REFRESH_SHARED_TRIP'; trip: Trip }
  | { type: 'SET_TRIP_SHARE_ID'; tripId: number; shareId: string }
  | { type: 'SET_TRIP_ROOM'; tripId: number; code: string; ownerToken: string; updatedAt: number; members: TripMember[] }
  | { type: 'SET_TRIP_MEMBERS'; tripId: number; members: TripMember[] }
  | { type: 'SET_TRIP_ROOM_UPDATED_AT'; tripId: number; updatedAt: number }
  | { type: 'SET_TRIP_BUDGET'; tripId: number; budget: TripBudget; updatedAt?: number }
  | { type: 'RESTORE_TELEGRAM_CLOUD_STATE'; cloudState: TelegramCloudState }
  | { type: 'DELETE_TRIP'; tripId: number }
  | { type: 'ADD_STOP'; dayIndex: number; stop: Stop }
  | { type: 'UPDATE_STOP'; dayIndex: number; stopIndex: number; stop: Stop }
  | { type: 'REMOVE_STOP'; dayIndex: number; stopIndex: number }
  | { type: 'REORDER_STOPS'; dayIndex: number; oldIndex: number; newIndex: number }
  | { type: 'ADD_PHOTO'; key: string; photo: Photo }
  | { type: 'UPDATE_PHOTO_CAPTION'; key: string; index: number; caption: string }
  | { type: 'DELETE_PHOTO'; key: string; index: number }
  | { type: 'ADD_PACKING_ITEM'; item: PackingItem }
  | { type: 'TOGGLE_PACKING_ITEM'; itemId: number }
  | { type: 'REMOVE_PACKING_ITEM'; itemId: number }
  | { type: 'ADD_DOCUMENT'; tripId: number; document: TripDocument }
  | { type: 'REMOVE_DOCUMENT'; tripId: number; key: string }
  | { type: 'SET_PROFILE_NAME'; name: string }
  | { type: 'SET_PROFILE_PHOTO'; photo: string | null }
  | { type: 'SET_THEME'; theme: Theme }
  | { type: 'SET_LANGUAGE'; language: Language }
  | { type: 'CLEAR_ALL_DATA' };
