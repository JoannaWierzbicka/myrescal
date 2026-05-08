# Backup & Restore Runbook (MyResCal)

## 1. Scope And Purpose

This runbook describes the minimal practical backup and restore process for the current architecture: Supabase + Node/Express. It does not cover infrastructure migration.

Priorities:

- recover critical business data quickly;
- reduce operational risk;
- keep restore testing repeatable.

## 2. What Needs Backup

### Critical Data

- `public.reservations` - primary reservation business data.
- `public.properties` - owner properties.
- `public.rooms` - rooms linked to properties and reservations.
- `auth.users` - user accounts mapped to `owner_id`.

### DB Configuration And Logic

- SQL from `server/supabase/migrations/*.sql` covering RLS, constraints, and indexes.
- Environment variables from `server/.env`; treat them as secrets and store them outside the repo.

### Outside The Database

- The codebase currently does not use Supabase Storage buckets or user uploads.
- Frontend static assets are versioned in Git and do not need a separate runtime data backup.

## 3. What Supabase Provides

- Built-in physical backups, depending on the project plan.
- Point-in-time recovery (PITR) as a plan/add-on feature.
- Backup restore through the Supabase platform.

Note: database backups do not include every project setting, for example API keys or some Auth settings. They also do not include Storage object files, only object metadata.

## 4. Minimal Backup Policy

### Frequency

- Daily: one logical application backup using `scripts/backup.sh`.
- Additionally before every higher-risk change, for example larger SQL changes or a larger backend deploy.

### Retention

- Local: 7 days.
- Offsite copy in private encrypted storage: 30 days.

### Ownership

- Process owner: on-call/deploying developer.
- Daily backups can be triggered manually or from a simple cron/CI job. No complex orchestration is required at this stage.

## 5. How To Run Backup

Local requirements:

- `pg_dump`, `gzip`.
- `DATABASE_URL` with read access to required schemas.

Example:

```bash
export DATABASE_URL='postgresql://...'
./scripts/backup.sh
```

Output:

- dump file: `backups/backup_YYYYmmdd_HHMMSS.sql.gz`
- checksum: `backups/backup_YYYYmmdd_HHMMSS.sql.gz.sha256`

## 6. Restore Plan

### Safety Rule

Run a test restore first, then decide whether production restore is needed.

### Steps

1. Take a fresh backup of the current target database, even if it is logically broken.
2. Choose the correct backup file and verify its checksum.
3. Set `DATABASE_URL` to a test/staging environment, never production first.
4. Run restore:

```bash
export DATABASE_URL='postgresql://...test...'
./scripts/restore.sh backups/backup_YYYYmmdd_HHMMSS.sql.gz
```

5. Verify integrity and application behavior. See section 7.
6. Only after a successful test, repeat restore on production during a controlled maintenance window.

Non-interactive mode, for example in CI:

```bash
FORCE_RESTORE=1 ./scripts/restore.sh --yes backups/backup_YYYYmmdd_HHMMSS.sql.gz
```

## 7. Restore Test

Minimum test, at least monthly:

1. Restore to a separate test environment.
2. Run SQL checks:

```sql
select count(*) from public.properties;
select count(*) from public.rooms;
select count(*) from public.reservations;
select count(*) from auth.users;
```

3. Run an application smoke test:

- log in with an existing account;
- list properties, rooms, and reservations;
- create and edit a sample reservation.

4. Record the test result: date, backup file, PASS/FAIL.

A backup without a recurring restore test is not a complete backup strategy.

## 8. Current Limitations

- No full scheduling and retention automation in the repo.
- No automatic backup status reporting.
- No separate procedure for Storage objects because Storage is not used by the project right now.

## 9. Preparation For Future Migration To Own Postgres

What already helps:

- regular logical dumps;
- documented restore workflow;
- SQL and RLS rules stored in the repo.

What will still be missing:

- Auth migration plan from Supabase Auth to a custom mechanism;
- mapping of Supabase-specific features;
- procedure for moving project settings and secrets.

Later recommendation, without implementing it now:

- keep regular restore tests;
- maintain a list of Supabase-specific dependencies;
- define the target auth model before infrastructure migration.
