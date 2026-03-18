import { describe, expect, it } from 'vitest';

import { addDays, getCompletionPercent, getTodayDateString, getWeekNumber } from '@/utils/dateHelpers';

describe('date helpers', () => {
  it('calculates week numbers', () => {
    expect(getWeekNumber(1)).toBe(1);
    expect(getWeekNumber(7)).toBe(1);
    expect(getWeekNumber(8)).toBe(2);
  });

  it('adds days correctly', () => {
    expect(addDays('2026-03-17', 1)).toBe('2026-03-18');
  });

  it('formats a local calendar day without UTC drift', () => {
    expect(getTodayDateString(new Date(2026, 2, 17, 9, 30))).toBe('2026-03-17');
  });

  it('caps completion percent at 100', () => {
    expect(getCompletionPercent(60)).toBe(100);
    expect(getCompletionPercent(30)).toBe(50);
  });
});
