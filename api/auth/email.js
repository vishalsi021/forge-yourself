import { createSupabaseServer, getJsonBody, getServerAuthState, getSiteUrl } from './_shared.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createSupabaseServer(req, res);
    const { mode, email, password, fullName } = await getJsonBody(req);

    if (!email || !password || !['login', 'signup'].includes(mode)) {
      return res.status(400).json({ error: 'Mode, email, and password are required.' });
    }

    const response = mode === 'signup'
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName || '' },
            emailRedirectTo: `${getSiteUrl(req)}/api/auth/callback`,
          },
        })
      : await supabase.auth.signInWithPassword({ email, password });

    if (response.error) {
      return res.status(400).json({ error: response.error.message });
    }

    if (!response.data.session) {
      return res.status(200).json({
        session: null,
        user: response.data.user ?? null,
        profile: null,
        redirectTo: null,
        message: 'Check your email to confirm your account.',
      });
    }

    const payload = await getServerAuthState(supabase);
    return res.status(200).json({
      ...payload,
      message: mode === 'signup' ? 'Account created. Welcome to FORGE.' : 'Signed in successfully.',
    });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to complete authentication' });
  }
}
