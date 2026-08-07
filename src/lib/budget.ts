import type { BudgetCurrency, TripBudget } from '../types';

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
