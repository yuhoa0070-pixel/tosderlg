import { useAppContext } from '../../context/AppContext';
import type { ViewName } from '../../types';

export type NavId = 'navHome' | 'navItinerary' | 'navMap' | 'navProfile';

const NAV_MAP: Record<ViewName, NavId | undefined> = {
  home: 'navHome',
  itinerary: 'navItinerary',
  budget: 'navItinerary',
  customize: 'navItinerary',
  map: 'navMap',
  memory: 'navItinerary',
  'all-photos': undefined,
  recap: undefined,
  mytrips: undefined,
  profile: 'navProfile',
  budgetTracker: 'navProfile',
};

export default function BottomNav() {
  const { state, dispatch } = useAppContext();
  const activeTrip = state.trips.find((t) => t.id === state.currentTripId);
  const hasTrip = !!activeTrip;
  const active = NAV_MAP[state.currentView] ?? 'navHome';
  const km = state.language === 'km';

  const goItinerary = () => dispatch({ type: 'NAVIGATE', view: hasTrip ? 'itinerary' : 'home' });
  const goMap = () => dispatch({ type: 'NAVIGATE', view: hasTrip ? 'map' : 'home' });

  return (
    <nav className="bottom-nav">
      <button
        type="button"
        className={`nav-item${active === 'navHome' ? ' active' : ''}`}
        aria-label={km ? 'ទំព័រដើម' : 'Home'}
        aria-current={active === 'navHome' ? 'page' : undefined}
        onClick={() => dispatch({ type: 'NAVIGATE', view: 'home' })}
      >
        <svg className="nav-icon" viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3.5 11.5L12 4l8.5 7.5" />
          <path d="M5.5 10.5V18.5a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5V10.5" />
          <circle cx="12" cy="15.5" r="1.6" fill="currentColor" stroke="none" />
        </svg>
        <span>{km ? 'ទំព័រដើម' : 'Home'}</span>
      </button>
      <button
        type="button"
        className={`nav-item${active === 'navItinerary' ? ' active' : ''}`}
        aria-label={km ? 'កាលវិភាគ' : 'Itinerary'}
        aria-current={active === 'navItinerary' ? 'page' : undefined}
        disabled={!hasTrip}
        onClick={goItinerary}
      >
        <svg className="nav-icon" viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.8" y="4.5" width="16.4" height="16" rx="5" />
          <path d="M8.5 12.3l2.2 2.2 4.8-5.2" />
        </svg>
        <span>{km ? 'កាលវិភាគ' : 'Itinerary'}</span>
      </button>
      <button
        type="button"
        className={`nav-item${active === 'navMap' ? ' active' : ''}`}
        aria-label={km ? 'ផែនទី' : 'Map'}
        aria-current={active === 'navMap' ? 'page' : undefined}
        disabled={!hasTrip}
        onClick={goMap}
      >
        <svg className="nav-icon" viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21s6.8-6.1 6.8-11.6a6.8 6.8 0 1 0-13.6 0C5.2 14.9 12 21 12 21z" />
          <circle cx="12" cy="9.3" r="2.4" />
        </svg>
        <span>{km ? 'ផែនទី' : 'Map'}</span>
      </button>
      <button
        type="button"
        className={`nav-item${active === 'navProfile' ? ' active' : ''}`}
        aria-label={km ? 'គណនី' : 'Profile'}
        aria-current={active === 'navProfile' ? 'page' : undefined}
        onClick={() => dispatch({ type: 'NAVIGATE', view: 'profile' })}
      >
        <svg className="nav-icon" viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8.3" r="3.5" fill="currentColor" stroke="none" />
          <path d="M4.8 20c0-4.1 3.2-6.7 7.2-6.7s7.2 2.6 7.2 6.7" />
        </svg>
        <span>{km ? 'គណនី' : 'Profile'}</span>
      </button>
    </nav>
  );
}
