import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { PageWrapper } from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useUiStore } from '@/stores/uiStore';
import { getTodayDateString } from '@/utils/dateHelpers';

const challengeSchema = z.object({
  title: z.string().min(3, 'Give the challenge a real title.'),
  description: z.string().min(10, 'Add a little context so people know what they are joining.'),
  habits: z.string().min(3, 'List at least one habit.'),
  duration_days: z.coerce.number().int().min(3).max(60),
});

async function recountChallengeParticipants(challengeId) {
  const { count, error: countError } = await supabase
    .from('challenge_participants')
    .select('id', { count: 'exact', head: true })
    .eq('challenge_id', challengeId);

  if (countError) throw countError;

  const { error: updateError } = await supabase
    .from('challenges')
    .update({ participant_count: count || 0 })
    .eq('id', challengeId);

  if (updateError) throw updateError;
}

export default function SocialPage() {
  const enabled = useUiStore((state) => state.featureFlags.social);
  const pushToast = useUiStore((state) => state.pushToast);
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  const [partnerSearch, setPartnerSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');

  const socialQuery = useQuery({
    queryKey: ['social-row', user?.id],
    enabled: enabled && Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase.from('social').select('*').eq('user_id', user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const partnerQuery = useQuery({
    queryKey: ['partner-search', submittedSearch],
    enabled: enabled && Boolean(submittedSearch),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name')
        .ilike('username', `%${submittedSearch}%`)
        .limit(5);

      if (error) throw error;
      return (data || []).filter((item) => item.id !== user.id);
    },
  });

  const partnerProfileQuery = useQuery({
    queryKey: ['partner-profile', socialQuery.data?.partner_id],
    enabled: enabled && Boolean(socialQuery.data?.partner_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name')
        .eq('id', socialQuery.data.partner_id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const publicChallengesQuery = useQuery({
    queryKey: ['public-challenges'],
    enabled: enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_public', true)
        .order('start_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
  });

  const myChallengesQuery = useQuery({
    queryKey: ['my-challenges', user?.id],
    enabled: enabled && Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenge_participants')
        .select('*, challenges(*)')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const leaderboardQuery = useQuery({
    queryKey: ['leaderboard'],
    enabled: enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_leaderboard');
      if (error) throw error;
      return data || [];
    },
  });

  const myStreakQuery = useQuery({
    queryKey: ['my-streak', user?.id],
    enabled: enabled && Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase.from('streaks').select('*').eq('user_id', user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const setPartnerMutation = useMutation({
    mutationFn: async (partnerId) => {
      const { error } = await supabase.from('social').upsert({ user_id: user.id, partner_id: partnerId }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['social-row', user?.id] });
      pushToast({ title: 'Accountability partner updated', variant: 'success' });
    },
    onError: (error) => {
      pushToast({ title: error.message || 'Unable to update accountability partner', variant: 'error' });
    },
  });

  const joinChallengeMutation = useMutation({
    mutationFn: async (challengeId) => {
      const { error } = await supabase
        .from('challenge_participants')
        .upsert({ challenge_id: challengeId, user_id: user.id }, { onConflict: 'challenge_id,user_id' });

      if (error) throw error;
      await recountChallengeParticipants(challengeId);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['public-challenges'] }),
        queryClient.invalidateQueries({ queryKey: ['my-challenges', user?.id] }),
      ]);
      pushToast({ title: 'Challenge joined', variant: 'success' });
    },
    onError: (error) => {
      pushToast({ title: error.message || 'Unable to join challenge', variant: 'error' });
    },
  });

  const challengeForm = useForm({
    resolver: zodResolver(challengeSchema),
    defaultValues: {
      title: '',
      description: '',
      habits: '',
      duration_days: 14,
    },
  });

  const createChallengeMutation = useMutation({
    mutationFn: async (values) => {
      const habitIds = values.habits
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      const { data, error } = await supabase
        .from('challenges')
        .insert({
          creator_id: user.id,
          title: values.title.trim(),
          description: values.description.trim(),
          habit_ids: habitIds,
          duration_days: values.duration_days,
          start_date: getTodayDateString(),
          participant_count: 1,
          is_public: true,
        })
        .select()
        .single();

      if (error) throw error;

      const { error: joinError } = await supabase.from('challenge_participants').insert({
        challenge_id: data.id,
        user_id: user.id,
      });

      if (joinError) throw joinError;
      return data;
    },
    onSuccess: async () => {
      challengeForm.reset();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['public-challenges'] }),
        queryClient.invalidateQueries({ queryKey: ['my-challenges', user?.id] }),
      ]);
      pushToast({ title: 'Challenge created', variant: 'success' });
    },
    onError: (error) => {
      pushToast({ title: error.message || 'Unable to create challenge', variant: 'error' });
    },
  });

  if (!enabled) {
    return (
      <PageWrapper>
        <Card className="p-6">
          <div className="section-label mb-2">Social</div>
          <h1 className="display-title text-5xl">Release 2</h1>
          <p className="mt-3 text-sm leading-6 text-forge-muted2">
            The production-ready social surfaces are built behind a flag now. Enable `VITE_ENABLE_SOCIAL=true` after QA if you want partners, challenges, and the leaderboard live in the app shell.
          </p>
        </Card>
      </PageWrapper>
    );
  }

  const shareSummary = `${profile?.full_name || 'FORGE Member'} - Level ${myStreakQuery.data?.level || 1} - ${myStreakQuery.data?.current_streak || 0} day streak - Day ${myStreakQuery.data?.current_day || 1} of 60`;

  return (
    <PageWrapper>
      <Card className="p-5">
        <div className="section-label mb-2">Accountability partner</div>
        <p className="text-sm leading-6 text-forge-muted2">
          Commitment to another human dramatically increases follow-through. Search by username, set a partner, and keep the signal visible.
        </p>
        <div className="mt-4 flex gap-2">
          <Input value={partnerSearch} onChange={(event) => setPartnerSearch(event.target.value)} placeholder="Search username" />
          <Button variant="secondary" onClick={() => setSubmittedSearch(partnerSearch.trim())}>Search</Button>
        </div>
        {partnerProfileQuery.data ? (
          <div className="mt-4 border border-forge-border px-3 py-3 text-sm text-forge-muted2">
            Current partner: <span className="text-forge-text">{partnerProfileQuery.data.full_name || partnerProfileQuery.data.username}</span>
          </div>
        ) : null}
        <div className="mt-4 grid gap-2">
          {(partnerQuery.data || []).map((item) => (
            <div key={item.id} className="flex items-center justify-between border border-forge-border px-3 py-3 text-sm text-forge-muted2">
              <div>
                <div className="text-forge-text">{item.full_name || item.username}</div>
                <div className="text-xs uppercase tracking-[0.18em]">{item.username}</div>
              </div>
              <Button variant="secondary" onClick={() => setPartnerMutation.mutate(item.id)}>Set Partner</Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <div className="section-label mb-2">Community challenges</div>
        <div className="grid gap-3">
          {(publicChallengesQuery.data || []).map((challenge) => (
            <div key={challenge.id} className="border border-forge-border px-3 py-3">
              <div className="font-condensed text-xs font-bold uppercase tracking-[0.18em] text-forge-gold">{challenge.participant_count} participants</div>
              <div className="mt-2 font-display text-3xl text-forge-text">{challenge.title}</div>
              <p className="mt-2 text-sm leading-6 text-forge-muted2">{challenge.description}</p>
              <div className="mt-3 text-xs uppercase tracking-[0.18em] text-forge-muted2">{challenge.duration_days} days</div>
              <Button className="mt-4 w-full" variant="secondary" onClick={() => joinChallengeMutation.mutate(challenge.id)}>
                Join Challenge
              </Button>
            </div>
          ))}
        </div>

        <form
          className="mt-5 grid gap-3"
          onSubmit={challengeForm.handleSubmit(async (values) => {
            await createChallengeMutation.mutateAsync(values);
          })}
        >
          <div className="section-label">Create challenge</div>
          <Input placeholder="Challenge title" {...challengeForm.register('title')} />
          {challengeForm.formState.errors.title ? <p className="text-xs text-forge-red">{challengeForm.formState.errors.title.message}</p> : null}
          <Textarea placeholder="What is this challenge about?" {...challengeForm.register('description')} />
          {challengeForm.formState.errors.description ? <p className="text-xs text-forge-red">{challengeForm.formState.errors.description.message}</p> : null}
          <Input placeholder="Habits, comma separated" {...challengeForm.register('habits')} />
          {challengeForm.formState.errors.habits ? <p className="text-xs text-forge-red">{challengeForm.formState.errors.habits.message}</p> : null}
          <Input type="number" min="3" max="60" placeholder="Duration in days" {...challengeForm.register('duration_days')} />
          {challengeForm.formState.errors.duration_days ? <p className="text-xs text-forge-red">{challengeForm.formState.errors.duration_days.message}</p> : null}
          <Button type="submit">Create Public Challenge</Button>
        </form>
      </Card>

      <Card className="mt-4 p-5">
        <div className="section-label mb-2">Leaderboard</div>
        <div className="grid gap-2">
          {(leaderboardQuery.data || []).slice(0, 10).map((item, index) => (
            <div key={item.id} className={`flex items-center justify-between border px-3 py-3 text-sm ${item.id === user.id ? 'border-forge-gold bg-forge-gold/10' : 'border-forge-border'}`}>
              <div>
                <div className="font-condensed text-xs font-bold uppercase tracking-[0.18em] text-forge-muted2">#{index + 1}</div>
                <div className="text-forge-text">{item.full_name || item.username || 'FORGE Member'}</div>
              </div>
              <div className="text-right text-forge-muted2">
                <div>{item.current_streak} streak</div>
                <div>Level {item.level}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <div className="section-label mb-2">Shareable progress card</div>
        <div className="border border-forge-gold/30 bg-forge-gold/10 px-4 py-4 text-sm leading-6 text-forge-text">
          {shareSummary}
        </div>
        <div className="mt-4 grid gap-2">
          {(myChallengesQuery.data || []).slice(0, 3).map((entry) => (
            <div key={entry.id} className="border border-forge-border px-3 py-3 text-sm text-forge-muted2">
              Active challenge: <span className="text-forge-text">{entry.challenges?.title || 'Untitled challenge'}</span>
            </div>
          ))}
        </div>
        <Button
          className="mt-4 w-full"
          variant="secondary"
          onClick={async () => {
            await navigator.clipboard.writeText(shareSummary);
            pushToast({ title: 'Progress summary copied', variant: 'success' });
          }}
        >
          Copy Share Summary
        </Button>
      </Card>
    </PageWrapper>
  );
}
