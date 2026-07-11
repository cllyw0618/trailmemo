-- TrailMemo Supabase schema
-- Run this once in Supabase SQL Editor.
-- Supports anonymous visitor sessions and later email binding on the same auth.users.id.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  avatar text default '',
  gender text default '',
  birthday text default '',
  traveler_gender text default 'female',
  traveler_identity text default 'forest',
  level integer not null default 1,
  experience integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists avatar text default '';
alter table public.profiles add column if not exists level integer not null default 1;
alter table public.profiles add column if not exists experience integer not null default 0;
alter table public.profiles alter column username drop not null;
alter table public.profiles alter column traveler_gender set default 'female';

create table if not exists public.characters (
  user_id uuid primary key references auth.users(id) on delete cascade,
  character_type text not null default 'forest',
  equipment jsonb not null default '[]'::jsonb,
  level integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hikes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  distance numeric default 0,
  duration text default '',
  location text default '',
  created_at timestamptz not null default now()
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
alter table public.characters enable row level security;
alter table public.hikes enable row level security;
alter table public.unlocked_trails enable row level security;
alter table public.journals enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "characters_select_own" on public.characters;
drop policy if exists "characters_insert_own" on public.characters;
drop policy if exists "characters_update_own" on public.characters;
create policy "characters_select_own" on public.characters
  for select using (auth.uid() = user_id);
create policy "characters_insert_own" on public.characters
  for insert with check (auth.uid() = user_id);
create policy "characters_update_own" on public.characters
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "hikes_select_own" on public.hikes;
drop policy if exists "hikes_insert_own" on public.hikes;
drop policy if exists "hikes_update_own" on public.hikes;
drop policy if exists "hikes_delete_own" on public.hikes;
create policy "hikes_select_own" on public.hikes
  for select using (auth.uid() = user_id);
create policy "hikes_insert_own" on public.hikes
  for insert with check (auth.uid() = user_id);
create policy "hikes_update_own" on public.hikes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "hikes_delete_own" on public.hikes
  for delete using (auth.uid() = user_id);

drop policy if exists "unlocked_select_own" on public.unlocked_trails;
drop policy if exists "unlocked_insert_own" on public.unlocked_trails;
drop policy if exists "unlocked_delete_own" on public.unlocked_trails;
create policy "unlocked_select_own" on public.unlocked_trails
  for select using (auth.uid() = user_id);
create policy "unlocked_insert_own" on public.unlocked_trails
  for insert with check (auth.uid() = user_id);
create policy "unlocked_delete_own" on public.unlocked_trails
  for delete using (auth.uid() = user_id);

drop policy if exists "journals_select_own" on public.journals;
drop policy if exists "journals_insert_own" on public.journals;
drop policy if exists "journals_update_own" on public.journals;
drop policy if exists "journals_delete_own" on public.journals;
create policy "journals_select_own" on public.journals
  for select using (auth.uid() = user_id);
create policy "journals_insert_own" on public.journals
  for insert with check (auth.uid() = user_id);
create policy "journals_update_own" on public.journals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "journals_delete_own" on public.journals
  for delete using (auth.uid() = user_id);

create index if not exists characters_user_id_idx on public.characters(user_id);
create index if not exists hikes_user_id_created_at_idx on public.hikes(user_id, created_at desc);
create index if not exists unlocked_trails_user_id_idx on public.unlocked_trails(user_id);
create index if not exists journals_user_id_created_at_idx on public.journals(user_id, created_at desc);
