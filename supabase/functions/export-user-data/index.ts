import { corsHeaders } from '../_shared/cors.ts';
import { createClients } from '../_shared/auth.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization') || '';
    const { admin, getUser } = createClients(authHeader);
    const user = await getUser();

    const [profile, dailyLogs, reviews, cbt, streak, social, prefs, notifications] = await Promise.all([
      admin.from('profiles').select('*').eq('id', user.id).single(),
      admin.from('daily_logs').select('*').eq('user_id', user.id).order('day_number', { ascending: true }),
      admin.from('weekly_reviews').select('*').eq('user_id', user.id).order('week_number', { ascending: true }),
      admin.from('cbt_sessions').select('*').eq('user_id', user.id).order('completed_at', { ascending: false }),
      admin.from('streaks').select('*').eq('user_id', user.id).single(),
      admin.from('social').select('*').eq('user_id', user.id).single(),
      admin.from('notification_preferences').select('*').eq('user_id', user.id).single(),
      admin.from('notifications_log').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);

    return Response.json({
      user,
      profile: profile.data,
      daily_logs: dailyLogs.data || [],
      weekly_reviews: reviews.data || [],
      cbt_sessions: cbt.data || [],
      streak: streak.data,
      social: social.data,
      notification_preferences: prefs.data,
      notifications_log: notifications.data || [],
    }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400, headers: corsHeaders });
  }
});
