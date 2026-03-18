export const onboardingSections = [
  {
    id: 'identity',
    label: 'Identity',
    subtitle: 'Who are you right now?',
    icon: '🧬',
    questions: [
      { id: 'identity_0', type: 'slider', text: 'Self-confidence level right now?', lo: 'Rock bottom', hi: 'Unshakeable', defaultValue: 5 },
      { id: 'identity_1', type: 'chips', text: 'Words that describe you today:', options: ['Introvert', 'Extrovert', 'Analytical', 'Creative', 'Disciplined', 'Impulsive', 'Empathetic', 'Ambitious', 'Fearful', 'Procrastinator', 'Driven', 'Lost'] }
    ]
  },
  {
    id: 'fitness',
    label: 'Fitness',
    subtitle: 'Physical baseline',
    icon: '💪',
    questions: [
      { id: 'fitness_0', type: 'slider', text: 'Exercise frequency right now?', lo: 'Zero', hi: 'Every day', defaultValue: 5 },
      { id: 'fitness_1', type: 'chips', text: 'Physical goals:', options: ['Lose fat', 'Build muscle', 'More energy', 'Athletic performance', 'Better sleep', 'Flexibility', 'Endurance', 'Be active'] }
    ]
  },
  {
    id: 'mind',
    label: 'Mind',
    subtitle: 'Mental and emotional state',
    icon: '🧠',
    questions: [
      { id: 'mind_0', type: 'slider', text: 'How often do you feel overwhelmed?', lo: 'Never', hi: 'Constantly', defaultValue: 5 },
      { id: 'mind_1', type: 'chips', text: 'Mental habits you want:', options: ['Meditation', 'Journaling', 'Gratitude', 'Therapy', 'Digital detox', 'Deep work', 'Reading', 'Breathwork', 'Cold exposure'] }
    ]
  },
  {
    id: 'career',
    label: 'Career',
    subtitle: 'Professional trajectory',
    icon: '🚀',
    questions: [
      { id: 'career_0', type: 'slider', text: 'Career or study satisfaction?', lo: 'Miserable', hi: 'Thriving', defaultValue: 5 },
      { id: 'career_1', type: 'chips', text: 'Skills to build:', options: ['Communication', 'Coding', 'Finance', 'Leadership', 'Public speaking', 'Time management', 'Writing', 'Sales', 'Design'] }
    ]
  },
  {
    id: 'social',
    label: 'Social',
    subtitle: 'Connections and relationships',
    icon: '🤝',
    questions: [
      { id: 'social_0', type: 'slider', text: 'Quality of relationships?', lo: 'Isolated', hi: 'Thriving', defaultValue: 5 },
      { id: 'social_1', type: 'chips', text: 'Social goals:', options: ['New friends', 'Deepen bonds', 'Be assertive', 'Set limits', 'Meet partner', 'Fix family', 'Less conflict', 'Expand network'] }
    ]
  },
  {
    id: 'wealth',
    label: 'Wealth',
    subtitle: 'Financial foundation',
    icon: '💰',
    questions: [
      { id: 'wealth_0', type: 'slider', text: 'Financial discipline right now?', lo: 'Zero control', hi: 'Fully optimized', defaultValue: 5 },
      { id: 'wealth_1', type: 'chips', text: 'Financial goals:', options: ['Save 20%+', 'Invest monthly', 'Build business', 'Clear debt', 'Create income stream', 'Learn investing', 'Budgeting', 'Track spending'] }
    ]
  },
  {
    id: 'purpose',
    label: 'Purpose',
    subtitle: 'Your why',
    icon: '🎯',
    questions: [
      { id: 'purpose_0', type: 'slider', text: 'How clear is your life purpose?', lo: 'Completely lost', hi: 'Crystal clear', defaultValue: 5 },
      { id: 'purpose_1', type: 'text', text: 'In one sentence, who do you need to become in 60 days?' }
    ]
  },
  {
    id: 'blockers',
    label: 'Blockers',
    subtitle: 'What is stopping you?',
    icon: '⚡',
    questions: [
      { id: 'blockers_0', type: 'chips', text: 'Biggest obstacles:', options: ['No motivation', 'Procrastination', 'Negative self-talk', 'Bad habits', 'Fear', 'No clear goals', 'Anxiety', 'Low energy', 'Distractions', 'Environment', 'People around me'] },
      { id: 'blockers_1', type: 'slider', text: 'Commitment to change starting today?', lo: 'Not sure', hi: '100% committed', defaultValue: 5 }
    ]
  },
  {
    id: 'customHabits',
    label: 'Your Habits',
    subtitle: 'Personal non-negotiables',
    icon: '⭐',
    questions: [
      { id: 'custom_habits', type: 'custom', text: 'Add personal habits you will track daily (minimum 1).' }
    ]
  },
];
