-- goals: everything to reach, with realistic target dates
create table if not exists goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  detail text,
  category text default 'personal',
  target_value numeric,
  target_unit text,
  target_date date,
  status text default 'active' check (status in ('active','done','archived')),
  sort int default 0,
  completed_at timestamptz,
  created_at timestamptz default now()
);
alter table goals enable row level security;
create policy "goals_own" on goals for all using (auth.uid() = user_id);
create index if not exists goals_user_date_idx on goals (user_id, target_date);
