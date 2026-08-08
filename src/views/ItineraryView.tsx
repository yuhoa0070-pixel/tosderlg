import { useAppContext } from '../context/AppContext';
import { useActiveTrip } from '../hooks/useActiveTrip';
import { useTripPresence } from '../hooks/useTripPresence';
import { dayDateLabel, isPastTrip, plannedDaysProgress } from '../lib/tripUtils';
import StopCard from '../components/shared/StopCard';
import TripForm from '../components/home/TripForm';
import TripInviteButton from '../components/shared/TripInviteButton';
import TripSummaryHeader from '../components/shared/TripSummaryHeader';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0]}` : parts[0]?.slice(0, 2) || '?').toUpperCase();
}

export default function ItineraryView() {
  const { state, dispatch } = useAppContext();
  const activeTrip = useActiveTrip();
  const presence = useTripPresence(activeTrip);
  const km = state.language === 'km';

  if (!activeTrip) {
    return (
      <section id="view-itinerary" className="active">
        <p className="eyebrow">{km ? 'គោលដៅ' : 'Destination'}</p>
        <h2 style={{ margin: '0 0 4px' }}>{km ? 'បង្កើតដំណើររបស់អ្នក' : 'Plan your first trip'}</h2>
        <p className="sub" style={{ margin: '0 0 20px' }}>
          {km ? 'បញ្ចូលគោលដៅ និងកាលបរិច្ឆេទដើម្បីចាប់ផ្ដើម' : 'Enter a destination and dates to get started'}
        </p>
        <TripForm />
      </section>
    );
  }

  const tripDays = activeTrip?.tripDays ?? [];
  const stops = tripDays[state.currentDay]?.stops ?? [];
  const showRecapBtn = !!activeTrip && isPastTrip(activeTrip);
  const { planned, total, percent } = plannedDaysProgress(tripDays);
  const dateLabel = activeTrip ? dayDateLabel(activeTrip.startDate, state.currentDay, state.language) : null;

  const editingDays = new Set(presence.map((entry) => entry.dayIndex));
  const currentDayEditors = presence.filter((entry) => entry.dayIndex === state.currentDay);
  const latestEditor = presence.length > 0
    ? presence.reduce((a, b) => (a.updatedAt > b.updatedAt ? a : b))
    : null;

  return (
    <section id="view-itinerary" className="active">
      <TripSummaryHeader trip={activeTrip} />

      {activeTrip && <TripInviteButton trip={activeTrip} />}

      {latestEditor && (
        <div className="itin-presence-banner" role="status">
          <span className="itin-presence-avatar" aria-hidden="true">{initials(latestEditor.name)}</span>
          <span>
            {km
              ? `${latestEditor.name} កំពុងកែប្រែ ថ្ងៃទី ${latestEditor.dayIndex + 1}`
              : `${latestEditor.name} is editing Day ${latestEditor.dayIndex + 1}`}
          </span>
        </div>
      )}

      {total > 0 && (
        <div className="itin-progress">
          <div className="itin-progress-label">
            <span>{km ? `ដំណើររៀបចំរួច ${percent}%` : `Trip is ${percent}% planned`}</span>
            <span>{km ? `${planned} នៃ ${total} ថ្ងៃ` : `${planned} of ${total} days set`}</span>
          </div>
          <div className="itin-progress-track">
            <div className="itin-progress-fill" style={{ width: `${percent}%` }} />
          </div>
        </div>
      )}

      <div className="day-tabs" id="dayTabs">
        {tripDays.map((_, i) => (
          <div
            key={i}
            className={`day-tab${i === state.currentDay ? ' active' : ''}${editingDays.has(i) ? ' live' : ''}`}
            onClick={() => dispatch({ type: 'SET_CURRENT_DAY', day: i })}
          >
            Day {i + 1}
            {editingDays.has(i) && <span className="day-tab-live-dot" aria-hidden="true" />}
          </div>
        ))}
      </div>

      {dateLabel && <p className="itin-date-heading">{dateLabel}</p>}

      <div id="stopList" className="itin-timeline">
        {stops.length === 0 && activeTrip?.readOnly && (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: 13 }}>
            {km ? 'មិនទាន់មានទីកន្លែងសម្រាប់ថ្ងៃនេះទេ។' : 'No stops yet for this day.'}
          </div>
        )}
        {stops.map((stop, i) => {
          const editor = currentDayEditors.find((entry) => entry.stopIndex === i);
          return (
            <div className="itin-timeline-item" key={i}>
              <span className="itin-timeline-dot" aria-hidden="true" />
              <div className="itin-timeline-content">
                {stop.time && <div className="itin-timeline-time">{stop.time}</div>}
                <StopCard stop={stop} mode="readonly" editedBy={editor ? initials(editor.name) : undefined} />
              </div>
            </div>
          );
        })}

        {!activeTrip?.readOnly && (
          <div className="itin-timeline-item">
            <span className="itin-timeline-dot ghost" aria-hidden="true" />
            <div className="itin-timeline-content">
              <button
                type="button"
                className="itin-add-activity"
                onClick={() => dispatch({ type: 'OPEN_MODAL', modal: 'stopForm', editingStopIndex: null })}
              >
                + {km ? 'បន្ថែមសកម្មភាព' : 'Add activity'}
              </button>
            </div>
          </div>
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
