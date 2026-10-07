import assert from 'node:assert/strict';
import test from 'node:test';

import { formatMonth, localMonth, shiftMonth } from './month.ts';

test('derives the current month from the device calendar, not UTC', () => {
  // Built in local time: 31 March 2026, 23:30 on this device.
  const lateMarchLocally = new Date(2026, 2, 31, 23, 30);
  assert.equal(localMonth(lateMarchLocally), '2026-03');
});

test('shifts months across year boundaries in both directions', () => {
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
  assert.equal(shiftMonth('2025-12', 1), '2026-01');
  assert.equal(shiftMonth('2026-10', -6), '2026-04');
  assert.equal(shiftMonth('2026-10', 6), '2027-04');
});

test('shifts without drifting on month lengths and leap years', () => {
  assert.equal(shiftMonth('2026-03', -1), '2026-02');
  assert.equal(shiftMonth('2026-03', 1), '2026-04');
  assert.equal(shiftMonth('2024-02', 1), '2024-03');
  assert.equal(shiftMonth('2026-12', 2), '2027-02');
});

test('formats a month label in Brazilian Portuguese', () => {
  assert.equal(formatMonth('2026-09'), 'setembro de 2026');
  assert.equal(formatMonth('2026-01'), 'janeiro de 2026');
});
