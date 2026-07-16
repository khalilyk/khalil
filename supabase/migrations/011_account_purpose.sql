-- Give each account a purpose label and optional links to a goal / a business.
alter table public.accounts add column if not exists purpose text;
alter table public.accounts add column if not exists goal_id uuid references public.goals(id) on delete set null;
alter table public.accounts add column if not exists business_key text;
