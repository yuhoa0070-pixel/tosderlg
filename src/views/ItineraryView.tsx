import { useAppContext } from '../context/AppContext';
import { useActiveTrip } from '../hooks/useActiveTrip';
import { isPastTrip } from '../lib/tripUtils';
import StopCard from '../components/shared/StopCard';
import TripInviteButton from '../components/shared/TripInviteButton';
import TripSummaryHeader from '../components/shared/TripSummaryHeader';

export default function ItineraryView() {
  const { state, dispatch } = useAppContext();
  const activeTrip = useActiveTrip();

  const tripDays = activeTrip?.tripDays ?? [];
  const stops = tripDays[state.currentDay]?.stops ?? [];
  const showRecapBtn = !!activeTrip && isPastTrip(activeTrip);

  return (
    <section id="view-itinerary" className="active">
      <TripSummaryHeader trip={activeTrip} />

      {activeTrip && <TripInviteButton trip={activeTrip} />}

      <div className="day-tabs" id="dayTabs">
        {tripDays.map((_, i) => (
          <div
            key={i}
            className={`day-tab${i === state.currentDay ? ' active' : ''}`}
            onClick={() => dispatch({ type: 'SET_CURRENT_DAY', day: i })}
          >
            Day {i + 1}
          </div>
        ))}
      </div>

      <div id="stopList">
        {stops.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: 13 }}>
            No stops yet for this day.
            <br />
            Add the places you're planning to go.
          </div>
        ) : (
          stops.map((stop, i) => <StopCard key={i} stop={stop} mode="readonly" />)
        )}
      </div>

      {!activeTrip?.readOnly && (
        <button
          className="btn btn-primary"
          style={{ marginTop: 8 }}
          onClick={() => dispatch({ type: 'NAVIGATE', view: 'customize' })}
        >
          Review and customize
        </button>
      )}
      {showRecapBtn && (
        <button
          className="btn btn-ghost"
          style={{ marginTop: 10 }}
          onClick={() => dispatch({ type: 'NAVIGATE', view: 'recap' })}
        >
          View trip recap
        </button>
      )}
    </section>
  );
}
