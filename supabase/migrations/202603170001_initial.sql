create extension if not exists pgcrypto;

DO $$
BEGIN
  CREATE TYPE public.plan_tier AS ENUM ('free', 'pro', 'teams');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  avatar_url text,
  plan_tier public.plan_tier not null default 'free',
  onboarding_complete boolean not null default false,
  quiz_answers jsonb not null default '{}'::jsonb,
  arch_scores jsonb not null default '{"fitness":5,"mind":5,"career":5,"social":5,"habits":5,"purpose":5}'::jsonb,
  alter_ego jsonb not null default '{"name":"","desc":"","traits":[]}'::jsonb,
  mission_statement text,
  selected_values text[] not null default '{}',
  custom_habits text[] not null default '{}',
  face_shape text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  day_number integer not null check (day_number between 1 and 60),
  log_date date not null,
  tasks jsonb not null default '[]'::jsonb,
  day_rating integer check (day_rating between 1 and 10),
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, log_date),
  unique (user_id, day_number)
);

create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_number integer not null,
  wins text,
  proud_of text,
  missed text,
  lessons text,
  next_focus text,
  drop_habit text,
  add_action text,
  deep_reflection text,
  alter_ego_feedback text,
  discipline_rating integer check (discipline_rating between 1 and 10),
  top_actions text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, week_number)
);

create table if not exists public.cbt_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_number integer not null,
  answers jsonb not null default '{}'::jsonb,
  distortion_type text,
  completed_at timestamptz not null default now()
);

create table if not exists public.streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  last_active_date date,
  freeze_count integer not null default 0,
  total_tasks_done integer not null default 0,
  total_xp integer not null default 0,
  level integer not null default 1,
  current_day integer not null default 1 check (current_day between 1 and 60)
);

create table if not exists public.social (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  partner_id uuid references public.profiles(id) on delete set null,
  challenge_id uuid,
  streak_visible boolean not null default true,
  profile_public boolean not null default false
);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  habit_ids text[] not null default '{}',
  duration_days integer not null check (duration_days > 0),
  start_date date not null,
  participant_count integer not null default 1,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.challenge_participants (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  current_streak integer not null default 0,
  completed boolean not null default false,
  unique (challenge_id, user_id)
);

alter table public.social drop constraint if exists social_challenge_id_fkey;
alter table public.social
  add constraint social_challenge_id_fkey
  foreign key (challenge_id) references public.challenges(id) on delete set null;

create table if not exists public.notifications_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  scheduled_at timestamptz,
  sent_at timestamptz,
  opened_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  morning_time time not null default '08:00',
  evening_time time not null default '21:00',
  weekly_review_enabled boolean not null default true,
  streak_risk_enabled boolean not null default true,
  partner_checkin_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null,
  subscription jsonb not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index if not exists daily_logs_user_date_idx on public.daily_logs(user_id, log_date desc);
