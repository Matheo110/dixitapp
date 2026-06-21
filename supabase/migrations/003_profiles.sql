-- ============================================================
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Create profiles table
create table if not exists public.profiles (
  id   uuid primary key references auth.users(id) on delete cascade,
  slug text not null unique
);

-- 2. Enable RLS
alter table public.profiles enable row level security;

-- Drop existing policies first (idempotent)
drop policy if exists "public_select_profiles" on public.profiles;
drop policy if exists "owner_insert_profile"   on public.profiles;
drop policy if exists "owner_update_profile"   on public.profiles;

-- Anyone can read profiles (needed to resolve slug → user_id on collect/wall pages)
create policy "public_select_profiles"
  on public.profiles
  for select
  using (true);

-- Authenticated user can create their own profile
create policy "owner_insert_profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- Authenticated user can update their own profile
create policy "owner_update_profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 3. Index on slug for fast lookups
create index if not exists idx_profiles_slug on public.profiles(slug);
