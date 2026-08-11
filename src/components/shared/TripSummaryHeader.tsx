import type { ReactNode } from 'react';
import type { Trip, ViewName } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { formatTripDateRange } from '../../lib/tripUtils';

export default function TripSummaryHeader({ trip }: { trip?: Trip }) {
  const { state, dispatch } = useAppContext();
  const km = state.language === 'km';
  const currentView = state.currentView;

  if (!trip) return null;

  const destName = trip.destination.split(',')[0].trim();
  const tripTitle = `${destName} ${km ? 'ដំណើរ' : 'trip'}`;
  const memberCount = trip.members?.length || 1;
  const datesFormatted = formatTripDateRange(trip, km);
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
          <path d="M3 7a2 2 0 0 1 2-2h11v4H5a2 2 0 0 1-2-2Z" />
          <path d="M3 7v10a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-3" />
          <path d="M15 13h4a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-4a2 2 0 0 1 0-4Z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="trip-summary-header">
      {/* Top row: Trip Title & Subtitle — Destination/Itinerary/Budget are peer
          tabs below, not a push stack, so there's no "back" to go to. */}
      <div className="tsh-top-row">
        <div className="tsh-title-meta">
          <h1 className="tsh-title">{tripTitle}</h1>
          {trip.readOnly ? (
            <p className="tsh-subtitle">{subtitle}</p>
          ) : (
            <button
              type="button"
              className="trip-date-edit-trigger"
              onClick={() => dispatch({ type: 'OPEN_MODAL', modal: 'editTripDates' })}
              aria-label={km ? 'កែប្រែកាលបរិច្ឆេទដំណើរ' : 'Edit trip dates'}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M16 3v4M8 3v4M3 10h18M8 14h3M8 17h6" />
              </svg>
              <span>{subtitle}</span>
              <svg className="trip-date-edit-pencil" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </button>
          )}
        </div>
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
