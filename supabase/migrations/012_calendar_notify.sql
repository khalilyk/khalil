-- Per-event reminders for the calendar.
-- `notify` = the user wants a push before this event; `notified_at` = when we sent it (so we send once).
alter table calendar_events
  add column if not exists notify boolean not null default false,
  add column if not exists notified_at timestamptz;

-- Helps the reminder cron find due events quickly.
create index if not exists calendar_events_notify_idx
  on calendar_events (starts_at)
  where notify = true and notified_at is null;
