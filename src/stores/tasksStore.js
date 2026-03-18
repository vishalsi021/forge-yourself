import { create } from 'zustand';

export const useTasksStore = create((set) => ({
  lastCompletedTaskId: null,
  setLastCompletedTaskId(lastCompletedTaskId) {
    set({ lastCompletedTaskId });
  },
}));
