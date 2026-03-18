import { createClient } from '@supabase/supabase-js';

import { cookieStorage } from './storage';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const useBrowserAuthFallback = import.meta.env.DEV;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables.');
}

let activeSessionKey = '';

export const supabase = createClient(supabaseUrl ?? 'https://example.supabase.co', supabaseAnonKey ?? 'demo-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: useBrowserAuthFallback,
    flowType: 'pkce',
    ...(useBrowserAuthFallback ? { storage: cookieStorage } : {}),
  },
});

export async function bootstrapSupabaseSession(session) {
  if (!session?.access_token || !session?.refresh_token) {
    await clearSupabaseSession();
    return null;
  }

  const nextSessionKey = `${session.access_token}:${session.refresh_token}`;

  if (activeSessionKey === nextSessionKey) {
    return session;
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  if (error) {
    throw error;
  }

  activeSessionKey = nextSessionKey;
  return data.session;
}

export async function clearSupabaseSession() {
  activeSessionKey = '';

  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch {
    return null;
  }

  return null;
}

export const functionsBaseUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || `${supabaseUrl}/functions/v1`;
