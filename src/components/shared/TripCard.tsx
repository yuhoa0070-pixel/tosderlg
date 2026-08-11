import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import type { Trip } from '../../types';
import { getUpcomingTripAlert, isPastTrip } from '../../lib/tripUtils';
import { useAppContext } from '../../context/AppContext';

interface TripCardProps {
  trip: Trip;
  active: boolean;
  onSelect: (id: number) => void;
  allowDelete?: boolean;
  onDelete?: (id: number) => void;
  /** 'card' = home carousel (default) | 'list' = My Trips vertical layout */
  layout?: 'card' | 'list';
  /** Shown as a "Plan again" shortcut on past trips (list layout only). */
  onPlanAgain?: (trip: Trip) => void;
}

const TRIP_STROKE_COLORS = ['#7FB8FF', '#FF8A73', '#FFD83D', '#A57CFF', '#4FD1C5', '#FF6FA5'];

function tripStrokeColor(tripId: number): string {
  return TRIP_STROKE_COLORS[Math.abs(tripId) % TRIP_STROKE_COLORS.length];
}

const COVER_GRADIENTS = [
  'linear-gradient(135deg,#1a3a2a 0%,#2e7d50 100%)',
  'linear-gradient(135deg,#1e2d4a 0%,#3b6fa0 100%)',
  'linear-gradient(135deg,#3a1a2a 0%,#9b4470 100%)',
  'linear-gradient(135deg,#3a2d10 0%,#b07c2a 100%)',
  'linear-gradient(135deg,#1a2a3a 0%,#4a7a9b 100%)',
  'linear-gradient(135deg,#2a1a3a 0%,#7b4a9b 100%)',
];

function coverGradient(tripId: number): string {
  return COVER_GRADIENTS[Math.abs(tripId) % COVER_GRADIENTS.length];
}

/** First photo src from any day/stop in the trip */
function firstTripPhoto(trip: Trip): string | null {
  for (const photos of Object.values(trip.photos ?? {})) {
    if (photos?.length) return photos[0].src;
  }
  return null;
}

/** Abbreviation from the first word of the destination */
function destinationInitials(destination: string): string {
  const first = destination.split(',')[0].trim();
  const words = first.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return first.slice(0, 2).toUpperCase();
}

function formatDateRange(trip: Trip, km: boolean): string {
  if (!trip.startDate || !trip.endDate) return km ? 'មិនទាន់កំណត់ថ្ងៃ' : 'Dates not set';
  const start = new Date(`${trip.startDate}T00:00:00`);
  const end = new Date(`${trip.endDate}T00:00:00`);
  const sameYear = start.getFullYear() === end.getFullYear();
  const fmt = new Intl.DateTimeFormat(km ? 'km-KH' : 'en-US', { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) });
  if (start.getTime() === end.getTime()) return fmt.format(start);
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

function formatTripSchedule(trip: Trip, km: boolean) {
  const days = Math.max(trip.tripDays.length, 1);
  const duration = km ? `${days} ថ្ងៃ` : `${days} day${days === 1 ? '' : 's'}`;
  if (!trip.startDate || !trip.endDate) return trip.label || duration;
  const start = new Date(`${trip.startDate}T00:00:00`);
  const end = new Date(`${trip.endDate}T00:00:00`);
  const includeYear = start.getFullYear() !== end.getFullYear();
  const formatter = new Intl.DateTimeFormat(km ? 'km-KH' : 'en-US', {
    month: 'short',
    day: 'numeric',
    ...(includeYear ? { year: 'numeric' } : {}),
  });
  const range = start.getTime() === end.getTime()
    ? formatter.format(start)
    : `${formatter.format(start)} – ${formatter.format(end)}`;
  return `${range} · ${duration}`;
}

function travelerCount(trip: Trip): number {
  return trip.members?.length ?? 1;
}

/** Derive booking status from budget expenses */
function bookingStatus(trip: Trip): { flight: 'booked' | 'none'; stay: 'booked' | 'none' } {
  const expenses = trip.budget?.expenses ?? [];
  return {
    flight: expenses.some((e) => e.category === 'transport') ? 'booked' : 'none',
    stay: expenses.some((e) => e.category === 'stay') ? 'booked' : 'none',
  };
}

// ─── List-layout card (new My Trips design) ───────────────────────────────────

