import { describe, expect, it } from 'vitest';

import { buildDailyTasks, calculateArchScores, getWeakAreas } from '@/utils/scoring';

describe('scoring helpers', () => {
  it('builds arch scores from answers', () => {
    const scores = calculateArchScores({
      fitness_0: 8,
      fitness_1: ['Build muscle', 'Better sleep'],
      mind_0: 3,
      mind_1: ['Meditation'],
      career_0: 7,
      career_1: ['Writing'],
      social_0: 6,
      social_1: ['Deepen bonds'],
      blockers_0: ['Procrastination'],
      blockers_1: 8,
      purpose_0: 7,
      purpose_1: 'Become calmer and more focused',
      wealth_0: 5,
      wealth_1: ['Budgeting'],
    });

    expect(scores.fitness).toBeGreaterThan(1);
    expect(scores.mind).toBeGreaterThan(1);
    expect(scores.purpose).toBeGreaterThan(1);
  });

  it('returns weak areas and builds task sets', () => {
    const scores = { fitness: 3, mind: 4, career: 8, social: 7, habits: 5, purpose: 6 };
    const weak = getWeakAreas(scores);
    const tasks = buildDailyTasks({ scores, customHabits: ['Stretch for 5 minutes'] });

    expect(weak[0]).toBe('fitness');
    expect(tasks.some((task) => task.isCustom)).toBe(true);
    expect(tasks.length).toBeGreaterThan(15);
  });
});
