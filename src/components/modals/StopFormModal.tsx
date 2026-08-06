import { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useActiveTrip } from '../../hooks/useActiveTrip';
import { parseGoogleMapsLink, isShortMapsLink, resolveShortLink } from '../../lib/mapsLink';
import { reverseGeocode } from '../../lib/geocode';
import { DEFAULT_CENTER } from '../../lib/constants';
import BottomSheetModal from './BottomSheetModal';

// Ported verbatim from the original's #emojiPicker: unicode category chips
// interleaved with 4 image chips extracted from the original's inline base64
// PNGs (now real files under public/emoji/). The stored value for an image
// chip is its /emoji/*.png path — see useLeafletMap.ts's isImgEmoji() and
// StopCard.tsx's isImgIcon() for the 3 formats supported at render time.
const EMOJI_CHIPS: string[] = [
  '📍',
  '/emoji/map.png',
  '🍜',
  '☕',
  '/emoji/coffee.png',
  '🏨',
  '🏛️',
  '🌳',
  '/emoji/wave.png',
  '🛍️',
  '🎉',
  '/emoji/temple.png',
];

function isImgChip(emoji: string): boolean {
  return emoji.startsWith('/emoji/');
}

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
  const [titleError, setTitleError] = useState('');
  const [busy, setBusy] = useState(false);
  // True while reverse-geocoding a tap-to-add-stop location (map view only).
  const [nameLocating, setNameLocating] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit) {
      const s = stops[editingIndex as number];
      setTime(s.time);
      setTitle(s.title);
      setNote(s.sub);
      setMapLink(s.mapLink || '');
      setEmoji(s.emoji || '📍');
      setNameLocating(false);
    } else {
      setTime('');
      setNote('');
      setMapLink('');
      setEmoji('📍');
      const tapCoords = state.pendingTapCoords;
      if (tapCoords) {
        setTitle('Locating…');
        setNameLocating(true);
        reverseGeocode(tapCoords.lat, tapCoords.lng).then((name) => {
          setTitle(name || '');
          setNameLocating(false);
        });
      } else {
        setTitle('');
        setNameLocating(false);
      }
    }
    setStatus('');
    setStatusErr(false);
    setTitleError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingIndex]);

  function close() {
    dispatch({ type: 'SET_PENDING_TAP_COORDS', coords: null });
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
    if (!finalTitle) {
      setTitleError('Place is required');
      return;
    }
    setTitleError('');

    setStatus('');
    setStatusErr(false);
    let parsedCoords = finalMapLink ? parseGoogleMapsLink(finalMapLink) : null;

    if (finalMapLink && !parsedCoords && isShortMapsLink(finalMapLink)) {
      setBusy(true);
      const resolved = await resolveShortLink(finalMapLink);
      if (resolved) {
        finalMapLink = resolved.url;
        parsedCoords = resolved.coords;
        setMapLink(resolved.url);
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
      const tapCoords = state.pendingTapCoords;
      const coords = tapCoords || parsedCoords || jitteredCoords();
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
      if (tapCoords) {
        // Newly added stop lands at the end — select it so the map view highlights it.
        dispatch({ type: 'SET_SELECTED_STOP', index: stops.length });
      }
    }
    close();
  }

  return (
    <BottomSheetModal isOpen={isOpen} onClose={close} overlayId="stopFormOverlay">
      <h2>{isEdit ? 'Edit stop' : 'Add a stop'}</h2>
      <label className="field-label">Time</label>
      <input type="text" placeholder="9:00 AM" value={time} onChange={(e) => setTime(e.target.value)} />
      <label className="field-label">Place</label>
      <input
        type="text"
        placeholder="Belem Tower"
        value={title}
        disabled={nameLocating}
        onChange={(e) => {
          setTitle(e.target.value);
          if (titleError && e.target.value.trim()) setTitleError('');
        }}
        style={titleError ? { borderColor: 'var(--danger)', marginBottom: 4 } : undefined}
      />
      {titleError && (
        <p className="status err" style={{ margin: '0 0 10px', textAlign: 'left' }}>
          {titleError}
        </p>
      )}
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
            className={`emoji-chip${isImgChip(e) ? ' emoji-chip-img' : ''}${emoji === e ? ' active' : ''}`}
            onClick={() => setEmoji(e)}
          >
            {isImgChip(e) ? <img src={e} alt="" /> : e}
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
