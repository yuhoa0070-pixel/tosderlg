import type { Trip } from '../../types';

export default function TripSummaryHeader({ trip }: { trip?: Trip }) {
  return (
    <>
      <p className="eyebrow" id="itinEyebrow">
        Your itinerary
      </p>
      <h1 id="itineraryTitle">{trip ? trip.destination.split(',')[0] : ''}</h1>
      <p className="sub" id="itinDates">
        {trip ? trip.label : '—'}
      </p>
    </>
  );
}
