import { create } from 'zustand';

export const useUiStore = create((set) => ({
  toasts: [],
  comboLabel: '',
  levelUp: null,
  authMessage: '',
  installPromptEvent: null,
  isOffline: false,
  featureFlags: {
    social: import.meta.env.VITE_ENABLE_SOCIAL === 'true',
    push: import.meta.env.VITE_ENABLE_PUSH === 'true',
  },
  pushToast(toast) {
    const id = crypto.randomUUID();
    set((state) => ({
      toasts: [...state.toasts, { id, variant: 'default', ...toast }],
    }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) }));
    }, toast.duration ?? 2400);
  },
  setComboLabel(comboLabel) {
    set({ comboLabel });
    if (comboLabel) {
      setTimeout(() => set({ comboLabel: '' }), 1400);
    }
  },
  setLevelUp(levelUp) {
    set({ levelUp });
  },
  clearLevelUp() {
    set({ levelUp: null });
  },
  setAuthMessage(authMessage) {
    set({ authMessage });
  },
  setInstallPromptEvent(installPromptEvent) {
    set({ installPromptEvent });
  },
  setOffline(isOffline) {
    set({ isOffline });
  },
}));
