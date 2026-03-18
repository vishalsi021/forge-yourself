import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useUiStore } from '@/stores/uiStore';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

const defaultPreferences = {
  morning_time: '08:00',
  evening_time: '21:00',
  weekly_review_enabled: true,
  streak_risk_enabled: true,
  partner_checkin_enabled: true,
};

async function fetchPreferences(userId) {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ? { ...defaultPreferences, ...data } : defaultPreferences;
}

export function useNotifications(userId) {
  const queryClient = useQueryClient();
  const pushToast = useUiStore((state) => state.pushToast);
  const featureFlags = useUiStore((state) => state.featureFlags);

  const prefsQuery = useQuery({
    queryKey: ['notification-preferences', userId],
    enabled: Boolean(userId),
    queryFn: () => fetchPreferences(userId),
  });

  const savePrefs = useMutation({
    mutationFn: async (updates) => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert({ user_id: userId, ...updates }, { onConflict: 'user_id' })
        .select()
        .single();
      if (error) throw error;
      return { ...defaultPreferences, ...data };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['notification-preferences', userId], data);
      pushToast({ title: 'Notification settings saved', variant: 'success' });
    },
    onError: (error) => {
      pushToast({ title: error.message || 'Unable to save notifications', variant: 'error' });
    },
  });

  const enablePush = useMutation({
    mutationFn: async () => {
      if (!featureFlags.push) {
        throw new Error('Web Push stays disabled until release 2 QA is complete.');
      }

      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push notifications are not supported on this device.');
      }

      if (!import.meta.env.VITE_VAPID_PUBLIC_KEY) {
        throw new Error('Missing VAPID public key.');
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission was not granted.');
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
      });

      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: userId,
        endpoint: subscription.endpoint,
        subscription: subscription.toJSON(),
        user_agent: navigator.userAgent,
      });

      if (error) throw error;

      return subscription;
    },
    onSuccess: () => {
      pushToast({ title: 'Push notifications enabled', variant: 'success' });
    },
    onError: (error) => {
      pushToast({ title: error.message || 'Unable to enable push', variant: 'error' });
    },
  });

  return {
    preferences: prefsQuery.data || defaultPreferences,
    pushFeatureEnabled: featureFlags.push,
    savePreferences: savePrefs.mutateAsync,
    enablePush: enablePush.mutateAsync,
    notificationsLoading: prefsQuery.isLoading || savePrefs.isPending || enablePush.isPending,
  };
}