function ListTripCard({
  trip,
  active,
  onSelect,
  allowDelete,
  onDelete,
  onPlanAgain,
}: TripCardProps) {
  const { state } = useAppContext();
  const km = state.language === 'km';
  const alert = getUpcomingTripAlert(trip);
  const past = isPastTrip(trip);
  const coverPhoto = firstTripPhoto(trip);
  const travelers = travelerCount(trip);
  const booking = bookingStatus(trip);

  const swipeOffsetRef = useRef(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, offset: 0 });
  const draggedRef = useRef(false);

  function updateSwipeOffset(next: number) {
    swipeOffsetRef.current = next;
    setSwipeOffset(next);
  }
  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!allowDelete || e.button !== 0) return;
    dragStartRef.current = { x: e.clientX, y: e.clientY, offset: swipeOffsetRef.current };
    draggedRef.current = false;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!allowDelete || !dragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
      setDragging(false);
      updateSwipeOffset(swipeOffsetRef.current < -44 ? -88 : 0);
      return;
    }
    if (Math.abs(dx) > 6) draggedRef.current = true;
    updateSwipeOffset(Math.max(-96, Math.min(0, dragStartRef.current.offset + dx)));
  }
  function finishSwipe(e: ReactPointerEvent<HTMLDivElement>) {
    if (!allowDelete || !dragging) return;
    setDragging(false);
    updateSwipeOffset(swipeOffsetRef.current < -44 ? -88 : 0);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  }
  function handleCardClick() {
    if (draggedRef.current) { draggedRef.current = false; return; }
    if (swipeOffsetRef.current < 0) { updateSwipeOffset(0); return; }
    onSelect(trip.id);
  }

  // Status badge text
  let statusLabel = '';
  let statusClass = '';
  if (past) {
    statusLabel = km ? 'បានបញ្ចប់' : 'Past';
    statusClass = 'past';
  } else if (alert) {
    if (alert.daysUntil === 0) { statusLabel = km ? 'ចាប់ផ្ដើមថ្ងៃនេះ' : 'Starts today'; statusClass = 'urgent'; }
    else if (alert.daysUntil === 1) { statusLabel = km ? 'ថ្ងៃស្អែក' : 'Tomorrow'; statusClass = 'urgent'; }
    else { statusLabel = km ? `ក្នុង ${alert.daysUntil} ថ្ងៃ` : `In ${alert.daysUntil} days`; statusClass = alert.tone; }
  } else if (!trip.startDate) {
    statusLabel = km ? 'សេចក្ដីព្រាង' : 'Draft';
    statusClass = 'draft';
  }

  const dateRange = formatDateRange(trip, km);
  const travelerLabel = km
    ? `${travelers} នាក់ដំណើរ`
    : `${travelers} traveler${travelers === 1 ? '' : 's'}`;
  const metaLine = `${dateRange} · ${travelerLabel}`;

  return (
    <div className={`mt-swipe-shell${allowDelete ? '' : ' no-delete'}`}>
      {allowDelete && onDelete && (
        <button
          type="button"
          className="trip-card-delete-action"
          aria-label={km ? `លុបដំណើរទៅ ${trip.destination}` : `Delete trip to ${trip.destination}`}
          onClick={() => onDelete(trip.id)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
          </svg>
          <span>{km ? 'លុប' : 'Delete'}</span>
        </button>
      )}
      <div
        className={`mt-trip-card${active ? ' active' : ''}${dragging ? ' dragging' : ''}`}
        style={{ transform: `translateX(${swipeOffset}px)` } as CSSProperties}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishSwipe}
        onPointerCancel={finishSwipe}
        onClick={handleCardClick}
      >
        {/* Cover photo / placeholder */}
        <div className="mt-card-cover" style={!coverPhoto ? { background: coverGradient(trip.id) } : undefined}>
          {coverPhoto
            ? <img src={coverPhoto} alt="" className="mt-card-cover-img" />
            : <span className="mt-card-cover-initials" aria-hidden="true">{destinationInitials(trip.destination)}</span>
          }
          {statusLabel && (
            <span className={`mt-card-status ${statusClass}`}>{statusLabel}</span>
          )}
        </div>

        {/* Card body */}
        <div className="mt-card-body">
          <div className="mt-card-title-row">
            <strong className="mt-card-title">{trip.destination.split(',')[0].trim()}</strong>
            <span className="mt-card-chevron" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
            </span>
          </div>
          <p className="mt-card-meta">{metaLine}</p>
          {(booking.flight !== 'none' || booking.stay !== 'none' || !trip.startDate) && (
            <div className="mt-card-chips">
              <span className={`mt-card-chip${booking.flight === 'booked' ? ' booked' : ''}`}>
                {/* Plane icon */}
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                {booking.flight === 'booked' ? (km ? 'បានកក់' : 'Booked') : (km ? 'មិនទាន់' : 'Not booked')}
              </span>
              <span className={`mt-card-chip${booking.stay === 'booked' ? ' booked' : ''}`}>
                {/* Bed icon */}
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 4v16" /><path d="M2 8h18a2 2 0 0 1 2 2v10" /><path d="M2 17h20" /><path d="M6 8v9" /></svg>
                {booking.stay === 'booked' ? (km ? 'បានកក់' : 'Booked') : (km ? 'មិនទាន់' : 'Not booked')}
              </span>
            </div>
          )}
          {past && onPlanAgain && (
            <button
              type="button"
              className="mt-plan-again-btn"
              onClick={(event) => {
                event.stopPropagation();
                onPlanAgain(trip);
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 1 2.7 6M4 12v5h5" /></svg>
              {km ? 'រៀបចំម្ដងទៀត' : 'Plan this trip again'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Original card-layout (home carousel) ────────────────────────────────────

export default function TripCard({ trip, active, onSelect, allowDelete = false, onDelete, layout = 'card', onPlanAgain }: TripCardProps) {
  // Delegate to list layout
  if (layout === 'list') {
    return <ListTripCard trip={trip} active={active} onSelect={onSelect} allowDelete={allowDelete} onDelete={onDelete} onPlanAgain={onPlanAgain} />;
  }

  const { state } = useAppContext();
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const swipeOffsetRef = useRef(0);
  const dragStartRef = useRef({ x: 0, y: 0, offset: 0 });
  const draggedRef = useRef(false);
  const alert = getUpcomingTripAlert(trip);
  const km = state.language === 'km';
  const scheduleText = formatTripSchedule(trip, km);
  const destinationName = trip.destination.split(',')[0].trim();
  const unpackedItems = (trip.packingItems ?? []).filter((item) => !item.packed).length;
  const excitementText = km
    ? `${destinationName} ជិតមកដល់ហើយ! តើអ្នករំភើបចង់ទៅមើលអ្វីជាងគេ?`
    : `${destinationName} is almost here! What are you most excited to explore?`;

  function updateSwipeOffset(next: number) {
    swipeOffsetRef.current = next;
    setSwipeOffset(next);
  }
  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!allowDelete || event.button !== 0) return;
    dragStartRef.current = { x: event.clientX, y: event.clientY, offset: swipeOffsetRef.current };
    draggedRef.current = false;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!allowDelete || !dragging) return;
    const deltaX = event.clientX - dragStartRef.current.x;
    const deltaY = event.clientY - dragStartRef.current.y;
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 8) {
      setDragging(false);
      updateSwipeOffset(swipeOffsetRef.current < -44 ? -88 : 0);
      return;
    }
    if (Math.abs(deltaX) > 6) draggedRef.current = true;
    updateSwipeOffset(Math.max(-96, Math.min(0, dragStartRef.current.offset + deltaX)));
  }
  function finishSwipe(event: ReactPointerEvent<HTMLDivElement>) {
    if (!allowDelete || !dragging) return;
    setDragging(false);
    updateSwipeOffset(swipeOffsetRef.current < -44 ? -88 : 0);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }
  function handleCardClick() {
    if (draggedRef.current) { draggedRef.current = false; return; }
    if (swipeOffsetRef.current < 0) { updateSwipeOffset(0); return; }
    onSelect(trip.id);
  }

  const alertText = alert
    ? alert.daysUntil === 0
      ? km ? 'ចាប់ផ្ដើមថ្ងៃនេះ' : 'Starts today'
      : alert.daysUntil === 1
        ? km ? 'ចាប់ផ្ដើមថ្ងៃស្អែក' : 'Starts tomorrow'
        : alert.tone === 'urgent'
          ? km ? `ត្រៀមខ្លួន · ${alert.daysUntil} ថ្ងៃ` : `Get ready · ${alert.daysUntil} days`
          : km ? `ឆាប់ៗនេះ · ${alert.daysUntil} ថ្ងៃ` : `Coming soon · ${alert.daysUntil} days`
    : '';

  return (
    <div className={`trip-swipe-shell${allowDelete ? '' : ' no-delete'}`}>
      {allowDelete && onDelete && (
        <button
          type="button"
          className="trip-card-delete-action"
          aria-label={km ? `លុបដំណើរទៅ ${trip.destination}` : `Delete trip to ${trip.destination}`}
          onClick={() => onDelete(trip.id)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
          </svg>
          <span>{km ? 'លុប' : 'Delete'}</span>
        </button>
      )}
      <div
        className={`trip-card${active ? ' active' : ''}${dragging ? ' dragging' : ''}`}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          '--trip-stroke': tripStrokeColor(trip.id),
        } as CSSProperties}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishSwipe}
        onPointerCancel={finishSwipe}
        onClick={handleCardClick}
      >
        <div className="trip-card-body">
          <div className="trip-card-heading">
            <div className="trip-card-dest">{trip.destination}</div>
            <div className="trip-card-alerts">
              {alert && <span className={`trip-card-alert-badge ${alert.tone}`}>{alertText}</span>}
              {isPastTrip(trip) && <span className="trip-card-past-badge">{km ? 'បានបញ្ចប់' : 'Past'}</span>}
            </div>
          </div>
          <div className="trip-card-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" />
            </svg>
            <span>{scheduleText}</span>
          </div>
          {alert && (
            <div className="trip-card-excitement">
              <span className="trip-card-sparkle" aria-hidden="true">✦</span>
              <span>{excitementText}</span>
            </div>
          )}
          {alert && unpackedItems > 0 && (
            <div className="trip-card-packing-reminder">
              <span aria-hidden="true">▣</span>
              <span>
                {km
                  ? `រំលឹក៖ នៅសល់របស់ត្រូវរៀបចំ ${unpackedItems}`
                  : `Packing reminder: ${unpackedItems} item${unpackedItems === 1 ? '' : 's'} left`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
