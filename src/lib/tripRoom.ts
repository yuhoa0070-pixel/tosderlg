import type { Trip, TripBudget, TripMember } from '../types';
import { getTelegramUser, telegramUserDisplayName } from './telegram';

const MEMBER_ID_KEY = 'waylo_room_member_id_v1';
let sessionMemberId = '';

export interface TripMemberInput {
  id: string;
  name: string;
  photoUrl?: string;
}

interface SavedRoom {
  code: string;
  ownerToken: string;
  updatedAt: number;
  members: TripMember[];
}

interface RoomResponse {
  code: string;
  sharedBy: string;
  trip: Omit<Trip, 'id' | 'photos'>;
  updatedAt: number;
  members?: TripMember[];
}

interface BudgetCommitmentResponse {
  budget: TripBudget;
  updatedAt: number;
}

function tripRoomApiUrl(): string {
  const configured = import.meta.env.VITE_TRIP_ROOM_API_URL?.replace(/\/+$/, '');
  if (configured) return configured;
  if (import.meta.env.DEV) return 'http://localhost:8787/api/trip-room';
  return '/api/trip-room';
}

function roomSnapshot(trip: Trip): Omit<Trip, 'id' | 'photos'> {
  const {
    id: _id,
    photos: _photos,
    readOnly: _readOnly,
    roomOwnerToken: _roomOwnerToken,
    roomMemberId: _roomMemberId,
    members: _members,
    ...snapshot
  } = trip;
  return snapshot;
}

function createMemberId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function persistentMemberId(): string {
  try {
    const existing = localStorage.getItem(MEMBER_ID_KEY);
    if (existing) return existing;
    const created = createMemberId();
    localStorage.setItem(MEMBER_ID_KEY, created);
    return created;
  } catch {
    if (!sessionMemberId) sessionMemberId = createMemberId();
    return sessionMemberId;
  }
}

export function currentTripMember(profileName: string, profilePhoto: string | null): TripMemberInput {
  const telegramUser = getTelegramUser();
  const name = telegramUser ? telegramUserDisplayName(telegramUser) : profileName.trim() || 'Traveler';
  const candidatePhoto = telegramUser?.photo_url || profilePhoto || '';
  return {
    id: telegramUser ? `telegram:${telegramUser.id}` : persistentMemberId(),
    name: name.slice(0, 80),
    photoUrl: candidatePhoto.startsWith('https://') ? candidatePhoto : undefined,
  };
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error || 'The trip room is unavailable right now.';
  } catch {
    return 'The trip room is unavailable right now.';
  }
}

export async function saveTripRoom(trip: Trip, sharedBy: string, member: TripMemberInput): Promise<SavedRoom> {
  const response = await fetch(tripRoomApiUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: trip.roomCode,
      ownerToken: trip.roomOwnerToken,
      sharedBy,
      member,
      trip: roomSnapshot(trip),
    }),
  });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as SavedRoom;
}

function roomResponseToTrip(room: RoomResponse, roomMemberId?: string): Trip {
  if (!room.trip || !room.code || !Array.isArray(room.trip.tripDays)) {
    throw new Error('This trip room contains invalid data.');
  }
  return {
    ...room.trip,
    id: Date.now(),
    photos: {},
    readOnly: true,
    roomCode: room.code,
    roomMemberId,
    sharedBy: room.sharedBy,
    roomUpdatedAt: room.updatedAt,
    members: Array.isArray(room.members) ? room.members : [],
  };
}

export async function joinTripRoom(rawCode: string, member: TripMemberInput): Promise<Trip> {
  const code = rawCode.trim().toUpperCase();
  const response = await fetch(`${tripRoomApiUrl()}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ code, member }),
  });
  if (!response.ok) throw new Error(await readError(response));
  return roomResponseToTrip((await response.json()) as RoomResponse, member.id);
}

export async function leaveTripRoom(
  rawCode: string,
  member: TripMemberInput,
  joinedMemberId?: string,
): Promise<void> {
  const code = rawCode.trim().toUpperCase();
  const memberIds = Array.from(new Set([
    joinedMemberId,
    member.id,
    persistentMemberId(),
  ].filter((id): id is string => Boolean(id))));
  const response = await fetch(`${tripRoomApiUrl()}/leave`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ code, memberIds }),
  });
  if (!response.ok) throw new Error(await readError(response));
}

export async function getTripRoom(rawCode: string): Promise<Trip> {
  const code = rawCode.trim().toUpperCase();
  const response = await fetch(`${tripRoomApiUrl()}?code=${encodeURIComponent(code)}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(await readError(response));
  return roomResponseToTrip((await response.json()) as RoomResponse);
}

export async function lockTripBudgetAmount(
  rawCode: string,
  member: TripMemberInput,
  amount: number,
): Promise<BudgetCommitmentResponse> {
  const code = rawCode.trim().toUpperCase();
  const response = await fetch(`${tripRoomApiUrl()}/budget/commitment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ code, member, amount }),
  });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as BudgetCommitmentResponse;
}
