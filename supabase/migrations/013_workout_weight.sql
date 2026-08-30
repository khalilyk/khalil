-- Track weight lifted per exercise. `weight` = a single working weight (legacy);
-- `set_weights` = an array of per-set weights (nulls allowed for unset sets).
alter table workout_logs
  add column if not exists weight numeric,
  add column if not exists set_weights jsonb;
