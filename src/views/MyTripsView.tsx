import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import TripCard from '../components/shared/TripCard';
import TripRoomIcon from '../components/shared/TripRoomIcon';

export default function MyTripsView() {
  const { state, dispatch, removeTrip } = useAppContext();
  const [deleteError, setDeleteError] = useState('');
  const [deletingTripId, setDeletingTripId] = useState<number | null>(null);
  const trips = state.trips.slice().reverse();
  const km = state.language === 'km';

  function createNewTrip() {
    dispatch({ type: 'NAVIGATE', view: 'home' });
    window.setTimeout(() => {
      const destinationInput = document.getElementById('destination') as HTMLInputElement | null;
      destinationInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      destinationInput?.focus({ preventScroll: true });
    }, 60);
  }

  async function handleDeleteTrip(tripId: number) {
    if (deletingTripId !== null) return;
    setDeletingTripId(tripId);
    setDeleteError('');
    try {
      await removeTrip(tripId);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Could not leave this trip room. Try again.');
    } finally {
      setDeletingTripId(null);
    }
  }

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
              allowDelete
              onDelete={(id) => void handleDeleteTrip(id)}
            />
          ))}
        </div>
      )}
      {deleteError && <p className="status err" role="alert">{deleteError}</p>}
      <button
        type="button"
        className="btn btn-ghost my-trips-join"
        onClick={() => dispatch({ type: 'OPEN_MODAL', modal: 'joinTripRoom' })}
      >
        <TripRoomIcon size={18} /> {km ? 'ចូលដោយលេខកូដ' : 'Join with room code'}
      </button>
      <button type="button" className="btn btn-primary my-trips-create" onClick={createNewTrip}>
        <span aria-hidden="true">＋</span> {km ? 'បង្កើតដំណើរថ្មី' : 'Create new trip'}
      </button>
    </section>
  );
}
