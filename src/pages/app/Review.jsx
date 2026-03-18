import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { PageWrapper } from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/hooks/useAuth';
import { claudeApi } from '@/lib/claude';
import { supabase } from '@/lib/supabase';
import { getWeekNumber } from '@/utils/dateHelpers';

function getFirstName(profile, user) {
  const fullName = profile?.full_name?.trim();
  if (fullName) return fullName.split(/\s+/)[0];

  const emailName = user?.email?.split('@')?.[0]?.trim();
  if (emailName) return emailName;

  return 'Member';
}

export default function ReviewPage() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();

  const reviewsQuery = useQuery({
    queryKey: ['weekly-reviews', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_reviews')
        .select('*')
        .eq('user_id', user.id)
        .order('week_number', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const streakQuery = useQuery({
    queryKey: ['streak', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase.from('streaks').select('*').eq('user_id', user.id).single();
      if (error) throw error;
      return data;
    },
  });

  const dayNumber = streakQuery.data?.current_day || 1;
  const weekNumber = getWeekNumber(dayNumber);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      wins: '',
      proud_of: '',
      missed: '',
      lessons: '',
      next_focus: '',
      drop_habit: '',
      add_action: '',
      deep_reflection: '',
      discipline_rating: 7,
      top_actions_0: '',
      top_actions_1: '',
      top_actions_2: '',
      top_actions_3: '',
      top_actions_4: '',
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values) => {
      const topActions = [values.top_actions_0, values.top_actions_1, values.top_actions_2, values.top_actions_3, values.top_actions_4].filter(Boolean);
      const coaching = await claudeApi.weeklyCoach({
        weekData: values,
        alterEgoName: profile?.alter_ego?.name || '',
        firstName: getFirstName(profile, user),
      });
      const payload = {
        user_id: user.id,
        week_number: weekNumber,
        wins: values.wins,
        proud_of: values.proud_of,
        missed: values.missed,
        lessons: values.lessons,
        next_focus: values.next_focus,
        drop_habit: values.drop_habit,
        add_action: values.add_action,
        deep_reflection: values.deep_reflection,
        discipline_rating: Number(values.discipline_rating),
        top_actions: topActions,
        alter_ego_feedback: coaching.coachMessage,
      };

      const { error } = await supabase.from('weekly_reviews').upsert(payload, { onConflict: 'user_id,week_number' });
      if (error) throw error;
      return coaching;
    },
    onSuccess: async () => {
      reset();
      await queryClient.invalidateQueries({ queryKey: ['weekly-reviews', user?.id] });
    },
  });

  const headerStats = useMemo(() => {
    const reviews = reviewsQuery.data || [];
    return {
      tasksDone: streakQuery.data?.total_tasks_done || 0,
      avgRating: reviews.length ? (reviews.reduce((sum, review) => sum + (review.discipline_rating || 0), 0) / reviews.length).toFixed(1) : '—',
      streak: streakQuery.data?.current_streak || 0,
    };
  }, [reviewsQuery.data, streakQuery.data]);

  return (
    <PageWrapper>
      <Card className="p-5">
        <div className="section-label mb-2">Week {weekNumber} review</div>
        <h1 className="display-title text-5xl">Lock in the week</h1>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Card className="bg-forge-bg3 p-3 text-center"><div className="font-display text-3xl text-forge-green">{headerStats.tasksDone}</div><div className="section-label mt-1">Tasks done</div></Card>
          <Card className="bg-forge-bg3 p-3 text-center"><div className="font-display text-3xl text-forge-gold">{headerStats.avgRating}</div><div className="section-label mt-1">Avg rating</div></Card>
          <Card className="bg-forge-bg3 p-3 text-center"><div className="font-display text-3xl text-forge-orange">{headerStats.streak}</div><div className="section-label mt-1">Streak</div></Card>
        </div>
      </Card>

      <form className="mt-4 grid gap-4" onSubmit={handleSubmit((values) => saveMutation.mutate(values))}>
        <Card className="p-5"><div className="section-label mb-2 text-forge-green">Wins</div><Textarea placeholder="What went well?" {...register('wins')} /><Textarea className="mt-4" placeholder="What are you most proud of?" {...register('proud_of')} /></Card>
        <Card className="p-5"><div className="section-label mb-2 text-forge-red">Losses & lessons</div><Textarea placeholder="What did you miss or avoid?" {...register('missed')} /><Textarea className="mt-4" placeholder="What pattern keeps showing up?" {...register('lessons')} /></Card>
        <Card className="p-5"><div className="section-label mb-2 text-forge-gold">Next week</div><Textarea placeholder="One major focus" {...register('next_focus')} /><Input placeholder="One habit you will drop" {...register('drop_habit')} /><Input placeholder="One new action you will add" {...register('add_action')} /></Card>
        <Card className="p-5"><div className="section-label mb-2 text-forge-purple">Deep reflection</div><Textarea placeholder="Who did you become this week vs last week?" {...register('deep_reflection')} /><Input type="number" min="1" max="10" placeholder="Discipline rating" {...register('discipline_rating')} /></Card>
        <Card className="p-5"><div className="section-label mb-2">Top 5 actions for next week</div><div className="grid gap-3">{Array.from({ length: 5 }, (_, index) => <Input key={index} placeholder={`Action ${index + 1}`} {...register(`top_actions_${index}`)} />)}</div></Card>
        <Button type="submit" className="w-full">Lock In This Week’s Review</Button>
      </form>

      <Card className="mt-4 p-5">
        <div className="section-label mb-2">Past reviews</div>
        <div className="grid gap-3">
          {(reviewsQuery.data || []).map((review) => (
            <Card key={review.id} className="bg-forge-bg3 p-4">
              <div className="flex items-center justify-between">
                <div className="font-condensed text-xs font-bold uppercase tracking-[0.18em] text-forge-text">Week {review.week_number} · Saved</div>
                <div className="text-sm text-forge-gold">{review.discipline_rating}/10</div>
              </div>
              <p className="mt-3 text-sm text-forge-muted2">{review.alter_ego_feedback || review.next_focus}</p>
            </Card>
          ))}
        </div>
      </Card>
    </PageWrapper>
  );
}
