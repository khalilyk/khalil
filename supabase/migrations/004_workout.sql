-- workout_logs: one row per completed exercise on a given date
create table if not exists workout_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  logged_on date not null,
  exercise text not null,
  created_at timestamptz default now(),
  unique (user_id, logged_on, exercise)
);
alter table workout_logs enable row level security;
create policy "workout_logs_own" on workout_logs for all using (auth.uid() = user_id);
create index if not exists workout_logs_user_date_idx on workout_logs (user_id, logged_on);
