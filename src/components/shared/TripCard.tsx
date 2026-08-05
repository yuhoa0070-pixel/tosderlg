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
  const alert = getUpcomingTripAlert(trip);
  const km = state.language === 'km';

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
    <div className={`trip-card${active ? ' active' : ''}`} onClick={() => onSelect(trip.id)}>
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
      <span
        className="trip-card-del"
        title="Delete trip"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(trip.id);
        }}
      >
        &times;
      </span>
    </div>
  );
}
