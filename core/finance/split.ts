/**
 * Money helpers for shared debts.
 *
 * Everything is handled in integer cents: the debt service rejects payouts whose
 * amounts do not sum exactly to the debt total and also rejects zero or negative
 * shares, so float arithmetic on reais is not an option here.
 */

export type Share = { personId: string; amountCents: number };

const MINOR_UNITS = 100;

function toCents(value: number): number {
  return Math.round(value * MINOR_UNITS);
}

/**
 * Parses user input into cents. Accepts `1234,56`, `1.234,56`, `1234.5` and `10`.
 * Returns null for zero, negative, malformed or over-precise values.
 */
export function parseAmountToCents(input: string): number | null {
  const cleaned = input.trim().replace(/\s/g, '').replace(/^R\$/i, '');
  if (!cleaned || !/^[0-9.,]+$/.test(cleaned) || cleaned.startsWith('-')) return null;

  const hasComma = cleaned.includes(',');
  let normalized: string;

  if (hasComma) {
    const [whole, ...rest] = cleaned.split(',');
    if (rest.length > 1 || rest[0].length > 2) return null;
    normalized = `${whole.replace(/\./g, '')}.${rest[0] || '0'}`;
  } else {
    const dots = cleaned.split('.');
    if (dots.length > 2) return null;
    if (dots.length === 2 && dots[1].length <= 2) {
      normalized = `${dots[0]}.${dots[1]}`;
    } else {
      normalized = cleaned.replace(/\./g, '');
    }
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;

  const cents = toCents(Number(normalized));
  return cents > 0 ? cents : null;
}

/** Renders cents as a brazilian decimal amount, e.g. 123456 -> `1.234,56`. */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / MINOR_UNITS);
}

/**
 * Splits a total evenly, handing the remaining cents to the first participants so
 * the shares always sum back to the total.
 */
export function splitEqually(totalCents: number, personIds: readonly string[]): Share[] {
  if (personIds.length === 0) return [];

  const base = Math.floor(totalCents / personIds.length);
  const remainder = totalCents - base * personIds.length;

  return personIds.map((personId, index) => ({
    personId,
    amountCents: base + (index < remainder ? 1 : 0),
  }));
}

/** Difference between the debt total and the sum of the current shares. */
export function remainingCents(totalCents: number, shares: readonly Share[]): number {
  return totalCents - shares.reduce((sum, share) => sum + share.amountCents, 0);
}

/** Mirrors the server rules: at least one share, every share positive, exact sum. */
export function isValidSplit(totalCents: number, shares: readonly Share[]): boolean {
  if (shares.length === 0) return false;
  if (shares.some(share => !Number.isInteger(share.amountCents) || share.amountCents <= 0)) return false;
  return remainingCents(totalCents, shares) === 0;
}
