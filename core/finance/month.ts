const MONTH_PATTERN = /^\d{4}-\d{2}$/;

function parseMonth(value: string): Date {
  if (!MONTH_PATTERN.test(value)) {
    throw new Error(`Invalid month value: ${value}`);
  }
  return new Date(`${value}-01T12:00:00Z`);
}

/**
 * Current month according to the device calendar.
 *
 * Deliberately not derived from `toISOString()`, which would report the UTC
 * month and show the wrong period to users behind UTC (for example Brazil,
 * UTC-03:00, late on the last day of a month).
 */
export function localMonth(reference: Date = new Date()): string {
  const year = reference.getFullYear();
  const month = String(reference.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/** Moves a `YYYY-MM` value by whole months, anchored at noon UTC to avoid drift. */
export function shiftMonth(value: string, delta: number): string {
  const date = parseMonth(value);
  date.setUTCMonth(date.getUTCMonth() + delta);
  return date.toISOString().slice(0, 7);
}

/** Human label such as `setembro de 2026`. */
export function formatMonth(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parseMonth(value));
}
