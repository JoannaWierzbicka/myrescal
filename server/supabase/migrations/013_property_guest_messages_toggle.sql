-- Master toggle for guest messages per property.
-- Idempotent: safe to run more than once.

alter table public.properties
  add column if not exists guest_messages_enabled boolean not null default true;
