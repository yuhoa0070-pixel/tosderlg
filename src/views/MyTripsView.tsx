import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import TripCard from '../components/shared/TripCard';
import TripRoomIcon from '../components/shared/TripRoomIcon';
import { useStartNewTrip } from '../hooks/useStartNewTrip';
import { isPastTrip } from '../lib/tripUtils';

type Tab = 'upcoming' | 'past';

export default function MyTripsView() {
  const { state, dispatch, removeTrip } = useAppContext();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [deleteError, setDeleteError] = useState('');
  const [deletingTripId, setDeletingTripId] = useState<number | null>(null);
  const km = state.language === 'km';
  const startNewTrip = useStartNewTrip();

  const allTrips = state.trips.slice().reverse();
  const upcomingTrips = allTrips.filter((trip) => !isPastTrip(trip));
  const pastTrips = allTrips.filter((trip) => isPastTrip(trip));
  const displayedTrips = tab === 'upcoming' ? upcomingTrips : pastTrips;

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
    <section id="view-mytrips" className="active mt-view">
      {/* Top bar */}
      <div className="topbar">
        <div className="icon-btn" onClick={() => dispatch({ type: 'NAVIGATE', view: 'home' })}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 4 12l7 7" /><path d="M4.5 12h15" /></svg>
        </div>
        <div />
      </div>

      <h2 className="mt-heading">{km ? 'ដំណើររបស់ខ្ញុំ' : 'My trips'}</h2>

      {/* Upcoming / Past tab switcher */}
      <div className="mt-tab-bar" role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'upcoming'}
          className={`mt-tab${tab === 'upcoming' ? ' active' : ''}`}
          onClick={() => setTab('upcoming')}
          id="tab-upcoming"
        >
          {km ? 'ខាងមុខ' : 'Upcoming'}
          {upcomingTrips.length > 0 && (
            <span className="mt-tab-count">{upcomingTrips.length}</span>
          )}
        </button>
        <button
          role="tab"
          aria-selected={tab === 'past'}
          className={`mt-tab${tab === 'past' ? ' active' : ''}`}
          onClick={() => setTab('past')}
          id="tab-past"
        >
          {km ? 'កន្លងទៅ' : 'Past'}
          {pastTrips.length > 0 && (
            <span className="mt-tab-count">{pastTrips.length}</span>
          )}
        </button>
      </div>

      {/* Trip list */}
      {displayedTrips.length === 0 ? (
        <div className="mt-empty">
          {tab === 'upcoming'
            ? (km ? 'មិនទាន់មានដំណើរខាងមុខ។' : 'No upcoming trips yet.')
            : (km ? 'មិនទាន់មានដំណើរដែលបានបញ្ចប់ទេ។' : 'No past trips yet.')}
        </div>
      ) : (
        <div className="mt-list" id="myTripsList">
          {displayedTrips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              active={trip.id === state.currentTripId}
              onSelect={(id) => dispatch({ type: 'LOAD_TRIP', tripId: id })}
              allowDelete
              onDelete={(id) => void handleDeleteTrip(id)}
              layout="list"
            />
          ))}
        </div>
      )}

      {deleteError && <p className="status err" role="alert">{deleteError}</p>}

      {/* Bottom actions — in document flow */}
      <div className="mt-actions">
        <button type="button" className="mt-plan-btn" onClick={startNewTrip} id="planNewTripBtn">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          {km ? 'រៀបចំដំណើរថ្មី' : 'Plan a new trip'}
        </button>
        <button
          type="button"
          className="mt-join-btn"
          onClick={() => dispatch({ type: 'OPEN_MODAL', modal: 'joinTripRoom' })}
        >
          <TripRoomIcon size={16} /> {km ? 'ចូលដោយលេខកូដ' : 'Join with room code'}
        </button>
      </div>
    </section>
  );
}


