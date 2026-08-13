import { useEffect, useRef } from 'react';
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
  tripDetails: undefined,
  documents: 'navProfile',
  tripTemplates: 'navHome',
  weather: undefined,
};

export default function BottomNav() {
  const { state, dispatch } = useAppContext();
  const activeTrip = state.trips.find((t) => t.id === state.currentTripId);
  const hasTrip = !!activeTrip;
  const active = NAV_MAP[state.currentView] ?? 'navHome';
  const km = state.language === 'km';

  const navRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef<Map<NavId, HTMLButtonElement>>(new Map());

  // A single pill element tracks the active tab's box via transform + width,
  // measured from the real DOM each time. Previously every .nav-item grew
  // its own background/width independently, so on tab change the old tab's
  // background was still fading out while the new one grew in — a visible
  // overlap that read as the pill "duplicating" — and each item's own
  // box-shadow (not clipped by that item's own overflow:hidden, since an
  // element's box-shadow is never clipped by its own overflow) could bleed
  // past its edge mid-transition. One shared, CSS-transitioned element
  // sidesteps both: there's only ever one shape, so retargeting its
  // transform/width on rapid taps just smoothly redirects the same
  // transition instead of stacking animations.
  useEffect(() => {
    const nav = navRef.current;
    const pill = pillRef.current;
    const node = itemRefs.current.get(active);
    if (!nav || !pill || !node) return;

    let attempts = 0;
    let cancelled = false;
    const position = () => {
      if (cancelled) return;
      if (nav.clientWidth < 20 && attempts < 15) {
        attempts += 1;
        requestAnimationFrame(position);
        return;
      }
      pill.style.transform = `translateX(${node.offsetLeft}px)`;
      pill.style.width = `${node.offsetWidth}px`;
      pill.style.height = `${node.offsetHeight}px`;
    };
    requestAnimationFrame(position);

    const observer = new ResizeObserver(() => position());
    observer.observe(nav);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [active]);

  const goItinerary = () => dispatch({ type: 'NAVIGATE', view: hasTrip ? 'itinerary' : 'home' });
  const goMap = () => dispatch({ type: 'NAVIGATE', view: hasTrip ? 'map' : 'home' });

  const setItemRef = (id: NavId) => (node: HTMLButtonElement | null) => {
    if (node) itemRefs.current.set(id, node);
    else itemRefs.current.delete(id);
  };

  return (
    <nav className="bottom-nav" ref={navRef}>
      <span className="nav-active-pill" ref={pillRef} aria-hidden="true" />
      <button
        type="button"
        ref={setItemRef('navHome')}
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
        ref={setItemRef('navItinerary')}
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
        ref={setItemRef('navMap')}
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
        ref={setItemRef('navProfile')}
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
