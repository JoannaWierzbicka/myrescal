# MyResCal

MyResCal is a full-stack reservation management application.

Stack:

- client: React + Vite + MUI
- server: Node + Express
- database/auth: Supabase

## Requirements

- Node.js 20+
- npm
- Supabase project
- access to Supabase SQL Editor

## Structure

```text
.
├── client/
├── server/
├── scripts/
└── README.md
```

## Quick Start

1. Create `server/.env` from `server/.env.example`.
2. Install dependencies:

```bash
cd server && npm install
cd ../client && npm install
```

3. Apply the SQL process described in `server/supabase/README.md`.
4. Start the backend:

```bash
cd server
npm run dev
```

5. Start the frontend:

```bash
cd client
npm run dev
```

## Tests

Backend:

```bash
cd server
npm test
```

The current test suite covers core HTTP contracts, normalized error responses, `401`, `404`, malformed JSON, validators, Supabase error mapping, and the `properties`, `rooms`, and `reservations` endpoints.

## Environment Configuration

### Backend (`server/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `SUPABASE_URL` | Yes | Supabase project URL. |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon key used for user-scoped requests with RLS enforced. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Admin/service-role key used for administrative operations and auth validation. |
| `SUPABASE_KEY` | No (legacy) | Fallback for `SUPABASE_SERVICE_ROLE_KEY`; deprecated. |
| `CORS_ORIGIN` | Recommended | Comma-separated list of allowed origins. |
| `CLIENT_ORIGIN` | No (legacy) | Fallback for `CORS_ORIGIN`; deprecated. |
| `AUTH_REQUIRE_EMAIL_CONFIRMATION` | Recommended | Email confirmation is required by default; set to `false` only locally if you need to bypass it. |
| `AUTH_EMAIL_REDIRECT_URL` | Recommended | Redirect URL after clicking the email confirmation link. |
| `PORT` | No | Defaults to `3000`. |
| `JSON_BODY_LIMIT` | No | JSON body limit; defaults to `100kb`. |
| `CSP_REPORT_ONLY` | No | `true` forces CSP report-only mode; production defaults to enforce mode. |
| `API_RATE_LIMIT_MAX` | No | Global `/api` rate limit. |
| `AUTH_LOGIN_RATE_LIMIT_MAX` | No | `/api/auth/login` rate limit. |
| `SENTRY_DSN` | No | Sentry DSN for backend monitoring; empty disables Sentry. |
| `SENTRY_ENVIRONMENT` | No | Sentry environment, for example `development`, `staging`, `production`. |
| `SENTRY_RELEASE` | No | Application release/version reported to Sentry. |
| `SENTRY_TRACES_SAMPLE_RATE` | No | Performance tracing sample rate from `0` to `1`; defaults to `0`. |

### Frontend (`client/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | No | Preferred API URL, for example `/api` or `https://api.example.com`. |
| `VITE_NATIVE_API_URL` | No | Absolute API URL for Android/Capacitor builds, for example `https://myrescal.onrender.com/api`. |
| `VITE_API_BASE_URL` | No (legacy) | Fallback kept for backwards compatibility. |
| `VITE_SENTRY_DSN` | No | Sentry DSN for web/mobile monitoring; empty disables Sentry. |
| `VITE_SENTRY_ENVIRONMENT` | No | Client Sentry environment. |
| `VITE_SENTRY_RELEASE` | No | Client release/version reported to Sentry. |
| `VITE_SENTRY_TRACES_SAMPLE_RATE` | No | Frontend tracing sample rate from `0` to `1`; defaults to `0`. |

## CSP Repo Audit

- Root `vercel.json`: no CSP headers, only `rewrites`.
- `client/vercel.json`: no CSP headers, only `rewrites`.
- `client/index.html`: no CSP meta tag.
- No CSP config is stored in this repo; it may be configured in the Vercel dashboard.

## Supabase Migrations

The current source of truth for database changes is:

```text
server/supabase/migrations/
```

Run files in Supabase SQL Editor in numeric order. Details:

- `server/supabase/README.md`
- `docs/operational/supabase-migrations.md`

## Backup & Restore Runbook

Scripts:

- `scripts/backup.sh`
- `scripts/restore.sh`

Requirements:

- `DATABASE_URL` set to the Postgres connection string
- `pg_dump`, `psql`, and `gzip` available locally

Backup:

```bash
export DATABASE_URL='postgresql://...'
./scripts/backup.sh
```

Backup files:

- `backups/backup_YYYYmmdd_HHMMSS.sql.gz`
- `backups/backup_YYYYmmdd_HHMMSS.sql.gz.sha256`

Restore:

```bash
export DATABASE_URL='postgresql://...'
./scripts/restore.sh backups/backup_YYYYmmdd_HHMMSS.sql.gz
```

Non-interactive mode, for example in CI:

```bash
FORCE_RESTORE=1 ./scripts/restore.sh --yes backups/backup_YYYYmmdd_HHMMSS.sql.gz
```

Warnings:

- Restore overwrites data in the target database.
- Always test restore on a test/staging environment first.
- Take a fresh backup before restoring production.

Full operational procedure and restore test plan:

- `docs/operational/backup-restore.md`

## Auth SMTP

Configure custom SMTP for Supabase Auth before production user registration. Supabase's default email sender is intended for testing and has a low rate limit.

Runbook:

- `docs/operational/auth-smtp.md`

## Monitoring

Sentry monitors backend, web, and mobile errors after DSNs are configured in environment variables.

Runbook:

- `docs/operational/monitoring-sentry.md`
