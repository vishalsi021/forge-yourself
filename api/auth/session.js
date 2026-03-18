import { createSupabaseServer, getServerAuthState } from './_shared.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createSupabaseServer(req, res);
    const payload = await getServerAuthState(supabase);
    return res.status(200).json(payload);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to read session' });
  }
}
