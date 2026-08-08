import type { ReactNode } from 'react';
import type { Trip, ViewName } from '../../types';
import { useAppContext } from '../../context/AppContext';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0]}` : parts[0]?.slice(0, 2) || '?').toUpperCase();
}

function formatDateRange(trip: Trip, km: boolean): string {
  if (!trip.startDate || !trip.endDate) return km ? 'មិនទាន់កំណត់ថ្ងៃ' : 'Dates not set';
  const start = new Date(`${trip.startDate}T00:00:00`);
  const end = new Date(`${trip.endDate}T00:00:00`);
  const sameYear = start.getFullYear() === end.getFullYear();
  const fmt = new Intl.DateTimeFormat(km ? 'km-KH' : 'en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
  if (start.getTime() === end.getTime()) return fmt.format(start);
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

export default function TripSummaryHeader({ trip }: { trip?: Trip }) {
  const { state, dispatch } = useAppContext();
  const km = state.language === 'km';
  const currentView = state.currentView;

  if (!trip) return null;

  const destName = trip.destination.split(',')[0].trim();
  const tripTitle = `${destName} ${km ? 'ដំណើរ' : 'trip'}`;
  const memberCount = trip.members?.length || 1;
  const datesFormatted = formatDateRange(trip, km);
  const subtitle = `${datesFormatted} · ${memberCount} ${km ? 'អ្នកធ្វើដំណើរ' : memberCount === 1 ? 'traveler' : 'travelers'}`;

  const tabs: Array<{ id: ViewName; label: string; icon: ReactNode }> = [
    {
      id: 'map',
      label: km ? 'គោលដៅ' : 'Destination',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
    },
    {
      id: 'itinerary',
      label: km ? 'កម្មវិធីដំណើរ' : 'Itinerary',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.8" y="4.5" width="16.4" height="16" rx="5" />
          <path d="M8.5 12.3l2.2 2.2 4.8-5.2" />
        </svg>
      ),
    },
    {
      id: 'budget',
      label: km ? 'ថវិកា' : 'Budget',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 3.5l1.8 1.2L8.6 3.5l1.8 1.2 1.8-1.2 1.8 1.2 1.8-1.2 1.8 1.2 1.8-1.2v17l-1.8-1.2-1.8 1.2-1.8-1.2-1.8 1.2-1.8-1.2-1.8 1.2-1.8-1.2V3.5Z" />
          <path d="M8.5 9h7M8.5 12.5h7M8.5 16h4" />
        </svg>
      ),
    },
  ];

  // "Itinerary" is a primary bottom-nav tab reached directly, so it needs no
  // back button. Every other view this header appears on (currently just
  // Budget) is a level deeper, reached from the tab bar below — show a way
  // back to Itinerary there, matching how the bottom nav also hides on it
  // (see App.tsx's PRIMARY_TAB_VIEWS).
  const showBackButton = currentView !== 'itinerary';

  return (
    <div className="trip-summary-header">
      {/* Top row: Back arrow + Trip Title & Subtitle */}
      <div className="tsh-top-row">
        {showBackButton && (
          <button
            type="button"
            className="tsh-back-btn"
            onClick={() => dispatch({ type: 'NAVIGATE', view: 'itinerary' })}
            aria-label={km ? 'ត្រឡប់ទៅកាលវិភាគ' : 'Back to itinerary'}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <div className="tsh-title-meta">
          <h1 className="tsh-title">{tripTitle}</h1>
          <p className="tsh-subtitle">{subtitle}</p>
        </div>

        {trip.members && trip.members.length > 0 && (
          <div className="tsh-member-stack" aria-label={km ? 'សមាជិកដំណើរ' : 'Trip members'}>
            {trip.members.slice(0, 4).map((member) => (
              <span className="tsh-member-avatar" key={member.id} title={member.name}>
                {member.photoUrl ? (
                  <img src={member.photoUrl} alt="" onError={(event) => event.currentTarget.remove()} />
                ) : null}
                <span aria-hidden="true">{initials(member.name)}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Segmented Tab Bar */}
      <div className="tsh-tab-bar" role="tablist">
        {tabs.map((tab) => {
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              className={`tsh-tab${isActive ? ' active' : ''}`}
              onClick={() => dispatch({ type: 'NAVIGATE', view: tab.id })}
            >
              <span className="tsh-tab-icon">{tab.icon}</span>
              <span className="tsh-tab-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
