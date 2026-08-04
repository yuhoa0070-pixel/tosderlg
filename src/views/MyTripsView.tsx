import { useAppContext } from '../context/AppContext';
import TripCard from '../components/shared/TripCard';

export default function MyTripsView() {
  const { state, dispatch } = useAppContext();
  const trips = state.trips.slice().reverse();

  return (
    <section id="view-mytrips" className="active">
      <div className="topbar">
        <div className="icon-btn" onClick={() => dispatch({ type: 'NAVIGATE', view: 'home' })}>
          &#8592;
        </div>
        <div />
      </div>
      <h2>My trips</h2>
      <p className="sub">Every trip you&rsquo;ve created, all in one place</p>
      {trips.length === 0 ? (
        <div id="myTripsEmpty" style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)', fontSize: 13 }}>
          No trips yet.
          <br />
          Create one to see it here.
        </div>
      ) : (
        <div id="myTripsList">
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
      )}
    </section>
  );
}
