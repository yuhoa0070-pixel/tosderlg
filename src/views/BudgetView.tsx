import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useAppContext } from '../context/AppContext';
import { useActiveTrip } from '../hooks/useActiveTrip';
import TripSummaryHeader from '../components/shared/TripSummaryHeader';

import {
  amountToMinor,
  budgetExpenseTotal,
  computeMemberBalances,
  computeSettlements,
  formatBudgetAmount,
  minorToInput,
  tripBudget,
  type MemberBalance,
  type Settlement,
} from '../lib/budget';
import { currentTripMember } from '../lib/tripRoom';
import type { BudgetCategory, BudgetCurrency, BudgetExpense, TripBudget, TripMember } from '../types';

// ─── Category meta ────────────────────────────────────────────────────────────

const CATEGORY_META: Record<BudgetCategory, { en: string; km: string; path: string }> = {
  stay:      { en: 'Stay',      km: 'កន្លែងស្នាក់នៅ', path: 'M5 19v-8h14v8M7 11V7h4a3 3 0 0 1 3 3v1M3 19h18M5 15h14' },
  transport: { en: 'Flights',   km: 'ការធ្វើដំណើរ',   path: 'M5 16h14M7 16l1-7h8l1 7M6 9l2-3h8l2 3M7 19h.01M17 19h.01' },
  food:      { en: 'Food',      km: 'អាហារ',           path: 'M7 4v7M4 4v4a3 3 0 0 0 6 0V4M7 11v9M16 4v16M16 4c3 2 4 5 4 8h-4' },
  activity:  { en: 'Activities',km: 'សកម្មភាព',        path: 'M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.7-5.3 2.7 1-5.8-4.2-4.1 5.9-.9z' },
  other:     { en: 'Other',     km: 'ផ្សេងៗ',           path: 'M5 12h.01M12 12h.01M19 12h.01' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0]}` : parts[0]?.slice(0, 2) || '?').toUpperCase();
}

function makeExpenseId(): string {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(12)), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// ─── Who Owes What section ────────────────────────────────────────────────────

function WhoOwesSection({
  balances,
  settlements,
  currency,
  km,
}: {
  balances: MemberBalance[];
  settlements: Settlement[];
  currency: BudgetCurrency;
  km: boolean;
}) {
  if (!balances.length) return null;
  return (
    <div className="bv-who-section">
      <div className="bv-who-header">
        <h2 className="bv-section-title">{km ? 'អ្នកណាជំពាក់អ្វី' : 'Who owes what'}</h2>
        {settlements.length > 0 && (
          <span className="bv-settle-label">{km ? 'ទូទាត់' : 'Settle up'}</span>
        )}
      </div>

      <div className="bv-who-list">
        {balances.map(({ member, paid, net }) => {
          const isCurrentUser = false; // future: detect self
          const label = isCurrentUser ? `${member.name} (you)` : member.name;
          return (
            <div className="bv-who-row" key={member.id}>
              <span className="bv-who-avatar">
                <span>{initials(member.name)}</span>
                {member.photoUrl && <img src={member.photoUrl} alt="" onError={(e) => e.currentTarget.remove()} />}
              </span>
              <span className="bv-who-name">{label}</span>
              {net >= 0 ? (
                <span className="bv-who-amount paid">
                  {km ? 'បានបង់' : 'Paid'} {formatBudgetAmount(paid, currency)}
                </span>
              ) : (
                <span className="bv-who-amount owes">
                  {km ? 'ជំពាក់' : 'Owes'} {formatBudgetAmount(Math.abs(net), currency)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {settlements.length > 0 && (
        <div className="bv-settlements">
          {settlements.map((s, i) => (
            <div className="bv-settlement-row" key={i}>
              <span className="bv-settlement-avatar"><span>{initials(s.from.name)}</span></span>
              <span className="bv-settlement-copy">
                <strong>{s.from.name}</strong>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                <strong>{s.to.name}</strong>
              </span>
              <strong className="bv-settlement-amount">{formatBudgetAmount(s.amount, currency)}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function BudgetView() {
  const { state, dispatch } = useAppContext();
  const activeTrip = useActiveTrip();
  const km = state.language === 'km';
  const budget = useMemo(() => tripBudget(activeTrip?.budget), [activeTrip?.budget]);
  const current = useMemo(
    () => currentTripMember(state.profileName, state.profilePhoto),
    [state.profileName, state.profilePhoto],
  );

  const ownerMemberId = activeTrip?.members?.find((m) => m.role === 'owner')?.id;
  const currentMemberId = activeTrip?.roomMemberId || (!activeTrip?.readOnly ? ownerMemberId : undefined) || current.id;
  const members = useMemo<TripMember[]>(() => {
    if (activeTrip?.members?.length) return activeTrip.members;
    return [{ ...current, id: currentMemberId, role: 'owner', joinedAt: Date.now() }];
  }, [activeTrip?.members, current, currentMemberId]);

  const canManage = !!activeTrip && !activeTrip.readOnly;

  const planned = budgetExpenseTotal(budget);
  const remaining = Math.max(budget.targetAmount - planned, 0);
  const pct = budget.targetAmount > 0 ? Math.min((planned / budget.targetAmount) * 100, 100) : 0;
  const over = budget.targetAmount > 0 && planned > budget.targetAmount;

  // Category totals
  const categoryTotals = useMemo(() => {
    const map: Partial<Record<BudgetCategory, number>> = {};
    for (const exp of budget.expenses) {
      map[exp.category] = (map[exp.category] ?? 0) + exp.amount;
    }
    const totals = (Object.keys(CATEGORY_META) as BudgetCategory[])
      .map((cat) => ({ cat, total: map[cat] ?? 0 }))
      .filter((e) => e.total > 0);
    const max = Math.max(...totals.map((e) => e.total), 1);
    return totals.map((e) => ({ ...e, pct: Math.max((e.total / max) * 100, 6) }));
  }, [budget.expenses]);

  const hasBudgetData = budget.targetAmount > 0 || budget.expenses.length > 0 || budget.commitments.some((c) => c.amount > 0);

  const [targetInput, setTargetInput] = useState(() => minorToInput(budget.targetAmount, budget.currency));
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<BudgetCategory>('stay');
  const [expenseMemberId, setExpenseMemberId] = useState(members[0]?.id ?? '');
  const [status, setStatus] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const addFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setTargetInput(minorToInput(budget.targetAmount, budget.currency)); }, [budget.currency, budget.targetAmount]);
  useEffect(() => {
    if (!members.some((m) => m.id === expenseMemberId)) setExpenseMemberId(members[0]?.id ?? '');
  }, [expenseMemberId, members]);
  useEffect(() => {
    if (!status) return;
    const t = window.setTimeout(() => setStatus(''), 2600);
    return () => window.clearTimeout(t);
  }, [status]);

  if (!activeTrip) return null;

  const applyBudget = (nextBudget: TripBudget, updatedAt?: number) => {
    dispatch({ type: 'SET_TRIP_BUDGET', tripId: activeTrip.id, budget: nextBudget, updatedAt });
  };

  const saveTarget = (event: FormEvent) => {
    event.preventDefault();
    const amount = amountToMinor(targetInput, budget.currency);
    if (amount == null) return;
    applyBudget({ ...budget, targetAmount: amount });
    setTargetInput(minorToInput(amount, budget.currency));
    setStatus(km ? 'បានរក្សាទុកថវិកា' : 'Budget saved');
  };

  const changeCurrency = (currency: BudgetCurrency) => {
    if (hasBudgetData || currency === budget.currency) return;
    applyBudget({ ...budget, currency });
    setTargetInput('');
  };

  const addExpense = (event: FormEvent) => {
    event.preventDefault();
    const amount = amountToMinor(expenseAmount, budget.currency);
    const title = expenseTitle.trim();
    if (!canManage || !title || amount == null || amount === 0) return;
    const expense: BudgetExpense = {
      id: makeExpenseId(),
      title: title.slice(0, 60),
      amount,
      category: expenseCategory,
      assignedToMemberId: expenseMemberId || undefined,
      createdAt: Date.now(),
    };
    applyBudget({ ...budget, expenses: [...budget.expenses, expense] });
    setExpenseTitle('');
    setExpenseAmount('');
    setStatus(km ? 'បានបន្ថែមចំណាយ' : 'Expense added');
  };

  const removeExpense = (expenseId: string) => {
    if (!canManage) return;
    applyBudget({ ...budget, expenses: budget.expenses.filter((e) => e.id !== expenseId) });
  };

  function openAddForm() {
    setShowAddForm(true);
    window.setTimeout(() => {
      addFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }

  const balances = computeMemberBalances(budget, members);
  const settlements = computeSettlements(balances);

  return (
    <section id="view-budget" className="active budget-view bv-redesign">
      <TripSummaryHeader trip={activeTrip} />

      {/* ── Top summary hero ──────────────────────────────────── */}
      <div className="bv-hero">
        <div className="bv-hero-row">
          <div className="bv-hero-col">
            <p className="bv-hero-label">{km ? 'ថវិកាដំណើរសរុប' : 'Total trip budget'}</p>
            <strong className="bv-hero-amount">{formatBudgetAmount(budget.targetAmount, budget.currency)}</strong>
          </div>
          <div className="bv-hero-col right">
            <p className="bv-hero-label">{km ? 'បានចំណាយ' : 'Spent so far'}</p>
            <strong className="bv-hero-amount spent">{formatBudgetAmount(planned, budget.currency)}</strong>
          </div>
        </div>
        {/* Progress bar */}
        <div className="bv-progress-track" aria-label="Budget progress">
          <div className={`bv-progress-fill${over ? ' over' : ''}`} style={{ width: `${pct}%` }} />
        </div>
        <p className="bv-progress-meta">
          {budget.targetAmount > 0 ? (
            <>{Math.round(pct)}% {km ? 'បានប្រើ' : 'used'} · {formatBudgetAmount(remaining, budget.currency)} {km ? 'នៅសល់' : 'remaining'}</>
          ) : (
            <>{km ? 'មិនទាន់កំណត់ថវិកា' : 'No target set yet'}</>
          )}
        </p>
      </div>

      {/* ── Set the target ────────────────────────────────────── */}
      {canManage && (
        <form className="budget-settings" onSubmit={saveTarget}>
          <div className="budget-section-heading">
            <div className="budget-section-heading-main">
              <span className="budget-section-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r=".6" fill="currentColor" /></svg>
              </span>
              <div><h2>{km ? 'កំណត់ថវិកា' : 'Set the target'}</h2><p>{km ? 'ម្ចាស់ដំណើរអាចកែប្រែបាន។' : 'Only the trip owner can change this.'}</p></div>
            </div>
          </div>
          <div className="budget-target-row">
            <label className="budget-money-input">
              <span>{budget.currency === 'USD' ? '$' : '៛'}</span>
              <input
                type="text" inputMode="decimal" value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                placeholder={budget.currency === 'USD' ? '500.00' : '2,000,000'}
                aria-label={km ? 'ថវិកាគោលដៅ' : 'Budget target'}
              />
            </label>
            <button type="submit" className="budget-save-button">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
              {km ? 'រក្សាទុក' : 'Save'}
            </button>
          </div>
          <div className="budget-currency-switch" aria-label={km ? 'រូបិយប័ណ្ណ' : 'Currency'}>
            {(['USD', 'KHR'] as BudgetCurrency[]).map((currency) => (
              <button type="button" key={currency} className={budget.currency === currency ? 'active' : ''}
                disabled={hasBudgetData && budget.currency !== currency}
                onClick={() => changeCurrency(currency)}>
                {currency}
              </button>
            ))}
          </div>
        </form>
      )}

      {/* ── Split by category ─────────────────────────────────── */}
      {categoryTotals.length > 0 && (
        <div className="bv-cat-section">
          <h2 className="bv-section-title">{km ? 'បំបែកតាមប្រភេទ' : 'Split by category'}</h2>
          <div className="bv-cat-list">
            {categoryTotals.map(({ cat, total, pct }) => {
              const meta = CATEGORY_META[cat];
              return (
                <div className="bv-cat-row" key={cat}>
                  <span className="bv-cat-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d={meta.path} /></svg>
                  </span>
                  <span className="bv-cat-name">{km ? meta.km : meta.en}</span>
                  <span className="bv-cat-bar"><span style={{ width: `${pct}%` }} /></span>
                  <span className="bv-cat-amount">{formatBudgetAmount(total, budget.currency)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Who owes what ─────────────────────────────────────── */}
      <WhoOwesSection balances={balances} settlements={settlements} currency={budget.currency} km={km} />

      {/* ── Add an expense trigger / form (expandable) ────────── */}
      {canManage && (
        <div ref={addFormRef} className={`bv-add-form-wrap${showAddForm ? ' open' : ''}`}>
          {!showAddForm && (
            <button type="button" className="bv-add-trigger" onClick={openAddForm}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
              {km ? 'បន្ថែមចំណាយ' : 'Add an expense'}
            </button>
          )}
          {showAddForm && (
            <form className="budget-section budget-expense-form" onSubmit={(e) => { addExpense(e); setShowAddForm(false); }}>
              <div className="budget-section-heading">
                <div className="budget-section-heading-main">
                  <span className="budget-section-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
                  </span>
                  <div><h2>{km ? 'បន្ថែមចំណាយ' : 'Add an expense'}</h2><p>{km ? 'ចាត់ចែងការចំណាយទៅសមាជិកម្នាក់។' : 'Assign each planned cost to a member.'}</p></div>
                </div>
              </div>
              <input type="text" value={expenseTitle} onChange={(e) => setExpenseTitle(e.target.value)}
                placeholder={km ? 'ឧ. សណ្ឋាគារ' : 'e.g. Hotel booking'} maxLength={60} autoFocus />
              <div className="budget-expense-fields">
                <label className="budget-money-input">
                  <span>{budget.currency === 'USD' ? '$' : '៛'}</span>
                  <input type="text" inputMode="decimal" value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)} placeholder="0"
                    aria-label={km ? 'ចំនួនចំណាយ' : 'Expense amount'} />
                </label>
                <select value={expenseMemberId} onChange={(e) => setExpenseMemberId(e.target.value)}
                  aria-label={km ? 'អ្នកទទួលខុសត្រូវ' : 'Assigned member'}>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="budget-category-picker">
                {(Object.keys(CATEGORY_META) as BudgetCategory[]).map((cat) => {
                  const meta = CATEGORY_META[cat];
                  return (
                    <button type="button" key={cat} className={expenseCategory === cat ? 'active' : ''} onClick={() => setExpenseCategory(cat)}>
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={meta.path} /></svg>
                      <span>{km ? meta.km : meta.en}</span>
                    </button>
                  );
                })}
              </div>
              <div className="bv-form-actions">
                <button type="button" className="budget-save-button" onClick={() => setShowAddForm(false)}>
                  {km ? 'បោះបង់' : 'Cancel'}
                </button>
                <button type="submit" className="budget-add-expense" disabled={!expenseTitle.trim() || !expenseAmount.trim()}>
                  {km ? 'បន្ថែមចំណាយ' : 'Add expense'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── Planned expenses list ─────────────────────────────── */}
      <div className="budget-section budget-expense-list-section">
        <div className="budget-section-heading">
          <div className="budget-section-heading-main">
            <span className="budget-section-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
            </span>
            <div>
              <h2>{km ? 'ចំណាយដែលបានគ្រោង' : 'Planned expenses'}</h2>
              <p>{budget.expenses.length ? `${budget.expenses.length} ${km ? 'ចំណាយ' : budget.expenses.length === 1 ? 'item' : 'items'}` : (km ? 'មិនទាន់មានចំណាយទេ។' : 'No expenses yet.')}</p>
            </div>
          </div>
          <strong>{formatBudgetAmount(planned, budget.currency)}</strong>
        </div>
        {budget.expenses.length > 0 && (
          <div className="budget-expense-list">
            {budget.expenses.map((expense) => {
              const meta = CATEGORY_META[expense.category] ?? CATEGORY_META.other;
              const assigned = members.find((m) => m.id === expense.assignedToMemberId);
              return (
                <div className="budget-expense-row" key={expense.id}>
                  <span className="budget-expense-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d={meta.path} /></svg></span>
                  <span className="budget-expense-copy"><strong>{expense.title}</strong><small>{assigned?.name || (km ? 'មិនបានចាត់ចែង' : 'Unassigned')}</small></span>
                  <strong className="budget-expense-amount">{formatBudgetAmount(expense.amount, budget.currency)}</strong>
                  {canManage && <button type="button" className="budget-expense-remove" onClick={() => removeExpense(expense.id)} aria-label={km ? `លុប ${expense.title}` : `Remove ${expense.title}`}>×</button>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {status && <div className="budget-toast" role="status"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>{status}</div>}
    </section>
  );
}
