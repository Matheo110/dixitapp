-- Create testimonials table
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

-- Enable Row Level Security
alter table public.testimonials enable row level security;

-- Anyone can submit a testimonial (collect form is public)
create policy "public_insert"
  on public.testimonials
  for insert
  with check (true);

-- Form owner can read all their testimonials (including unapproved)
create policy "owner_select"
  on public.testimonials
  for select
  using (auth.uid() = user_id);

-- Anyone can read approved testimonials (for the wall)
create policy "public_select_approved"
  on public.testimonials
  for select
  using (approved = true);

-- Form owner can approve/edit their testimonials
create policy "owner_update"
  on public.testimonials
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Form owner can delete their testimonials
create policy "owner_delete"
  on public.testimonials
  for delete
  using (auth.uid() = user_id);

-- Indexes for common query patterns
create index if not exists idx_testimonials_user_id  on public.testimonials(user_id);
create index if not exists idx_testimonials_approved on public.testimonials(user_id, approved);
