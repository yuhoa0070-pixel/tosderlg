import type { Trip } from '../../types';
import { useAppContext } from '../../context/AppContext';

export default function TripSummaryHeader({ trip }: { trip?: Trip }) {
  const { state, dispatch } = useAppContext();
  const canEditDates = !!trip && !trip.readOnly;

  return (
    <>
      <p className="eyebrow" id="itinEyebrow">
        Your itinerary
      </p>
      <h1 id="itineraryTitle">{trip ? trip.destination.split(',')[0] : ''}</h1>
      {canEditDates ? (
        <button
          type="button"
          className="trip-date-edit-trigger"
          id="itinDates"
          onClick={() => dispatch({ type: 'OPEN_MODAL', modal: 'editTripDates' })}
          aria-label={state.language === 'km' ? 'កែប្រែកាលបរិច្ឆេទដំណើរ' : 'Edit trip dates'}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 10h18" />
          </svg>
          <span>{trip.label}</span>
          <svg className="trip-date-edit-pencil" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m14 5 5 5M4 20l3.5-.8L19 7.7a1.8 1.8 0 0 0 0-2.5l-.2-.2a1.8 1.8 0 0 0-2.5 0L4.8 16.5 4 20Z" />
          </svg>
        </button>
      ) : (
        <p className="sub" id="itinDates">
          {trip ? trip.label : '—'}
        </p>
      )}
    </>
  );
}
