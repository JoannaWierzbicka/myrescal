-- Choose one variant after checking column types in public.reservations.
-- Run only one ALTER TABLE block below.

create extension if not exists btree_gist;

-- Optional: uncomment before applying if you need to recreate the constraint.
-- alter table public.reservations drop constraint if exists reservations_no_overlap;

-- Variant A (for DATE start_date/end_date)
-- alter table public.reservations
--   add constraint reservations_no_overlap
--   exclude using gist (
--     room_id with =,
--     daterange(start_date, end_date, '[)') with &&
--   );

-- Variant B (for TIMESTAMP/TIMESTAMPTZ start_date/end_date)
-- alter table public.reservations
--   add constraint reservations_no_overlap
--   exclude using gist (
--     room_id with =,
--     tstzrange(start_date, end_date, '[)') with &&
--   );
