import { describe, expect, it } from 'vitest';

import { formatCents, isValidSplit, parseAmountToCents, remainingCents, splitEqually } from '@/core/finance/split';

describe('parseAmountToCents', () => {
  it('accepts brazilian and plain decimal formats', () => {
    expect(parseAmountToCents('10')).toBe(1000);
    expect(parseAmountToCents('10,50')).toBe(1050);
    expect(parseAmountToCents('1.234,56')).toBe(123456);
    expect(parseAmountToCents('1234,5')).toBe(123450);
    expect(parseAmountToCents('0,99')).toBe(99);
  });

  it('rejects zero, negatives, malformed and excess precision', () => {
    expect(parseAmountToCents('')).toBeNull();
    expect(parseAmountToCents('0')).toBeNull();
    expect(parseAmountToCents('-5')).toBeNull();
    expect(parseAmountToCents('abc')).toBeNull();
    expect(parseAmountToCents('10,555')).toBeNull();
  });
});

describe('formatCents', () => {
  it('renders a brazilian decimal amount', () => {
    expect(formatCents(123456)).toBe('1.234,56');
    expect(formatCents(5)).toBe('0,05');
    expect(formatCents(1000)).toBe('10,00');
  });

  it('round-trips with parseAmountToCents', () => {
    for (const cents of [1, 99, 1000, 123456, 99999999]) {
      expect(parseAmountToCents(formatCents(cents))).toBe(cents);
    }
  });
});

describe('splitEqually', () => {
  it('distributes the remainder so the sum matches the total exactly', () => {
    expect(splitEqually(10000, ['a', 'b', 'c'])).toEqual([
      { personId: 'a', amountCents: 3334 },
      { personId: 'b', amountCents: 3333 },
      { personId: 'c', amountCents: 3333 },
    ]);
    expect(splitEqually(100, ['a', 'b', 'c'])).toEqual([
      { personId: 'a', amountCents: 34 },
      { personId: 'b', amountCents: 33 },
      { personId: 'c', amountCents: 33 },
    ]);
  });

  it('handles a single participant and an empty list', () => {
    expect(splitEqually(500, ['only'])).toEqual([{ personId: 'only', amountCents: 500 }]);
    expect(splitEqually(500, [])).toEqual([]);
  });

  it('never produces a zero share when the total covers every participant', () => {
    const shares = splitEqually(300, ['a', 'b', 'c']);
    expect(shares.every(share => share.amountCents > 0)).toBe(true);
    expect(shares.reduce((sum, share) => sum + share.amountCents, 0)).toBe(300);
  });
});

describe('remainingCents and isValidSplit', () => {
  it('reports the difference between the total and the current shares', () => {
    expect(remainingCents(1000, [{ personId: 'a', amountCents: 400 }])).toBe(600);
    expect(remainingCents(1000, [])).toBe(1000);
    expect(remainingCents(1000, [{ personId: 'a', amountCents: 1200 }])).toBe(-200);
  });

  it('accepts only positive shares that match the total', () => {
    expect(isValidSplit(1000, [
      { personId: 'a', amountCents: 600 },
      { personId: 'b', amountCents: 400 },
    ])).toBe(true);

    expect(isValidSplit(1000, [
      { personId: 'a', amountCents: 600 },
      { personId: 'b', amountCents: 399 },
    ])).toBe(false);

    expect(isValidSplit(1000, [
      { personId: 'a', amountCents: 1000 },
      { personId: 'b', amountCents: 0 },
    ])).toBe(false);

    expect(isValidSplit(1000, [])).toBe(false);
  });
});
