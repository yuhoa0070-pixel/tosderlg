export interface UploadedDocument {
  key: string;
  name: string;
  size: number;
  contentType: string;
}

export const ACCEPTED_DOCUMENT_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/heic'];
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

function tripDocumentsApiUrl(): string {
  const configuredRoom = import.meta.env.VITE_TRIP_ROOM_API_URL?.replace(/\/+$/, '');
  if (configuredRoom) return `${configuredRoom.replace(/\/trip-room$/, '')}/trip-documents`;
  if (import.meta.env.DEV) return 'http://localhost:8787/api/trip-documents';
  return '/api/trip-documents';
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error || 'Could not process this document.';
  } catch {
    return 'Could not process this document.';
  }
}

export async function uploadTripDocument(file: File): Promise<UploadedDocument> {
  const response = await fetch(`${tripDocumentsApiUrl()}?name=${encodeURIComponent(file.name)}`, {
    method: 'POST',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as UploadedDocument;
}

export function tripDocumentDownloadUrl(key: string): string {
  return `${tripDocumentsApiUrl()}/${encodeURIComponent(key)}`;
}

export async function deleteTripDocument(key: string): Promise<void> {
  const response = await fetch(`${tripDocumentsApiUrl()}/${encodeURIComponent(key)}`, { method: 'DELETE' });
  if (!response.ok) throw new Error(await readError(response));
}
