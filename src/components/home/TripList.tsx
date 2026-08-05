import { useAppContext } from '../../context/AppContext';
import TripCard from '../shared/TripCard';

export default function TripList() {
  const { state, dispatch } = useAppContext();

  if (!state.trips.length) return null;

  const trips = state.trips.slice().reverse();

  return (
    <div id="tripListWrap" style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <p className="eyebrow" style={{ margin: 0 }}>
          {state.language === 'km' ? 'ដំណើររបស់ខ្ញុំ' : 'My trips'}
        </p>
        <span
          style={{ fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}
          onClick={() => dispatch({ type: 'NAVIGATE', view: 'mytrips' })}
        >
          {state.language === 'km' ? 'មើលទាំងអស់' : 'See all'}
        </span>
      </div>
      <div id="tripList">
        {trips.map((trip) => (
          <TripCard
            key={trip.id}
            trip={trip}
            active={trip.id === state.currentTripId}
            onSelect={(id) => dispatch({ type: 'LOAD_TRIP', tripId: id })}
            onDelete={(id) => dispatch({ type: 'DELETE_TRIP', tripId: id })}
          />
        ))}
      </div>
    </div>
  );
}
