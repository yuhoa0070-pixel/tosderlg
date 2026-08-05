import { useEffect, useState, type FormEvent } from 'react';
import { useAppContext } from '../../context/AppContext';
import { joinTripRoom } from '../../lib/tripRoom';
import BottomSheetModal from './BottomSheetModal';

export default function JoinTripRoomModal() {
  const { state, dispatch } = useAppContext();
  const isOpen = state.activeModal === 'joinTripRoom';
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const km = state.language === 'km';

  useEffect(() => {
    if (!isOpen) return;
    setCode('');
    setError('');
    setBusy(false);
  }, [isOpen]);

  function close() {
    if (!busy) dispatch({ type: 'CLOSE_MODAL' });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (code.length !== 6 || busy) return;
    setBusy(true);
    setError('');
    try {
      const trip = await joinTripRoom(code);
      dispatch({ type: 'IMPORT_SHARED_TRIP', trip });
      dispatch({ type: 'CLOSE_MODAL' });
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : 'Could not join this trip room.');
      setBusy(false);
    }
  }

  return (
    <BottomSheetModal isOpen={isOpen} onClose={close} overlayId="joinTripRoomOverlay">
      <form onSubmit={submit}>
        <div className="join-room-icon" aria-hidden="true">👥</div>
        <h2>{km ? 'ចូលបន្ទប់ដំណើរ' : 'Join a trip room'}</h2>
        <p className="join-room-sub">
          {km ? 'សុំលេខកូដ ៦ តួពីមិត្តភក្តិរបស់អ្នក។' : 'Ask your friend for their 6-character room code.'}
        </p>
        <label className="field-label" htmlFor="tripRoomCode">
          {km ? 'លេខកូដបន្ទប់' : 'Room code'}
        </label>
        <input
          id="tripRoomCode"
          className="join-room-input"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 6))}
          placeholder="ABC234"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          inputMode="text"
          autoFocus
        />
        {error && <p className="join-room-error" role="alert">{error}</p>}
        <div className="row2 join-room-actions">
          <button type="button" className="btn btn-ghost" onClick={close} disabled={busy}>
            {km ? 'បោះបង់' : 'Cancel'}
          </button>
          <button type="submit" className="btn btn-primary" disabled={code.length !== 6 || busy}>
            {busy ? (km ? 'កំពុងចូល…' : 'Joining…') : (km ? 'ចូលបន្ទប់' : 'Join room')}
          </button>
        </div>
      </form>
    </BottomSheetModal>
  );
}
