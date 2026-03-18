import { create } from 'zustand';

export const useUserStore = create((set) => ({
  session: null,
  user: null,
  profile: null,
  setAuthState(payload) {
    set(payload);
  },
  clearAuthState() {
    set({ session: null, user: null, profile: null });
  },
}));
