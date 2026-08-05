import type { PackingItem, Stop, Trip, TripDay } from '../types';

const INVITE_PARAM = 'tripInvite';
const MAX_INVITE_LENGTH = 14000;

interface InvitePayload {
  version: 1;
  shareId: string;
  sharedBy: string;
  trip: {
    destination: string;
    label: string;
    startDate: string | null;
    endDate: string | null;
    center: { lat: number; lng: number };
    tripDays: TripDay[];
    packingItems: PackingItem[];
  };
}

function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function cleanText(value: unknown, fallback = '', maxLength = 160): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : fallback;
}

function cleanCoordinate(value: unknown, limit: number): number | null {
  return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= limit ? value : null;
}

function cleanStop(value: unknown): Stop | null {
  if (!value || typeof value !== 'object') return null;
  const stop = value as Partial<Stop>;
  const lat = cleanCoordinate(stop.lat, 90);
  const lng = cleanCoordinate(stop.lng, 180);
  const title = cleanText(stop.title, '', 120);
  if (lat === null || lng === null || !title) return null;
  const rawMapLink = cleanText(stop.mapLink, '', 1000);
  const mapLink = rawMapLink.startsWith('https://') ? rawMapLink : null;
  return {
    time: cleanText(stop.time, '09:00', 20),
    title,
    sub: cleanText(stop.sub, '', 180),
    mapLink,
    emoji: cleanText(stop.emoji, '', 16) || undefined,
    lat,
    lng,
  };
}

function cleanTripDays(value: unknown): TripDay[] {
  if (!Array.isArray(value)) return [{ stops: [] }];
  const days = value.slice(0, 14).map((day) => {
    const rawStops = day && typeof day === 'object' && 'stops' in day ? (day as { stops?: unknown }).stops : [];
    const stops = Array.isArray(rawStops)
      ? rawStops.slice(0, 50).map(cleanStop).filter((stop): stop is Stop => stop !== null)
      : [];
    return { stops };
  });
  return days.length ? days : [{ stops: [] }];
}

function cleanPackingItems(value: unknown): PackingItem[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 100).flatMap((rawItem, index) => {
    if (!rawItem || typeof rawItem !== 'object') return [];
    const item = rawItem as Partial<PackingItem>;
    const text = cleanText(item.text, '', 100);
    if (!text) return [];
    return [{ id: index + 1, text, packed: item.packed === true, emoji: cleanText(item.emoji, '🎒', 16) }];
  });
}

function cleanDate(value: unknown): string | null {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export function createShareId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createTripInviteLink(trip: Trip, sharedBy: string, shareId: string): string {
  const payload: InvitePayload = {
    version: 1,
    shareId,
    sharedBy: cleanText(sharedBy, 'A friend', 80),
    trip: {
      destination: trip.destination,
      label: trip.label,
      startDate: trip.startDate,
      endDate: trip.endDate,
      center: trip.center,
      tripDays: trip.tripDays,
      packingItems: trip.packingItems ?? [],
    },
  };
  const encoded = encodeBase64Url(JSON.stringify(payload));
  if (encoded.length > MAX_INVITE_LENGTH) throw new Error('This trip has too many stops to share in one invite.');
  const inviteUrl = new URL(window.location.href);
  inviteUrl.search = '';
  inviteUrl.hash = '';
  inviteUrl.searchParams.set(INVITE_PARAM, encoded);
  return inviteUrl.toString();
}

export function readTripInviteFromUrl(): Trip | null {
  try {
    const encoded = new URL(window.location.href).searchParams.get(INVITE_PARAM);
    if (!encoded || encoded.length > MAX_INVITE_LENGTH) return null;
    const payload = JSON.parse(decodeBase64Url(encoded)) as Partial<InvitePayload>;
    if (payload.version !== 1 || !payload.trip || typeof payload.trip !== 'object') return null;
    const shareId = cleanText(payload.shareId, '', 100);
    const destination = cleanText(payload.trip.destination, '', 160);
    const centerLat = cleanCoordinate(payload.trip.center?.lat, 90);
    const centerLng = cleanCoordinate(payload.trip.center?.lng, 180);
    if (!shareId || !destination || centerLat === null || centerLng === null) return null;
    return {
      id: Date.now(),
      destination,
      label: cleanText(payload.trip.label, '', 180),
      startDate: cleanDate(payload.trip.startDate),
      endDate: cleanDate(payload.trip.endDate),
      center: { lat: centerLat, lng: centerLng },
      tripDays: cleanTripDays(payload.trip.tripDays),
      photos: {},
      packingItems: cleanPackingItems(payload.trip.packingItems),
      shareId,
      sharedBy: cleanText(payload.sharedBy, 'A friend', 80),
      readOnly: true,
    };
  } catch {
    return null;
  }
}

export function clearTripInviteFromUrl(): void {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(INVITE_PARAM)) return;
  url.searchParams.delete(INVITE_PARAM);
  window.history.replaceState({}, '', url.toString());
}
