import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { PageWrapper } from '@/components/layout/PageWrapper';
import { ArchBars } from '@/components/shared/ArchBars';
import { XPBar } from '@/components/shared/XPBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { claudeApi } from '@/lib/claude';
import { supabase } from '@/lib/supabase';

async function fetchProgress(userId) {
  const { data: dailyLogs, error: logsError } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .order('day_number', { ascending: true });
  if (logsError) throw logsError;

  const { data: streak, error: streakError } = await supabase.from('streaks').select('*').eq('user_id', userId).single();
  if (streakError) throw streakError;

  const { data: reviews, error: reviewsError } = await supabase
    .from('weekly_reviews')
    .select('*')
    .eq('user_id', userId)
    .order('week_number', { ascending: true });
  if (reviewsError) throw reviewsError;

  return { dailyLogs: dailyLogs || [], streak, reviews: reviews || [] };
}

function ProgressSkeleton() {
  return (
    <PageWrapper>
      <Card className="p-6">
        <Skeleton className="mx-auto h-16 w-32" />
        <Skeleton className="mx-auto mt-3 h-4 w-40" />
        <div className="mt-5 grid grid-cols-3 gap-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </Card>
      <Card className="mt-4 p-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-32 w-full" />
      </Card>
      <Card className="mt-4 p-5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-24 w-full" />
      </Card>
    </PageWrapper>
  );
}

function computeDimensionScores(dailyLogs) {
  const areas = ['mind', 'career', 'habits', 'social', 'fitness', 'purpose'];
  const done = {};
  const total = {};
  areas.forEach((a) => { done[a] = 0; total[a] = 0; });

  dailyLogs.forEach((log) => {
    (log.tasks || []).forEach((task) => {
      const area = task.area === 'custom' ? 'habits' : (task.area || 'purpose');
      if (total[area] !== undefined) {
        total[area] += 1;
        if (task.done) done[area] += 1;
      }
    });
  });

  const scores = {};
  areas.forEach((area) => {
    scores[area] = total[area] > 0 ? (done[area] / total[area]) * 10 : 0;
  });
  return scores;
}

