import { useAppContext } from '../../context/AppContext';
import { budgetCommitmentTotal, budgetExpenseTotal, formatBudgetAmount, tripBudget } from '../../lib/budget';
import type { Trip } from '../../types';

export default function TripBudgetPreview({ trip }: { trip: Trip }) {
  const { state, dispatch } = useAppContext();
  const budget = tripBudget(trip.budget);
  const planned = budgetExpenseTotal(budget);
  const locked = budgetCommitmentTotal(budget);
  const km = state.language === 'km';

  return (
    <button
      type="button"
      className="budget-preview"
      onClick={() => dispatch({ type: 'NAVIGATE', view: 'budget' })}
      aria-label={km ? 'បើកថវិកាដំណើរ' : 'Open trip budget'}
    >
      <span className="budget-preview-mark" aria-hidden="true">
        {budget.currency === 'USD' ? '$' : '៛'}
      </span>
      <span className="budget-preview-data">
        <span className="budget-preview-stat">
          <small>{km ? 'បានកក់' : 'Reserved'}</small>
          <strong>{formatBudgetAmount(locked, budget.currency)}</strong>
        </span>
        <span className="budget-preview-divider" aria-hidden="true" />
        <span className="budget-preview-stat">
          <small>{km ? 'បានគ្រោង' : 'Planned'}</small>
          <strong>{formatBudgetAmount(planned, budget.currency)}</strong>
        </span>
      </span>
      <span className="budget-preview-arrow" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7" /></svg>
      </span>
    </button>
  );
}
