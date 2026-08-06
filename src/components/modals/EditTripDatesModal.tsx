import { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useActiveTrip } from '../../hooks/useActiveTrip';
import { dayCount } from '../../lib/tripUtils';
import BottomSheetModal from './BottomSheetModal';

export default function EditTripDatesModal() {
  const { state, dispatch } = useAppContext();
  const activeTrip = useActiveTrip();
  const isOpen = state.activeModal === 'editTripDates';
  const km = state.language === 'km';
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [confirmShortening, setConfirmShortening] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setStartDate(activeTrip?.startDate ?? '');
    setEndDate(activeTrip?.endDate ?? '');
    setError('');
    setConfirmShortening(false);
  }, [activeTrip?.endDate, activeTrip?.startDate, isOpen]);

  const removedContentDays = useMemo(() => {
    if (!activeTrip || !startDate || !endDate || endDate < startDate) return [];
    const nextCount = dayCount(startDate, endDate);
    const days = new Set(
      activeTrip.tripDays
      .slice(nextCount)
      .map((day, index) => ({ day, number: nextCount + index + 1 }))
      .filter(({ day }) => day.stops.length > 0)
        .map(({ number }) => number),
    );
    Object.keys(activeTrip.photos).forEach((key) => {
      const match = key.match(/^d(\d+)-s\d+$/);
      if (match && Number(match[1]) >= nextCount) days.add(Number(match[1]) + 1);
    });
    return [...days].sort((a, b) => a - b);
  }, [activeTrip, endDate, startDate]);

  function close() {
    dispatch({ type: 'CLOSE_MODAL' });
  }

  function handleDateChange(setter: (value: string) => void, value: string) {
    setter(value);
    setError('');
    setConfirmShortening(false);
  }

  function save() {
    if (!activeTrip || activeTrip.readOnly) return;
    if (!startDate || !endDate) {
      setError(km ? 'សូមជ្រើសរើសថ្ងៃចេញដំណើរ និងថ្ងៃត្រឡប់។' : 'Choose both departure and return dates.');
      return;
    }
    if (endDate < startDate) {
      setError(km ? 'ថ្ងៃត្រឡប់ត្រូវតែនៅក្រោយថ្ងៃចេញដំណើរ។' : 'Return date must be on or after departure.');
      return;
    }
    if (removedContentDays.length > 0 && !confirmShortening) {
      setConfirmShortening(true);
      return;
    }

    dispatch({ type: 'UPDATE_TRIP_DATES', tripId: activeTrip.id, startDate, endDate });
    close();
  }

  const warningText = km
    ? `ការបន្ថយថ្ងៃនឹងលុបផែនការ ឬអនុស្សាវរីយ៍នៅថ្ងៃទី ${removedContentDays.join(', ')}។ ចុចម្ដងទៀតដើម្បីបញ្ជាក់។`
    : `Shortening this trip removes plans or memories from Day ${removedContentDays.join(', ')}. Tap again to confirm.`;

  return (
    <BottomSheetModal isOpen={isOpen} onClose={close} overlayId="editTripDatesOverlay">
      <div className="edit-dates-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18M8 14h3M8 17h6" />
        </svg>
      </div>
      <h2 className="edit-dates-title">{km ? 'កែប្រែកាលបរិច្ឆេទ' : 'Edit trip dates'}</h2>
      <p className="edit-dates-copy">
        {km ? 'កែថ្ងៃចេញដំណើរ និងថ្ងៃត្រឡប់របស់អ្នក។' : 'Update when your trip starts and ends.'}
      </p>

      <div className="row2">
        <div>
          <label className="field-label" htmlFor="editTripStartDate">{km ? 'ចេញដំណើរ' : 'Depart'}</label>
          <input
            id="editTripStartDate"
            type="date"
            value={startDate}
            onChange={(event) => handleDateChange(setStartDate, event.target.value)}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="editTripEndDate">{km ? 'ត្រឡប់' : 'Return'}</label>
          <input
            id="editTripEndDate"
            type="date"
            min={startDate || undefined}
            value={endDate}
            onChange={(event) => handleDateChange(setEndDate, event.target.value)}
          />
        </div>
      </div>

      {error && <p className="status err" role="alert">{error}</p>}
      {confirmShortening && <p className="edit-dates-warning" role="alert">{warningText}</p>}

      <div className="row2" style={{ marginTop: error ? 12 : 2 }}>
        <button type="button" className="btn btn-ghost" onClick={close}>
          {km ? 'បោះបង់' : 'Cancel'}
        </button>
        <button type="button" className="btn btn-primary" onClick={save}>
          {confirmShortening ? (km ? 'បញ្ជាក់ និងរក្សាទុក' : 'Confirm and save') : (km ? 'រក្សាទុកថ្ងៃ' : 'Save dates')}
        </button>
      </div>
    </BottomSheetModal>
  );
}
