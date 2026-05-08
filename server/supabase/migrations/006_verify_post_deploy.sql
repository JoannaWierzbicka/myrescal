-- Read-only verification after applying MyResCal Supabase migrations.
-- Expected results:
-- - all listed RLS tables have rowsecurity = true,
-- - reservations_no_overlap_exists = true,
-- - overlapping_reservation_pairs = 0.

select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('properties', 'rooms', 'reservations', 'owner_profiles')
order by c.relname;

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
  exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'reservations'
      and c.conname = 'reservations_no_overlap'
  ) as reservations_no_overlap_exists;

select
  c.conname,
  c.contype,
  pg_get_constraintdef(c.oid) as definition
from pg_constraint c
join pg_class t on t.oid = c.conrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relname = 'reservations'
  and c.conname in (
    'reservations_no_overlap',
    'reservations_status_check',
    'reservations_nightly_rate_non_negative',
    'reservations_total_price_non_negative',
    'reservations_deposit_amount_non_negative',
    'reservations_property_fk',
    'reservations_room_fk'
  )
order by c.conname;

select
  count(*) as overlapping_reservation_pairs
from public.reservations r1
join public.reservations r2
  on r1.room_id = r2.room_id
 and r1.ctid < r2.ctid
 and tstzrange(r1.start_date::timestamptz, r1.end_date::timestamptz, '[)')
     && tstzrange(r2.start_date::timestamptz, r2.end_date::timestamptz, '[)')
where r1.room_id is not null
  and r2.room_id is not null
  and r1.start_date is not null
  and r1.end_date is not null
  and r2.start_date is not null
  and r2.end_date is not null;

select
  r1.id as reservation_1_id,
  r2.id as reservation_2_id,
  r1.room_id,
  r1.start_date as reservation_1_start_date,
  r1.end_date as reservation_1_end_date,
  r2.start_date as reservation_2_start_date,
  r2.end_date as reservation_2_end_date
from public.reservations r1
join public.reservations r2
  on r1.room_id = r2.room_id
 and r1.ctid < r2.ctid
 and tstzrange(r1.start_date::timestamptz, r1.end_date::timestamptz, '[)')
     && tstzrange(r2.start_date::timestamptz, r2.end_date::timestamptz, '[)')
where r1.room_id is not null
  and r2.room_id is not null
  and r1.start_date is not null
  and r1.end_date is not null
  and r2.start_date is not null
  and r2.end_date is not null
limit 20;

-- Single-result summary for Supabase SQL Editor.
-- If the editor only shows one result tab, run this block or look at the last result.
with rls_status as (
  select
    c.relname as table_name,
    c.relrowsecurity as rls_enabled
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in ('properties', 'rooms', 'reservations', 'owner_profiles')
),
overlap_constraint as (
  select exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'reservations'
      and c.conname = 'reservations_no_overlap'
  ) as exists
),
overlap_pairs as (
  select
    count(*) as count
  from public.reservations r1
  join public.reservations r2
    on r1.room_id = r2.room_id
   and r1.ctid < r2.ctid
   and tstzrange(r1.start_date::timestamptz, r1.end_date::timestamptz, '[)')
       && tstzrange(r2.start_date::timestamptz, r2.end_date::timestamptz, '[)')
  where r1.room_id is not null
    and r2.room_id is not null
    and r1.start_date is not null
    and r1.end_date is not null
    and r2.start_date is not null
    and r2.end_date is not null
),
policy_status as (
  select
    count(*) filter (where tablename = 'properties') as properties_policies,
    count(*) filter (where tablename = 'rooms') as rooms_policies,
    count(*) filter (where tablename = 'reservations') as reservations_policies,
    count(*) filter (where tablename = 'owner_profiles') as owner_profiles_policies
  from pg_policies
  where schemaname = 'public'
    and tablename in ('properties', 'rooms', 'reservations', 'owner_profiles')
)
select
  'rls_enabled' as check_name,
  case
    when count(*) = 4 and bool_and(rls_enabled) then 'pass'
    else 'fail'
  end as result,
  jsonb_object_agg(table_name, rls_enabled order by table_name) as details
from rls_status

union all

select
  'reservations_no_overlap_exists' as check_name,
  case when exists then 'pass' else 'fail' end as result,
  jsonb_build_object('exists', exists) as details
from overlap_constraint

union all

select
  'overlapping_reservation_pairs' as check_name,
  case when count = 0 then 'pass' else 'fail' end as result,
  jsonb_build_object('count', count) as details
from overlap_pairs

union all

select
  'owner_policies_present' as check_name,
  case
    when properties_policies > 0
     and rooms_policies > 0
     and reservations_policies > 0
     and owner_profiles_policies > 0
    then 'pass'
    else 'fail'
  end as result,
  jsonb_build_object(
    'properties', properties_policies,
    'rooms', rooms_policies,
    'reservations', reservations_policies,
    'owner_profiles', owner_profiles_policies
  ) as details
from policy_status;
