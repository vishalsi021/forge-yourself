import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

import { corsHeaders } from '../_shared/cors.ts';

type PushMode = 'morning' | 'evening' | 'weekly' | 'risk' | 'reengage' | 'test';

type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  subscription: {
    endpoint: string;
    expirationTime?: number | null;
    keys?: {
      auth?: string;
      p256dh?: string;
    };
  };
};

function getAdminClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('SUPABASE_PROJECT_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_KEY')!;
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function requireCronSecret(request: Request) {
  const expected = Deno.env.get('PUSH_FUNCTION_SECRET') || Deno.env.get('CRON_SECRET');

  if (!expected) return;

  const bearer = request.headers.get('authorization')?.replace('Bearer ', '');
  if (bearer !== expected) {
    throw new Error('Unauthorized push invocation.');
  }
}

function formatDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function shiftDate(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return formatDate(date);
}

function getIdentityName(profile: any) {
  const alterEgoName = profile?.alter_ego?.name?.trim();
  if (alterEgoName) return alterEgoName;

  const fullName = profile?.full_name?.trim();
  if (fullName) return fullName.split(/\s+/)[0];

  const username = profile?.username?.trim();
  if (username) return username;

  return 'Member';
}

function buildMessage({
  mode,
  name,
  streak,
  currentDay,
  doneCount,
  totalTasks,
  avgRating,
  weeklyTasksDone,
}: {
  mode: PushMode;
  name: string;
  streak: number;
  currentDay: number;
  doneCount: number;
  totalTasks: number;
  avgRating: number;
  weeklyTasksDone: number;
}) {
  if (mode === 'morning') {
    return {
      type: 'morning_activation',
      title: `Day ${currentDay} is live`,
      body: `${name}, day ${currentDay} is live. ${totalTasks} tasks are waiting. Streak is ${streak} days.`,
    };
  }

  if (mode === 'evening') {
    if (doneCount < 5) {
      return {
        type: 'evening_checkin',
        title: 'Streak check-in',
        body: `${name}, ${Math.max(totalTasks - doneCount, 0)} tasks are still pending tonight. Move now.`,
      };
    }

    if (doneCount < totalTasks) {
      return {
        type: 'evening_checkin',
        title: 'Final push',
        body: `${name}, ${doneCount}/${totalTasks} done. Finish strong before midnight.`,
      };
    }

    return {
      type: 'evening_checkin',
      title: 'Full day locked',
      body: `${name}, full day complete. ${streak}-day streak keeps moving.`,
    };
  }

  if (mode === 'weekly') {
    return {
      type: 'weekly_review',
      title: 'Weekly Review time',
      body: `${name}, week closed at ${weeklyTasksDone} tasks done with ${avgRating.toFixed(1)}/10 average rating.`,
    };
  }

  if (mode === 'risk') {
    return {
      type: 'streak_risk',
      title: 'Streak at risk',
      body: `${name}, day ${currentDay} is closing. Complete one task now to protect your streak.`,
    };
  }

  if (mode === 'reengage') {
    return {
      type: 'reengage',
      title: 'Never miss twice',
      body: `${name}, day ${currentDay} is still waiting. Missing once is noise. Missing twice becomes identity.`,
    };
  }

  return {
    type: 'test',
    title: 'FORGE push test',
    body: `Push is connected for ${name}.`,
  };
}

