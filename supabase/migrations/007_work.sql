-- Work: items across the three businesses (revenue, projects/orders, tasks)
create table if not exists work_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  business text not null check (business in ('not_normal','bric','print_paradise')),
  kind text not null check (kind in ('revenue','project','order','task')),
  title text not null,
  amount numeric,
  status text default 'pending' check (status in ('pending','in_progress','done')),
  due_date date,
  created_at timestamptz default now()
);
alter table work_items enable row level security;
drop policy if exists "work_items_own" on work_items;
create policy "work_items_own" on work_items for all using (auth.uid() = user_id);
create index if not exists work_items_user_business_idx on work_items (user_id, business);
