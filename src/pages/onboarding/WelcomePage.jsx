import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { PageWrapper } from '@/components/layout/PageWrapper';
import { ArchBars } from '@/components/shared/ArchBars';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { clearOnboardingDraft, clearOnboardingResult, loadOnboardingResult } from '@/lib/onboardingDraft';
import { updateProfile } from '@/lib/profile';

function WelcomeSkeleton() {
  return (
    <PageWrapper>
      <Card className="p-6">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-4 h-12 w-3/4" />
        <Skeleton className="mt-4 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-5/6" />
      </Card>

      <Card className="mt-4 p-6">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-4 h-40 w-full" />
      </Card>

      <Card className="mt-4 p-6">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="mt-4 h-10 w-1/2" />
        <Skeleton className="mt-3 h-4 w-full" />
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      </Card>

      <Skeleton className="mt-4 h-12 w-full" />
    </PageWrapper>
  );
}

export default function WelcomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile, user, authLoading, isError, error, refetch } = useAuth();
  const result = loadOnboardingResult() || profile?.quiz_answers?.analysis;

  const startMutation = useMutation({
    mutationFn: async () => {
      return updateProfile(user.id, {
        onboarding_complete: true,
        arch_scores: result?.archScores,
        alter_ego: result?.alterEgo,
        custom_habits: profile?.custom_habits ?? profile?.quiz_answers?.raw?.custom_habits ?? [],
      });
    },
    onSuccess: async (updatedProfile) => {
      queryClient.setQueryData(['auth-state'], (current) => ({
        ...(current ?? {}),
        user: current?.user ?? user ?? null,
        session: current?.session ?? null,
        profile: updatedProfile,
        redirectTo: '/app/today',
      }));
      clearOnboardingDraft();
      clearOnboardingResult();
      await queryClient.invalidateQueries({ queryKey: ['auth-state'] });
      navigate('/app/today', { replace: true });
    },
  });

  if ((authLoading && !result) || (!user && !result)) {
    return <WelcomeSkeleton />;
  }

  if (isError && !result) {
    return (
      <PageWrapper>
        <Card className="p-6">
          <div className="section-label mb-2 text-forge-red">Unable to load onboarding</div>
          <p className="text-sm text-forge-muted2">{error?.message || 'Your onboarding data did not load correctly.'}</p>
          <Button className="mt-4 w-full" onClick={() => refetch()}>
            Tap to retry
          </Button>
        </Card>
      </PageWrapper>
    );
  }

  if (!result) {
    return (
      <PageWrapper>
        <Card className="p-6">
          <div className="section-label mb-2">No analysis yet</div>
          <h1 className="display-title text-4xl">Let’s restart onboarding.</h1>
          <Button className="mt-4 w-full" onClick={() => navigate('/onboarding/0')}>Back to onboarding</Button>
        </Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Card className="p-6">
        <div className="section-label mb-2">Your protocol is ready</div>
        <h1 className="display-title text-5xl">Welcome to day one</h1>
        <p className="mt-3 text-sm leading-6 text-forge-muted2">{result.personalizedGreeting}</p>
        <p className="mt-3 border-l-2 border-l-forge-gold pl-3 text-sm leading-6 text-forge-text">{result.keyInsight}</p>
      </Card>

      <Card className="mt-4 p-6">
        <div className="section-label mb-2">Arch scores</div>
        <ArchBars scores={result.archScores} />
      </Card>

      <Card className="mt-4 p-6">
        <div className="section-label mb-2">Suggested alter ego</div>
        <h2 className="display-title text-4xl">{result.alterEgo?.name}</h2>
        <p className="mt-2 text-sm leading-6 text-forge-muted2">{result.alterEgo?.desc}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(result.alterEgo?.traits ?? []).map((trait) => (
            <span key={trait} className="border border-forge-gold/20 bg-forge-gold/10 px-2 py-1 font-condensed text-xs font-bold uppercase tracking-[0.16em] text-forge-gold">
              {trait}
            </span>
          ))}
        </div>
      </Card>

      <Card className="mt-4 p-6">
        <div className="section-label mb-2">Day 1 additions</div>
        <div className="font-display text-5xl text-forge-gold">{(result.day1TaskAdditions ?? []).length + 15}</div>
        <p className="mt-2 text-sm text-forge-muted2">Total tasks queued for day one, including core behaviors and personalized additions.</p>
      </Card>

      <Button className="mt-4 w-full" onClick={() => startMutation.mutate()} disabled={authLoading || !user?.id || startMutation.isPending}>
        Start Day 1
      </Button>
    </PageWrapper>
  );
}
