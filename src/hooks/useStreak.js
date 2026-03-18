import { useEffect } from 'react';

import { useStreakStore } from '@/stores/streakStore';

export function useStreak(streak) {
  const setMilestone = useStreakStore((state) => state.setMilestone);

  useEffect(() => {
    if (!streak?.current_streak) return;

    if ([7, 14, 30, 60].includes(streak.current_streak)) {
      setMilestone({
        streak: streak.current_streak,
        label: `${streak.current_streak}-Day Milestone`,
      });
    }
  }, [setMilestone, streak?.current_streak]);
}
