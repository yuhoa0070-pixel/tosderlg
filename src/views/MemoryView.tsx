import { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useActiveTrip } from '../hooks/useActiveTrip';
import { parseKey } from '../lib/tripUtils';

export default function MemoryView() {
  const { state, dispatch } = useAppContext();
  const activeTrip = useActiveTrip();
  const viewing = state.viewingPhoto;
  const photo = viewing && activeTrip ? activeTrip.photos[viewing.key]?.[viewing.index] : undefined;
  const parsed = viewing ? parseKey(viewing.key) : null;
  const stop = parsed && activeTrip ? activeTrip.tripDays[parsed.day]?.stops[parsed.stop] : undefined;
  const locationText = `${stop ? stop.title : 'Unknown stop'}, ${activeTrip ? activeTrip.destination.split(',')[0] : ''}`;

  const [caption, setCaption] = useState('');

  useEffect(() => {
    setCaption(photo?.caption || '');
  }, [photo]);

  function goBack() {
    dispatch({ type: 'NAVIGATE', view: state.memoryReturnView });
  }

  function handleSave() {
    if (!viewing) return;
    dispatch({ type: 'UPDATE_PHOTO_CAPTION', key: viewing.key, index: viewing.index, caption });
    dispatch({ type: 'NAVIGATE', view: state.memoryReturnView });
  }

  return (
    <section id="view-memory" className="active">
      <div className="topbar">
        <div className="icon-btn" onClick={goBack}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 4 12l7 7" /><path d="M4.5 12h15" /></svg>
        </div>
        <div className="icon-btn" id="deleteMemoryBtn" onClick={() => dispatch({ type: 'OPEN_MODAL', modal: 'confirmDeletePhoto' })}>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4.5 7h15" />
            <path d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2" />
            <path d="M6.5 7l1 12.5A2 2 0 0 0 9.5 21h5a2 2 0 0 0 2-1.5L17.5 7" />
          </svg>
        </div>
      </div>
      <div className="photo-full">
        <img id="memoryImg" src={photo?.src ?? ''} />
      </div>
      <div className="loc-row">
        <span>&#128205;</span>
        <span id="memoryLoc">{locationText}</span>
      </div>
      <div className="date-row" id="memoryDate">
        {stop ? stop.time : '—'}
      </div>
      <label className="field-label">Caption</label>
      <textarea
        id="memoryCaption"
        placeholder="Add a note about this moment"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />
      <button className="btn btn-primary" id="saveMemoryBtn" onClick={handleSave}>
        Save
      </button>
    </section>
  );
}
