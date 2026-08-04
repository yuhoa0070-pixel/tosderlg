import { useAppContext } from '../context/AppContext';
import { useActiveTrip } from '../hooks/useActiveTrip';
import { isPastTrip } from '../lib/tripUtils';
import StopCard from '../components/shared/StopCard';

export default function ItineraryView() {
  const { state, dispatch } = useAppContext();
  const activeTrip = useActiveTrip();

  const tripDays = activeTrip?.tripDays ?? [];
  const stops = tripDays[state.currentDay]?.stops ?? [];
  const showRecapBtn = !!activeTrip && isPastTrip(activeTrip);

  return (
    <section id="view-itinerary" className="active">
      <p className="eyebrow" id="itinEyebrow">
        Your itinerary
      </p>
      <h1 id="itineraryTitle">{activeTrip ? activeTrip.destination.split(',')[0] : ''}</h1>
      <p className="sub" id="itinDates">
        {activeTrip ? activeTrip.label : '—'}
      </p>

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

      <button
        className="btn btn-primary"
        style={{ marginTop: 8 }}
        onClick={() => dispatch({ type: 'NAVIGATE', view: 'customize' })}
      >
        Review and customize
      </button>
      <button
        className="btn btn-ghost"
        style={{ marginTop: 10 }}
        onClick={() => dispatch({ type: 'NAVIGATE', view: 'map' })}
      >
        Open map explorer
      </button>
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
