import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Card } from '@/components/ui/Card';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useAuth } from '@/hooks/useAuth';
import { loadOnboardingDraft, saveOnboardingResult } from '@/lib/onboardingDraft';
import { claudeApi } from '@/lib/claude';
import { updateProfile } from '@/lib/profile';
import { calculateArchScores, getWeakAreas } from '@/utils/scoring';

const messages = [
  'Mapping identity baseline...',
  'Computing physical readiness...',
  'Reading mental friction patterns...',
  'Scoring career focus...',
  'Scoring social resilience...',
  'Evaluating financial habits...',
  'Extracting top blockers...',
  'Shaping day-one protocol...',
  'Writing your first coaching frame...',
  'Finalizing personalized momentum model...',
  'Compiling dynamic task suggestions...',
  'Preparing your FORGE welcome...',
];

export default function AnalyzingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const draft = loadOnboardingDraft();

  useEffect(() => {
    if (!draft || !Object.keys(draft).length) {
      navigate('/onboarding/0', { replace: true });
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((value) => Math.min(messages.length - 1, value + 1));
      setProgress((value) => Math.min(96, value + 8));
    }, 500);

    const start = async () => {
      const fallbackScores = calculateArchScores(draft);
      const fallbackResult = {
        archScores: fallbackScores,
        topWeaknesses: getWeakAreas(fallbackScores),
        personalizedGreeting: 'Your protocol is ready. The next 60 days are about evidence, not excuses.',
        keyInsight: 'Your results show that momentum improves when your environment and identity move together.',
        day1TaskAdditions: [],
        alterEgo: {
          name: 'The Builder',
          desc: 'A disciplined version of you who acts before mood catches up.',
          traits: ['deliberate', 'calm', 'consistent'],
        },
      };

      try {
        const response = await Promise.all([
          claudeApi.analyzeQuiz({ answers: draft, fallbackScores }),
          new Promise((resolve) => setTimeout(resolve, 6000)),
        ]).then(([result]) => result);

        const result = {
          ...fallbackResult,
          archScores: response?.archScores ?? fallbackResult.archScores,
          topWeaknesses: response?.topWeaknesses ?? fallbackResult.topWeaknesses,
          personalizedGreeting: response?.personalizedGreeting ?? fallbackResult.personalizedGreeting,
          keyInsight: response?.keyInsight ?? fallbackResult.keyInsight,
          day1TaskAdditions: response?.day1TaskAdditions ?? fallbackResult.day1TaskAdditions,
          alterEgo: response?.alterEgo ?? fallbackResult.alterEgo,
        };

        saveOnboardingResult(result);

        if (user?.id) {
          await updateProfile(user.id, {
            quiz_answers: {
              raw: draft,
              analysis: result,
            },
            arch_scores: result.archScores,
            alter_ego: result.alterEgo,
            custom_habits: draft.custom_habits ?? [],
          });
        }

        setProgress(100);
        navigate('/onboarding/welcome', { replace: true });
      } catch {
        saveOnboardingResult(fallbackResult);
        setProgress(100);
        navigate('/onboarding/welcome', { replace: true });
      } finally {
        window.clearInterval(interval);
      }
    };

    start();
    return () => window.clearInterval(interval);
  }, [draft, navigate, user?.id]);

  return (
    <PageWrapper className="flex min-h-screen items-center justify-center">
      <Card className="w-full p-6 text-center">
        <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-forge-gold/20 bg-forge-gold/10 font-display text-4xl text-forge-gold">
          {progress}%
        </div>
        <div className="section-label mt-4">Analyzing your protocol</div>
        <h1 className="display-title mt-2 text-5xl">Building your FORGE</h1>
        <div className="mt-5 h-2 bg-forge-bg4">
          <div className="h-full bg-forge-gold transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-6 space-y-2 text-left">
          {messages.slice(0, activeIndex + 1).map((message, index) => (
            <div key={message} className={`font-condensed text-xs font-bold uppercase tracking-[0.18em] ${index === activeIndex ? 'text-forge-green' : 'text-forge-muted2'}`}>
              • {message}
            </div>
          ))}
        </div>
      </Card>
    </PageWrapper>
  );
}
