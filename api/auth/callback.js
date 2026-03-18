import { createSupabaseServer, getServerAuthState } from './_shared.js';

export default async function handler(req, res) {
  try {
    const supabase = createSupabaseServer(req, res);
    const code = req.query.code;

    if (!code) {
      return res.redirect('/login?error=Missing%20authorization%20code');
    }

    const { error } = await supabase.auth.exchangeCodeForSession(String(code));

    if (error) {
      return res.redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }

    const payload = await getServerAuthState(supabase);
    return res.redirect(payload.redirectTo || '/app/today');
  } catch (error) {
    return res.redirect(`/login?error=${encodeURIComponent(error.message || 'Unable to complete sign-in')}`);
  }
}
