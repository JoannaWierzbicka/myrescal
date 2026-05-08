# Sentry Monitoring Runbook (MyResCal)

## Scope

Sentry is used for:

- Express backend errors;
- web frontend errors;
- Android/Capacitor app errors;
- correlating errors with `requestId`;
- identifying the user by `user.id`.

Sentry runs only when a DSN is configured. No DSN means a silent no-op.

## Sentry Projects

Recommended setup: two projects.

```text
myrescal-backend
myrescal-frontend
```

The frontend project covers both web and Capacitor Android because both currently use the same React/Vite bundle.

## Backend ENV

Local / Render:

```env
SENTRY_DSN=
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=
SENTRY_TRACES_SAMPLE_RATE=0
```

Notes:

- Set `SENTRY_DSN` from the `myrescal-backend` project.
- `SENTRY_RELEASE` should eventually be the deployed version.
- `SENTRY_TRACES_SAMPLE_RATE=0` collects errors but does not send performance traces.
- For staging/test, temporarily setting `SENTRY_TRACES_SAMPLE_RATE=0.1` is acceptable.

## Frontend ENV

Vercel / Android build:

```env
VITE_SENTRY_DSN=
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_RELEASE=
VITE_SENTRY_TRACES_SAMPLE_RATE=0
```

Notes:

- Set `VITE_SENTRY_DSN` from the `myrescal-frontend` project.
- `VITE_*` variables are embedded at build time, so changing them requires rebuilding the frontend/Android app.

## Context Sent To Sentry

Backend:

- `request_id`;
- HTTP method;
- endpoint;
- status;
- `user.id` and email when the request is authenticated.

Frontend:

- API `request_id`;
- endpoint;
- status;
- `user.id` and email;
- whether the owner profile exists.

## Sentry Alerts

Minimum alerts before external testing:

1. Backend 5xx spike:
   - project: `myrescal-backend`;
   - condition: number of errors/issues above baseline, or at least several errors within 5-10 minutes;
   - filter: `level:error`.

2. Auth/login errors:
   - project: `myrescal-backend`;
   - filter by `/api/auth/login` and `/api/auth/register`;
   - notify when error volume increases.

3. Supabase errors:
   - project: `myrescal-backend`;
   - filter by codes starting with `SUPABASE_`.

4. Frontend API/network errors:
   - project: `myrescal-frontend`;
   - tags: `endpoint`, `status`;
   - notify on increasing network error or `5xx` volume.

5. Render cold start / timeout:
   - project: `myrescal-frontend`;
   - watch errors with `reason=timeout` or `reason=network`.

## Integration Test

1. Set DSNs locally for backend and frontend.
2. Start backend and frontend.
3. Trigger a controlled backend error:

```bash
curl http://localhost:3000/debug/sentry
```

The endpoint is available only outside `NODE_ENV=production`.

4. Trigger a controlled frontend error in the browser console:

```js
window.__MYRESCAL_TEST_SENTRY__()
```

The function is available only in Vite dev mode.

5. Check in Sentry that the event contains:
   - request id;
   - endpoint;
   - user id for an authenticated request.
6. If events appear correctly, the test hooks do not need to be removed because they are disabled in production.

Do not add a permanent `/debug-sentry` style endpoint to production without protection.

## Bundle Size

After enabling Sentry, the frontend bundle grows. Before release, consider a separate Sentry chunk or later monitoring initialization if bundle size becomes a problem for Android/Web.
