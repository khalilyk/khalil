-- Web Push subscriptions (one per device/browser)
create table if not exists push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);
alter table push_subscriptions enable row level security;
drop policy if exists "push_subscriptions_own" on push_subscriptions;
create policy "push_subscriptions_own" on push_subscriptions for all using (auth.uid() = user_id);

-- Reminder preferences
alter table profiles add column if not exists remind_water boolean default false;
alter table profiles add column if not exists remind_snack boolean default false;
