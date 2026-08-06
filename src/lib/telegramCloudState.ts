import type { AppState, Photo, TelegramCloudState, Trip } from '../types';
import { getTelegramCloudStorage } from './telegram';

const META_KEY = 'waylo_state_v1_meta';
const KEY_PREFIX = 'waylo_state_v1';
const CHUNK_SIZE = 3_500;
const MAX_CHUNKS = 450;
const READ_BATCH_SIZE = 100;
const WRITE_BATCH_SIZE = 20;

interface CloudMeta {
  version: 1;
  generation: string;
  chunks: number;
  length: number;
  updatedAt: number;
}

type TelegramCloudStateSource = Pick<
  AppState,
  'trips' | 'currentTripId' | 'profileName' | 'profilePhoto'
>;

function storageError(error: unknown): Error {
  return error instanceof Error ? error : new Error(typeof error === 'string' ? error : 'Telegram cloud storage failed.');
}

function cloudGetItem(key: string): Promise<string> {
  const storage = getTelegramCloudStorage();
  if (!storage) return Promise.reject(new Error('Telegram cloud storage is unavailable.'));
  return new Promise((resolve, reject) => {
    storage.getItem(key, (error, value) => {
      if (error) reject(storageError(error));
      else resolve(value ?? '');
    });
  });
}

function cloudGetItems(keys: string[]): Promise<Record<string, string>> {
  const storage = getTelegramCloudStorage();
  if (!storage) return Promise.reject(new Error('Telegram cloud storage is unavailable.'));
  return new Promise((resolve, reject) => {
    storage.getItems(keys, (error, values) => {
      if (error) reject(storageError(error));
      else resolve(values ?? {});
    });
  });
}

function cloudSetItem(key: string, value: string): Promise<void> {
  const storage = getTelegramCloudStorage();
  if (!storage) return Promise.reject(new Error('Telegram cloud storage is unavailable.'));
  return new Promise((resolve, reject) => {
    storage.setItem(key, value, (error, stored) => {
      if (error) reject(storageError(error));
      else if (stored === false) reject(new Error('Telegram did not store the cloud value.'));
      else resolve();
    });
  });
}

function cloudRemoveItems(keys: string[]): Promise<void> {
  const storage = getTelegramCloudStorage();
  if (!storage || keys.length === 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    storage.removeItems(keys, (error) => {
      if (error) reject(storageError(error));
      else resolve();
    });
  });
}

function cloudGetKeys(): Promise<string[]> {
  const storage = getTelegramCloudStorage();
  if (!storage) return Promise.reject(new Error('Telegram cloud storage is unavailable.'));
  return new Promise((resolve, reject) => {
    storage.getKeys((error, keys) => {
      if (error) reject(storageError(error));
      else resolve(keys ?? []);
    });
  });
}

function validGeneration(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9-]{6,64}$/.test(value);
}

function parseMeta(value: string): CloudMeta | null {
  if (!value) return null;
  try {
    const meta = JSON.parse(value) as Partial<CloudMeta>;
    if (
      meta.version !== 1 ||
      !validGeneration(meta.generation) ||
      !Number.isInteger(meta.chunks) ||
      !Number.isInteger(meta.length) ||
      !Number.isFinite(meta.updatedAt) ||
      (meta.chunks ?? 0) < 1 ||
      (meta.chunks ?? 0) > MAX_CHUNKS ||
      (meta.length ?? 0) < 2
    ) return null;
    return meta as CloudMeta;
  } catch {
    return null;
  }
}

function chunkKey(generation: string, index: number): string {
  return `${KEY_PREFIX}_${generation}_${index}`;
}

function cloudSafePhotos(photos: Record<string, Photo[]>): Record<string, Photo[]> {
  return Object.fromEntries(
    Object.entries(photos)
      .map(([key, items]) => [
        key,
        items.filter((photo) => !photo.src.startsWith('data:') && !photo.src.startsWith('blob:')),
      ] as const)
      .filter(([, items]) => items.length > 0),
  );
}

function cloudSafeTrip(trip: Trip): Trip {
  return { ...trip, photos: cloudSafePhotos(trip.photos) };
}

