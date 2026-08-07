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
}

const TRIP_STROKE_COLORS = ['#7FB8FF', '#FF8A73', '#FFD83D', '#A57CFF', '#4FD1C5', '#FF6FA5'];

function tripStrokeColor(tripId: number): string {
  return TRIP_STROKE_COLORS[Math.abs(tripId) % TRIP_STROKE_COLORS.length];
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

export default function TripCard({ trip, active, onSelect, allowDelete = false, onDelete }: TripCardProps) {
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
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    if (swipeOffsetRef.current < 0) {
      updateSwipeOffset(0);
      return;
    }
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
