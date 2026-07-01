-- Admin / contact fields on profiles
alter table profiles add column if not exists full_name text;
alter table profiles add column if not exists phone text;
alter table profiles add column if not exists contact_email text;
alter table profiles add column if not exists emergency_contact text;
