update public.reservations
set status = 'preliminary'
where status = 'confirmed';

alter table public.reservations
  drop constraint if exists reservations_status_check;

alter table public.reservations
  add constraint reservations_status_check
  check (status in ('preliminary', 'deposit_paid', 'booking', 'past'));
