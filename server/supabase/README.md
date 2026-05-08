## Supabase Setup

The current source of truth for database changes is:

```text
server/supabase/migrations/
```

Run migrations in Supabase SQL Editor in numeric order:

1. `migrations/000_preflight_read_only.sql`
2. `migrations/001_core_schema.sql`
3. `migrations/002_owner_profiles.sql`
4. `migrations/003_rls_policies.sql`
5. `migrations/004_status_cleanup.sql`
6. `migrations/005_reservations_no_overlap_auto.sql`
7. `migrations/007_confirmed_reservations.sql`
8. `migrations/008_verify_post_deploy.sql`

Detailed runbook:

```text
docs/operational/supabase-migrations.md
```

---

### What The Migrations Do

- `000_preflight_read_only.sql`
  - does not change anything;
  - shows current tables, columns, constraints, RLS policies, and indexes;
  - run it before schema changes and save the result.

- `001_core_schema.sql`
  - creates or updates `properties`, `rooms`, and `reservations`;
  - adds missing reservation columns: `property_id`, `room_id`, `status`, `notes`, `nightly_rate`, `total_price`, `deposit_amount`, `confirmation_method`;
  - copies legacy `price` into `total_price` if that column exists;
  - adds pricing/status/confirmation constraints, foreign keys, and indexes.

- `002_owner_profiles.sql`
  - creates the `owner_profiles` table;
  - links profiles to `auth.users(id)`;
  - adds length validation constraints.

- `003_rls_policies.sql`
  - enables RLS for `properties`, `rooms`, `reservations`, and `owner_profiles`;
  - recreates owner-based policies.

- `004_status_cleanup.sql`
  - normalizes legacy reservation status values;
  - recreates the reservation status constraint.

- `005_reservations_no_overlap_auto.sql`
  - adds `btree_gist`;
  - checks whether date conflicts already exist;
  - automatically chooses `daterange`, `tsrange`, or `tstzrange`;
  - adds the `reservations_no_overlap` constraint.

- `007_confirmed_reservations.sql`
  - changes legacy `booking` reservation status values to `confirmed`;
  - adds `confirmation_method`;
  - requires `confirmation_method` for confirmed reservations.

- `008_verify_post_deploy.sql`
  - does not change anything;
  - verifies RLS, constraints, and reservation conflicts after migration.

---

### Rule

The `server/supabase/` directory should contain only this README and the `migrations/` directory.

New database changes must go through `server/supabase/migrations/`.

---

### Required Backend ENV

Set these in `server/.env`:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_REQUIRE_EMAIL_CONFIRMATION=true` recommended
- `AUTH_EMAIL_REDIRECT_URL` optional redirect URL after clicking the email confirmation link

Legacy fallback:

- `SUPABASE_KEY` deprecated, only as fallback for service role.

---

### Required Supabase Auth Setting

To create only accounts with a real email address, enable email confirmation in Supabase:

1. Supabase Dashboard -> Authentication -> Providers -> Email.
2. Enable `Confirm email`.
3. Set `Site URL` and `Redirect URLs` to the web app URL and the future mobile deep link when it is ready.
4. If you use `AUTH_EMAIL_REDIRECT_URL`, add that URL to Supabase redirect URLs.

Note: without `Confirm email`, Supabase may not send a confirmation email. The backend does not log a user in after registration by default, but email delivery is controlled by Supabase Auth settings, not only by application code.
