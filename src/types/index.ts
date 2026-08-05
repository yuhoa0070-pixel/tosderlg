export type Theme = 'dark' | 'light';
export type Language = 'en' | 'km';

export type ViewName =
  | 'home'
  | 'itinerary'
  | 'customize'
  | 'map'
  | 'packing'
  | 'all-photos'
  | 'memory'
  | 'recap'
  | 'mytrips'
  | 'profile';

export type ModalName =
  | 'stopForm'
  | 'pasteLink'
  | 'memoryCollection'
  | 'joinTripRoom'
  | 'editProfile'
  | 'confirmClear'
  | 'confirmDeletePhoto';

export interface Photo {
  src: string;
  caption?: string;
}

export interface Stop {
  time: string;
  title: string;
  sub: string;
  mapLink?: string | null;
  emoji?: string;
  lat: number;
  lng: number;
}

export interface TripDay {
  stops: Stop[];
}

export interface PackingItem {
  id: number;
  text: string;
  packed: boolean;
  emoji?: string;
}

export interface GeoCenter {
  lat: number;
  lng: number;
}

export interface Trip {
  id: number;
  destination: string;
  label: string;
  startDate: string | null;
  endDate: string | null;
  center: GeoCenter;
  tripDays: TripDay[];
  photos: Record<string, Photo[]>;
  packingItems?: PackingItem[];
  shareId?: string;
  sharedBy?: string;
  readOnly?: boolean;
  roomCode?: string;
  roomOwnerToken?: string;
  roomUpdatedAt?: number;
}

export interface MomentGroup {
  tripId?: number;
  key?: string;
  time: string;
  title: string;
  photos: Photo[];
}

export interface ViewingPhoto {
  key: string;
  index: number;
}

export interface AppState {
  trips: Trip[];
  currentTripId: number | null;
  currentDay: number;
  selectedStop: number;
  profileName: string;
  profilePhoto: string | null;
  theme: Theme;
  language: Language;
  currentView: ViewName;
  memoryReturnView: ViewName;
  activeModal: ModalName | null;
  editingStopIndex: number | null;
  activeMomentGroup: MomentGroup | null;
  viewingPhoto: ViewingPhoto | null;
  /** Coordinates from a tap-to-add-stop on the map, consumed by StopFormModal. */
  pendingTapCoords: GeoCenter | null;
  /** Coordinates a newly pasted-link stop should fly to, consumed by MapView. */
  pendingFlyToCoords: GeoCenter | null;
}
