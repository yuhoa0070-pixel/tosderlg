import { useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useActiveTrip } from '../hooks/useActiveTrip';
import { formatTripDateRange } from '../lib/tripUtils';
import { getTelegramWebApp } from '../lib/telegram';
import { copyText } from '../lib/clipboard';
import { ACCEPTED_DOCUMENT_TYPES, MAX_DOCUMENT_BYTES, deleteTripDocument, tripDocumentDownloadUrl, uploadTripDocument } from '../lib/tripDocuments';
import PhotoPlaceholderIcon from '../components/shared/PhotoPlaceholderIcon';
import type { TripDocument } from '../types';

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TripDetailsView() {
  const { state, dispatch } = useAppContext();
  const trip = useActiveTrip();
  const km = state.language === 'km';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [shareStatus, setShareStatus] = useState('');

  if (!trip) return null;

  const tripId = trip.id;
  const destName = trip.destination.split(',')[0].trim();
  const memberCount = trip.members?.length || 1;
  const daysCount = trip.tripDays.length;
  const nightsCount = Math.max(daysCount - 1, 0);
  const dateRange = formatTripDateRange(trip, km);
  const firstPhoto = Object.values(trip.photos).flat()[0];

  const expenses = trip.budget?.expenses ?? [];
  const flightBooked = expenses.some((expense) => expense.category === 'transport');
  const hotelBooked = expenses.some((expense) => expense.category === 'stay');
  const activitiesBooked = expenses.filter((expense) => expense.category === 'activity').length;

  const documents = trip.documents ?? [];

  function daySummary(dayIndex: number): string {
    const stops = trip!.tripDays[dayIndex]?.stops ?? [];
    if (stops.length === 0) return km ? 'ថ្ងៃទំនេរ មិនទាន់មានផែនការ' : 'Free day, no plans yet';
    return stops.map((stop) => stop.title).join(' · ');
  }

  function dayBadge(dayIndex: number): { month: string; day: number } | null {
    if (!trip!.startDate) return null;
    const [year, month, dayOfMonth] = trip!.startDate.split('-').map(Number);
    if (!year || !month || !dayOfMonth) return null;
    const date = new Date(year, month - 1, dayOfMonth + dayIndex);
    const monthLabel = new Intl.DateTimeFormat(km ? 'km-KH' : 'en-US', { month: 'short' }).format(date).toUpperCase();
    return { month: monthLabel, day: date.getDate() };
  }

  function openDay(dayIndex: number) {
    dispatch({ type: 'SET_CURRENT_DAY', day: dayIndex });
    dispatch({ type: 'NAVIGATE', view: 'itinerary' });
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

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
      dispatch({ type: 'ADD_DOCUMENT', tripId, document });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : (km ? 'មិនអាចផ្ទុកឡើងបានទេ' : 'Could not upload this file.'));
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteDocument(key: string) {
    try {
      await deleteTripDocument(key);
    } catch {
      // The record still gets removed locally — a stray blob left in storage
      // isn't worth blocking the user's UI over.
    }
    dispatch({ type: 'REMOVE_DOCUMENT', tripId, key });
  }

  async function shareTripDetails() {
    const summary = km
      ? `${destName} ដំណើរ — ${dateRange} · ${memberCount} អ្នកធ្វើដំណើរ · ${nightsCount} យប់`
      : `${destName} trip — ${dateRange} · ${memberCount} traveler${memberCount === 1 ? '' : 's'} · ${nightsCount} night${nightsCount === 1 ? '' : 's'}`;

    setShareStatus('');
    try {
      const webApp = getTelegramWebApp();
      if (webApp?.openTelegramLink) {
        webApp.openTelegramLink(`https://t.me/share/url?url=&text=${encodeURIComponent(summary)}`);
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: `${destName} trip`, text: summary });
        return;
      }
      await copyText(summary);
      setShareStatus(km ? 'បានចម្លងព័ត៌មានដំណើរ' : 'Trip details copied to clipboard');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setShareStatus(km ? 'មិនអាចចែករំលែកបានទេ' : 'Could not share right now');
    }
  }

  return (
    <section id="view-trip-details" className="active trip-details">
      <div className="trip-details-topbar">
        <button
          type="button"
          className="icon-btn"
          onClick={() => dispatch({ type: 'NAVIGATE', view: state.previousView ?? 'home' })}
          aria-label={km ? 'ត្រឡប់ក្រោយ' : 'Back'}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 4 12l7 7" /><path d="M4.5 12h15" /></svg>
        </button>
        <button type="button" className="icon-btn" onClick={() => void shareTripDetails()} aria-label={km ? 'ចែករំលែក' : 'Share'}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="18" cy="5" r="2.4" /><circle cx="6" cy="12" r="2.4" /><circle cx="18" cy="19" r="2.4" />
            <path d="M8.1 10.7 15.9 6.3M8.1 13.3l7.8 4.4" />
          </svg>
        </button>
      </div>

      <div className="trip-details-photo">
        {firstPhoto ? <img src={firstPhoto.src} alt="" /> : <PhotoPlaceholderIcon className="photo-placeholder-icon" />}
      </div>

      <h1 className="trip-details-title">{destName} {km ? 'ដំណើរ' : 'trip'}</h1>
      <p className="trip-details-sub">
        {dateRange} · {memberCount} {km ? 'អ្នកធ្វើដំណើរ' : memberCount === 1 ? 'traveler' : 'travelers'} · {nightsCount} {km ? 'យប់' : nightsCount === 1 ? 'night' : 'nights'}
      </p>

      <div className="trip-details-status-row">
        <div className="trip-details-status-card">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
          <span className="trip-details-status-label">{km ? 'ជើងហោះហើរ' : 'Flight'}</span>
          <span className={`trip-details-status-value${flightBooked ? ' confirmed' : ''}`}>
            {flightBooked ? (km ? 'បានកក់' : 'Confirmed') : (km ? 'មិនទាន់កក់' : 'Not booked')}
          </span>
        </div>
        <div className="trip-details-status-card">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 4v16" /><path d="M2 8h18a2 2 0 0 1 2 2v10" /><path d="M2 17h20" /><path d="M6 8v9" /></svg>
          <span className="trip-details-status-label">{km ? 'សណ្ឋាគារ' : 'Hotel'}</span>
          <span className={`trip-details-status-value${hotelBooked ? ' confirmed' : ''}`}>
            {hotelBooked ? (km ? 'បានកក់' : 'Confirmed') : (km ? 'មិនទាន់កក់' : 'Not booked')}
          </span>
        </div>
        <div className="trip-details-status-card">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
            <path d="M13 5v2M13 17v2M13 11v2" />
          </svg>
          <span className="trip-details-status-label">{km ? 'សកម្មភាព' : 'Activities'}</span>
          <span className={`trip-details-status-value${activitiesBooked > 0 ? ' confirmed' : ''}`}>
            {activitiesBooked > 0
              ? (km ? `${activitiesBooked} បានកក់` : `${activitiesBooked} booked`)
              : (km ? 'មិនទាន់មានទេ' : 'None booked')}
          </span>
        </div>
      </div>

      <div className="trip-details-section-head">
        <h2>{km ? 'កម្មវិធីដំណើរ' : 'Itinerary'}</h2>
        <button type="button" className="trip-details-edit-link" onClick={() => dispatch({ type: 'NAVIGATE', view: 'itinerary' })}>
          {km ? 'កែប្រែ' : 'Edit'}
        </button>
      </div>
      <div className="trip-details-day-list">
        {trip.tripDays.map((_, dayIndex) => {
          const badge = dayBadge(dayIndex);
          return (
            <button type="button" className="trip-details-day-row" key={dayIndex} onClick={() => openDay(dayIndex)}>
              <span className="trip-details-day-badge">
                {badge ? (<><small>{badge.month}</small>{badge.day}</>) : <small>—</small>}
              </span>
              <span className="trip-details-day-text">{daySummary(dayIndex)}</span>
              <svg className="trip-details-day-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
            </button>
          );
        })}
      </div>

      <div className="trip-details-section-head">
        <h2>{km ? 'ឯកសារ' : 'Documents'}</h2>
      </div>
      <div className="trip-details-documents">
        {documents.map((document) => (
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
                onClick={() => void handleDeleteDocument(document.key)}
                aria-label={km ? `លុប ${document.name}` : `Remove ${document.name}`}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></svg>
              </button>
            )}
          </div>
        ))}
        {documents.length === 0 && (
          <p className="trip-details-documents-empty">
            {km ? 'មិនទាន់មានឯកសារនៅឡើយទេ។' : 'No documents added yet.'}
          </p>
        )}
      </div>

      {!trip.readOnly && (
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
            + {uploading ? (km ? 'កំពុងផ្ទុកឡើង…' : 'Uploading…') : (km ? 'បន្ថែមឯកសារ' : 'Add a document')}
          </button>
        </>
      )}
      {uploadError && <p className="status err" role="alert">{uploadError}</p>}
      {shareStatus && <p className="status" role="status">{shareStatus}</p>}
    </section>
  );
}
