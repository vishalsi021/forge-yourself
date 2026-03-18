-- Run after migrations to smoke-check core policies manually.
set role authenticated;

-- Replace with a real JWT-backed session when running in Supabase test tooling.
select tablename, rowsecurity from pg_tables where schemaname = 'public' and tablename in (
  'profiles',
  'daily_logs',
  'weekly_reviews',
  'cbt_sessions',
  'streaks',
  'social',
  'challenges',
  'challenge_participants',
  'notifications_log',
  'notification_preferences',
  'push_subscriptions'
);
