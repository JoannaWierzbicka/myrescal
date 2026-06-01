# Supabase Migrations

This folder is the current source of truth for manual Supabase SQL migrations.

Run files in Supabase SQL Editor in numeric order:

1. `000_preflight_read_only.sql`
2. `001_core_schema.sql`
3. `002_owner_profiles.sql`
4. `003_rls_policies.sql`
5. `004_status_cleanup.sql`
6. `005_reservations_no_overlap_auto.sql`
7. `007_confirmed_reservations.sql`
8. `008_verify_post_deploy.sql`
9. `009_reservation_delete_cascade.sql`
10. `010_owner_property_confirmation_settings.sql`
11. `011_property_payment_and_message_settings.sql`
12. `012_cleanup_property_payment_settings.sql`

Rules:

- Run `000_preflight_read_only.sql` first and save the result before changing DB schema.
- Run `008_verify_post_deploy.sql` after migrations and save the result.
- Do not edit already-run migration files for production. Add a new numbered file instead.
- Keep new DB changes in this directory as numbered migration files.
