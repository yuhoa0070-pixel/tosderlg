import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useAppContext } from '../context/AppContext';
import { useActiveTrip } from '../hooks/useActiveTrip';
import {
  amountToMinor,
  budgetCommitmentTotal,
  budgetExpenseTotal,
  formatBudgetAmount,
  minorToInput,
  tripBudget,
} from '../lib/budget';
import { currentTripMember, lockTripBudgetAmount } from '../lib/tripRoom';
import type { BudgetCategory, BudgetCurrency, BudgetExpense, TripBudget, TripMember } from '../types';

const CATEGORY_META: Record<BudgetCategory, { en: string; km: string; path: string }> = {
  stay: { en: 'Stay', km: 'កន្លែងស្នាក់នៅ', path: 'M5 19v-8h14v8M7 11V7h4a3 3 0 0 1 3 3v1M3 19h18M5 15h14' },
  transport: { en: 'Transport', km: 'ការធ្វើដំណើរ', path: 'M5 16h14M7 16l1-7h8l1 7M6 9l2-3h8l2 3M7 19h.01M17 19h.01' },
  food: { en: 'Food', km: 'អាហារ', path: 'M7 4v7M4 4v4a3 3 0 0 0 6 0V4M7 11v9M16 4v16M16 4c3 2 4 5 4 8h-4' },
  activity: { en: 'Activity', km: 'សកម្មភាព', path: 'M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.7-5.3 2.7 1-5.8-4.2-4.1 5.9-.9z' },
  other: { en: 'Other', km: 'ផ្សេងៗ', path: 'M5 12h.01M12 12h.01M19 12h.01' },
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0]}` : parts[0]?.slice(0, 2) || '?').toUpperCase();
}

function makeExpenseId(): string {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(12)), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function MemberAvatar({ member }: { member: TripMember }) {
  return (
    <span className="budget-member-avatar" aria-hidden="true">
      <span>{initials(member.name)}</span>
      {member.photoUrl && <img src={member.photoUrl} alt="" onError={(event) => event.currentTarget.remove()} />}
    </span>
  );
}

export default function BudgetView() {
  const { state, dispatch } = useAppContext();
  const activeTrip = useActiveTrip();
  const km = state.language === 'km';
  const budget = useMemo(() => tripBudget(activeTrip?.budget), [activeTrip?.budget]);
  const current = useMemo(
    () => currentTripMember(state.profileName, state.profilePhoto),
    [state.profileName, state.profilePhoto],
  );
  const ownerMemberId = activeTrip?.members?.find((member) => member.role === 'owner')?.id;
  const currentMemberId = activeTrip?.roomMemberId || (!activeTrip?.readOnly ? ownerMemberId : undefined) || current.id;
  const members = useMemo<TripMember[]>(() => {
    if (activeTrip?.members?.length) return activeTrip.members;
    return [{ ...current, id: currentMemberId, role: 'owner', joinedAt: Date.now() }];
  }, [activeTrip?.members, current, currentMemberId]);
  const currentMember = members.find((member) => member.id === currentMemberId) ?? members[0];
  const canManage = !!activeTrip && !activeTrip.readOnly;
  const today = new Date().toISOString().slice(0, 10);
  const lockingOpen = !!activeTrip?.startDate && activeTrip.startDate > today;
  const planned = budgetExpenseTotal(budget);
  const locked = budgetCommitmentTotal(budget);
  const remaining = Math.max(budget.targetAmount - locked, 0);
  const targetBase = Math.max(budget.targetAmount, planned, 1);
  const lockedProgress = Math.min((locked / targetBase) * 100, 100);
  const plannedProgress = Math.min((planned / targetBase) * 100, 100);
  const currentCommitment = budget.commitments.find((item) => item.memberId === currentMemberId)?.amount ?? 0;
  const hasBudgetData = budget.targetAmount > 0 || budget.expenses.length > 0 || budget.commitments.some((item) => item.amount > 0);

  const [targetInput, setTargetInput] = useState(() => minorToInput(budget.targetAmount, budget.currency));
  const [commitmentInput, setCommitmentInput] = useState(() => minorToInput(currentCommitment, budget.currency));
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<BudgetCategory>('stay');
  const [expenseMemberId, setExpenseMemberId] = useState(members[0]?.id ?? '');
  const [savingCommitment, setSavingCommitment] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    setTargetInput(minorToInput(budget.targetAmount, budget.currency));
  }, [budget.currency, budget.targetAmount]);

  useEffect(() => {
    setCommitmentInput(minorToInput(currentCommitment, budget.currency));
  }, [budget.currency, currentCommitment]);

  useEffect(() => {
    if (!members.some((member) => member.id === expenseMemberId)) setExpenseMemberId(members[0]?.id ?? '');
  }, [expenseMemberId, members]);

  useEffect(() => {
    if (!status) return;
    const timer = window.setTimeout(() => setStatus(''), 2600);
    return () => window.clearTimeout(timer);
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
    setCommitmentInput('');
  };

  const saveCommitment = async (event: FormEvent) => {
    event.preventDefault();
    const amount = amountToMinor(commitmentInput, budget.currency);
    if (amount == null || !lockingOpen) return;
    setSavingCommitment(true);
    setStatus('');
    try {
      if (activeTrip.roomCode) {
        const response = await lockTripBudgetAmount(
          activeTrip.roomCode,
          { ...current, id: currentMemberId },
          amount,
        );
        applyBudget(response.budget, response.updatedAt);
      } else {
        const commitments = budget.commitments.filter((item) => item.memberId !== currentMemberId);
        if (amount > 0) commitments.push({ memberId: currentMemberId, amount, lockedAt: Date.now() });
        applyBudget({ ...budget, commitments });
      }
      setCommitmentInput(minorToInput(amount, budget.currency));
      setStatus(amount > 0 ? (km ? 'បានកក់ថវិកាទុក' : 'Amount reserved') : (km ? 'បានដកការកក់ទុក' : 'Reservation released'));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : km ? 'មិនអាចកក់ថវិកាបានទេ' : 'Could not reserve this amount');
    } finally {
      setSavingCommitment(false);
    }
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
    applyBudget({ ...budget, expenses: budget.expenses.filter((expense) => expense.id !== expenseId) });
  };

  return (
    <section id="view-budget" className="active budget-view">
      <div className="budget-hero">
        <div className="budget-hero-heading">
          <button
            type="button"
            className="budget-back-button"
            onClick={() => dispatch({ type: 'NAVIGATE', view: 'itinerary' })}
            aria-label={km ? 'ត្រឡប់ទៅកាលវិភាគ' : 'Back to itinerary'}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 7 5 12l5 5" />
              <path d="M5.5 12h7.2a6.3 6.3 0 0 1 6.3 6.3" />
            </svg>
          </button>
          <div>
            <span>{km ? 'ថវិកាគោលដៅ' : 'Trip target'}</span>
            <strong>{formatBudgetAmount(budget.targetAmount, budget.currency)}</strong>
          </div>
          <span className="budget-currency-chip">{budget.currency}</span>
        </div>
        <div className="budget-meter" aria-label={km ? 'វឌ្ឍនភាពថវិកា' : 'Budget progress'}>
          <span className="budget-meter-planned" style={{ width: `${plannedProgress}%` }} />
          <span className="budget-meter-locked" style={{ width: `${lockedProgress}%` }} />
        </div>
        <div className="budget-legend">
          <span><i className="locked" />{km ? 'បានកក់' : 'Reserved'} <strong>{formatBudgetAmount(locked, budget.currency)}</strong></span>
          <span><i className="planned" />{km ? 'បានគ្រោង' : 'Planned'} <strong>{formatBudgetAmount(planned, budget.currency)}</strong></span>
        </div>
        <div className="budget-remaining">
          <span>{km ? 'នៅត្រូវកក់បន្ថែម' : 'Still to reserve'}</span>
          <strong>{formatBudgetAmount(remaining, budget.currency)}</strong>
        </div>
      </div>

      {canManage && (
        <form className="budget-settings" onSubmit={saveTarget}>
          <div className="budget-section-heading">
            <div><h2>{km ? 'កំណត់ថវិកា' : 'Set the target'}</h2><p>{km ? 'ម្ចាស់ដំណើរអាចកែប្រែបាន។' : 'Only the trip owner can change this.'}</p></div>
          </div>
          <div className="budget-target-row">
            <label className="budget-money-input">
              <span>{budget.currency === 'USD' ? '$' : '៛'}</span>
              <input
                type="text"
                inputMode="decimal"
                value={targetInput}
                onChange={(event) => setTargetInput(event.target.value)}
                placeholder={budget.currency === 'USD' ? '500.00' : '2,000,000'}
                aria-label={km ? 'ថវិកាគោលដៅ' : 'Budget target'}
              />
            </label>
            <button type="submit" className="budget-save-button">{km ? 'រក្សាទុក' : 'Save'}</button>
          </div>
          <div className="budget-currency-switch" aria-label={km ? 'រូបិយប័ណ្ណ' : 'Currency'}>
            {(['USD', 'KHR'] as BudgetCurrency[]).map((currency) => (
              <button
                type="button"
                key={currency}
                className={budget.currency === currency ? 'active' : ''}
                disabled={hasBudgetData && budget.currency !== currency}
                onClick={() => changeCurrency(currency)}
              >
                {currency}
              </button>
            ))}
          </div>
        </form>
      )}

      <div className="budget-section budget-commitment-section">
        <div className="budget-section-heading">
          <div><h2>{km ? 'កក់ចំនួនរបស់អ្នក' : 'Reserve your share'}</h2><p>{km ? 'ចំនួននេះសម្រាប់ផែនការ មិនមែនការបង់ប្រាក់ទេ។' : 'This is a planning commitment—not a payment.'}</p></div>
          {currentMember && <MemberAvatar member={currentMember} />}
        </div>
        <form className="budget-commitment-form" onSubmit={saveCommitment}>
          <label className="budget-money-input">
            <span>{budget.currency === 'USD' ? '$' : '៛'}</span>
            <input
              type="text"
              inputMode="decimal"
              value={commitmentInput}
              disabled={!lockingOpen || savingCommitment}
              onChange={(event) => setCommitmentInput(event.target.value)}
              placeholder={budget.currency === 'USD' ? '100.00' : '400,000'}
              aria-label={km ? 'ចំនួនត្រូវកក់' : 'Amount to reserve'}
            />
          </label>
          <button type="submit" className="budget-lock-button" disabled={!lockingOpen || savingCommitment}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2" /></svg>
            {savingCommitment ? (km ? 'កំពុងកក់...' : 'Saving...') : currentCommitment > 0 ? (km ? 'កែប្រែចំនួន' : 'Update amount') : (km ? 'កក់ចំនួន' : 'Lock amount')}
          </button>
        </form>
        {!lockingOpen && <p className="budget-closed-note">{km ? 'ការកក់ថវិកាបិទនៅថ្ងៃដំណើរចាប់ផ្តើម។' : 'Budget reservations close when the trip starts.'}</p>}
      </div>

      {canManage && (
        <form className="budget-section budget-expense-form" onSubmit={addExpense}>
          <div className="budget-section-heading">
            <div><h2>{km ? 'បន្ថែមចំណាយ' : 'Add an expense'}</h2><p>{km ? 'ចាត់ចែងការចំណាយទៅសមាជិកម្នាក់។' : 'Assign each planned cost to a member.'}</p></div>
          </div>
          <input type="text" value={expenseTitle} onChange={(event) => setExpenseTitle(event.target.value)} placeholder={km ? 'ឧ. សណ្ឋាគារ' : 'e.g. Hotel booking'} maxLength={60} />
          <div className="budget-expense-fields">
            <label className="budget-money-input">
              <span>{budget.currency === 'USD' ? '$' : '៛'}</span>
              <input type="text" inputMode="decimal" value={expenseAmount} onChange={(event) => setExpenseAmount(event.target.value)} placeholder="0" aria-label={km ? 'ចំនួនចំណាយ' : 'Expense amount'} />
            </label>
            <select value={expenseMemberId} onChange={(event) => setExpenseMemberId(event.target.value)} aria-label={km ? 'អ្នកទទួលខុសត្រូវ' : 'Assigned member'}>
              {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
            </select>
          </div>
          <div className="budget-category-picker">
            {(Object.keys(CATEGORY_META) as BudgetCategory[]).map((category) => {
              const meta = CATEGORY_META[category];
              return (
                <button type="button" key={category} className={expenseCategory === category ? 'active' : ''} onClick={() => setExpenseCategory(category)}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d={meta.path} /></svg>
                  <span>{km ? meta.km : meta.en}</span>
                </button>
              );
            })}
          </div>
          <button type="submit" className="budget-add-expense" disabled={!expenseTitle.trim() || !expenseAmount.trim()}>{km ? 'បន្ថែមចំណាយ' : 'Add expense'}</button>
        </form>
      )}

      <div className="budget-section budget-expense-list-section">
        <div className="budget-section-heading">
          <div><h2>{km ? 'ចំណាយដែលបានគ្រោង' : 'Planned expenses'}</h2><p>{budget.expenses.length ? `${budget.expenses.length} ${km ? 'ចំណាយ' : budget.expenses.length === 1 ? 'item' : 'items'}` : (km ? 'មិនទាន់មានចំណាយទេ។' : 'No expenses yet.')}</p></div>
          <strong>{formatBudgetAmount(planned, budget.currency)}</strong>
        </div>
        {budget.expenses.length > 0 && (
          <div className="budget-expense-list">
            {budget.expenses.map((expense) => {
              const meta = CATEGORY_META[expense.category] ?? CATEGORY_META.other;
              const assigned = members.find((member) => member.id === expense.assignedToMemberId);
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
