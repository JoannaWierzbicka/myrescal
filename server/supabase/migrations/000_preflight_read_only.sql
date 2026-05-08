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

-- Single-result summary for Supabase SQL Editor.
-- This keeps the preflight readable even when the editor shows only the last result tab.
with expected_tables(table_name) as (
  values
    ('properties'),
    ('rooms'),
    ('reservations'),
    ('owner_profiles')
),
table_status as (
  select
    expected_tables.table_name,
    (tables.table_name is not null) as exists
  from expected_tables
  left join information_schema.tables tables
    on tables.table_schema = 'public'
   and tables.table_name = expected_tables.table_name
),
rls_status as (
  select
    expected_tables.table_name,
    coalesce(classes.relrowsecurity, false) as rls_enabled
  from expected_tables
  left join pg_namespace namespaces
    on namespaces.nspname = 'public'
  left join pg_class classes
    on classes.relname = expected_tables.table_name
   and classes.relnamespace = namespaces.oid
),
policy_status as (
  select
    expected_tables.table_name,
    count(policies.policyname) as policy_count
  from expected_tables
  left join pg_policies policies
    on policies.schemaname = 'public'
   and policies.tablename = expected_tables.table_name
  group by expected_tables.table_name
),
index_status as (
  select
    expected_tables.table_name,
    count(indexes.indexname) as index_count
  from expected_tables
  left join pg_indexes indexes
    on indexes.schemaname = 'public'
   and indexes.tablename = expected_tables.table_name
  group by expected_tables.table_name
),
constraint_status as (
  select
    expected_tables.table_name,
    count(constraints.conname) as constraint_count
  from expected_tables
  left join pg_namespace namespaces
    on namespaces.nspname = 'public'
  left join pg_class classes
    on classes.relname = expected_tables.table_name
   and classes.relnamespace = namespaces.oid
  left join pg_constraint constraints
    on constraints.conrelid = classes.oid
  group by expected_tables.table_name
)
select
  table_status.table_name,
  table_status.exists as table_exists,
  rls_status.rls_enabled,
  policy_status.policy_count,
  index_status.index_count,
  constraint_status.constraint_count
from table_status
join rls_status on rls_status.table_name = table_status.table_name
join policy_status on policy_status.table_name = table_status.table_name
join index_status on index_status.table_name = table_status.table_name
join constraint_status on constraint_status.table_name = table_status.table_name
order by table_status.table_name;