create index if not exists daily_logs_user_day_idx on public.daily_logs(user_id, day_number desc);
create index if not exists weekly_reviews_user_week_idx on public.weekly_reviews(user_id, week_number desc);
create index if not exists cbt_sessions_user_completed_idx on public.cbt_sessions(user_id, completed_at desc);
create index if not exists streaks_user_idx on public.streaks(user_id);
create index if not exists challenges_creator_idx on public.challenges(creator_id);
create index if not exists challenge_participants_user_idx on public.challenge_participants(user_id);
create index if not exists notifications_log_user_scheduled_idx on public.notifications_log(user_id, scheduled_at desc);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;

  insert into public.streaks (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.social (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create or replace function public.get_public_leaderboard()
returns table (
  id uuid,
  username text,
  full_name text,
  avatar_url text,
  current_streak integer,
  total_xp integer,
  level integer
)
language sql
security definer
set search_path = public
as $$
  select p.id, p.username, p.full_name, p.avatar_url, st.current_streak, st.total_xp, st.level
  from public.profiles p
  join public.streaks st on st.user_id = p.id
  join public.social s on s.user_id = p.id
  where s.profile_public = true or s.streak_visible = true
  order by st.total_xp desc, st.current_streak desc;
$$;

create or replace function public.calculate_tasks_xp(tasks jsonb)
returns integer
language sql
immutable
as $$
  select coalesce(sum((item->>'xp')::integer), 0)
  from jsonb_array_elements(tasks) item
  where coalesce((item->>'done')::boolean, false) = true;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
drop trigger if exists notification_preferences_set_updated_at on public.notification_preferences;
create trigger notification_preferences_set_updated_at before update on public.notification_preferences for each row execute procedure public.set_updated_at();
drop trigger if exists push_subscriptions_set_updated_at on public.push_subscriptions;
create trigger push_subscriptions_set_updated_at before update on public.push_subscriptions for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.daily_logs enable row level security;
alter table public.weekly_reviews enable row level security;
alter table public.cbt_sessions enable row level security;
alter table public.streaks enable row level security;
alter table public.social enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.notifications_log enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.push_subscriptions enable row level security;

drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles for select using (
  auth.uid() = id or exists (select 1 from public.social s where s.user_id = profiles.id and s.profile_public = true)
);
drop policy if exists profiles_self_insert on public.profiles;
create policy profiles_self_insert on public.profiles for insert with check (auth.uid() = id);
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists daily_logs_self_all on public.daily_logs;
create policy daily_logs_self_all on public.daily_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists weekly_reviews_self_all on public.weekly_reviews;
create policy weekly_reviews_self_all on public.weekly_reviews for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists cbt_sessions_self_all on public.cbt_sessions;
create policy cbt_sessions_self_all on public.cbt_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists streaks_select on public.streaks;
create policy streaks_select on public.streaks for select using (
  auth.uid() = user_id or exists (select 1 from public.social s where s.user_id = streaks.user_id and s.streak_visible = true)
);
drop policy if exists streaks_self_update on public.streaks;
create policy streaks_self_update on public.streaks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists streaks_self_insert on public.streaks;
create policy streaks_self_insert on public.streaks for insert with check (auth.uid() = user_id);
drop policy if exists social_self_all on public.social;
create policy social_self_all on public.social for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists challenges_select on public.challenges;
create policy challenges_select on public.challenges for select using (
  is_public = true or creator_id = auth.uid() or exists (
    select 1 from public.challenge_participants cp where cp.challenge_id = challenges.id and cp.user_id = auth.uid()
  )
);
drop policy if exists challenges_insert on public.challenges;
create policy challenges_insert on public.challenges for insert with check (creator_id = auth.uid());
drop policy if exists challenges_update on public.challenges;
create policy challenges_update on public.challenges for update using (creator_id = auth.uid()) with check (creator_id = auth.uid());
drop policy if exists challenges_delete on public.challenges;
create policy challenges_delete on public.challenges for delete using (creator_id = auth.uid());

drop policy if exists challenge_participants_select on public.challenge_participants;
create policy challenge_participants_select on public.challenge_participants for select using (
  user_id = auth.uid() or exists (
    select 1 from public.challenges c where c.id = challenge_participants.challenge_id and (c.creator_id = auth.uid() or c.is_public = true)
  )
);
drop policy if exists challenge_participants_insert on public.challenge_participants;
create policy challenge_participants_insert on public.challenge_participants for insert with check (user_id = auth.uid());
drop policy if exists challenge_participants_update on public.challenge_participants;
create policy challenge_participants_update on public.challenge_participants for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists challenge_participants_delete on public.challenge_participants;
create policy challenge_participants_delete on public.challenge_participants for delete using (user_id = auth.uid());

drop policy if exists notifications_log_self_all on public.notifications_log;
create policy notifications_log_self_all on public.notifications_log for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists notification_preferences_self_all on public.notification_preferences;
create policy notification_preferences_self_all on public.notification_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists push_subscriptions_self_all on public.push_subscriptions;
create policy push_subscriptions_self_all on public.push_subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('vision', 'vision', true)
on conflict (id) do nothing;

drop policy if exists avatars_select on storage.objects;
create policy avatars_select on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists avatars_insert on storage.objects;
create policy avatars_insert on storage.objects for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists avatars_update on storage.objects;
create policy avatars_update on storage.objects for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists avatars_delete on storage.objects;
create policy avatars_delete on storage.objects for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists vision_select on storage.objects;
create policy vision_select on storage.objects for select using (bucket_id = 'vision');
drop policy if exists vision_insert on storage.objects;
create policy vision_insert on storage.objects for insert with check (bucket_id = 'vision' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists vision_update on storage.objects;
create policy vision_update on storage.objects for update using (bucket_id = 'vision' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists vision_delete on storage.objects;
create policy vision_delete on storage.objects for delete using (bucket_id = 'vision' and (storage.foldername(name))[1] = auth.uid()::text);
