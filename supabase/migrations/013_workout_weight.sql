-- Track the weight lifted per exercise (nullable; bodyweight moves leave it empty).
alter table workout_logs
  add column if not exists weight numeric;