export function telegramCloudStateFromApp(state: TelegramCloudStateSource): TelegramCloudState {
  return {
    version: 1,
    trips: state.trips.map(cloudSafeTrip),
    currentTripId: state.currentTripId,
    profileName: state.profileName,
    profilePhoto: state.profilePhoto && !state.profilePhoto.startsWith('data:') && !state.profilePhoto.startsWith('blob:')
      ? state.profilePhoto
      : null,
    updatedAt: Date.now(),
  };
}

export function telegramCloudStateSignature(state: TelegramCloudState): string {
  return JSON.stringify({
    version: state.version,
    trips: state.trips,
    currentTripId: state.currentTripId,
    profileName: state.profileName,
    profilePhoto: state.profilePhoto,
  });
}

function validCloudState(value: unknown): value is TelegramCloudState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<TelegramCloudState>;
  return state.version === 1 &&
    Array.isArray(state.trips) &&
    state.trips.every((trip) =>
      trip &&
      typeof trip.id === 'number' &&
      typeof trip.destination === 'string' &&
      Array.isArray(trip.tripDays) &&
      trip.photos &&
      typeof trip.photos === 'object'
    ) &&
    (state.currentTripId === null || typeof state.currentTripId === 'number') &&
    typeof state.profileName === 'string' &&
    (state.profilePhoto === null || typeof state.profilePhoto === 'string') &&
    typeof state.updatedAt === 'number';
}

export function hasTelegramCloudStorage(): boolean {
  return getTelegramCloudStorage() !== null;
}

export async function loadTelegramCloudState(): Promise<TelegramCloudState | null> {
  const meta = parseMeta(await cloudGetItem(META_KEY));
  if (!meta) return null;

  const keys = Array.from({ length: meta.chunks }, (_, index) => chunkKey(meta.generation, index));
  const values: Record<string, string> = {};
  for (let offset = 0; offset < keys.length; offset += READ_BATCH_SIZE) {
    Object.assign(values, await cloudGetItems(keys.slice(offset, offset + READ_BATCH_SIZE)));
  }
  const serialized = keys.map((key) => values[key] ?? '').join('');
  if (serialized.length !== meta.length) throw new Error('Telegram cloud state is incomplete.');

  const parsed = JSON.parse(serialized) as unknown;
  if (!validCloudState(parsed)) throw new Error('Telegram cloud state is invalid.');
  return parsed;
}

function generationId(): string {
  const random = Array.from(crypto.getRandomValues(new Uint8Array(6)), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${Date.now().toString(36)}-${random}`;
}

export async function saveTelegramCloudState(state: TelegramCloudState): Promise<void> {
  const storage = getTelegramCloudStorage();
  if (!storage) throw new Error('Telegram cloud storage is unavailable.');

  const serialized = JSON.stringify({ ...state, updatedAt: Date.now() });
  const chunks = Array.from(
    { length: Math.ceil(serialized.length / CHUNK_SIZE) },
    (_, index) => serialized.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE),
  );
  if (chunks.length > MAX_CHUNKS) {
    throw new Error('Trip data is too large for Telegram cloud storage.');
  }

  const generation = generationId();
  const entries = chunks.map((value, index) => [chunkKey(generation, index), value] as const);
  for (let offset = 0; offset < entries.length; offset += WRITE_BATCH_SIZE) {
    await Promise.all(
      entries.slice(offset, offset + WRITE_BATCH_SIZE).map(([key, value]) => cloudSetItem(key, value)),
    );
  }

  const meta: CloudMeta = {
    version: 1,
    generation,
    chunks: chunks.length,
    length: serialized.length,
    updatedAt: Date.now(),
  };
  await cloudSetItem(META_KEY, JSON.stringify(meta));

  try {
    const currentKeys = new Set([META_KEY, ...entries.map(([key]) => key)]);
    const staleKeys = (await cloudGetKeys()).filter(
      (key) => key.startsWith(`${KEY_PREFIX}_`) && !currentKeys.has(key),
    );
    for (let offset = 0; offset < staleKeys.length; offset += READ_BATCH_SIZE) {
      await cloudRemoveItems(staleKeys.slice(offset, offset + READ_BATCH_SIZE));
    }
  } catch (error) {
    // The new generation is already live. Cleanup is best-effort and the next
    // successful save will try every stale Waylo key again.
    console.warn('Old Telegram cloud chunks could not be removed.', error);
  }
}
