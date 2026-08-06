import type { Trip } from '../types';

interface SavedRoom {
  code: string;
  ownerToken: string;
  updatedAt: number;
}

interface RoomResponse {
  code: string;
  sharedBy: string;
  trip: Omit<Trip, 'id' | 'photos'>;
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
    ...snapshot
  } = trip;
  return snapshot;
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error || 'The trip room is unavailable right now.';
  } catch {
    return 'The trip room is unavailable right now.';
  }
}

export async function saveTripRoom(trip: Trip, sharedBy: string): Promise<SavedRoom> {
  const response = await fetch(tripRoomApiUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: trip.roomCode,
      ownerToken: trip.roomOwnerToken,
      sharedBy,
      trip: roomSnapshot(trip),
    }),
  });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as SavedRoom;
}

export async function joinTripRoom(rawCode: string): Promise<Trip> {
  const code = rawCode.trim().toUpperCase();
  const response = await fetch(`${tripRoomApiUrl()}?code=${encodeURIComponent(code)}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(await readError(response));
  const room = (await response.json()) as RoomResponse;
  if (!room.trip || !room.code || !Array.isArray(room.trip.tripDays)) {
    throw new Error('This trip room contains invalid data.');
  }
  return {
    ...room.trip,
    id: Date.now(),
    photos: {},
    readOnly: true,
    roomCode: room.code,
    sharedBy: room.sharedBy,
    roomUpdatedAt: room.updatedAt,
  };
}
