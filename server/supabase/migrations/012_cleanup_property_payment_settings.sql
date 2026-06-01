-- Remove obsolete property payment settings that were briefly part of migration 011.
-- Idempotent: safe to run more than once.

alter table public.properties
  drop column if exists payment_transfer_title_template,
  drop column if exists deposit_unpaid_note;
