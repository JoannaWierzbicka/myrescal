# Supabase Migration Runbook

## Purpose

This runbook describes the current repeatable Supabase database change process for MyResCal.

The current source of truth is:

```text
server/supabase/migrations/
```

The `server/supabase/` directory should contain only the README and the `migrations/` directory. Do not apply database changes by running ad hoc SQL files outside the numbered migration flow.

## Execution Order

In Supabase Dashboard, open:

```text
SQL Editor -> New query
```

Run files in this order:

1. `000_preflight_read_only.sql`
2. `001_core_schema.sql`
3. `002_owner_profiles.sql`
4. `003_rls_policies.sql`
5. `004_status_cleanup.sql`
6. `005_reservations_no_overlap_auto.sql`
7. `006_verify_post_deploy.sql`

## What To Check

After `000_preflight_read_only.sql`, save the result. It is the pre-change snapshot.

After `006_verify_post_deploy.sql`, verify:

- `rls_enabled = true` for:
  - `properties`,
  - `rooms`,
  - `reservations`,
  - `owner_profiles`.
- `reservations_no_overlap_exists = true`.
- `overlapping_reservation_pairs = 0`.
- RLS policies exist for all four tables.

## If The Overlap Migration Stops

`005_reservations_no_overlap_auto.sql` intentionally stops if the database already contains overlapping reservations for the same room.

If that happens:

1. Run `006_verify_post_deploy.sql`.
2. The last result shows up to 20 conflict pairs.
3. Fix the conflicts manually in the app or in Supabase.
4. Run `005_reservations_no_overlap_auto.sql` again.
5. Run `006_verify_post_deploy.sql` again.

## Future Rules

- Do not edit migration files that have already been applied to production.
- Every new DB change gets a new file with the next number.
- Migrations should be idempotent where practical.
- Every RLS, constraint, or index change must have a short verification query.

