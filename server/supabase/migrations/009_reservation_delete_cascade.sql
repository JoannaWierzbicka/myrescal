-- Delete reservations when their property or room is deleted.
-- Idempotent: safe to run more than once.

alter table public.reservations
  drop constraint if exists reservations_property_fk;

alter table public.reservations
  add constraint reservations_property_fk foreign key (property_id)
  references public.properties(id) on delete cascade;

alter table public.reservations
  drop constraint if exists reservations_room_fk;

alter table public.reservations
  add constraint reservations_room_fk foreign key (room_id)
  references public.rooms(id) on delete cascade;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'reservations_property_fk'
      and confdeltype = 'c'
  ) then
    raise exception 'reservations_property_fk is not configured with ON DELETE CASCADE';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'reservations_room_fk'
      and confdeltype = 'c'
  ) then
    raise exception 'reservations_room_fk is not configured with ON DELETE CASCADE';
  end if;
end $$;

select
  conname as constraint_name,
  case confdeltype
    when 'c' then 'cascade'
    when 'n' then 'set null'
    when 'r' then 'restrict'
    when 'a' then 'no action'
    when 'd' then 'set default'
  end as on_delete
from pg_constraint
where conname in ('reservations_property_fk', 'reservations_room_fk')
order by conname;
