import { request } from './request';

export type Dashboard = {
  balance: number | string;
  totalIncome: number | string;
  totalExpenses: number | string;
};

export type Income = {
  id: string;
  description: string;
  amount: number | string;
  transactionDate: string;
};

export type Expense = {
  id: string;
  description: string;
  amount: number | string;
  transactionDate: string;
  category: string;
};

export async function getDashboard(accessToken: string): Promise<Dashboard> {
  return request<Dashboard>('/api/v1/dashboard', {}, accessToken);
}

export async function getTransactions(accessToken: string): Promise<Array<Income | Expense>> {
  const [incomes, expenses] = await Promise.all([
    request<Income[]>('/api/v1/finance/incomes', {}, accessToken),
    request<Expense[]>('/api/v1/finance/expenses', {}, accessToken),
  ]);
  return [...incomes, ...expenses].sort((left, right) => right.transactionDate.localeCompare(left.transactionDate));
}

export async function createIncome(
  accessToken: string,
  input: { description: string; amount: number; transactionDate: string },
): Promise<Income> {
  return request<Income>('/api/v1/finance/incomes', { method: 'POST', body: JSON.stringify(input) }, accessToken);
}

export async function createExpense(
  accessToken: string,
  input: { description: string; amount: number; transactionDate: string; category: string },
): Promise<Expense> {
  return request<Expense>('/api/v1/finance/expenses', { method: 'POST', body: JSON.stringify(input) }, accessToken);
}

export function isExpense(transaction: Income | Expense): transaction is Expense {
  return 'category' in transaction;
}
