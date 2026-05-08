-- Read-only preflight before applying MyResCal Supabase migrations.
-- Run this first in Supabase SQL Editor and save the results.

select
  table_schema,
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('properties', 'rooms', 'reservations', 'owner_profiles')
order by table_name;

select
  table_name,
  column_name,
  data_type,
  udt_name,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('properties', 'rooms', 'reservations', 'owner_profiles')
order by table_name, ordinal_position;

select
  n.nspname as schema_name,
  t.relname as table_name,
  c.conname as constraint_name,
  c.contype as constraint_type,
  pg_get_constraintdef(c.oid) as definition
from pg_constraint c
join pg_class t on t.oid = c.conrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relname in ('properties', 'rooms', 'reservations', 'owner_profiles')
order by t.relname, c.conname;

select
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('properties', 'rooms', 'reservations', 'owner_profiles')
order by tablename, policyname;

select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('properties', 'rooms', 'reservations', 'owner_profiles')
order by tablename, indexname;

