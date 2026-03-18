export const core15Tasks = [
  { text: 'Sleep 8 hours - in bed by 10:30 PM', area: 'fitness', xp: 20, emoji: '\u{1F634}', why: 'Protect recovery first.' },
  { text: 'Drink 3 liters of water', area: 'fitness', xp: 15, emoji: '\u{1F4A7}', why: 'Hydration supports cognition and energy.' },
  { text: 'Exercise minimum 20 minutes', area: 'fitness', xp: 25, emoji: '\u{1F4AA}', why: 'Movement improves mood and long-term health.' },
  { text: '3 home-cooked meals. No Swiggy, no Zomato today.', area: 'fitness', xp: 20, emoji: '\u{1F957}', why: 'Cleaner food helps energy and compliance.' },
  { text: 'Phone screen time under 2 hours', area: 'mind', xp: 20, emoji: '\u{1F4F5}', why: 'Attention is a limited resource.' },
  { text: 'Read 20 pages of non-fiction', area: 'career', xp: 20, emoji: '\u{1F4DA}', why: 'Reading compounds into better judgment.' },
  { text: 'Write 3 gratitudes + 1 journal entry', area: 'mind', xp: 15, emoji: '\u{1F4DD}', why: 'Reflection improves self-awareness.' },
  { text: 'Have 1 real conversation with someone', area: 'social', xp: 15, emoji: '\u{1F91D}', why: 'Connection matters for resilience.' },
  { text: 'Meditate or deep breathing for 10 minutes', area: 'mind', xp: 15, emoji: '\u{1F9D8}', why: 'Mindfulness helps regulation.' },
  { text: 'Complete your most important task first', area: 'career', xp: 25, emoji: '\u{1F3AF}', why: 'Priority creates leverage.' },
  { text: 'Cold shower - 30 seconds cold finish', area: 'fitness', xp: 20, emoji: '\u{1F6BF}', why: 'Discomfort builds resilience.' },
  { text: 'Get 10 minutes of morning sunlight', area: 'fitness', xp: 10, emoji: '\u2600\uFE0F', why: 'Light anchors rhythm and alertness.' },
  { text: 'Plan tomorrow - write your top 3 tasks', area: 'habits', xp: 15, emoji: '\u{1F4CB}', why: 'Pre-planning reduces friction.' },
  { text: 'Zero social media before noon', area: 'mind', xp: 20, emoji: '\u{1F6AB}', why: 'Protect your best attention.' },
  { text: 'Walk 8,000+ steps', area: 'fitness', xp: 15, emoji: '\u{1F6B6}', why: 'Walking is low-friction health insurance.' },
];

export const dynamicPools: Record<string, Array<{ text: string; area: string; xp: number; why: string }>> = {
  fitness: [
    { text: 'Do 3 sets of push-ups, squats, and lunges', area: 'fitness', xp: 20, why: 'Short circuits lower resistance and build momentum.' },
    { text: 'Hold a 2-minute plank and 1-minute wall sit', area: 'fitness', xp: 20, why: 'Simple tension work builds discipline fast.' },
  ],
  mind: [
    { text: 'Write your top 3 fears and a response to each', area: 'mind', xp: 20, why: 'Naming fear makes it more workable.' },
    { text: 'Practice 10 rounds of box breathing', area: 'mind', xp: 20, why: 'Controlled breathing lowers stress quickly.' },
  ],
  career: [
    { text: 'Spend 25 minutes on your highest-leverage skill', area: 'career', xp: 20, why: 'Focused practice compounds.' },
    { text: 'Write 3 goals and one next step each', area: 'career', xp: 20, why: 'Clarity reduces avoidance.' },
  ],
  social: [
    { text: 'Send a specific appreciation message', area: 'social', xp: 20, why: 'Specific praise strengthens relationships.' },
    { text: 'Ask one person a deeper question and listen', area: 'social', xp: 20, why: 'Presence builds trust.' },
  ],
  habits: [
    { text: 'Reset one physical space for 10 minutes', area: 'habits', xp: 20, why: 'Environment design raises compliance.' },
    { text: 'Track everything you consumed today', area: 'habits', xp: 20, why: 'Measurement interrupts denial.' },
  ],
  purpose: [
    { text: 'Write what you want said at age 75', area: 'purpose', xp: 20, why: 'Legacy clarifies standards.' },
    { text: 'Write from your future self about what matters', area: 'purpose', xp: 20, why: 'Future perspective sharpens direction.' },
  ],
};

