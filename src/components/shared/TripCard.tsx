import type { Trip } from '../../types';
import { isPastTrip } from '../../lib/tripUtils';

interface TripCardProps {
  trip: Trip;
  active: boolean;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function TripCard({ trip, active, onSelect, onDelete }: TripCardProps) {
  return (
    <div className={`trip-card${active ? ' active' : ''}`} onClick={() => onSelect(trip.id)}>
      <div className="trip-card-body" style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div className="trip-card-dest">{trip.destination}</div>
          <div className="trip-card-label">{trip.label}</div>
        </div>
        {isPastTrip(trip) && <span className="trip-card-past-badge">Past</span>}
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
