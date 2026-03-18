import { create } from 'zustand';

export const useStreakStore = create((set) => ({
  milestone: null,
  setMilestone(milestone) {
    set({ milestone });
  },
  clearMilestone() {
    set({ milestone: null });
  },
}));
