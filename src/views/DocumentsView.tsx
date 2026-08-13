import { useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useActiveTrip } from '../hooks/useActiveTrip';
import {
  ACCEPTED_DOCUMENT_TYPES,
  MAX_DOCUMENT_BYTES,
  deleteTripDocument,
  tripDocumentDownloadUrl,
  uploadTripDocument,
} from '../lib/tripDocuments';
import type { Trip, TripDocument } from '../types';

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsView() {
  const { state, dispatch } = useAppContext();
  const activeTrip = useActiveTrip();
  const km = state.language === 'km';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const tripsWithDocuments = state.trips
    .filter((trip) => (trip.documents ?? []).length > 0)
    .sort((a, b) => b.id - a.id);

  async function handleDelete(trip: Trip, key: string) {
    try {
      await deleteTripDocument(key);
    } catch {
      // The record still gets removed locally — a stray blob left in storage
      // isn't worth blocking the user's UI over.
    }
    dispatch({ type: 'REMOVE_DOCUMENT', tripId: trip.id, key });
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !activeTrip) return;

    setUploadError('');
    if (!ACCEPTED_DOCUMENT_TYPES.includes(file.type)) {
      setUploadError(km ? 'គាំទ្រតែ PDF, PNG, JPEG, WEBP, ឬ HEIC ប៉ុណ្ណោះ' : 'Only PDF, PNG, JPEG, WEBP, or HEIC files are supported.');
      return;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      setUploadError(km ? 'ឯកសារត្រូវតែតូចជាង 10MB' : 'Files must be under 10 MB.');
      return;
    }

    setUploading(true);
    try {
      const uploaded = await uploadTripDocument(file);
      const document: TripDocument = { ...uploaded, uploadedAt: Date.now() };
      dispatch({ type: 'ADD_DOCUMENT', tripId: activeTrip.id, document });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : (km ? 'មិនអាចផ្ទុកឡើងបានទេ' : 'Could not upload this file.'));
    } finally {
      setUploading(false);
    }
  }

  return (
    <section id="view-documents" className="active">
      <div className="page-header">
        <div className="icon-btn glass" onClick={() => dispatch({ type: 'NAVIGATE', view: state.previousView ?? 'profile' })}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 4 12l7 7" /><path d="M4.5 12h15" /></svg>
        </div>
        <h2>{km ? 'ឯកសាររបស់ខ្ញុំ' : 'My documents'}</h2>
        <div className="page-header-spacer" />
      </div>

      {tripsWithDocuments.length === 0 ? (
        <p className="trip-details-documents-empty">
          {km ? 'មិនទាន់មានឯកសារនៅឡើយទេ។' : 'No documents yet. Add one below.'}
        </p>
      ) : (
        tripsWithDocuments.map((trip) => (
          <div key={trip.id} style={{ marginBottom: 22 }}>
            <p className="eyebrow" style={{ margin: '0 0 8px' }}>{trip.destination.split(',')[0].trim()}</p>
            <div className="trip-details-documents">
              {(trip.documents ?? []).map((document) => (
                <div className="trip-details-document-row" key={document.key}>
                  <a
                    className="trip-details-document-link"
                    href={tripDocumentDownloadUrl(document.key)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={km ? `មើល ${document.name}` : `View ${document.name}`}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M6.5 3h7l4.5 4.5V20a1 1 0 0 1-1 1h-10.5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
                      <path d="M13.5 3v4.5H18" />
                      <path d="M8.5 12.5h7M8.5 15.5h4.5" />
                    </svg>
                    <span className="trip-details-document-name">
                      {document.name}
                      <small>{formatFileSize(document.size)}</small>
                    </span>
                  </a>
                  {!trip.readOnly && (
                    <button
                      type="button"
                      className="trip-details-document-action"
                      onClick={() => void handleDelete(trip, document.key)}
                      aria-label={km ? `លុប ${document.name}` : `Remove ${document.name}`}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {activeTrip && !activeTrip.readOnly && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_DOCUMENT_TYPES.join(',')}
            style={{ display: 'none' }}
            onChange={(event) => void handleFileChange(event)}
          />
          <button
            type="button"
            className="itin-add-activity"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            + {uploading
              ? (km ? 'កំពុងផ្ទុកឡើង…' : 'Uploading…')
              : (km ? `បន្ថែមឯកសារទៅ ${activeTrip.destination.split(',')[0].trim()}` : `Add a document to ${activeTrip.destination.split(',')[0].trim()}`)}
          </button>
        </>
      )}
      {uploadError && <p className="status err" role="alert">{uploadError}</p>}
    </section>
  );
}
