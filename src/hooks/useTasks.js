import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { enqueueMutation, flushMutationQueue, registerBackgroundSync, registerQueueHandler } from '@/lib/offlineQueue';
import { claudeApi } from '@/lib/claude';
import { saveDayCache, loadDayCache } from '@/lib/dayCache';
import { useTasksStore } from '@/stores/tasksStore';
import { useUiStore } from '@/stores/uiStore';
import { getComboLabel, getLevelFromXp } from '@/utils/xp';

function getIdentityName(profile) {
  const alterEgoName = profile?.alter_ego?.name?.trim();
  if (alterEgoName) return alterEgoName;

  const fullName = profile?.full_name?.trim() || profile?.username?.trim() || '';
  if (fullName) return fullName.split(/\s+/)[0];

  return 'Member';
}

export function useTasks(userId) {
  const queryClient = useQueryClient();
  const pushToast = useUiStore((state) => state.pushToast);
  const setComboLabel = useUiStore((state) => state.setComboLabel);
  const setLevelUp = useUiStore((state) => state.setLevelUp);
  const setLastCompletedTaskId = useTasksStore((state) => state.setLastCompletedTaskId);

  useEffect(() => {
    if (!userId) return undefined;

    let timeoutId;

    const scheduleNextDayRefresh = () => {
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 1, 0);
      const delay = Math.max(1000, nextMidnight.getTime() - now.getTime());

      timeoutId = window.setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['today-state', userId] }).catch(() => null);
        scheduleNextDayRefresh();
      }, delay);
    };

    scheduleNextDayRefresh();

    return () => window.clearTimeout(timeoutId);
  }, [queryClient, userId]);

  useEffect(() => {
    registerQueueHandler('save-day', async (payload) => {
      await claudeApi.ensureDayState({ action: 'save', ...payload });
    });
  }, []);

  useEffect(() => {
    const onFlush = () => flushMutationQueue().catch(() => null);
    window.addEventListener('online', onFlush);
    window.addEventListener('forge:flush-queue', onFlush);

    navigator.serviceWorker?.addEventListener('message', (event) => {
      if (event.data?.type === 'FORGE_FLUSH_QUEUE') {
        onFlush();
      }
    });

    return () => {
      window.removeEventListener('online', onFlush);
      window.removeEventListener('forge:flush-queue', onFlush);
    };
  }, []);

  const todayQuery = useQuery({
    queryKey: ['today-state', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      try {
        const data = await claudeApi.ensureDayState({ action: 'get' });
        saveDayCache(userId, data);
        return data;
      } catch (err) {
        const cached = loadDayCache(userId);
        if (cached) return cached;
        throw err;
      }
    },
    initialData: () => loadDayCache(userId) || undefined,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (!navigator.onLine) {
        await enqueueMutation({ type: 'save-day', payload });
        await registerBackgroundSync().catch(() => null);
        return payload.optimistic;
      }

      return claudeApi.ensureDayState({ action: 'save', ...payload });
    },
    onSuccess: async (data, variables) => {
      queryClient.setQueryData(['today-state', userId], (current) => {
        const nextState = data?.dailyLog ? data : {
          ...(current ?? {}),
          ...(variables.optimistic ?? {}),
        };
        saveDayCache(userId, nextState);
        return nextState;
      });

      const completedCount = data?.dailyLog?.tasks?.filter((task) => task.done).length ?? 0;
      const combo = getComboLabel(completedCount);
      if (combo) setComboLabel(combo);

      const level = getLevelFromXp(data?.streak?.total_xp ?? 0);
      if (level.level > (variables.previousLevel ?? 1)) {
        setLevelUp(level);
      }

      await queryClient.invalidateQueries({ queryKey: ['today-state', userId] });
    },
    onError: (error) => {
      pushToast({ title: error.message || 'Unable to save your progress', variant: 'error' });
    },
  });

  const toggleTask = async (taskId) => {
    const current = todayQuery.data;
    if (!current?.dailyLog) return;

    const tasks = current.dailyLog.tasks.map((task) =>
      task.id === taskId ? { ...task, done: !task.done } : task,
    );
    const doneTask = tasks.find((task) => task.id === taskId);
    const previousLevel = getLevelFromXp(current?.streak?.total_xp ?? 0).level;
    const identityName = getIdentityName(current?.profile);

    setLastCompletedTaskId(taskId);
    pushToast({ title: `+${doneTask?.xp ?? 0} XP � ${identityName} expected this`, variant: 'success' });

    await saveMutation.mutateAsync({
      dailyLogId: current.dailyLog.id,
      tasks,
      dayRating: current.dailyLog.day_rating,
      notes: current.dailyLog.notes,
      previousLevel,
      optimistic: {
        ...current,
        dailyLog: { ...current.dailyLog, tasks },
      },
    });
  };

  const setDayRating = async (dayRating) => {
    const current = todayQuery.data;
    if (!current?.dailyLog) return;

    await saveMutation.mutateAsync({
      dailyLogId: current.dailyLog.id,
      tasks: current.dailyLog.tasks,
      dayRating,
      notes: current.dailyLog.notes,
      previousLevel: getLevelFromXp(current?.streak?.total_xp ?? 0).level,
      optimistic: {
        ...current,
        dailyLog: { ...current.dailyLog, day_rating: dayRating },
      },
    });
  };

  const saveNotes = async (notes) => {
    const current = todayQuery.data;
    if (!current?.dailyLog) return;

    await saveMutation.mutateAsync({
      dailyLogId: current.dailyLog.id,
      tasks: current.dailyLog.tasks,
      dayRating: current.dailyLog.day_rating,
      notes,
      previousLevel: getLevelFromXp(current?.streak?.total_xp ?? 0).level,
      optimistic: {
        ...current,
        dailyLog: { ...current.dailyLog, notes },
      },
    });
  };

  return {
    ...todayQuery,
    dailyLog: todayQuery.data?.dailyLog ?? null,
    streak: todayQuery.data?.streak ?? null,
    profile: todayQuery.data?.profile ?? null,
    toggleTask,
    setDayRating,
    saveNotes,
    saveLoading: saveMutation.isPending,
  };
}
