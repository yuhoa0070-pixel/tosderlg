import { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useActiveTrip } from '../../hooks/useActiveTrip';
import { parseGoogleMapsLink, isShortMapsLink, resolveShortLink } from '../../lib/mapsLink';
import { reverseGeocode } from '../../lib/geocode';
import BottomSheetModal from './BottomSheetModal';

export default function PasteLinkModal() {
  const { state, dispatch } = useAppContext();
  const activeTrip = useActiveTrip();
  const isOpen = state.activeModal === 'pasteLink';

  const [link, setLink] = useState('');
  const [status, setStatus] = useState('');
  const [statusErr, setStatusErr] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState('Add stop');

  useEffect(() => {
    if (!isOpen) return;
    setLink('');
    setStatus('');
    setStatusErr(false);
    setBusy(false);
    setBusyLabel('Add stop');
  }, [isOpen]);

  function close() {
    dispatch({ type: 'CLOSE_MODAL' });
  }

  async function handleSave() {
    const trimmed = link.trim();
    setStatus('');
    setStatusErr(false);

    let coords = parseGoogleMapsLink(trimmed);
    let finalLink = trimmed;

    if (!coords && isShortMapsLink(trimmed)) {
      setBusy(true);
      setBusyLabel('Resolving link…');
      const expanded = await resolveShortLink(trimmed);
      if (expanded) {
        finalLink = expanded;
        coords = parseGoogleMapsLink(expanded);
      }
      setBusy(false);
      setBusyLabel('Add stop');
    }

    if (!coords) {
      setStatus(
        isShortMapsLink(trimmed)
          ? "Couldn't expand that short link automatically. Open it in Google Maps, then use Share → Copy link again — that usually gives a longer link with coordinates."
          : "Couldn't read coordinates from that link — try copying it again from Google Maps.",
      );
      setStatusErr(true);
      return;
    }

    setBusy(true);
    setBusyLabel('Adding…');
    const placeName = await reverseGeocode(coords.lat, coords.lng);

    const stops = activeTrip?.tripDays[state.currentDay]?.stops ?? [];
    const lastTime = stops.length ? stops[stops.length - 1].time : '09:00';

    dispatch({
      type: 'ADD_STOP',
      dayIndex: state.currentDay,
      stop: {
        time: lastTime,
        title: placeName || 'Dropped pin',
        sub: 'Added from Google Maps',
        mapLink: finalLink,
        lat: coords.lat,
        lng: coords.lng,
      },
    });
    dispatch({ type: 'SET_SELECTED_STOP', index: stops.length });

    setBusy(false);
    setBusyLabel('Add stop');
    close();
  }

  return (
    <BottomSheetModal isOpen={isOpen} onClose={close} overlayId="pasteLinkOverlay">
      <h2>Paste a Google Maps link</h2>
      <label className="field-label">Link</label>
      <input
        type="text"
        placeholder="https://maps.google.com/..."
        value={link}
        onChange={(e) => setLink(e.target.value)}
      />
      <div className={`status${statusErr ? ' err' : ''}`}>{status}</div>
      <div className="row2" style={{ marginTop: 6 }}>
        <button className="btn btn-ghost" onClick={close}>
          Cancel
        </button>
        <button className="btn btn-primary" disabled={busy} onClick={handleSave}>
          {busy ? busyLabel : 'Add stop'}
        </button>
      </div>
    </BottomSheetModal>
  );
}
