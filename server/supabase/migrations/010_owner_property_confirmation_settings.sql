-- Owner and property settings required for reservation confirmations.
-- Idempotent: safe to run more than once.

alter table public.owner_profiles
  add column if not exists address text;

alter table public.properties
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists address text,
  add column if not exists check_in_time text,
  add column if not exists check_out_time text,
  add column if not exists check_in_instructions text,
  add column if not exists check_out_instructions text,
  add column if not exists cancellation_free_until_days integer,
  add column if not exists deposit_refund_policy text,
  add column if not exists cancellation_policy_note text,
  add column if not exists terms_text text;

do $$
begin
  alter table public.owner_profiles
    add constraint owner_profiles_address_length
    check (address is null or char_length(btrim(address)) between 1 and 500);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.properties
    add constraint properties_contact_email_length
    check (contact_email is null or char_length(btrim(contact_email)) between 3 and 254);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.properties
    add constraint properties_contact_phone_length
    check (contact_phone is null or char_length(contact_phone) between 6 and 25);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.properties
    add constraint properties_address_length
    check (address is null or char_length(btrim(address)) between 1 and 500);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.properties
    add constraint properties_check_in_time_length
    check (check_in_time is null or char_length(btrim(check_in_time)) between 1 and 20);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.properties
    add constraint properties_check_out_time_length
    check (check_out_time is null or char_length(btrim(check_out_time)) between 1 and 20);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.properties
    add constraint properties_cancellation_free_until_days_range
    check (cancellation_free_until_days is null or cancellation_free_until_days between 0 and 365);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.properties
    add constraint properties_deposit_refund_policy_check
    check (
      deposit_refund_policy is null
      or deposit_refund_policy in ('refundable', 'non_refundable', 'partially_refundable', 'custom')
    );
exception
  when duplicate_object then null;
end $$;
