import { request } from './request';

export type PersonReference = { id: string; name: string; isCurrentUser: boolean };
export type Person = PersonReference & { email: string | null };
export type DebtShare = { id: string; person: PersonReference; amount: number | string; paidAmount: number | string; remainingAmount: number | string; isPayer: boolean };
export type Debt = { id: string; description: string; totalAmount: number | string; paidBy: PersonReference; groupId: string | null; category: string; status: string; dueDate: string | null; createdByCurrentUser: boolean; shares: DebtShare[] };
export type DebtSummary = { totalOwed: number | string; totalToReceive: number | string; openDebtsCount: number | string };
export type Payment = { id: string; debtId: string; debtShareId: string; fromPerson: PersonReference; toPerson: PersonReference; amount: number | string; paymentDate: string; note: string | null; status: string; canConfirm: boolean; canReject: boolean };
export type SimplifiedTransfer = { fromIdentityId: string; fromPerson: PersonReference; toIdentityId: string; toPerson: PersonReference; amount: number | string };
export type Settlement = { totalOpenAmount: number | string; originalTransferCount: number | string; simplifiedTransferCount: number | string; transfers: SimplifiedTransfer[] };

export const getDebtSummary = (token: string) => request<DebtSummary>('/api/v1/debts/summary', {}, token);
export const getDebts = (token: string) => request<Debt[]>('/api/v1/debts', {}, token);
export const getDebt = (token: string, id: string) => request<Debt>(`/api/v1/debts/${id}`, {}, token);
export const getDebtPayments = (token: string, id: string) => request<Payment[]>(`/api/v1/debts/${id}/payments`, {}, token);
export const getPendingPayments = (token: string) => request<Payment[]>('/api/v1/debts/payments/pending-confirmation', {}, token);
export const getSettlement = (token: string) => request<Settlement>('/api/v1/debts/settlements/simplified', {}, token);
export const recordSettlementTransfer = (token: string, input: { fromPersonId: string; toPersonId: string; amount: number | string }) => request<unknown>('/api/v1/debts/settlements/simplified/transfers', { method: 'POST', body: JSON.stringify({ groupId: null, ...input, paymentDate: new Date().toISOString().slice(0, 10), note: null }) }, token);
export const getPeople = (token: string) => request<Person[]>('/api/v1/people', {}, token);

export function createDebt(token: string, input: { description: string; totalAmount: number; paidByPersonId: string; groupId: string | null; category: string; dueDate: string | null; shares: { personId: string; amount: number }[] }) {
  return request<Debt>('/api/v1/debts', { method: 'POST', body: JSON.stringify(input) }, token);
}
export function createPayment(token: string, debtId: string, shareId: string, input: { amount: number; paymentDate: string; note: string | null }) {
  return request<Payment>(`/api/v1/debts/${debtId}/shares/${shareId}/payments`, { method: 'POST', body: JSON.stringify(input) }, token);
}
export function confirmPayment(token: string, debtId: string, paymentId: string) { return request<Payment>(`/api/v1/debts/${debtId}/payments/${paymentId}/confirm`, { method: 'POST' }, token); }
export function rejectPayment(token: string, debtId: string, paymentId: string) { return request<Payment>(`/api/v1/debts/${debtId}/payments/${paymentId}/reject`, { method: 'POST' }, token); }
