import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { authApi } from '@/lib/authApi';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/userStore';
import { useUiStore } from '@/stores/uiStore';

async function fetchAuthState() {
  return authApi.getSession();
}

const EMPTY_AUTH_RESULT = {
  data: null,
  isLoading: false,
  isError: false,
  error: null,
  refetch: async () => null,
};

export function useAuth({ skipSession = false } = {}) {
  const queryClient = useQueryClient();
  const setAuthState = useUserStore((state) => state.setAuthState);
  const clearAuthState = useUserStore((state) => state.clearAuthState);
  const pushToast = useUiStore((state) => state.pushToast);

  const authQuery = useQuery({
    queryKey: ['auth-state'],
    queryFn: fetchAuthState,
    enabled: !skipSession,
  });
  const sessionQuery = skipSession ? EMPTY_AUTH_RESULT : authQuery;

  useEffect(() => {
    if (!skipSession && authQuery.data) {
      setAuthState(authQuery.data);
    }
  }, [authQuery.data, setAuthState, skipSession]);

  useEffect(() => {
    if (skipSession) return undefined;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      queryClient.invalidateQueries({ queryKey: ['auth-state'] });

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        queryClient.invalidateQueries({ queryKey: ['today-state'] });
        queryClient.invalidateQueries({ queryKey: ['progress'] });
        queryClient.invalidateQueries({ queryKey: ['streak'] });
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient, skipSession]);

  const emailMutation = useMutation({
    mutationFn: authApi.signInWithEmail,
    onSuccess: async (result) => {
      if (result?.message) {
        pushToast({ title: result.message, variant: 'success' });
      }

      await queryClient.invalidateQueries({ queryKey: ['auth-state'] });
    },
    onError: (error) => {
      pushToast({ title: error.message || 'Authentication failed', variant: 'error' });
    },
  });

  const oauthMutation = useMutation({
    mutationFn: authApi.signInWithOAuth,
    onError: (error) => {
      pushToast({ title: error.message || 'OAuth sign in failed', variant: 'error' });
    },
  });

  const signOutMutation = useMutation({
    mutationFn: authApi.signOut,
    onSuccess: async () => {
      clearAuthState();
      queryClient.removeQueries({ queryKey: ['today-state'] });
      queryClient.removeQueries({ queryKey: ['progress'] });
      queryClient.removeQueries({ queryKey: ['streak'] });
      await queryClient.invalidateQueries({ queryKey: ['auth-state'] });
    },
    onError: (error) => {
      pushToast({ title: error.message || 'Sign out failed', variant: 'error' });
    },
  });

  return {
    ...sessionQuery,
    session: sessionQuery.data?.session ?? null,
    user: sessionQuery.data?.user ?? null,
    profile: sessionQuery.data?.profile ?? null,
    signInWithEmail: emailMutation.mutateAsync,
    signInWithOAuth: oauthMutation.mutateAsync,
    signOut: signOutMutation.mutateAsync,
    sessionLoading: sessionQuery.isLoading,
    authLoading: emailMutation.isPending || oauthMutation.isPending || signOutMutation.isPending,
  };
}
