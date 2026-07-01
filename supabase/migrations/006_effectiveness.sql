-- Weight plan: target rate (kg/week) + optional starting weight
alter table profiles add column if not exists weight_rate numeric;
alter table profiles add column if not exists weight_start numeric;

-- Money budgets: per-category monthly limit
create table if not exists budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  category text not null,
  monthly_limit numeric not null,
  created_at timestamptz default now(),
  unique (user_id, category)
);
alter table budgets enable row level security;
create policy "budgets_own" on budgets for all using (auth.uid() = user_id);

-- Goal milestones
create table if not exists milestones (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  goal_id uuid references goals on delete cascade not null,
  title text not null,
  done boolean default false,
  sort int default 0,
  created_at timestamptz default now()
);
alter table milestones enable row level security;
create policy "milestones_own" on milestones for all using (auth.uid() = user_id);
create index if not exists milestones_goal_idx on milestones (goal_id);
