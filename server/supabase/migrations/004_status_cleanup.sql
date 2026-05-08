-- Normalize legacy reservation status values.
-- Idempotent: safe to run more than once.

update public.reservations
set status = 'confirmed',
    confirmation_method = coalesce(confirmation_method, 'booking_com')
where lower(btrim(status)) = 'booking';

update public.reservations
set status = 'confirmed',
    confirmation_method = coalesce(confirmation_method, 'other')
where lower(btrim(status)) = 'confirmed';

alter table public.reservations
  drop constraint if exists reservations_status_check;

alter table public.reservations
  add constraint reservations_status_check
  check (status in ('preliminary', 'deposit_paid', 'confirmed', 'past'));
