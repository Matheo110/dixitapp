-- ============================================================
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Create table if it doesn't exist yet
-- (safe to run even if already created)
create table if not exists public.testimonials (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        references auth.users(id) on delete cascade not null,
  name        text        not null,
  company     text,
  role        text,
  message     text        not null,
  rating      integer     check (rating >= 1 and rating <= 5),
  approved    boolean     not null default false,
  created_at  timestamptz not null default now()
);

-- 2. Enable RLS (idempotent)
alter table public.testimonials enable row level security;

-- 3. Drop ALL existing policies so we start clean
drop policy if exists "public_insert"          on public.testimonials;
drop policy if exists "owner_select"           on public.testimonials;
drop policy if exists "public_select_approved" on public.testimonials;
drop policy if exists "owner_update"           on public.testimonials;
drop policy if exists "owner_delete"           on public.testimonials;

-- 4. Recreate policies

-- Anyone (anonymous or authenticated) can submit a testimonial
create policy "public_insert"
  on public.testimonials
  for insert
  with check (true);

-- Authenticated owner can read ALL their testimonials (pending + approved)
create policy "owner_select"
  on public.testimonials
  for select
  using (auth.uid() = user_id);

-- Anyone can read approved testimonials (wall page, no login required)
create policy "public_select_approved"
  on public.testimonials
  for select
  using (approved = true);

-- Owner can approve / unapprove their testimonials
create policy "owner_update"
  on public.testimonials
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Owner can delete / reject their testimonials
create policy "owner_delete"
  on public.testimonials
  for delete
  using (auth.uid() = user_id);

-- 5. Indexes (idempotent)
create index if not exists idx_testimonials_user_id
  on public.testimonials(user_id);

create index if not exists idx_testimonials_approved
  on public.testimonials(user_id, approved);
