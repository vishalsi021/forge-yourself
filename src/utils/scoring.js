import { core15Tasks } from '@/data/core15Tasks';

const dynamicPools = {
  fitness: [
    { text: 'Complete 3 sets of push-ups, squats, and lunges', area: 'fitness', xp: 20, why: 'Short resistance circuits create an immediate compliance win and lower activation energy for bigger training blocks.' },
    { text: 'Hold a 2-minute plank and 1-minute wall sit', area: 'fitness', xp: 20, why: 'Isometric work builds discipline under tension and creates measurable progress without needing equipment.' },
  ],
  mind: [
    { text: 'Write your top 3 fears and the smallest action that weakens each one', area: 'mind', xp: 20, why: 'Naming fear reduces its emotional charge and translates anxiety into executable behavior.' },
    { text: 'Practice 10 rounds of box breathing (4-4-4-4)', area: 'mind', xp: 20, why: 'Controlled breathing downshifts stress physiology and restores executive control quickly.' },
  ],
  career: [
    { text: 'Spend 25 uninterrupted minutes on your highest-leverage skill', area: 'career', xp: 20, why: 'Deliberate practice compounds only when it is focused, measurable, and repeated.' },
    { text: 'Write 3 goals and the next action for each', area: 'career', xp: 20, why: 'Clarity shrinks overwhelm; concrete next actions reduce avoidance.' },
  ],
  social: [
    { text: 'Send a specific appreciation message to someone important', area: 'social', xp: 20, why: 'Specific positive reinforcement deepens relationships faster than generic contact.' },
    { text: 'Ask one person a deeper question and listen without fixing', area: 'social', xp: 20, why: 'Psychological safety is built through presence, not performance.' },
  ],
  habits: [
    { text: 'Reset one physical space for 10 minutes', area: 'habits', xp: 20, why: 'Environment design is one of the fastest ways to reduce friction and improve compliance.' },
    { text: 'Track everything you consumed and did today with full honesty', area: 'habits', xp: 20, why: 'Measurement interrupts self-deception and makes behavior change visible.' },
  ],
  purpose: [
    { text: 'Write what you want said about you at age 75', area: 'purpose', xp: 20, why: 'Identity becomes sharper when viewed through legacy rather than impulse.' },
    { text: 'Write a letter from your future self about what matters now', area: 'purpose', xp: 20, why: 'Future-self perspective improves long-term decision quality and patience.' },
  ],
};

export function calculateArchScores(answers = {}) {
  const chipsScore = (key) => (answers[key] ?? []).length;
  const slider = (key, fallback = 5) => Number(answers[key] ?? fallback);

  return {
    fitness: clamp(Math.round((slider('fitness_0', 5) + chipsScore('fitness_1') * 0.7) / 2)),
    mind: clamp(Math.round((11 - slider('mind_0', 5) + chipsScore('mind_1') * 0.8) / 2)),
    career: clamp(Math.round((slider('career_0', 5) + chipsScore('career_1') * 0.8) / 2)),
    social: clamp(Math.round((slider('social_0', 5) + chipsScore('social_1') * 0.7) / 2)),
    habits: clamp(Math.round((slider('blockers_1', 5) + chipsScore('blockers_0') * 0.4) / 2)),
    purpose: clamp(Math.round((slider('purpose_0', 5) + String(answers['purpose_1'] ?? '').trim().length / 24) / 2)),
    wealth: clamp(Math.round((slider('wealth_0', 5) + chipsScore('wealth_1') * 0.8) / 2)),
  };
}

export function getWeakAreas(scores = {}) {
  return Object.entries(scores)
    .filter(([key]) => key !== 'wealth')
    .sort((a, b) => a[1] - b[1])
    .slice(0, 2)
    .map(([key]) => key);
}

export function buildDailyTasks({ customHabits = [], dynamicTasks = [], scores = {} }) {
  const weakAreas = getWeakAreas(scores);
  const fallbackDynamic = weakAreas.flatMap((area) => (dynamicPools[area] ?? []).slice(0, 1));
  const selectedDynamic = (dynamicTasks.length ? dynamicTasks : fallbackDynamic).slice(0, 3);

  const normalizedCore = core15Tasks.map((task, index) => ({
    id: `core-${index + 1}`,
    ...task,
    done: false,
    isCore: true,
    isCustom: false,
  }));

  const normalizedDynamic = selectedDynamic.map((task, index) => ({
    id: `dynamic-${index + 1}`,
    done: false,
    isCore: false,
    isCustom: false,
    ...task,
  }));

  const normalizedCustom = customHabits.map((habit, index) => ({
    id: `custom-${index + 1}`,
    text: habit,
    area: 'custom',
    xp: 25,
    why: 'Custom habits make the protocol personal, which raises commitment and identity alignment.',
    emoji: '⭐',
    done: false,
    isCore: false,
    isCustom: true,
  }));

  return [...normalizedCore, ...normalizedDynamic, ...normalizedCustom];
}

function clamp(value) {
  return Math.max(1, Math.min(10, value || 1));
}
