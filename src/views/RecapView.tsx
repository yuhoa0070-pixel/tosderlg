import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useActiveTrip } from '../hooks/useActiveTrip';
import { formatTripDateRange } from '../lib/tripUtils';
import { tripHighlights } from '../lib/tripRecap';
import { budgetExpenseTotal, formatBudgetAmount, tripBudget } from '../lib/budget';
import { getTelegramWebApp } from '../lib/telegram';
import { copyText } from '../lib/clipboard';
import PhotoPlaceholderIcon from '../components/shared/PhotoPlaceholderIcon';

export default function RecapView() {
  const { state, dispatch } = useAppContext();
  const trip = useActiveTrip();
  const km = state.language === 'km';
  const [shareStatus, setShareStatus] = useState('');

  const totalStops = trip ? trip.tripDays.reduce((sum, d) => sum + d.stops.length, 0) : 0;
  const allPhotos = trip ? Object.values(trip.photos).flat() : [];
  const daysCount = trip ? trip.tripDays.length : 0;
  const highlights = trip ? tripHighlights(trip, km) : [];
  const budget = trip ? tripBudget(trip.budget) : null;
  const spent = budget ? budgetExpenseTotal(budget) : 0;
  const destName = trip ? trip.destination.split(',')[0] : '';

  const rowPhotos = allPhotos.slice(0, 2);

  async function shareTripStory() {
    if (!trip) return;
    const dateRange = formatTripDateRange(trip, km);
    const spentText = budget ? formatBudgetAmount(spent, budget.currency) : '—';
    const summary = km
      ? `រឿងដំណើររបស់ខ្ញុំ — ${destName}, ${daysCount} ថ្ងៃ (${dateRange})\n📸 ${allPhotos.length} រូបភាព · 📍 ${totalStops} ទីកន្លែង · 💸 ${spentText}`
      : `My trip story — ${destName}, ${daysCount} day${daysCount === 1 ? '' : 's'} (${dateRange})\n📸 ${allPhotos.length} photos · 📍 ${totalStops} places · 💸 ${spentText} spent`;

    setShareStatus('');
    try {
      const webApp = getTelegramWebApp();
      if (webApp?.openTelegramLink) {
        webApp.openTelegramLink(`https://t.me/share/url?url=&text=${encodeURIComponent(summary)}`);
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: `${destName} trip story`, text: summary });
        return;
      }
      await copyText(summary);
      setShareStatus(km ? 'បានចម្លងរឿងដំណើររបស់អ្នក' : 'Trip story copied to clipboard');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setShareStatus(km ? 'មិនអាចចែករំលែកបានទេ' : 'Could not share right now');
    }
  }

  return (
    <section id="view-recap" className="active recap-story">
      <div className="recap-story-topbar">
        <button
          type="button"
          className="icon-btn"
          onClick={() => dispatch({ type: 'NAVIGATE', view: 'itinerary' })}
          aria-label={km ? 'បិទ' : 'Close'}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
        <button type="button" className="icon-btn" onClick={() => void shareTripStory()} aria-label={km ? 'ចែករំលែក' : 'Share'}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="18" cy="5" r="2.4" /><circle cx="6" cy="12" r="2.4" /><circle cx="18" cy="19" r="2.4" />
            <path d="M8.1 10.7 15.9 6.3M8.1 13.3l7.8 4.4" />
          </svg>
        </button>
      </div>

      <p className="eyebrow recap-story-eyebrow">{km ? 'រឿងដំណើររបស់អ្នក' : 'Your trip story'}</p>
      <h1 className="recap-story-title">
        {km ? `${destName}, ${daysCount} ថ្ងៃ` : `${destName}, ${daysCount} day${daysCount === 1 ? '' : 's'}`}
      </h1>
      {trip && <p className="sub recap-story-dates">{formatTripDateRange(trip, km)}</p>}

      <div className="recap-story-photo-row">
        {[0, 1].map((i) => (
          <div className="recap-story-photo" key={i}>
            {rowPhotos[i] ? <img src={rowPhotos[i].src} alt="" /> : <PhotoPlaceholderIcon className="recap-photo-placeholder-icon" />}
          </div>
        ))}
      </div>

      <div className="recap-stats">
        <div className="recap-stat">
          <div className="recap-stat-num">{allPhotos.length}</div>
          <div className="recap-stat-label">{km ? 'រូបភាព' : 'Photos'}</div>
        </div>
        <div className="recap-stat">
          <div className="recap-stat-num">{totalStops}</div>
          <div className="recap-stat-label">{km ? 'ទីកន្លែងបានទស្សនា' : 'Places visited'}</div>
        </div>
        <div className="recap-stat">
          <div className="recap-stat-num">{budget ? formatBudgetAmount(spent, budget.currency) : '—'}</div>
          <div className="recap-stat-label">{km ? 'ចំណាយ' : 'Spent'}</div>
        </div>
      </div>

      {highlights.length > 0 && (
        <>
          <h2 style={{ margin: '4px 0 10px' }}>{km ? 'ចំណុចសំខាន់ៗ' : 'Highlights'}</h2>
          <div className="recap-highlights">
            {highlights.map((highlight) => (
              <div className="recap-highlight-row" key={highlight.key}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3.5l2.5 5.5 6 .7-4.5 4.2 1.2 6-5.2-3-5.2 3 1.2-6-4.5-4.2 6-.7Z" />
                </svg>
                <span>{highlight.text}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <button type="button" className="recap-share-btn" onClick={() => void shareTripStory()}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M8 11l4 4 4-4M5 19h14" /></svg>
        {km ? 'ចែករំលែករឿងដំណើររបស់អ្នក' : 'Share your trip story'}
      </button>
      {shareStatus && <p className="status" role="status">{shareStatus}</p>}
    </section>
  );
}
