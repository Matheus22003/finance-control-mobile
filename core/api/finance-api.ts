import { request } from './request';

export type Dashboard = { balance: number | string; totalIncome: number | string; totalExpenses: number | string };
export type Income = { id: string; description: string; amount: number | string; transactionDate: string; recurringTransactionId?: string | null; goalAllocatedAmount?: number | string };
export type Expense = { id: string; description: string; amount: number | string; transactionDate: string; category: string; recurringTransactionId?: string | null };
export type BudgetCategory = { category: string; name: string; planned: number | string; spent: number | string; remaining: number | string; usagePercentage: number | string };
export type MonthlyBudget = { referenceMonth: string; totalPlanned: number | string; totalSpent: number | string; totalRemaining: number | string; categories: BudgetCategory[] };
export type FinancialGoal = { id: string; name: string; targetAmount: number | string; currentAmount: number | string; remainingAmount: number | string; progressPercentage: number | string; targetDate: string; status: string; requiredMonthlyContribution: number | string };
export type Contribution = { id: string; amount: number | string; contributionDate: string; note: string | null };
export type RecurringTransaction = { id: string; kind: string; description: string; amount: number | string; category: string | null; frequency: string; startDate: string; nextOccurrenceDate: string; endDate: string | null; active: boolean };
export type CashFlowMonth = { referenceMonth: string; projectedIncome: number | string; projectedExpenses: number | string; projectedNet: number | string; cumulativeBalance: number | string };
export type CashFlowProjection = { referenceDate: string; months: number | string; currentRecordedBalance: number | string; totalProjectedIncome: number | string; totalProjectedExpenses: number | string; projectedCumulativeBalance: number | string; items: CashFlowMonth[] };

export async function getDashboard(token: string): Promise<Dashboard> { return request('/api/v1/dashboard', {}, token); }
export async function getTransactions(token: string, selectedMonth?: string): Promise<Array<Income | Expense>> { const from = selectedMonth ? `${selectedMonth}-01` : undefined; const to = selectedMonth ? `${selectedMonth}-31` : undefined; const query = from ? `?from=${from}&to=${to}` : ''; const [incomes, expenses] = await Promise.all([request<Income[]>(`/api/v1/finance/incomes${query}`, {}, token), request<Expense[]>(`/api/v1/finance/expenses${query}`, {}, token)]); return [...incomes, ...expenses].sort((a,b)=>b.transactionDate.localeCompare(a.transactionDate)); }
export const getIncome = (token: string, id: string) => request<Income>(`/api/v1/finance/incomes/${id}`, {}, token);
export const getExpense = (token: string, id: string) => request<Expense>(`/api/v1/finance/expenses/${id}`, {}, token);
export const updateIncome = (token: string, id: string, input: { description: string; amount: number; transactionDate: string }) => request<Income>(`/api/v1/finance/incomes/${id}`, { method: 'PUT', body: JSON.stringify(input) }, token);
export const deleteIncome = (token: string, id: string) => request<void>(`/api/v1/finance/incomes/${id}`, { method: 'DELETE' }, token);
export const updateExpense = (token: string, id: string, input: { description: string; amount: number; transactionDate: string; category: string }) => request<Expense>(`/api/v1/finance/expenses/${id}`, { method: 'PUT', body: JSON.stringify(input) }, token);
export const deleteExpense = (token: string, id: string) => request<void>(`/api/v1/finance/expenses/${id}`, { method: 'DELETE' }, token);
export const createIncome = (token: string, input: { description: string; amount: number; transactionDate: string }) => request<Income>('/api/v1/finance/incomes', { method: 'POST', body: JSON.stringify(input) }, token);
export const createExpense = (token: string, input: { description: string; amount: number; transactionDate: string; category: string }) => request<Expense>('/api/v1/finance/expenses', { method: 'POST', body: JSON.stringify(input) }, token);
export const getBudget = (token: string, month: string) => request<MonthlyBudget>(`/api/v1/finance/budgets?month=${encodeURIComponent(month)}`, {}, token);
export const setBudget = (token: string, category: string, amount: number, month: string) => request<MonthlyBudget>(`/api/v1/finance/budgets/${encodeURIComponent(category)}?month=${encodeURIComponent(month)}`, { method: 'PUT', body: JSON.stringify({ amount }) }, token);
export const deleteBudget = (token: string, category: string, month: string) => request<void>(`/api/v1/finance/budgets/${encodeURIComponent(category)}?month=${encodeURIComponent(month)}`, { method: 'DELETE' }, token);
export const getGoals = (token: string) => request<FinancialGoal[]>('/api/v1/finance/goals', {}, token);
export const createGoal = (token: string, input: { name: string; targetAmount: number; currentAmount: number; targetDate: string }) => request<FinancialGoal>('/api/v1/finance/goals', { method: 'POST', body: JSON.stringify(input) }, token);
export const updateGoal = (token: string, id: string, input: { name: string; targetAmount: number; currentAmount: number; targetDate: string }) => request<FinancialGoal>(`/api/v1/finance/goals/${id}`, { method: 'PUT', body: JSON.stringify(input) }, token);
export const deleteGoal = (token: string, id: string) => request<void>(`/api/v1/finance/goals/${id}`, { method: 'DELETE' }, token);
export const addContribution = (token: string, goalId: string, input: { amount: number; contributionDate: string; note: string | null }) => request<Contribution>(`/api/v1/finance/goals/${goalId}/contributions`, { method: 'POST', body: JSON.stringify(input) }, token);
export const deleteContribution = (token: string, goalId: string, contributionId: string) => request<void>(`/api/v1/finance/goals/${goalId}/contributions/${contributionId}`, { method: 'DELETE' }, token);
export const getRecurring = (token: string) => request<RecurringTransaction[]>('/api/v1/finance/recurring-transactions', {}, token);
export const createRecurring = (token: string, input: { kind: string; description: string; amount: number; category: string | null; frequency: string; startDate: string; endDate: string | null }) => request<RecurringTransaction>('/api/v1/finance/recurring-transactions', { method: 'POST', body: JSON.stringify(input) }, token);
export const updateRecurring = (token: string, id: string, input: { description: string; amount: number; category: string | null; endDate: string | null; active: boolean }) => request<RecurringTransaction>(`/api/v1/finance/recurring-transactions/${id}`, { method: 'PUT', body: JSON.stringify(input) }, token);
export const deleteRecurring = (token: string, id: string) => request<void>(`/api/v1/finance/recurring-transactions/${id}`, { method: 'DELETE' }, token);
export const getCashFlowProjection = (token: string) => request<CashFlowProjection>('/api/v1/finance/projections/cash-flow', {}, token);
export function isExpense(transaction: Income | Expense): transaction is Expense { return 'category' in transaction; }
