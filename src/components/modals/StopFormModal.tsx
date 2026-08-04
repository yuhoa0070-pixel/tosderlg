import { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useActiveTrip } from '../../hooks/useActiveTrip';
import { parseGoogleMapsLink, isShortMapsLink, resolveShortLink } from '../../lib/mapsLink';
import { DEFAULT_CENTER } from '../../lib/constants';
import BottomSheetModal from './BottomSheetModal';

// TODO(phase3-followup): add base64 image emoji chips (4 extra chips ported
// from the original's inline base64 PNGs — map/coffee/wave/temple icons).
// Only the 8 unicode category chips are wired up in this phase.
const EMOJI_CHIPS = ['📍', '🍜', '☕', '🏨', '🏛️', '🌳', '🛍️', '🎉'];

export default function StopFormModal() {
  const { state, dispatch } = useAppContext();
  const activeTrip = useActiveTrip();
  const isOpen = state.activeModal === 'stopForm';
  const editingIndex = state.editingStopIndex;

  const stops = activeTrip?.tripDays[state.currentDay]?.stops ?? [];
  const isEdit = editingIndex !== null && editingIndex !== undefined && !!stops[editingIndex];

  const [time, setTime] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [mapLink, setMapLink] = useState('');
  const [emoji, setEmoji] = useState('📍');
  const [status, setStatus] = useState('');
  const [statusErr, setStatusErr] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit) {
      const s = stops[editingIndex as number];
      setTime(s.time);
      setTitle(s.title);
      setNote(s.sub);
      setMapLink(s.mapLink || '');
      setEmoji(s.emoji || '📍');
    } else {
      setTime('');
      setTitle('');
      setNote('');
      setMapLink('');
      setEmoji('📍');
    }
    setStatus('');
    setStatusErr(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingIndex]);

  function close() {
    dispatch({ type: 'CLOSE_MODAL' });
  }

  function jitteredCoords() {
    const c = activeTrip?.center || DEFAULT_CENTER;
    return { lat: c.lat + (Math.random() - 0.5) * 0.02, lng: c.lng + (Math.random() - 0.5) * 0.02 };
  }

  async function handleSave() {
    const finalTime = time || '--:--';
    const finalTitle = title.trim();
    const finalNote = note.trim();
    let finalMapLink = mapLink.trim();
    const finalEmoji = emoji || '📍';
    if (!finalTitle) return;

    setStatus('');
    setStatusErr(false);
    let parsedCoords = finalMapLink ? parseGoogleMapsLink(finalMapLink) : null;

    if (finalMapLink && !parsedCoords && isShortMapsLink(finalMapLink)) {
      setBusy(true);
      const expanded = await resolveShortLink(finalMapLink);
      if (expanded) {
        finalMapLink = expanded;
        parsedCoords = parseGoogleMapsLink(expanded);
        setMapLink(expanded);
      }
      setBusy(false);
    }

    if (finalMapLink && !parsedCoords) {
      setStatus(
        isShortMapsLink(finalMapLink)
          ? "Couldn't expand that short link automatically. Open it in Google Maps, then use Share → Copy link again — that usually gives a longer link with coordinates."
          : "Couldn't read coordinates from that link — using an approximate spot instead",
      );
      setStatusErr(true);
    }

    if (isEdit) {
      const existing = stops[editingIndex as number];
      dispatch({
        type: 'UPDATE_STOP',
        dayIndex: state.currentDay,
        stopIndex: editingIndex as number,
        stop: {
          ...existing,
          time: finalTime,
          title: finalTitle,
          sub: finalNote,
          mapLink: finalMapLink || null,
          emoji: finalEmoji,
          lat: parsedCoords ? parsedCoords.lat : existing.lat,
          lng: parsedCoords ? parsedCoords.lng : existing.lng,
        },
      });
    } else {
      const coords = parsedCoords || jitteredCoords();
      dispatch({
        type: 'ADD_STOP',
        dayIndex: state.currentDay,
        stop: {
          time: finalTime,
          title: finalTitle,
          sub: finalNote,
          mapLink: finalMapLink || null,
          emoji: finalEmoji,
          lat: coords.lat,
          lng: coords.lng,
        },
      });
    }
    close();
  }

  return (
    <BottomSheetModal isOpen={isOpen} onClose={close} overlayId="stopFormOverlay">
      <h2>{isEdit ? 'Edit stop' : 'Add a stop'}</h2>
      <label className="field-label">Time</label>
      <input type="text" placeholder="9:00 AM" value={time} onChange={(e) => setTime(e.target.value)} />
      <label className="field-label">Place</label>
      <input type="text" placeholder="Belem Tower" value={title} onChange={(e) => setTitle(e.target.value)} />
      <label className="field-label">Note</label>
      <input
        type="text"
        placeholder="Historic riverside district"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <label className="field-label">Google Maps link (optional)</label>
      <input
        type="text"
        placeholder="Paste a Google Maps link"
        value={mapLink}
        onChange={(e) => setMapLink(e.target.value)}
      />
      <div className={`status${statusErr ? ' err' : ''}`}>{status}</div>
      <label className="field-label">Category</label>
      <div className="emoji-picker">
        {EMOJI_CHIPS.map((e) => (
          <div
            key={e}
            className={`emoji-chip${emoji === e ? ' active' : ''}`}
            onClick={() => setEmoji(e)}
          >
            {e}
          </div>
        ))}
      </div>
      <div className="row2" style={{ marginTop: 6 }}>
        <button className="btn btn-ghost" onClick={close}>
          Cancel
        </button>
        <button className="btn btn-primary" disabled={busy} onClick={handleSave}>
          {busy ? 'Resolving link…' : 'Save'}
        </button>
      </div>
    </BottomSheetModal>
  );
}
