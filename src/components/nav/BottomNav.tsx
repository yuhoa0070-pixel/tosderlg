export type NavId = 'navHome' | 'navItinerary' | 'navMap' | 'navProfile';

interface BottomNavProps {
  active: NavId;
  disabled: boolean;
  onHome: () => void;
  onItinerary: () => void;
  onMap: () => void;
  onProfile: () => void;
}

export default function BottomNav({ active, disabled, onHome, onItinerary, onMap, onProfile }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      <button className={`nav-item${active === 'navHome' ? ' active' : ''}`} onClick={onHome}>
        <svg className="nav-icon" viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3.5 11.5L12 4l8.5 7.5" />
          <path d="M5.5 10.5V18.5a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5V10.5" />
          <circle cx="12" cy="15.5" r="1.6" fill="currentColor" stroke="none" />
        </svg>
        <span>Home</span>
      </button>
      <button className={`nav-item${active === 'navItinerary' ? ' active' : ''}`} disabled={disabled} onClick={onItinerary}>
        <svg className="nav-icon" viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.8" y="4.5" width="16.4" height="16" rx="5" />
          <path d="M8.5 12.3l2.2 2.2 4.8-5.2" />
        </svg>
        <span>Itinerary</span>
      </button>
      <button className={`nav-item${active === 'navMap' ? ' active' : ''}`} disabled={disabled} onClick={onMap}>
        <svg className="nav-icon" viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21s7-6.3 7-11.8a7 7 0 1 0-14 0C5 14.7 12 21 12 21z" />
          <circle cx="12" cy="9.2" r="2.6" fill="currentColor" stroke="none" />
        </svg>
        <span>Map</span>
      </button>
      <button className={`nav-item${active === 'navProfile' ? ' active' : ''}`} onClick={onProfile}>
        <svg className="nav-icon" viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8.3" r="3.5" fill="currentColor" stroke="none" />
          <path d="M4.8 20c0-4.1 3.2-6.7 7.2-6.7s7.2 2.6 7.2 6.7" />
        </svg>
        <span>Profile</span>
      </button>
    </nav>
  );
}
