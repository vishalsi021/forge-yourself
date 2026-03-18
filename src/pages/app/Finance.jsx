import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { PageWrapper } from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { financeHabits, incomeStreams, wealthLaws } from '@/data/finance';
import { useAuth } from '@/hooks/useAuth';
import { mergeProfileQuizAnswers } from '@/lib/profile';
import { getTodayDateString } from '@/utils/dateHelpers';

export default function FinancePage() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const todayKey = getTodayDateString();
  const financeLog = profile?.quiz_answers?.financeHabits?.[todayKey] || [];
  const wealthScore = Number(profile?.quiz_answers?.raw?.wealth_0 || 5);

  const financeType = useMemo(() => {
    if (wealthScore < 4) return { name: 'Survival', color: 'text-forge-red', border: 'border-forge-red/20', description: 'You need stability and visibility before complexity. The challenge is building control, not impressing anyone.' };
    if (wealthScore < 7) return { name: 'Builder', color: 'text-forge-gold', border: 'border-forge-gold/20', description: 'You have enough awareness to start building simple systems. The win is consistency, not intensity.' };
    return { name: 'Architect', color: 'text-forge-green', border: 'border-forge-green/20', description: 'You already think in compounding systems. The next move is leverage and disciplined repetition.' };
  }, [wealthScore]);

  const saveMutation = useMutation({
    mutationFn: async (nextHabits) => {
      await mergeProfileQuizAnswers(user.id, (current) => ({
        ...current,
        financeHabits: {
          ...(current.financeHabits || {}),
          [todayKey]: nextHabits,
        },
      }));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth-state'] });
    },
  });

  const financialHealthScore = Math.round((financeLog.length / financeHabits.length) * 100);

  return (
    <PageWrapper>
      <Card className={`p-5 ${financeType.border}`}>
        <div className="section-label mb-2">Money mindset</div>
        <h1 className={`display-title text-5xl ${financeType.color}`}>{financeType.name}</h1>
        <p className="mt-3 text-sm leading-6 text-forge-muted2">{financeType.description}</p>
      </Card>

      <Card className="mt-4 p-5">
        <div className="section-label mb-3">Daily financial habits</div>
        <div className="grid gap-3">
          {financeHabits.map((habit) => {
            const active = financeLog.includes(habit);
            return (
              <button key={habit} type="button" className={`flex items-center justify-between border px-3 py-3 text-left text-sm ${active ? 'border-forge-green bg-forge-green/10 text-forge-green' : 'border-forge-border text-forge-muted2'}`} onClick={() => {
                const next = active ? financeLog.filter((item) => item !== habit) : [...financeLog, habit];
                saveMutation.mutate(next);
              }}>
                <span>{habit}</span>
                <span>{active ? '✓' : '+15 XP'}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <div className="section-label mb-2">Naval’s wealth formula</div>
        <h2 className="display-title text-4xl">Specific Knowledge × Leverage × Accountability</h2>
        <div className="mt-4 grid gap-3 text-sm leading-6 text-forge-muted2">
          <p>Specific knowledge comes from your real curiosity, not borrowed status.</p>
          <p>Leverage means code, media, systems, and assets that keep working after you stop.</p>
          <p>Accountability means your name is attached to your work, which sharpens the standard.</p>
        </div>
        <Input className="mt-4" placeholder="What is your specific knowledge?" defaultValue={profile?.quiz_answers?.specificKnowledge || ''} onBlur={(event) => mergeProfileQuizAnswers(user.id, (current) => ({ ...current, specificKnowledge: event.target.value }))} />
      </Card>

      <Card className="mt-4 p-5">
        <div className="section-label mb-2">The 5 wealth laws</div>
        <div className="grid gap-3">
          {wealthLaws.map((law) => (
            <Card key={law.name} className="bg-forge-bg3 p-4">
              <div className="font-condensed text-xs font-bold uppercase tracking-[0.18em] text-forge-gold">{law.name}</div>
              <div className="mt-2 font-condensed text-sm font-bold uppercase tracking-[0.12em] text-forge-text">{law.title}</div>
              <p className="mt-2 text-sm leading-6 text-forge-muted2">{law.description}</p>
            </Card>
          ))}
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <div className="section-label mb-2">Income streams tracker</div>
        <div className="grid gap-2">
          {incomeStreams.map((item) => (
            <div key={item} className="flex items-center justify-between border border-forge-border px-3 py-3 text-sm text-forge-muted2">
              <span>{item}</span>
              <span className="font-condensed uppercase tracking-[0.16em] text-forge-gold">Planning</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <div className="section-label mb-2">Financial health score</div>
        <div className="font-display text-7xl text-forge-gold">{financialHealthScore}</div>
        <p className="mt-3 text-sm text-forge-muted2">Your financial health score reflects how often you practiced the small behaviors that create control and compounding.</p>
      </Card>
    </PageWrapper>
  );
}
