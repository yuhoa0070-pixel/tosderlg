import { useAppContext } from '../context/AppContext';
import { deleteTripDocument, tripDocumentDownloadUrl } from '../lib/tripDocuments';
import type { Trip } from '../types';

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsView() {
  const { state, dispatch } = useAppContext();
  const km = state.language === 'km';

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

  return (
    <section id="view-documents" className="active">
      <div className="tsh-top-row" style={{ marginBottom: 22 }}>
        <div className="icon-btn glass" onClick={() => dispatch({ type: 'NAVIGATE', view: state.previousView ?? 'profile' })}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 4 12l7 7" /><path d="M4.5 12h15" /></svg>
        </div>
        <div className="tsh-title-meta">
          <h2 className="tsh-title">{km ? 'ឯកសាររបស់ខ្ញុំ' : 'My documents'}</h2>
          <p className="tsh-subtitle">{km ? 'ឯកសារដែលបានផ្ទុកឡើងសម្រាប់ដំណើររបស់អ្នក' : 'Files uploaded to your trips'}</p>
        </div>
      </div>

      {tripsWithDocuments.length === 0 ? (
        <p className="trip-details-documents-empty">
          {km ? 'មិនទាន់មានឯកសារនៅឡើយទេ។' : 'No documents yet. Add one from a trip’s details screen.'}
        </p>
      ) : (
        tripsWithDocuments.map((trip) => (
          <div key={trip.id} style={{ marginBottom: 22 }}>
            <p className="eyebrow" style={{ margin: '0 0 8px' }}>{trip.destination.split(',')[0].trim()}</p>
            <div className="trip-details-documents">
              {(trip.documents ?? []).map((document) => (
                <div className="trip-details-document-row" key={document.key}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6.5 3h7l4.5 4.5V20a1 1 0 0 1-1 1h-10.5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
                    <path d="M13.5 3v4.5H18" />
                    <path d="M8.5 12.5h7M8.5 15.5h4.5" />
                  </svg>
                  <span className="trip-details-document-name">
                    {document.name}
                    <small>{formatFileSize(document.size)}</small>
                  </span>
                  <a
                    className="trip-details-document-action"
                    href={tripDocumentDownloadUrl(document.key)}
                    download={document.name}
                    aria-label={km ? `ទាញយក ${document.name}` : `Download ${document.name}`}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M8 11l4 4 4-4M5 19h14" /></svg>
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
    </section>
  );
}
