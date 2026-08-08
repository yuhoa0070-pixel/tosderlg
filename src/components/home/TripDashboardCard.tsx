import { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { getTelegramUser, telegramUserDisplayName } from '../../lib/telegram';
import { currentTripMember } from '../../lib/tripRoom';
import { getUpcomingTripAlert, plannedDaysProgress } from '../../lib/tripUtils';
import { budgetExpenseTotal, computeMemberBalances, computeSettlements, formatBudgetAmount, tripBudget } from '../../lib/budget';
import type { Trip, TripMember } from '../../types';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0]}` : parts[0]?.slice(0, 2) || '?').toUpperCase();
}

function timeGreeting(hour: number, km: boolean): string {
  if (km) return hour < 12 ? 'អរុណសួស្តី' : hour < 18 ? 'ទិវាសួស្តី' : 'សាយណ្ហសួស្តី';
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
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
  return start.getTime() === end.getTime() ? fmt.format(start) : `${fmt.format(start)} – ${fmt.format(end)}`;
}

export default function TripDashboardCard({ trip }: { trip: Trip }) {
  const { state, dispatch } = useAppContext();
  const km = state.language === 'km';
  const telegramUser = getTelegramUser();
  const displayName = (telegramUser ? telegramUserDisplayName(telegramUser) : '') || state.profileName || (km ? 'អ្នកធ្វើដំណើរ' : 'Traveler');
  const destName = trip.destination.split(',')[0].trim();
  const memberCount = trip.members?.length || 1;

  const alert = getUpcomingTripAlert(trip);
  const today = new Date();
  const startDate = trip.startDate ? new Date(`${trip.startDate}T00:00:00`) : null;
  const endDate = trip.endDate ? new Date(`${trip.endDate}T23:59:59`) : null;
  const isOngoing = !!startDate && !!endDate && today >= startDate && today <= endDate;

  const headline = alert
    ? (km ? `ដល់ ${destName} ក្នុងរយៈពេល ${alert.daysUntil} ថ្ងៃទៀត` : `${alert.daysUntil} day${alert.daysUntil === 1 ? '' : 's'} to ${destName}`)
    : isOngoing
      ? (km ? `កំពុងធ្វើដំណើរនៅ ${destName}` : `Enjoying ${destName} right now`)
      : (km ? `ដំណើរទៅ ${destName}` : `${destName} trip`);

  const itineraryProgress = plannedDaysProgress(trip.tripDays);

  const budget = useMemo(() => tripBudget(trip.budget), [trip.budget]);
  const spent = budgetExpenseTotal(budget);
  const budgetPercent = budget.targetAmount > 0 ? Math.min((spent / budget.targetAmount) * 100, 100) : 0;

  const current = useMemo(() => currentTripMember(state.profileName, state.profilePhoto), [state.profileName, state.profilePhoto]);
  const members = useMemo<TripMember[]>(() => {
    if (trip.members?.length) return trip.members;
    return [{ ...current, id: current.id, role: 'owner', joinedAt: Date.now() }];
  }, [trip.members, current]);
  const balances = useMemo(() => computeMemberBalances(budget, members), [budget, members]);
  const settlements = useMemo(() => computeSettlements(balances), [balances]);

  const unplannedDays = Math.max(itineraryProgress.total - itineraryProgress.planned, 0);

  const settlementText = useMemo(() => {
    if (!settlements.length) return null;
    const amounts = new Set(settlements.map((s) => s.amount));
    if (amounts.size === 1) {
      const [amount] = amounts;
      const names = settlements.map((s) => s.from.name);
      const joined = km ? names.join('និង ') : names.join(' and ');
      return km
        ? `${joined} ជំពាក់ ${formatBudgetAmount(amount, budget.currency)} ម្នាក់`
        : `${joined} owe${names.length === 1 ? 's' : ''} ${formatBudgetAmount(amount, budget.currency)} each`;
    }
    return km ? `មានការទូទាត់ ${settlements.length} ត្រូវធ្វើ` : `${settlements.length} settlements needed`;
  }, [settlements, km, budget.currency]);

  const attentionItems: Array<{ key: string; icon: React.ReactNode; text: string; view: 'itinerary' | 'budget' }> = [];
  if (unplannedDays > 0) {
    attentionItems.push({
      key: 'unplanned',
      view: 'itinerary',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.8" y="4.5" width="16.4" height="16" rx="5" />
          <path d="M8 12h8M8 16h5" />
        </svg>
      ),
      text: km
        ? `នៅសល់ ${unplannedDays} ថ្ងៃត្រូវរៀបចំផែនការ`
        : `${unplannedDays} day${unplannedDays === 1 ? '' : 's'} still need plans`,
    });
  }
  if (settlementText) {
    attentionItems.push({
      key: 'settlements',
      view: 'budget',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 19c0-3.4 2.3-5.5 5.5-5.5s5.5 2.1 5.5 5.5" />
          <circle cx="17" cy="9" r="2.4" />
          <path d="M15 19c0-2.3 1-4.3 3-5" />
        </svg>
      ),
      text: settlementText,
    });
  }

  return (
    <div className="trip-dash">
      <div className="trip-dash-greeting">
        <div>
          <p className="trip-dash-hello">{timeGreeting(today.getHours(), km)}, {displayName}</p>
          <h1 className="trip-dash-headline">{headline}</h1>
        </div>
        <span className="trip-dash-avatar" aria-hidden="true">{initials(displayName)}</span>
      </div>

      <div className="trip-dash-card">
        <div className="trip-dash-card-head">
          <strong>{destName} {km ? 'ដំណើរ' : 'trip'}</strong>
        </div>
        <p className="trip-dash-card-sub">{formatDateRange(trip, km)} · {memberCount} {km ? 'អ្នកធ្វើដំណើរ' : memberCount === 1 ? 'traveler' : 'travelers'}</p>

        <div className="trip-dash-meters">
          <div className="trip-dash-meter">
            <span>{km ? 'ថវិកា' : 'Budget'}</span>
            <div className="trip-dash-meter-track"><div style={{ width: `${budgetPercent}%` }} /></div>
          </div>
          <div className="trip-dash-meter">
            <span>{km ? 'កម្មវិធីដំណើរ' : 'Itinerary'}</span>
            <div className="trip-dash-meter-track"><div style={{ width: `${itineraryProgress.percent}%` }} /></div>
          </div>
        </div>
      </div>

      {attentionItems.length > 0 && (
        <div className="trip-dash-attention">
          <h2 className="trip-dash-section-title">{km ? 'ត្រូវការការយកចិត្តទុកដាក់' : 'Needs your attention'}</h2>
          {attentionItems.map((item) => (
            <button
              type="button"
              key={item.key}
              className="trip-dash-attention-row"
              onClick={() => dispatch({ type: 'NAVIGATE', view: item.view })}
            >
              <span className="trip-dash-attention-icon">{item.icon}</span>
              <span className="trip-dash-attention-text">{item.text}</span>
              <svg className="trip-dash-attention-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
