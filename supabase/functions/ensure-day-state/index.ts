import { corsHeaders } from '../_shared/cors.ts';
import { createClients } from '../_shared/auth.ts';
import { core15Tasks, dynamicPools } from '../_shared/tasks.ts';
import { enforceRateLimit } from '../_shared/rate-limit.ts';

function normalizeTimeZone(timeZone: unknown) {
  if (typeof timeZone !== 'string' || !timeZone.trim()) return null;

  try {
    return new Intl.DateTimeFormat('en-US', { timeZone }).resolvedOptions().timeZone;
  } catch {
    return null;
  }
}

function formatDateForTimeZone(date: Date, timeZone = 'UTC') {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new Error('Unable to determine the current date');
  }

  return `${year}-${month}-${day}`;
}

function todayDate(timeZone?: string | null) {
  return formatDateForTimeZone(new Date(), timeZone || 'UTC');
}

function addDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function inferDynamicTasks(profile: any, dayNumber: number) {
  const analysis = profile?.quiz_answers?.analysis || {};
  if (dayNumber === 1 && Array.isArray(analysis.day1TaskAdditions) && analysis.day1TaskAdditions.length) {
    return analysis.day1TaskAdditions.slice(0, 3).map((task: any, index: number) => ({
      id: `dynamic-${index + 1}`,
      text: task.text,
      area: task.area || 'habits',
      xp: 20,
      why: task.why || 'Personalized to your onboarding pattern.',
      emoji: '⚡',
      done: false,
      isCore: false,
      isCustom: false,
    }));
  }

  const weakAreas = analysis.topWeaknesses || ['habits', 'purpose'];
  return weakAreas.slice(0, 2).flatMap((area: string, index: number) => (dynamicPools[area] || dynamicPools.habits).slice(index, index + 1).map((task, taskIndex) => ({
    id: `dynamic-${index + 1}-${taskIndex + 1}`,
    done: false,
    isCore: false,
    isCustom: false,
    emoji: '⚡',
    ...task,
  })));
}

function buildTasks(profile: any, dayNumber: number) {
  const core = core15Tasks.map((task, index) => ({ id: `core-${index + 1}`, done: false, isCore: true, isCustom: false, ...task }));
  const dynamic = inferDynamicTasks(profile, dayNumber);
  const custom = (profile?.custom_habits || []).map((habit: string, index: number) => ({
    id: `custom-${index + 1}`,
    text: habit,
    area: 'custom',
    xp: 25,
    why: 'Custom habits make the protocol personal and sticky.',
    emoji: '⭐',
    done: false,
    isCore: false,
    isCustom: true,
  }));

  return [...core, ...dynamic, ...custom];
}

function computeCurrentDay(streak: any, logDate: string) {
  if (!streak?.last_active_date) return streak?.current_day || 1;
  if (streak.last_active_date === logDate) return streak.current_day || 1;
  return Math.min(60, (streak.current_day || 1) + 1);
}

function calculateStats(logs: any[]) {
  const sorted = [...logs].sort((a, b) => String(a.log_date).localeCompare(String(b.log_date)));
  const successes = sorted.map((log) => ({
    date: String(log.log_date),
    doneCount: (log.tasks || []).filter((task: any) => task.done).length,
    xp: (log.tasks || []).filter((task: any) => task.done).reduce((sum: number, task: any) => sum + Number(task.xp || 0), 0),
  }));

  let currentStreak = 0;
  let bestStreak = 0;
  let totalTasksDone = 0;
  let totalXp = 0;
  let lastSuccessfulDate: string | null = null;

  for (const entry of successes) {
    totalTasksDone += entry.doneCount;
    totalXp += entry.xp;

    if (entry.doneCount >= 10) {
      if (lastSuccessfulDate && addDays(lastSuccessfulDate, 1) === entry.date) currentStreak += 1;
      else currentStreak = 1;
      lastSuccessfulDate = entry.date;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 0;
      lastSuccessfulDate = null;
    }
  }

  return { currentStreak, bestStreak, totalTasksDone, totalXp };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization') || '';
    const { admin, getUser } = createClients(authHeader);
    const user = await getUser();
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    enforceRateLimit(`day:${user.id}:${ip}`, 40, 60_000);

    const body = await request.json().catch(() => ({}));
    const action = body.action || 'get';
    const timeZone = normalizeTimeZone(body.timeZone);
    const logDate = todayDate(timeZone);

    const { data: profile, error: profileError } = await admin.from('profiles').select('*').eq('id', user.id).single();
    if (profileError) throw profileError;

    let { data: streak } = await admin.from('streaks').select('*').eq('user_id', user.id).single();
    if (!streak) {
      const { data } = await admin.from('streaks').insert({ user_id: user.id }).select().single();
      streak = data;
    }

    let { data: dailyLog } = await admin.from('daily_logs').select('*').eq('user_id', user.id).eq('log_date', logDate).maybeSingle();

    if (!dailyLog) {
      const dayNumber = computeCurrentDay(streak, logDate);
      const tasks = buildTasks(profile, dayNumber);
      const { data, error } = await admin.from('daily_logs').insert({
        user_id: user.id,
        day_number: dayNumber,
        log_date: logDate,
        tasks,
        notes: '',
      }).select().single();
      if (error) throw error;
      dailyLog = data;
      streak.current_day = dayNumber;
    }

    if (action === 'save') {
      const updates = {
        tasks: body.tasks ?? dailyLog.tasks,
        day_rating: body.dayRating ?? dailyLog.day_rating,
        notes: body.notes ?? dailyLog.notes,
      };
      const { data, error } = await admin.from('daily_logs').update(updates).eq('id', body.dailyLogId || dailyLog.id).eq('user_id', user.id).select().single();
      if (error) throw error;
      dailyLog = data;
    }

    const { data: allLogs, error: logsError } = await admin.from('daily_logs').select('*').eq('user_id', user.id).order('log_date', { ascending: true });
    if (logsError) throw logsError;
    const { currentStreak, bestStreak, totalTasksDone, totalXp } = calculateStats(allLogs || []);
    const level = totalXp >= 10000 ? 7 : totalXp >= 6000 ? 6 : totalXp >= 3500 ? 5 : totalXp >= 1800 ? 4 : totalXp >= 800 ? 3 : totalXp >= 300 ? 2 : 1;

    const { data: updatedStreak, error: streakError } = await admin.from('streaks').update({
      current_streak: currentStreak,
      best_streak: Math.max(bestStreak, streak?.best_streak || 0),
      last_active_date: logDate,
      total_tasks_done: totalTasksDone,
      total_xp: totalXp,
      level,
      current_day: dailyLog.day_number,
    }).eq('user_id', user.id).select().single();
    if (streakError) throw streakError;

    return Response.json({ dailyLog, streak: updatedStreak, profile }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400, headers: corsHeaders });
  }
});
