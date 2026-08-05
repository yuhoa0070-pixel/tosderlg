import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { geocodeCity } from '../../lib/geocode';
import { dayCount } from '../../lib/tripUtils';
import type { Trip } from '../../types';

export default function TripForm() {
  const { dispatch } = useAppContext();
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [destError, setDestError] = useState('');

  async function handleCreate() {
    const dest = destination.trim();
    if (!dest) {
      setDestError('Destination is required');
      return;
    }
    setDestError('');
    const n = dayCount(startDate, endDate);
    setBusy(true);
    setStatus('');

    const center = await geocodeCity(dest);
    const days = Array.from({ length: n }, () => ({ stops: [] }));
    const label =
      startDate && endDate ? `${startDate} - ${endDate} · ${n} day${n > 1 ? 's' : ''}` : `${n} day${n > 1 ? 's' : ''}`;

    const trip: Trip = {
      id: Date.now(),
      destination: dest,
      label,
      startDate: startDate || null,
      endDate: endDate || null,
      center,
      tripDays: days,
      photos: {},
    };

    setBusy(false);
    dispatch({ type: 'CREATE_TRIP', trip });
  }

  return (
    <>
      <p className="eyebrow">Destination</p>
      <input
        type="text"
        id="destination"
        placeholder="Lisbon, Portugal"
        value={destination}
        onChange={(e) => {
          setDestination(e.target.value);
          if (destError && e.target.value.trim()) setDestError('');
        }}
        style={destError ? { borderColor: 'var(--danger)', marginBottom: 4 } : undefined}
      />
      {destError && (
        <p className="status err" style={{ margin: '0 0 10px', textAlign: 'left' }}>
          {destError}
        </p>
      )}
      <div className="row2">
        <div>
          <label className="field-label">Depart</label>
          <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="field-label">Return</label>
          <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>
      <button className="btn btn-primary" id="generateBtn" disabled={busy} onClick={handleCreate}>
        {busy ? 'Setting up…' : 'Create trip'}
      </button>
      <div className="status" id="genStatus">
        {status}
      </div>
    </>
  );
}
