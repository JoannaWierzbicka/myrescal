-- Property payment and guest-message settings used by reservation confirmations.
-- Idempotent: safe to run more than once.

alter table public.properties
  add column if not exists payment_recipient text,
  add column if not exists payment_account text,
  add column if not exists deposit_type text,
  add column if not exists deposit_value numeric,
  add column if not exists deposit_due_days integer,
  add column if not exists message_deposit_request_enabled boolean not null default true,
  add column if not exists message_deposit_confirmation_enabled boolean not null default true,
  add column if not exists message_booking_confirmation_enabled boolean not null default true,
  add column if not exists message_custom_enabled boolean not null default true;

do $$
begin
  alter table public.properties
    add constraint properties_payment_recipient_length
    check (payment_recipient is null or char_length(btrim(payment_recipient)) between 1 and 160);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.properties
    add constraint properties_payment_account_length
    check (payment_account is null or char_length(btrim(payment_account)) between 1 and 80);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.properties
    add constraint properties_deposit_type_check
    check (deposit_type is null or deposit_type in ('percent', 'amount'));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.properties
    add constraint properties_deposit_value_range
    check (
      deposit_value is null
      or (
        deposit_value >= 0
        and (deposit_type <> 'percent' or deposit_value <= 100)
      )
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.properties
    add constraint properties_deposit_due_days_range
    check (deposit_due_days is null or deposit_due_days between 0 and 365);
exception
  when duplicate_object then null;
end $$;
