-- ─────────────────────────────────────────────────────────────
-- OPTIONAL: lock Khalil's access to the linked businesses down to
-- read-only, so it can't ever write to their databases.
--
-- Khalil's connector only runs SELECTs, but the credentials you gave
-- it (PP service_role key, NN full Postgres URL) can technically do
-- anything. These steps replace them with least-privilege access.
-- ─────────────────────────────────────────────────────────────


-- ═══ NOT NORMAL (Neon / Vercel Postgres) ═══
-- Run in the Not Normal database (Neon SQL editor or psql):

create role khalil_ro with login password 'PICK_A_STRONG_PASSWORD';
grant connect on database neondb to khalil_ro;
grant usage on schema public to khalil_ro;
grant select on invoices to khalil_ro;   -- only the table Khalil reads

-- Then set NN_POSTGRES_URL in Khalil to use khalil_ro instead of neondb_owner:
--   postgresql://khalil_ro:PICK_A_STRONG_PASSWORD@<same-host>/neondb?sslmode=require


-- ═══ PRINT PARADISE (Supabase Postgres) ═══
-- Option A — read-only Postgres role (most secure; switch the connector to pg):
--   Run in Print Paradise's Supabase SQL editor:

create role khalil_ro with login password 'PICK_A_STRONG_PASSWORD';
grant usage on schema public to khalil_ro;
grant select on orders to khalil_ro;

-- Then use Print Paradise's *pooler* connection string with khalil_ro and
-- tell me — I'll switch the Print Paradise connector from the service_role
-- key to this read-only Postgres connection (like Not Normal).

-- Option B — keep the service_role key (simplest, current setup). The key
-- is server-side only and gitignored; Khalil never writes. Lower effort,
-- higher trust. No SQL needed.
