export const LEVELS = [
  { level: 1, title: 'Awakening', threshold: 0 },
  { level: 2, title: 'Seeker', threshold: 300 },
  { level: 3, title: 'Warrior', threshold: 800 },
  { level: 4, title: 'Champion', threshold: 1800 },
  { level: 5, title: 'Legend', threshold: 3500 },
  { level: 6, title: 'Sovereign', threshold: 6000 },
  { level: 7, title: 'Master', threshold: 10000 },
];

export function getLevelFromXp(xp = 0) {
  let active = LEVELS[0];

  for (const tier of LEVELS) {
    if (xp >= tier.threshold) {
      active = tier;
    }
  }

  const next = LEVELS.find((tier) => tier.level === active.level + 1);

  return {
    ...active,
    nextThreshold: next?.threshold ?? active.threshold,
    progress: next ? Math.min(100, Math.round(((xp - active.threshold) / (next.threshold - active.threshold)) * 100)) : 100,
  };
}

export function getXpForFullDayBonus(tasks) {
  const allDone = tasks.length > 0 && tasks.every((task) => task.done);
  return allDone ? 100 : 0;
}

export function getComboLabel(doneCount) {
  if (doneCount >= 15) return 'ELITE DAY!';
  if (doneCount >= 10 && doneCount % 5 === 0) return '10 DONE!';
  if (doneCount >= 5 && doneCount % 5 === 0) return '5 DONE!';
  return '';
}
