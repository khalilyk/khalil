-- Daily step counts, pushed in from Apple Health via an iOS Shortcut.
create table if not exists public.daily_steps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  steps integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, day)
);

alter table public.daily_steps enable row level security;

create policy "own steps - select" on public.daily_steps
  for select using (auth.uid() = user_id);
create policy "own steps - insert" on public.daily_steps
  for insert with check (auth.uid() = user_id);
create policy "own steps - update" on public.daily_steps
  for update using (auth.uid() = user_id);

create index if not exists daily_steps_user_day_idx on public.daily_steps (user_id, day desc);