async function loadAudience(admin: ReturnType<typeof getAdminClient>, userId?: string) {
  let subscriptionsQuery = admin.from('push_subscriptions').select('*');

  if (userId) {
    subscriptionsQuery = subscriptionsQuery.eq('user_id', userId);
  }

  const { data: subscriptions, error } = await subscriptionsQuery;
  if (error) throw error;

  if (!subscriptions?.length) return [];

  const userIds = [...new Set(subscriptions.map((item) => item.user_id))];
  const weekStart = shiftDate(-6);
  const today = formatDate();

  const [profilesResult, preferencesResult, streaksResult, logsResult] = await Promise.all([
    admin.from('profiles').select('id, username, full_name, alter_ego').in('id', userIds),
    admin.from('notification_preferences').select('*').in('user_id', userIds),
    admin.from('streaks').select('*').in('user_id', userIds),
    admin.from('daily_logs').select('user_id, log_date, day_rating, tasks').in('user_id', userIds).gte('log_date', weekStart),
  ]);

  if (profilesResult.error) throw profilesResult.error;
  if (preferencesResult.error) throw preferencesResult.error;
  if (streaksResult.error) throw streaksResult.error;
  if (logsResult.error) throw logsResult.error;

  const profiles = new Map((profilesResult.data || []).map((item) => [item.id, item]));
  const preferences = new Map((preferencesResult.data || []).map((item) => [item.user_id, item]));
  const streaks = new Map((streaksResult.data || []).map((item) => [item.user_id, item]));
  const logsByUser = new Map<string, any[]>();

  for (const log of logsResult.data || []) {
    const bucket = logsByUser.get(log.user_id) || [];
    bucket.push(log);
    logsByUser.set(log.user_id, bucket);
  }

  return (subscriptions as PushSubscriptionRow[]).map((subscription) => ({
    subscription,
    profile: profiles.get(subscription.user_id),
    preferences: preferences.get(subscription.user_id),
    streak: streaks.get(subscription.user_id),
    logs: logsByUser.get(subscription.user_id) || [],
    today,
  }));
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (request.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders });
    }

    requireCronSecret(request);

    const admin = getAdminClient();
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const subject = Deno.env.get('WEB_PUSH_SUBJECT') || 'mailto:hello@forge.app';

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('Missing VAPID keys.');
    }

    webpush.setVapidDetails(subject, vapidPublicKey, vapidPrivateKey);

    const body = await request.json().catch(() => ({}));
    const mode = (body.mode || 'test') as PushMode;
    const audience = await loadAudience(admin, body.userId);
    const notificationsToLog: any[] = [];
    let sent = 0;
    let skipped = 0;
    let removed = 0;

    for (const entry of audience) {
      const doneCountToday = (entry.logs.find((log) => log.log_date === entry.today)?.tasks || []).filter((task: any) => task.done).length;
      const totalTasksToday = (entry.logs.find((log) => log.log_date === entry.today)?.tasks || []).length;
      const weeklyRatings = entry.logs.map((log) => Number(log.day_rating || 0)).filter(Boolean);
      const weeklyTasksDone = entry.logs.reduce((sum, log) => sum + (log.tasks || []).filter((task: any) => task.done).length, 0);
      const avgRating = weeklyRatings.length ? weeklyRatings.reduce((sum, rating) => sum + rating, 0) / weeklyRatings.length : 0;
      const isInactive = entry.streak?.last_active_date && entry.streak.last_active_date <= shiftDate(-2);

      if (mode === 'weekly' && entry.preferences?.weekly_review_enabled === false) {
        skipped += 1;
        continue;
      }

      if (mode === 'risk' && (entry.preferences?.streak_risk_enabled === false || doneCountToday > 0)) {
        skipped += 1;
        continue;
      }

      if (mode === 'reengage' && !isInactive) {
        skipped += 1;
        continue;
      }

      const message = buildMessage({
        mode,
        name: getIdentityName(entry.profile),
        streak: Number(entry.streak?.current_streak || 0),
        currentDay: Number(entry.streak?.current_day || 1),
        doneCount: doneCountToday,
        totalTasks: totalTasksToday || 15,
        avgRating,
        weeklyTasksDone,
      });

      const payload = JSON.stringify({
        title: message.title,
        body: message.body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-96.png',
        data: {
          href: '/app/today',
          type: message.type,
        },
      });

      try {
        if (!body.dryRun) {
          await webpush.sendNotification(entry.subscription.subscription, payload);
        }

        sent += 1;
        notificationsToLog.push({
          user_id: entry.subscription.user_id,
          type: message.type,
          title: message.title,
          body: message.body,
          scheduled_at: new Date().toISOString(),
          sent_at: new Date().toISOString(),
        });
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          await admin.from('push_subscriptions').delete().eq('id', entry.subscription.id);
          removed += 1;
        } else {
          skipped += 1;
        }
      }
    }

    if (notificationsToLog.length) {
      await admin.from('notifications_log').insert(notificationsToLog);
    }

    return Response.json(
      {
        ok: true,
        mode,
        audience: audience.length,
        sent,
        skipped,
        removed,
      },
      { headers: corsHeaders },
    );
  } catch (error: any) {
    return Response.json({ error: error.message || 'Push send failed' }, { status: 400, headers: corsHeaders });
  }
});
