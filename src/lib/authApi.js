import { bootstrapSupabaseSession, clearSupabaseSession, supabase } from './supabase';

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return null;
}

async function requestAuth(path, options = {}) {
  try {
    const response = await fetch(path, {
      credentials: 'include',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const payload = await parseResponse(response);

    if (!response.ok) {
      const error = new Error(payload?.error || 'Authentication request failed.');
      error.status = response.status;
      throw error;
    }

    return payload;
  } catch (error) {
    if (import.meta.env.DEV && (error.status === 404 || error instanceof TypeError)) {
      return null;
    }

    throw error;
  }
}

async function fetchFallbackProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

function buildRedirect(profile) {
  return profile?.onboarding_complete ? '/app/today' : '/onboarding/0';
}

function resetLocalAuthCache() {
  return { session: null, user: null, profile: null, redirectTo: null };
}

export const authApi = {
  async getSession() {
    const payload = await requestAuth('/api/auth/session', { method: 'GET' });

    if (payload) {
      if (payload.session) {
        await bootstrapSupabaseSession(payload.session);
      }

      return payload.session ? payload : resetLocalAuthCache();
    }

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session?.user) {
      await clearSupabaseSession();
      return resetLocalAuthCache();
    }

    const profile = await fetchFallbackProfile(session.user.id);

    return {
      session,
      user: session.user,
      profile,
      redirectTo: buildRedirect(profile),
    };
  },

  async signInWithEmail({ mode, email, password, fullName }) {
    const payload = await requestAuth('/api/auth/email', {
      method: 'POST',
      body: JSON.stringify({ mode, email, password, fullName }),
    });

    if (payload) {
      if (payload.session) {
        await bootstrapSupabaseSession(payload.session);
      }

      return payload;
    }

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName || '' },
        },
      });

      if (error) {
        throw error;
      }

      if (!data.session) {
        return {
          session: null,
          user: data.user ?? null,
          profile: null,
          redirectTo: null,
          message: 'Check your email to confirm your account.',
        };
      }

      const profile = await fetchFallbackProfile(data.session.user.id);
      return {
        session: data.session,
        user: data.session.user,
        profile,
        redirectTo: buildRedirect(profile),
        message: 'Account created. Welcome to FORGE.',
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw error;
    }

    const profile = await fetchFallbackProfile(data.session.user.id);
    return {
      session: data.session,
      user: data.session.user,
      profile,
      redirectTo: buildRedirect(profile),
      message: 'Signed in successfully.',
    };
  },

  async signInWithOAuth(provider) {
    if (import.meta.env.DEV) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/app/today`,
        },
      });

      if (error) {
        throw error;
      }

      return;
    }

    window.location.assign(`/api/auth/oauth-start?provider=${encodeURIComponent(provider)}&_=${Date.now()}`);
  },

  async signOut() {
    const payload = await requestAuth('/api/auth/logout', { method: 'POST' });

    if (payload) {
      await clearSupabaseSession();
      return payload;
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    return { success: true };
  },
};
