import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { geocodeCity, reverseGeocodeCity } from '../../lib/geocode';
import { getCurrentLocationCoords } from '../../lib/currentLocation';
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
  const [locating, setLocating] = useState(false);

  async function handleUseCurrentLocation() {
    setLocating(true);
    setDestError('');
    const coords = await getCurrentLocationCoords();
    if (!coords) {
      setDestError("Couldn't get your location — check location access is allowed for this app");
      setLocating(false);
      return;
    }
    const place = await reverseGeocodeCity(coords.lat, coords.lng);
    if (place) setDestination(place);
    else setDestError("Couldn't figure out a place name for your location — try typing it instead");
    setLocating(false);
  }

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p className="eyebrow" style={{ margin: 0 }}>
          Destination
        </p>
        <span
          onClick={locating ? undefined : handleUseCurrentLocation}
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: locating ? 'var(--text-muted)' : 'var(--accent)',
            cursor: locating ? 'default' : 'pointer',
            marginBottom: 4,
          }}
        >
          {locating ? 'Locating…' : '📍 Use my current location'}
        </span>
      </div>
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
