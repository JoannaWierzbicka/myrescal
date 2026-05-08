-- Read-only verification for the reservations_no_overlap constraint.
-- Run in Supabase SQL Editor after applying reservations_no_overlap.sql.

select
  column_name,
  data_type,
  udt_name,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'reservations'
  and column_name in ('id', 'room_id', 'start_date', 'end_date')
order by column_name;

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
  and c.conname = 'reservations_no_overlap';

select
  count(*) as overlapping_reservation_pairs
from public.reservations r1
join public.reservations r2
  on r1.room_id = r2.room_id
 and r1.ctid < r2.ctid
 and tstzrange(r1.start_date::timestamptz, r1.end_date::timestamptz, '[)')
     && tstzrange(r2.start_date::timestamptz, r2.end_date::timestamptz, '[)');

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
limit 20;
