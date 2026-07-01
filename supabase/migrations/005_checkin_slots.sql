-- Allow two check-ins per day (morning + evening)
alter table check_ins add column if not exists slot text default 'morning';
alter table check_ins drop constraint if exists check_ins_user_id_check_in_date_key;
alter table check_ins add constraint check_ins_user_date_slot_key unique (user_id, check_in_date, slot);
