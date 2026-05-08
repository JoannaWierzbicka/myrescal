-- Replace the legacy "booking" reservation status with "confirmed"
-- and store the confirmation source separately.
-- Idempotent: safe to run more than once.

alter table public.reservations
  add column if not exists confirmation_method text;

alter table public.reservations
  drop constraint if exists reservations_status_check;

alter table public.reservations
  drop constraint if exists reservations_confirmation_method_check;

update public.reservations
set confirmation_method = case
  when lower(btrim(status)) = 'booking' then 'booking_com'
  when lower(btrim(status)) = 'confirmed'
    and confirmation_method in ('paid_full', 'booking_com', 'other')
    then confirmation_method
  when lower(btrim(status)) = 'confirmed' then 'other'
  else null
end
where lower(btrim(status)) in ('booking', 'confirmed')
  or confirmation_method is not null;

update public.reservations
set status = case
  when status is null or btrim(status) = '' then 'preliminary'
  when lower(btrim(status)) in ('booking', 'confirmed') then 'confirmed'
  else btrim(status)
end
where status is null
  or btrim(status) = ''
  or status <> btrim(status)
  or lower(btrim(status)) in ('booking', 'confirmed');

alter table public.reservations
  add constraint reservations_status_check
  check (status in ('preliminary', 'deposit_paid', 'confirmed', 'past'));

alter table public.reservations
  add constraint reservations_confirmation_method_check
  check (
    (
      status = 'confirmed'
      and confirmation_method in ('paid_full', 'booking_com', 'other')
    )
    or (
      status <> 'confirmed'
      and confirmation_method is null
    )
  );
