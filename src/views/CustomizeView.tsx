import { useAppContext } from '../context/AppContext';
import { useActiveTrip } from '../hooks/useActiveTrip';
import { useSortable } from '../hooks/useSortable';
import StopCard from '../components/shared/StopCard';

export default function CustomizeView() {
  const { state, dispatch } = useAppContext();
  const activeTrip = useActiveTrip();
  const stops = activeTrip?.tripDays[state.currentDay]?.stops ?? [];

  const listRef = useSortable((oldIndex, newIndex) => {
    dispatch({ type: 'REORDER_STOPS', dayIndex: state.currentDay, oldIndex, newIndex });
  });

  const destinationTitle = activeTrip ? activeTrip.destination.split(',')[0] : '';

  return (
    <section id="view-customize" className="active">
      <div className="topbar">
        <div className="icon-btn" onClick={() => dispatch({ type: 'NAVIGATE', view: 'itinerary' })}>
          &#8592;
        </div>
        <div />
      </div>
      <p className="eyebrow">Active itinerary editor</p>
      <h2 id="customizeTitle">
        Day {state.currentDay + 1} · {destinationTitle}
      </h2>
      <p className="sub">Drag to reorder, edit, or remove</p>
      <div id="customizeList" ref={listRef}>
        {stops.map((stop, i) => (
          <StopCard
            key={i}
            stop={stop}
            mode="editable"
            onEdit={() => dispatch({ type: 'OPEN_MODAL', modal: 'stopForm', editingStopIndex: i })}
            onRemove={() => dispatch({ type: 'REMOVE_STOP', dayIndex: state.currentDay, stopIndex: i })}
          />
        ))}
      </div>
      <button
        className="btn btn-ghost"
        style={{ margin: '14px 0' }}
        onClick={() => dispatch({ type: 'OPEN_MODAL', modal: 'stopForm', editingStopIndex: null })}
      >
        + Add a stop
      </button>
      <button className="btn btn-primary" onClick={() => dispatch({ type: 'NAVIGATE', view: 'itinerary' })}>
        Looks good, save trip
      </button>
    </section>
  );
}
