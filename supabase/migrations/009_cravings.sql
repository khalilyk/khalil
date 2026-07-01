-- Craving / urge log — beat emotional eating by making the pattern visible
create table if not exists cravings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  feeling text,
  rode_out boolean default true,
  note text,
  created_at timestamptz default now()
);
alter table cravings enable row level security;
drop policy if exists "cravings_own" on cravings;
create policy "cravings_own" on cravings for all using (auth.uid() = user_id);
create index if not exists cravings_user_idx on cravings (user_id, created_at);
