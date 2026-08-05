import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { Trip } from '../../types';
import { getUpcomingTripAlert, isPastTrip } from '../../lib/tripUtils';
import { useAppContext } from '../../context/AppContext';

interface TripCardProps {
  trip: Trip;
  active: boolean;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function TripCard({ trip, active, onSelect, onDelete }: TripCardProps) {
  const { state } = useAppContext();
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const swipeOffsetRef = useRef(0);
  const dragStartRef = useRef({ x: 0, y: 0, offset: 0 });
  const draggedRef = useRef(false);
  const alert = getUpcomingTripAlert(trip);
  const km = state.language === 'km';

  function updateSwipeOffset(next: number) {
    swipeOffsetRef.current = next;
    setSwipeOffset(next);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    dragStartRef.current = { x: event.clientX, y: event.clientY, offset: swipeOffsetRef.current };
    draggedRef.current = false;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging) return;
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
    if (!dragging) return;
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
    <div className="trip-swipe-shell">
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
      <div
        className={`trip-card${active ? ' active' : ''}${dragging ? ' dragging' : ''}`}
        style={{ transform: `translateX(${swipeOffset}px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishSwipe}
        onPointerCancel={finishSwipe}
        onClick={handleCardClick}
      >
        <div className="trip-card-body" style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div className="trip-card-dest">{trip.destination}</div>
            <div className="trip-card-label">{trip.label}</div>
          </div>
          <div className="trip-card-alerts">
            {alert && <span className={`trip-card-alert-badge ${alert.tone}`}>{alertText}</span>}
            {isPastTrip(trip) && <span className="trip-card-past-badge">{km ? 'បានបញ្ចប់' : 'Past'}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
