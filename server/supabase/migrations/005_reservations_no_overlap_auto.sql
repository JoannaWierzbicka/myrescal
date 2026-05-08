-- Prevent overlapping reservations for the same room.
-- Idempotent: safe to run more than once.
-- The script auto-selects daterange/tsrange/tstzrange based on start_date/end_date column types.

create extension if not exists btree_gist;

do $$
declare
  start_data_type text;
  end_data_type text;
  overlap_count integer;
  range_expression text;
begin
  if exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'reservations'
      and c.conname = 'reservations_no_overlap'
  ) then
    return;
  end if;

  select data_type
  into start_data_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'reservations'
    and column_name = 'start_date';

  select data_type
  into end_data_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'reservations'
    and column_name = 'end_date';

  if start_data_type is null or end_data_type is null then
    raise exception 'Missing reservations.start_date or reservations.end_date column.';
  end if;

  if start_data_type <> end_data_type then
    raise exception 'reservations.start_date and reservations.end_date must use the same data type. Current types: %, %',
      start_data_type,
      end_data_type;
  end if;

  select count(*)
  into overlap_count
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

  if overlap_count > 0 then
    raise exception 'Cannot add reservations_no_overlap: found % overlapping reservation pairs. Run 006_verify_post_deploy.sql to list conflicts.',
      overlap_count;
  end if;

  if start_data_type = 'date' then
    range_expression := 'daterange(start_date, end_date, ''[)'')';
  elsif start_data_type = 'timestamp without time zone' then
    range_expression := 'tsrange(start_date, end_date, ''[)'')';
  elsif start_data_type = 'timestamp with time zone' then
    range_expression := 'tstzrange(start_date, end_date, ''[)'')';
  else
    raise exception 'Unsupported reservation date type for overlap constraint: %', start_data_type;
  end if;

  execute format(
    'alter table public.reservations
       add constraint reservations_no_overlap
       exclude using gist (
         room_id with =,
         %s with &&
       )
       where (room_id is not null and start_date is not null and end_date is not null)',
    range_expression
  );
end $$;

