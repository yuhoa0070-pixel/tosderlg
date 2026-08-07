import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { geocodeCity } from '../../lib/geocode';
import { dayCount } from '../../lib/tripUtils';
import type { Trip } from '../../types';
import DatePickerField from '../shared/DatePickerField';
import TripRoomIcon from '../shared/TripRoomIcon';

export default function TripForm() {
  const { state, dispatch } = useAppContext();
  const km = state.language === 'km';
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [destError, setDestError] = useState('');

  async function handleCreate() {
    const dest = destination.trim();
    if (!dest) {
      setDestError(km ? 'សូមបញ្ចូលគោលដៅ' : 'Destination is required');
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
      packingItems: [],
    };

    setBusy(false);
    dispatch({ type: 'CREATE_TRIP', trip });
  }

  return (
    <>
      <p className="eyebrow">{km ? 'គោលដៅ' : 'Destination'}</p>
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
      <div className="date-picker-grid">
        <DatePickerField
          id="startDate"
          label={km ? 'ចេញដំណើរ' : 'Depart'}
          value={startDate}
          language={state.language}
          onChange={setStartDate}
        />
        <DatePickerField
          id="endDate"
          label={km ? 'ត្រឡប់' : 'Return'}
          min={startDate || undefined}
          value={endDate}
          language={state.language}
          onChange={setEndDate}
        />
      </div>
      <button className="btn btn-primary" id="generateBtn" disabled={busy} onClick={handleCreate}>
        {busy ? (km ? 'កំពុងរៀបចំ…' : 'Setting up…') : (km ? 'បង្កើតដំណើរ' : 'Create trip')}
      </button>
      <button
        type="button"
        className="btn btn-ghost home-join-room"
        onClick={() => dispatch({ type: 'OPEN_MODAL', modal: 'joinTripRoom' })}
      >
        <TripRoomIcon size={18} /> {km ? 'មានលេខកូដ? ចូលបន្ទប់ដំណើរ' : 'Have a code? Join a trip room'}
      </button>
      <div className="status" id="genStatus">
        {status}
      </div>
    </>
  );
}
