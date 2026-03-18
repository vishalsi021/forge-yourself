import { corsHeaders } from '../_shared/cors.ts';
import { createClients } from '../_shared/auth.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization') || '';
    const { admin, getUser } = createClients(authHeader);
    const user = await getUser();
    const { confirm } = await request.json().catch(() => ({ confirm: false }));

    if (!confirm) {
      throw new Error('Delete confirmation is required.');
    }

    await admin.from('push_subscriptions').delete().eq('user_id', user.id);
    await admin.from('notifications_log').delete().eq('user_id', user.id);
    await admin.from('notification_preferences').delete().eq('user_id', user.id);
    await admin.from('challenge_participants').delete().eq('user_id', user.id);
    await admin.from('challenges').delete().eq('creator_id', user.id);
    await admin.from('social').delete().eq('user_id', user.id);
    await admin.from('cbt_sessions').delete().eq('user_id', user.id);
    await admin.from('weekly_reviews').delete().eq('user_id', user.id);
    await admin.from('daily_logs').delete().eq('user_id', user.id);
    await admin.from('streaks').delete().eq('user_id', user.id);
    await admin.from('profiles').delete().eq('id', user.id);
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;

    return Response.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400, headers: corsHeaders });
  }
});
