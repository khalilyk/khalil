-- Enable UUID extension
create extension if not exists "pgcrypto";

-- profiles
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  weight_goal numeric,
  weight_unit text default 'kg',
  currency text default 'AUD',
  timezone text default 'Australia/Sydney'
);
alter table profiles enable row level security;
create policy "profiles_own" on profiles for all using (auth.uid() = id);

-- accounts
create table if not exists accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  type text check (type in ('personal','business')) not null,
  name text not null,
  created_at timestamptz default now()
);
alter table accounts enable row level security;
create policy "accounts_own" on accounts for all using (auth.uid() = user_id);

-- receipts (before transactions due to FK)
create table if not exists receipts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  image_path text not null,
  status text default 'pending' check (status in ('pending','parsed','failed')),
  raw_extraction jsonb,
  created_at timestamptz default now()
);
alter table receipts enable row level security;
create policy "receipts_own" on receipts for all using (auth.uid() = user_id);

-- transactions
create table if not exists transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  account_id uuid references accounts not null,
  direction text check (direction in ('income','expense')) not null,
  amount numeric not null,
  currency text default 'AUD',
  category text,
  merchant text,
  occurred_on date not null,
  note text,
  receipt_id uuid references receipts,
  source text default 'manual' check (source in ('manual','receipt','stripe','shopify','assistant')),
  created_at timestamptz default now()
);
alter table transactions enable row level security;
create policy "transactions_own" on transactions for all using (auth.uid() = user_id);

-- balance_snapshots
create table if not exists balance_snapshots (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  account_id uuid references accounts not null,
  balance numeric not null,
  as_of date not null,
  note text,
  created_at timestamptz default now()
);
alter table balance_snapshots enable row level security;
create policy "balance_snapshots_own" on balance_snapshots for all using (auth.uid() = user_id);

-- weight_logs
create table if not exists weight_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  weight numeric not null,
  unit text default 'kg',
  logged_on date not null,
  note text,
  created_at timestamptz default now()
);
alter table weight_logs enable row level security;
create policy "weight_logs_own" on weight_logs for all using (auth.uid() = user_id);

-- anchors
create table if not exists anchors (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  type text,
  target numeric,
  active boolean default true,
  created_at timestamptz default now()
);
alter table anchors enable row level security;
create policy "anchors_own" on anchors for all using (auth.uid() = user_id);

-- anchor_logs
create table if not exists anchor_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  anchor_id uuid references anchors not null,
  logged_on date not null,
  value numeric,
  created_at timestamptz default now()
);
alter table anchor_logs enable row level security;
create policy "anchor_logs_own" on anchor_logs for all using (auth.uid() = user_id);

-- check_ins
create table if not exists check_ins (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  check_in_date date not null,
  mood int,
  energy int,
  note text,
  reflection_text text,
  created_at timestamptz default now(),
  unique (user_id, check_in_date)
);
alter table check_ins enable row level security;
create policy "check_ins_own" on check_ins for all using (auth.uid() = user_id);

-- calendar_events
create table if not exists calendar_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean default false,
  source text default 'native' check (source in ('native','gcal')),
  external_id text,
  created_at timestamptz default now()
);
alter table calendar_events enable row level security;
create policy "calendar_events_own" on calendar_events for all using (auth.uid() = user_id);

-- coach_reviews
create table if not exists coach_reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  period_start date not null,
  period_end date not null,
  summary text not null,
  created_at timestamptz default now()
);
alter table coach_reviews enable row level security;
create policy "coach_reviews_own" on coach_reviews for all using (auth.uid() = user_id);

-- conversations
create table if not exists conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);
alter table conversations enable row level security;
create policy "conversations_own" on conversations for all using (auth.uid() = user_id);

-- messages
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  conversation_id uuid references conversations not null,
  role text check (role in ('user','assistant')) not null,
  content text,
  tool_calls jsonb,
  created_at timestamptz default now()
);
alter table messages enable row level security;
create policy "messages_own" on messages for all using (auth.uid() = user_id);

-- reminders
create table if not exists reminders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  due_at timestamptz not null,
  recurrence text,
  status text default 'pending' check (status in ('pending','done','cancelled')),
  source text default 'manual' check (source in ('manual','assistant')),
  created_at timestamptz default now()
);
alter table reminders enable row level security;
create policy "reminders_own" on reminders for all using (auth.uid() = user_id);

-- notifications
create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  type text,
  title text not null,
  body text,
  read boolean default false,
  related_id uuid,
  created_at timestamptz default now()
);
alter table notifications enable row level security;
create policy "notifications_own" on notifications for all using (auth.uid() = user_id);

-- Enable realtime for notifications
alter publication supabase_realtime add table notifications;

-- Trigger to auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
