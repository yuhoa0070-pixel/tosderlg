import { useAppContext } from '../context/AppContext';
import { useActiveTrip } from '../hooks/useActiveTrip';

export default function RecapView() {
  const { dispatch } = useAppContext();
  const trip = useActiveTrip();

  const totalStops = trip ? trip.tripDays.reduce((sum, d) => sum + d.stops.length, 0) : 0;
  const allPhotos = trip ? Object.values(trip.photos || {}).flat() : [];
  const daysCount = trip ? trip.tripDays.length : 0;
  const highlights = allPhotos.slice(-12).reverse();

  return (
    <section id="view-recap" className="active">
      <div className="topbar">
        <div className="icon-btn" onClick={() => dispatch({ type: 'NAVIGATE', view: 'itinerary' })}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 4 12l7 7" /><path d="M4.5 12h15" /></svg>
        </div>
        <div />
      </div>
      <p className="eyebrow">Trip recap</p>
      <h1 id="recapTitle">{trip ? trip.destination.split(',')[0] : ''}</h1>
      <p className="sub" id="recapDates">
        {trip ? trip.label : '—'}
      </p>

      <div className="recap-stats">
        <div className="recap-stat">
          <div className="recap-stat-num" id="recapDaysNum">
            {daysCount}
          </div>
          <div className="recap-stat-label">days</div>
        </div>
        <div className="recap-stat">
          <div className="recap-stat-num" id="recapStopsNum">
            {totalStops}
          </div>
          <div className="recap-stat-label">stops</div>
        </div>
        <div className="recap-stat">
          <div className="recap-stat-num" id="recapPhotosNum">
            {allPhotos.length}
          </div>
          <div className="recap-stat-label">photos</div>
        </div>
      </div>

      <p className="eyebrow" style={{ marginTop: 8 }}>
        Highlights
      </p>
      {highlights.length ? (
        <div className="hero-gallery" id="recapPhotoStrip" style={{ marginBottom: 20 }}>
          {highlights.map((p, i) => (
            <div
              key={i}
              className="memory-thumb"
              style={{ flexBasis: 130, height: 150, backgroundImage: `url('${p.src}')` }}
            />
          ))}
        </div>
      ) : (
        <div
          id="recapPhotoEmpty"
          style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0 24px' }}
        >
          No photos saved for this trip yet.
        </div>
      )}

      <button className="btn btn-ghost" id="recapToItineraryBtn" onClick={() => dispatch({ type: 'NAVIGATE', view: 'itinerary' })}>
        View full itinerary
      </button>
    </section>
  );
}
