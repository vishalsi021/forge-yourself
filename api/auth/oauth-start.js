import { createSupabaseServer, getSiteUrl } from './_shared.js';

const allowedProviders = new Set(['google', 'apple']);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const provider = String(req.query.provider || 'google').toLowerCase();

    if (!allowedProviders.has(provider)) {
      return res.status(400).json({ error: 'Unsupported OAuth provider.' });
    }

    const supabase = createSupabaseServer(req, res);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${getSiteUrl(req)}/api/auth/callback`,
      },
    });

    if (error || !data?.url) {
      return res.status(400).json({ error: error?.message || 'Unable to start OAuth flow.' });
    }

    return res.redirect(data.url);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to start OAuth flow.' });
  }
}
