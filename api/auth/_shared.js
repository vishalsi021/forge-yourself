import { createServerClient } from '@supabase/ssr';

function parseCookies(header = '') {
  return header.split(';').reduce((acc, chunk) => {
    const [rawKey, ...rest] = chunk.trim().split('=');
    if (!rawKey) return acc;
    acc[rawKey] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${options.path || '/'}`);
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.secure) parts.push('Secure');
  return parts.join('; ');
}

export function createSupabaseServer(req, res) {
  const cookieStore = parseCookies(req.headers.cookie || '');
  const pendingCookies = [];
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  const client = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return Object.entries(cookieStore).map(([name, value]) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          pendingCookies.push(
            serializeCookie(name, value, {
              path: '/',
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'Lax',
              ...(options || {}),
            }),
          );
        });

        if (pendingCookies.length) {
          res.setHeader('Set-Cookie', pendingCookies);
        }
      },
    },
  });

  return client;
}

export function getSiteUrl(req) {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const forwardedHost = req.headers['x-forwarded-host'] || req.headers.host;

  if (forwardedHost) {
    const protocol = forwardedProto || (forwardedHost.includes('localhost') ? 'http' : 'https');
    return `${protocol}://${forwardedHost}`;
  }

  if (req.headers.origin) {
    return req.headers.origin;
  }

  if (process.env.VITE_SITE_URL) {
    return process.env.VITE_SITE_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'http://localhost:5173';
}

export async function getJsonBody(req) {
  if (!req.body) return {};

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return req.body;
}

export async function getServerAuthState(supabase) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return {
      session: null,
      user: null,
      profile: null,
      redirectTo: null,
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      session: null,
      user: null,
      profile: null,
      redirectTo: null,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  return {
    session,
    user,
    profile,
    redirectTo: profile?.onboarding_complete ? '/app/today' : '/onboarding/0',
  };
}
