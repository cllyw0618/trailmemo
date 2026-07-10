-- TrailMemo Supabase schema
-- Run this once in Supabase SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  gender text default '',
  birthday text default '',
  traveler_gender text default 'male',
  traveler_identity text default 'forest',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.unlocked_trails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trail_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, trail_id)
);

create table if not exists public.journals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trail_id text not null,
  title text not null default '',
  mood text default '',
  weather text default '',
  text text default '',
  images jsonb not null default '[]'::jsonb,
  template text default 't1',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.unlocked_trails enable row level security;
alter table public.journals enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "unlocked_select_own" on public.unlocked_trails
  for select using (auth.uid() = user_id);
create policy "unlocked_insert_own" on public.unlocked_trails
  for insert with check (auth.uid() = user_id);
create policy "unlocked_delete_own" on public.unlocked_trails
  for delete using (auth.uid() = user_id);

create policy "journals_select_own" on public.journals
  for select using (auth.uid() = user_id);
create policy "journals_insert_own" on public.journals
  for insert with check (auth.uid() = user_id);
create policy "journals_update_own" on public.journals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "journals_delete_own" on public.journals
  for delete using (auth.uid() = user_id);

create index if not exists unlocked_trails_user_id_idx on public.unlocked_trails(user_id);
create index if not exists journals_user_id_created_at_idx on public.journals(user_id, created_at desc);