import { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { budgetExpenseTotal, formatBudgetAmount, tripBudget } from '../lib/budget';
import type { BudgetCategory, BudgetCurrency } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────

const CAT_COLORS: Record<BudgetCategory, string> = {
  transport: '#2d6a4f',
  stay: '#e07aa0',
  food: '#7b2d52',
  activity: '#1a7d8a',
  other: '#9e9e9e',
};

const CAT_LABELS: Record<BudgetCategory, { en: string; km: string }> = {
  transport: { en: 'Flights', km: 'ធ្វើដំណើរ' },
  stay: { en: 'Stay', km: 'ស្នាក់នៅ' },
  food: { en: 'Food', km: 'អាហារ' },
  activity: { en: 'Activities', km: 'សកម្មភាព' },
  other: { en: 'Other', km: 'ផ្សេងៗ' },
};

const CAT_ORDER: BudgetCategory[] = ['transport', 'stay', 'food', 'activity', 'other'];

// ─── Donut chart ──────────────────────────────────────────────────────────────

function DonutChart({ segments }: { segments: Array<{ cat: BudgetCategory; pct: number }> }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  let cumulativePct = 0;
  const active = segments.filter((s) => s.pct > 0.5);

  return (
    <svg width="88" height="88" viewBox="0 0 88 88" style={{ display: 'block', flexShrink: 0 }}>
      <circle cx="44" cy="44" r={r} fill="none" stroke="var(--card-hover)" strokeWidth="11" />
      {active.length === 0 ? null : active.map((seg) => {
        const segLen = (seg.pct / 100) * circ;
        const gap = circ - segLen;
        const rotateDeg = -90 + (cumulativePct / 100) * 360;
        cumulativePct += seg.pct;
        return (
          <circle
            key={seg.cat}
            cx="44" cy="44" r={r}
            fill="none"
            stroke={CAT_COLORS[seg.cat]}
            strokeWidth="11"
            strokeLinecap="butt"
            strokeDasharray={`${segLen - 2} ${gap + 2}`}
            style={{ transformOrigin: '44px 44px', transform: `rotate(${rotateDeg}deg)` }}
          />
        );
      })}
      <circle cx="44" cy="44" r="26" fill="var(--card)" />
    </svg>
  );
}

// ─── Budget Tracker data hook ─────────────────────────────────────────────────

type TrackerTab = 'all' | 'year';

interface TripRow {
  id: number;
  name: string;
  currency: BudgetCurrency;
  spent: number;
  target: number;
  over: boolean;
}

function useBudgetTracker(tab: TrackerTab) {
  const { state } = useAppContext();
  const thisYear = new Date().getFullYear();

  return useMemo(() => {
    const tripsWithBudget = state.trips.filter((trip) => trip.budget);
    const filtered = tripsWithBudget.filter((trip) => {
      if (tab === 'all') return true;
      const yr = trip.startDate ? new Date(trip.startDate).getFullYear() : null;
      return yr === thisYear;
    });

    const rows: TripRow[] = filtered.map((trip) => {
      const b = tripBudget(trip.budget);
      const spent = budgetExpenseTotal(b);
      return {
        id: trip.id,
        name: trip.destination.split(',')[0].trim(),
        currency: b.currency,
        spent,
        target: b.targetAmount,
        over: b.targetAmount > 0 && spent > b.targetAmount,
      };
    });

    const totalByC: Partial<Record<BudgetCurrency, number>> = {};
    const spentByC: Partial<Record<BudgetCurrency, number>> = {};
    for (const row of rows) {
      totalByC[row.currency] = (totalByC[row.currency] ?? 0) + row.target;
      spentByC[row.currency] = (spentByC[row.currency] ?? 0) + row.spent;
    }

    const usdTrips = filtered.filter((t) => tripBudget(t.budget).currency === 'USD');
    const catTotals: Partial<Record<BudgetCategory, number>> = {};
    let catGrandTotal = 0;
    for (const trip of usdTrips) {
      const b = tripBudget(trip.budget);
      for (const exp of b.expenses) {
        catTotals[exp.category] = (catTotals[exp.category] ?? 0) + exp.amount;
        catGrandTotal += exp.amount;
      }
    }

    const segments = CAT_ORDER.map((cat) => ({
      cat,
      pct: catGrandTotal > 0 ? Math.round(((catTotals[cat] ?? 0) / catGrandTotal) * 100) : 0,
    })).filter((s) => s.pct > 0);

    const tripCount = rows.length;
    const overBudgetCount = rows.filter((r) => r.over).length;
    const usdSpentTotal = spentByC['USD'] ?? 0;
    const usdTripCount = rows.filter((r) => r.currency === 'USD').length;
    const avgPerTrip = usdTripCount > 0 ? usdSpentTotal / usdTripCount : 0;

    return { rows, totalByC, spentByC, segments, catGrandTotal, tripCount, overBudgetCount, avgPerTrip };
  }, [state.trips, tab, thisYear]);
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function BudgetTrackerView() {
  const { state, dispatch } = useAppContext();
  const km = state.language === 'km';
  const [tab, setTab] = useState<TrackerTab>('all');
  const data = useBudgetTracker(tab);

  const hasData = data.tripCount > 0;
  const spentUSD = data.spentByC['USD'];
  const spentKHR = data.spentByC['KHR'];

  return (
    <section id="view-budget-tracker" className="active">
      <div className="topbar">
        <div className="icon-btn" onClick={() => dispatch({ type: 'NAVIGATE', view: 'profile' })}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 4 12l7 7" /><path d="M4.5 12h15" /></svg>
        </div>
        <div />
      </div>

      <h2 className="bt-heading">{km ? 'តាមដានថវិកា' : 'Budget tracker'}</h2>

      <div className="bt-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'all'}
          className={`bt-tab${tab === 'all' ? ' active' : ''}`}
          onClick={() => setTab('all')}
        >
          {km ? 'ដំណើរទាំងអស់' : 'All trips'}
        </button>
        <button
          role="tab"
          aria-selected={tab === 'year'}
          className={`bt-tab${tab === 'year' ? ' active' : ''}`}
          onClick={() => setTab('year')}
        >
          {km ? 'ឆ្នាំនេះ' : 'This year'}
        </button>
      </div>

      {!hasData ? (
        <div className="bt-empty">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3v18h18" /><path d="M7 16l4-4 4 4 4-5" /></svg>
          <p>{km ? 'មិនទាន់មានថវិកាដំណើរ' : 'No trip budgets yet'}</p>
        </div>
      ) : (
        <>
          <div className="bt-total-block">
            <p className="bt-total-label">{km ? 'ចំណាយសរុបក្នុងដំណើរ' : 'Total spent across trips'}</p>
            {spentUSD !== undefined && spentUSD > 0 && (
              <strong className="bt-total-amount">{formatBudgetAmount(spentUSD, 'USD')}</strong>
            )}
            {spentKHR !== undefined && spentKHR > 0 && (
              <strong className="bt-total-amount">{formatBudgetAmount(spentKHR, 'KHR')}</strong>
            )}
            {!spentUSD && !spentKHR && <strong className="bt-total-amount">—</strong>}
          </div>

          <div className="bt-stats-row">
            <div className="bt-stat">
              <span className="bt-stat-label">{km ? 'ដំណើរ' : 'Trips'}</span>
              <strong className="bt-stat-value">{data.tripCount}</strong>
            </div>
            {spentUSD !== undefined && data.avgPerTrip > 0 && (
              <div className="bt-stat">
                <span className="bt-stat-label">{km ? 'មធ្យម/ដំណើរ' : 'Avg / trip'}</span>
                <strong className="bt-stat-value">{formatBudgetAmount(Math.round(data.avgPerTrip), 'USD')}</strong>
              </div>
            )}
            <div className="bt-stat">
              <span className="bt-stat-label">{km ? 'លើសថវិកា' : 'Over budget'}</span>
              <strong className={`bt-stat-value${data.overBudgetCount > 0 ? ' over' : ''}`}>
                {data.overBudgetCount} {km ? 'ដំណើរ' : data.overBudgetCount === 1 ? 'trip' : 'trips'}
              </strong>
            </div>
          </div>

          {data.segments.length > 0 && (
            <div className="bt-cat-block">
              <h3 className="bt-sub-heading">{km ? 'ចំណាយតាមប្រភេទ' : 'Spending by category'}</h3>
              <div className="bt-cat-body">
                <DonutChart segments={data.segments} />
                <div className="bt-cat-legend">
                  {data.segments.map((seg) => (
                    <div className="bt-cat-legend-row" key={seg.cat}>
                      <span className="bt-cat-dot" style={{ background: CAT_COLORS[seg.cat] }} />
                      <span className="bt-cat-name">{km ? CAT_LABELS[seg.cat].km : CAT_LABELS[seg.cat].en}</span>
                      <span className="bt-cat-pct">{seg.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="bt-trips-block">
            <h3 className="bt-sub-heading">{km ? 'តាមដំណើរ' : 'By trip'}</h3>
            <div className="bt-trips-list">
              {data.rows.map((row) => {
                const pct = row.target > 0 ? Math.min((row.spent / row.target) * 100, 100) : 0;
                return (
                  <div
                    className="bt-trip-row"
                    key={row.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      dispatch({ type: 'LOAD_TRIP', tripId: row.id });
                      dispatch({ type: 'NAVIGATE', view: 'budget' });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        dispatch({ type: 'LOAD_TRIP', tripId: row.id });
                        dispatch({ type: 'NAVIGATE', view: 'budget' });
                      }
                    }}
                  >
                    <span className="bt-trip-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24"><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.2-2h6.6l1.2 2h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z" /><circle cx="12" cy="13" r="3.5" /></svg>
                    </span>
                    <div className="bt-trip-info">
                      <span className="bt-trip-name">{row.name}</span>
                      <span className="bt-trip-sub">
                        {formatBudgetAmount(row.spent, row.currency)} {km ? 'នៃ' : 'of'} {formatBudgetAmount(row.target, row.currency)}
                      </span>
                    </div>
                    <div className="bt-mini-bar">
                      <div className={`bt-mini-fill${row.over ? ' over' : ''}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
