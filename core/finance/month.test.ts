import { describe, expect, it } from 'vitest';

import { formatMonth, localMonth, shiftMonth } from '@/core/finance/month';

describe('localMonth', () => {
  it('derives the current month from the device calendar, not UTC', () => {
    // Built in local time: 31 March 2026, 23:30 on this device.
    const lateMarchLocally = new Date(2026, 2, 31, 23, 30);
    expect(localMonth(lateMarchLocally)).toBe('2026-03');
  });
});

describe('shiftMonth', () => {
  it('shifts months across year boundaries in both directions', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2025-12', 1)).toBe('2026-01');
    expect(shiftMonth('2026-10', -6)).toBe('2026-04');
    expect(shiftMonth('2026-10', 6)).toBe('2027-04');
  });

  it('shifts without drifting on month lengths and leap years', () => {
    expect(shiftMonth('2026-03', -1)).toBe('2026-02');
    expect(shiftMonth('2026-03', 1)).toBe('2026-04');
    expect(shiftMonth('2024-02', 1)).toBe('2024-03');
    expect(shiftMonth('2026-12', 2)).toBe('2027-02');
  });

  it('rejects malformed month values', () => {
    expect(() => shiftMonth('2026-9', 1)).toThrow();
    expect(() => shiftMonth('setembro', 1)).toThrow();
  });
});

describe('formatMonth', () => {
  it('formats a month label in Brazilian Portuguese', () => {
    expect(formatMonth('2026-09')).toBe('setembro de 2026');
    expect(formatMonth('2026-01')).toBe('janeiro de 2026');
  });
});
