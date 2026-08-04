export type Theme = 'dark' | 'light';

export type ViewName =
  | 'home'
  | 'itinerary'
  | 'customize'
  | 'map'
  | 'all-photos'
  | 'memory'
  | 'recap'
  | 'mytrips'
  | 'profile';

export type ModalName =
  | 'stopForm'
  | 'pasteLink'
  | 'memoryCollection'
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
}

export interface MomentGroup {
  tripId?: number;
  key?: string;
  time: string;
  title: string;
  photos: Photo[];
}

export interface AppState {
  trips: Trip[];
  currentTripId: number | null;
  currentDay: number;
  selectedStop: number;
  profileName: string;
  profilePhoto: string | null;
  theme: Theme;
  currentView: ViewName;
  memoryReturnView: ViewName;
  activeModal: ModalName | null;
  editingStopIndex: number | null;
}
