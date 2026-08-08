import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useActiveTrip } from '../hooks/useActiveTrip';
import { useSortable } from '../hooks/useSortable';
import StopCard from '../components/shared/StopCard';
import TripSuccessCelebration from '../components/shared/TripSuccessCelebration';

function canPersistToStorage(): boolean {
  try {
    const probeKey = '__waylo_save_probe__';
    window.localStorage.setItem(probeKey, '1');
    window.localStorage.removeItem(probeKey);
    return true;
  } catch {
    return false;
  }
}

export default function CustomizeView() {
  const { state, dispatch } = useAppContext();
  const activeTrip = useActiveTrip();
  const stops = activeTrip?.tripDays[state.currentDay]?.stops ?? [];
  const km = state.language === 'km';
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [celebrationOpen, setCelebrationOpen] = useState(false);

  const listRef = useSortable((oldIndex, newIndex) => {
    dispatch({ type: 'REORDER_STOPS', dayIndex: state.currentDay, oldIndex, newIndex });
  });

  const destinationTitle = activeTrip ? activeTrip.destination.split(',')[0] : '';

  function handleSaveTrip() {
    if (saving) return;
    setSaving(true);
    setSaveError('');
    window.setTimeout(() => {
      setSaving(false);
      if (canPersistToStorage()) {
        setCelebrationOpen(true);
      } else {
        setSaveError(km ? 'មិនអាចរក្សាទុកបានទេ។ សូមព្យាយាមម្ដងទៀត។' : 'Could not save your trip. Please try again.');
      }
    }, 350);
  }

  return (
    <section id="view-customize" className="active">
      <div className="topbar">
        <div className="icon-btn" onClick={() => dispatch({ type: 'NAVIGATE', view: 'itinerary' })}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 4 12l7 7" /><path d="M4.5 12h15" /></svg>
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
      <button className="btn btn-primary" disabled={saving} onClick={handleSaveTrip}>
        {saving ? (km ? 'កំពុងរក្សាទុក…' : 'Saving…') : 'Looks good, save trip'}
      </button>
      {saveError && <p className="status err">{saveError}</p>}

      <TripSuccessCelebration
        open={celebrationOpen}
        friendImageSrc="/waylo-group-of-friends-transparent.png"
        language={state.language}
        onViewItinerary={() => {
          setCelebrationOpen(false);
          dispatch({ type: 'NAVIGATE', view: 'itinerary' });
        }}
        onClose={() => {
          setCelebrationOpen(false);
          dispatch({ type: 'NAVIGATE', view: 'home' });
        }}
      />
    </section>
  );
}
