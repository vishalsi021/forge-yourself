import { describe, expect, it } from 'vitest';

import { getComboLabel, getLevelFromXp } from '@/utils/xp';

describe('xp helpers', () => {
  it('returns the correct level for xp thresholds', () => {
    expect(getLevelFromXp(0).level).toBe(1);
    expect(getLevelFromXp(3500).level).toBe(5);
    expect(getLevelFromXp(10000).level).toBe(7);
  });

  it('returns combo labels for milestones', () => {
    expect(getComboLabel(5)).toBe('5 DONE!');
    expect(getComboLabel(10)).toBe('10 DONE!');
    expect(getComboLabel(15)).toBe('ELITE DAY!');
  });
});