export default function ProgressPage() {
  const { user, profile } = useAuth();
  const [selectedDay, setSelectedDay] = useState(null);
  const progressQuery = useQuery({
    queryKey: ['progress', user?.id],
    enabled: Boolean(user?.id),
    queryFn: () => fetchProgress(user.id),
  });

  const missedPatternQuery = useQuery({
    queryKey: ['missed-pattern', user?.id, progressQuery.data?.dailyLogs?.length],
    enabled: Boolean(progressQuery.data?.dailyLogs?.length),
    queryFn: async () => {
      const misses = {};
      progressQuery.data.dailyLogs.forEach((log) => {
        (log.tasks || []).filter((task) => !task.done).forEach((task) => {
          misses[task.text] = (misses[task.text] || 0) + 1;
        });
      });
      const top3MissedTasks = Object.entries(misses)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([task]) => task);
      if (!top3MissedTasks.length) return { insight: 'No consistent missed-task pattern yet.' };
      return claudeApi.missedPattern({ top3MissedTasks });
    },
  });

  const progress = useMemo(() => {
    const dailyLogs = progressQuery.data?.dailyLogs || [];
    const tasks = dailyLogs.flatMap((log) => log.tasks || []);
    const doneTasks = tasks.filter((task) => task.done).length;
    const avgRating = dailyLogs.filter((log) => log.day_rating).reduce((sum, log, _, array) => sum + log.day_rating / array.length, 0);

    const avgTasksPerDay = dailyLogs.length > 0 ? (tasks.length / dailyLogs.length) : 15;
    const expectedTotalTasks60Days = Math.round(avgTasksPerDay * 60);

    return {
      dailyLogs,
      totalTasks: tasks.length,
      doneTasks,
      completion: expectedTotalTasks60Days > 0 ? Math.round((doneTasks / expectedTotalTasks60Days) * 100) : 0,
      avgRating: avgRating ? avgRating.toFixed(1) : '—',
    };
  }, [progressQuery.data?.dailyLogs]);

  const dimensionScores = useMemo(() => {
    return computeDimensionScores(progressQuery.data?.dailyLogs || []);
  }, [progressQuery.data?.dailyLogs]);

  if (progressQuery.isLoading) {
    return <ProgressSkeleton />;
  }

  if (progressQuery.isError) {
    return (
      <PageWrapper>
        <Card className="p-5">
          <div className="section-label mb-2 text-forge-red">Unable to load progress</div>
          <p className="text-sm text-forge-muted2">{progressQuery.error?.message || 'Something went wrong.'}</p>
          <Button className="mt-4 w-full" onClick={() => progressQuery.refetch()}>Tap to retry</Button>
        </Card>
      </PageWrapper>
    );
  }

  const hasData = progress.dailyLogs.length > 0;

  const skippedTasks = hasData ? Object.entries(
    progress.dailyLogs.reduce((acc, log) => {
      (log.tasks || []).filter((task) => !task.done).forEach((task) => {
        acc[task.text] = (acc[task.text] || 0) + 1;
      });
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5) : [];

  return (
    <PageWrapper>
      {/* Hero stats */}
      <Card className="p-6 text-center">
        <div className="font-display text-7xl text-forge-gold">{progress.completion}%</div>
        <div className="section-label mt-2">60-Day completion</div>
        {hasData ? (
          <p className="mt-3 text-sm text-forge-muted2">{progress.doneTasks} tasks done · {progress.dailyLogs.length} days tracked</p>
        ) : (
          <p className="mt-3 text-sm text-forge-muted2">Complete tasks on the Today tab to see your progress grow.</p>
        )}
        <div className="mt-5 grid grid-cols-3 gap-2">
          <Card className="bg-forge-bg3 p-3 text-center"><div className="font-display text-3xl text-forge-orange">{progressQuery.data?.streak?.best_streak || 0}</div><div className="section-label mt-1">Best streak</div></Card>
          <Card className="bg-forge-bg3 p-3 text-center"><div className="font-display text-3xl text-forge-gold">{progress.avgRating}</div><div className="section-label mt-1">Avg rating</div></Card>
          <Card className="bg-forge-bg3 p-3 text-center"><div className="font-display text-3xl text-forge-blue">{progress.dailyLogs.length}</div><div className="section-label mt-1">Active days</div></Card>
        </div>
      </Card>

      {/* 60-day calendar */}
      <Card className="mt-4 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="section-label">60-day calendar</div>
          <Badge>Tap a day</Badge>
        </div>
        <div className="grid grid-cols-10 gap-1">
          {Array.from({ length: 60 }, (_, index) => {
            const dayNumber = index + 1;
            const log = progress.dailyLogs.find((item) => item.day_number === dayNumber);
            const completed = log?.tasks?.filter((task) => task.done).length || 0;
            const total = log?.tasks?.length || 0;
            const dayPct = total > 0 ? Math.round((completed / total) * 100) : 0;
            const state = !log ? 'future' : completed === total && total > 0 ? 'full' : completed > 0 ? 'partial' : 'missed';
            const classes = state === 'full' ? 'bg-forge-green text-black' : state === 'partial' ? 'bg-forge-green/20 text-forge-green' : state === 'missed' ? 'bg-forge-red/10 text-forge-red' : 'bg-forge-bg4 text-forge-muted';
            return (
              <button
                key={dayNumber}
                className={`aspect-square border text-xs font-display ${classes}`}
                onClick={() => setSelectedDay(log ? { ...log, _pct: dayPct } : { day_number: dayNumber, tasks: [], _future: true })}
              >
                {dayNumber}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Day detail */}
      {selectedDay ? (
        <Card className="mt-4 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="display-title text-3xl">Day {selectedDay.day_number}</div>
            {selectedDay._future ? (
              <Badge>Upcoming</Badge>
            ) : (
              <Badge variant={selectedDay._pct === 100 ? 'green' : selectedDay._pct > 0 ? 'blue' : 'default'}>
                {selectedDay._pct != null ? `${selectedDay._pct}%` : (selectedDay.day_rating || 'No rating')}
              </Badge>
            )}
          </div>
          {selectedDay._future ? (
            <p className="text-sm text-forge-muted2">This day hasn't started yet. Keep showing up and you'll get here.</p>
          ) : (selectedDay.tasks || []).length > 0 ? (
            <div className="grid gap-2">
              {(selectedDay.tasks || []).map((task) => (
                <div key={task.id} className="flex items-center justify-between border-b border-forge-border py-2 text-sm">
                  <span className={task.done ? 'text-forge-green' : 'text-forge-muted2'}>{task.done ? '✓' : '✗'} {task.text}</span>
                  <span className={`text-xs font-bold ${task.done ? 'text-forge-green' : 'text-forge-red'}`}>{task.done ? `+${task.xp || 0} XP` : 'Missed'}</span>
                </div>
              ))}
              {selectedDay.notes ? (
                <p className="mt-2 border-t border-forge-border pt-3 text-sm italic text-forge-muted2">"{selectedDay.notes}"</p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-forge-muted2">No tasks recorded for this day.</p>
          )}
        </Card>
      ) : null}

      {/* Live dimension breakdown from actual task data */}
      <Card className="mt-4 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="section-label">Dimension breakdown (All days)</div>
          {hasData ? <Badge>{progress.dailyLogs.length}d tracked</Badge> : null}
        </div>
        <ArchBars scores={dimensionScores} />
      </Card>

      {/* Daily ratings bar chart */}
      <Card className="mt-4 p-5">
        <div className="section-label mb-3">Daily ratings</div>
        {hasData && progress.dailyLogs.some((log) => log.day_rating) ? (
          <div className="flex h-28 items-end gap-1">
            {progress.dailyLogs.slice(-30).map((log) => {
              const value = log.day_rating || 0;
              const color = value >= 8 ? 'bg-forge-green' : value >= 6 ? 'bg-forge-gold' : value >= 4 ? 'bg-forge-orange' : 'bg-forge-bg4';
              return <div key={log.id} className={`flex-1 ${color}`} style={{ height: `${Math.max(8, value * 10)}%` }} title={`Day ${log.day_number}: ${value || 'N/A'}`} />;
            })}
          </div>
        ) : (
          <p className="text-sm text-forge-muted2">Rate your days on the Today tab to see your trend here.</p>
        )}
      </Card>

      {/* Pattern detection */}
      {hasData && skippedTasks.length > 0 ? (
        <Card className="mt-4 border border-forge-red/20 bg-forge-red/5 p-5">
          <div className="section-label mb-3 text-forge-red">Pattern detection</div>
          <div className="grid gap-3">
            {skippedTasks.map(([task, count]) => (
              <div key={task} className="grid grid-cols-[1fr_60px] items-center gap-3">
                <div>
                  <div className="text-sm text-forge-text">{task}</div>
                  <div className="mt-1 h-1 bg-forge-bg4"><div className="h-full bg-forge-red" style={{ width: `${Math.min(100, (count / Math.max(progress.dailyLogs.length, 1)) * 100)}%` }} /></div>
                </div>
                <div className="font-display text-2xl text-forge-red">{count}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-forge-muted2">{missedPatternQuery.data?.insight || 'Gathering your strongest resistance pattern...'}</p>
        </Card>
      ) : null}

      {/* Weekly performance */}
      <Card className="mt-4 p-5">
        <div className="section-label mb-3">Weekly performance</div>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 8 }, (_, index) => {
            const weekLogs = progress.dailyLogs.filter((log) => Math.ceil(log.day_number / 7) === index + 1);
            const weekTasks = weekLogs.flatMap((log) => log.tasks || []);
            const weekDone = weekTasks.filter((t) => t.done).length;
            const weekPct = weekTasks.length > 0 ? Math.round((weekDone / weekTasks.length) * 100) : 0;
            const tone = weekPct >= 80 ? 'bg-forge-green' : weekPct >= 50 ? 'bg-forge-gold' : weekPct > 0 ? 'bg-forge-orange' : 'bg-forge-bg4';
            const textTone = weekPct >= 50 ? 'text-black' : 'text-forge-text';
            return (
              <div key={index} className={`border border-forge-border p-3 text-center ${tone} ${textTone}`}>
                <div className="font-display text-2xl">W{index + 1}</div>
                <div className="font-condensed text-[0.6rem] font-bold uppercase tracking-[0.12em] mt-1 !text-current">
                  {weekLogs.length > 0 ? `${weekPct}%` : '—'}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </PageWrapper>
  );
}
