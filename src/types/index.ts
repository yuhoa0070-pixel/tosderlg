export type Theme = 'dark' | 'light';
export type Language = 'en' | 'km';

export type ViewName =
  | 'home'
  | 'itinerary'
  | 'budget'
  | 'customize'
  | 'map'
  | 'all-photos'
  | 'memory'
  | 'recap'
  | 'mytrips'
  | 'profile'
  | 'budgetTracker'
  | 'tripDetails'
  | 'documents'
  | 'tripTemplates'
  | 'weather';

export type ModalName =
  | 'stopForm'
  | 'tripCreated'
  | 'editTripDates'
  | 'pasteLink'
  | 'memoryCollection'
  | 'joinTripRoom'
  | 'editProfile'
  | 'confirmClear'
  | 'confirmDeletePhoto'
  | 'packingChecklist';

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

export interface TripDocument {
  key: string;
  name: string;
  size: number;
  contentType: string;
  uploadedAt: number;
}

export interface TripMember {
  id: string;
  name: string;
  photoUrl?: string;
  role: 'owner' | 'member';
  joinedAt: number;
}

export type BudgetCurrency = 'USD' | 'KHR';

export type BudgetCategory = 'stay' | 'transport' | 'food' | 'activity' | 'other';

export interface BudgetExpense {
  id: string;
  title: string;
  amount: number;
  category: BudgetCategory;
  assignedToMemberId?: string;
  createdAt: number;
}

export interface BudgetCommitment {
  memberId: string;
  amount: number;
  lockedAt: number;
}

export interface TripBudget {
  currency: BudgetCurrency;
  targetAmount: number;
  expenses: BudgetExpense[];
  commitments: BudgetCommitment[];
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
  documents?: TripDocument[];
  budget?: TripBudget;
  shareId?: string;
  sharedBy?: string;
  readOnly?: boolean;
  roomCode?: string;
  roomOwnerToken?: string;
  roomMemberId?: string;
  roomUpdatedAt?: number;
  members?: TripMember[];
}

export interface TelegramCloudState {
  version: 1;
  trips: Trip[];
  currentTripId: number | null;
  profileName: string;
  profilePhoto: string | null;
  updatedAt: number;
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
  /** The view NAVIGATE last came from, so a back button can return to where the user actually was. */
  previousView: ViewName | null;
  memoryReturnView: ViewName;
  activeModal: ModalName | null;
  editingStopIndex: number | null;
  activeMomentGroup: MomentGroup | null;
  viewingPhoto: ViewingPhoto | null;
  /** Coordinates from a tap-to-add-stop on the map, consumed by StopFormModal. */
  pendingTapCoords: GeoCenter | null;
  /** Coordinates a newly pasted-link stop should fly to, consumed by MapView. */
  pendingFlyToCoords: GeoCenter | null;
  /** Destination to prefill the next TripForm with — set by "Plan again" on a past trip. */
  newTripDestination: string;
}
