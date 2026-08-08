import type { BudgetCurrency, TripBudget, TripMember } from '../types';

export interface MemberBalance {
  member: TripMember;
  paid: number;
  share: number;
  /** positive = owed money back, negative = owes money */
  net: number;
}

export interface Settlement {
  from: TripMember;
  to: TripMember;
  amount: number;
}

/**
 * Computes each member's paid total, equal share, and net balance.
 * Only members who appear in expenses (as payer) or in the members list are included.
 */
export function computeMemberBalances(budget: TripBudget, members: TripMember[]): MemberBalance[] {
  if (!members.length) return [];
  const total = budget.expenses.reduce((sum, e) => sum + e.amount, 0);
  if (total === 0) return [];
  const share = Math.round(total / members.length);
  const paidMap = new Map<string, number>();
  for (const expense of budget.expenses) {
    if (expense.assignedToMemberId) {
      paidMap.set(expense.assignedToMemberId, (paidMap.get(expense.assignedToMemberId) ?? 0) + expense.amount);
    }
  }
  return members.map((member) => {
    const paid = paidMap.get(member.id) ?? 0;
    return { member, paid, share, net: paid - share };
  });
}

/**
 * Greedy settlement algorithm: returns the minimal set of transactions
 * needed to zero out all balances.
 */
export function computeSettlements(balances: MemberBalance[]): Settlement[] {
  const settlements: Settlement[] = [];
  // work with mutable copies
  const creditors = balances.filter((b) => b.net > 0).map((b) => ({ member: b.member, amount: b.net }));
  const debtors = balances.filter((b) => b.net < 0).map((b) => ({ member: b.member, amount: -b.net }));
  let ci = 0;
  let di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const credit = creditors[ci];
    const debt = debtors[di];
    const amount = Math.min(credit.amount, debt.amount);
    if (amount > 0) {
      settlements.push({ from: debt.member, to: credit.member, amount });
    }
    credit.amount -= amount;
    debt.amount -= amount;
    if (credit.amount === 0) ci++;
    if (debt.amount === 0) di++;
  }
  return settlements;
}

export const EMPTY_BUDGET: TripBudget = {
  currency: 'USD',
  targetAmount: 0,
  expenses: [],
  commitments: [],
};

export function tripBudget(value?: TripBudget): TripBudget {
  if (!value) return { ...EMPTY_BUDGET, expenses: [], commitments: [] };
  return {
    currency: value.currency === 'KHR' ? 'KHR' : 'USD',
    targetAmount: Number.isSafeInteger(value.targetAmount) && value.targetAmount >= 0 ? value.targetAmount : 0,
    expenses: Array.isArray(value.expenses) ? value.expenses : [],
    commitments: Array.isArray(value.commitments) ? value.commitments : [],
  };
}

export function amountToMinor(raw: string, currency: BudgetCurrency): number | null {
  const normalized = raw.replaceAll(',', '').trim();
  if (!normalized) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  const amount = currency === 'USD' ? Math.round(value * 100) : Math.round(value);
  return Number.isSafeInteger(amount) && amount <= 1_000_000_000_000 ? amount : null;
}

export function minorToInput(amount: number, currency: BudgetCurrency): string {
  if (!amount) return '';
  return currency === 'USD' ? (amount / 100).toFixed(2) : String(amount);
}

export function formatBudgetAmount(amount: number, currency: BudgetCurrency): string {
  const value = currency === 'USD' ? amount / 100 : amount;
  return new Intl.NumberFormat(currency === 'KHR' ? 'km-KH' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'USD' ? 2 : 0,
    maximumFractionDigits: currency === 'USD' ? 2 : 0,
  }).format(value);
}

export function budgetExpenseTotal(budget: TripBudget): number {
  return budget.expenses.reduce((total, expense) => total + expense.amount, 0);
}

export function budgetCommitmentTotal(budget: TripBudget): number {
  return budget.commitments.reduce((total, commitment) => total + commitment.amount, 0);
}
