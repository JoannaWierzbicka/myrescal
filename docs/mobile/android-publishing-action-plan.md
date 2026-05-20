# MyResCal Android Publishing Action Plan

This is the working plan to move MyResCal from a working Capacitor Android build to a Google Play release.

Use this file as the main checklist. The other documents contain deeper context:

- `docs/mobile/android-production-release.md`
- `docs/legal/privacy-compliance-readiness.md`
- `docs/mobile/android-runbook.md`
- `docs/operational/auth-smtp.md`
- `docs/operational/backup-restore.md`
- `docs/operational/monitoring-sentry.md`

## Phase 0 - Confirm Release Scope

Goal: freeze the first publishable version so the release work has a clear target.

1. Decide whether the first public version is only Android or Android plus public web.
2. Confirm final app name: `MyResCal`.
3. Confirm final Android package id before the first Play upload.
   - Current: `com.myrescal.app`.
   - Do not change this after publishing unless you want a separate app listing.
4. Decide launch market/languages.
   - Current app supports Polish and English.
5. Decide whether this is:
   - internal testing only;
   - closed testing;
   - public production release.
6. Create a release owner checklist:
   - who owns legal text;
   - who owns Play Console;
   - who owns backend/Supabase;
   - who owns release signing key.

Exit criteria:

- Package id is final.
- First release scope is written down.
- Someone owns each release area.

## Phase 1 - Business, Domain, And Contact Decisions

Goal: prepare the public identity required by privacy policy, Play Console, auth email, and support.

1. Decide public developer/company name.
   - This must match or be clearly referenced in the privacy policy.
2. Decide support email.
   - Example: `support@myrescal.com`.
3. Decide privacy contact email.
   - Can be the same as support for MVP.
4. Buy or assign a domain.
   - Recommended: `myrescal.com` or a domain you control.
5. Decide public URLs:
   - web app URL;
   - API URL;
   - privacy policy URL;
   - account deletion request URL.
6. Decide whether to use custom subdomains:
   - `app.example.com`;
   - `api.example.com`;
   - `privacy.example.com` or `/privacy`;
   - `/delete-account`.

Exit criteria:

- Domain and public contact email are chosen.
- Privacy policy and deletion URLs are reserved.

## Phase 2 - Privacy, RODO/GDPR, And Google Play Policy

Goal: remove the legal/store blockers before public testing.

1. Create the public privacy policy.
   - Must be a public, active, non-geofenced web page.
   - Do not use a PDF for Google Play.
2. Include at minimum:
   - controller identity and contact;
   - privacy contact;
   - collected data categories;
   - processing purposes;
   - legal bases;
   - processors/providers;
   - transfer safeguards if data leaves the EEA;
   - retention periods or criteria;
   - user rights;
   - account/data deletion process;
   - security summary;
   - effective date.
3. Create a processor/provider register.
   - Supabase;
   - Render;
   - Vercel, if web stays deployed;
   - Sentry, if enabled;
   - SMTP provider, for example Resend;
   - Google Play.
4. Check each provider's DPA/data processing terms.
5. Decide retention periods:
   - active account data;
   - deleted account data;
   - reservation data;
   - logs;
   - backups;
   - Sentry events.
6. Decide whether Sentry is enabled in production.
   - If yes, document user id/email diagnostic processing.
7. Decide whether any analytics/cookies are used.
   - Current code does not show a separate analytics SDK.
   - If analytics are added later, consent may be needed.
8. Prepare Google Play Data safety answers from actual behavior.
   - Account data;
   - owner profile data;
   - guest/reservation data;
   - diagnostics if Sentry is enabled.
9. Add a privacy policy link inside the app.
   - Recommended locations: Settings and auth pages footer.
10. Add account deletion support.
   - In-app route or Settings action.
   - External public deletion request URL.

Exit criteria:

- Privacy policy is published.
- In-app privacy link exists.
- Account deletion request path exists in app.
- Public deletion URL exists.
- Data Safety draft is ready.

## Phase 3 - Implement Account/Data Deletion

Goal: satisfy Google Play account deletion requirements and GDPR deletion handling.

Recommended MVP implementation:

1. Add a backend endpoint for authenticated deletion request.
   - Example: `POST /api/account/deletion-request`.
   - Store request or send email to support/admin.
2. Add a Settings UI action:
   - `Request account deletion`;
   - explain that account and associated data will be deleted after verification.
3. Add a public web page for unauthenticated deletion requests.
   - Example: `https://example.com/delete-account`.
   - User submits account email and request details.
4. Define manual operational procedure:
   - verify requester controls the account email;
   - export minimal audit record if legally needed;
   - delete Supabase auth user;
   - delete owner profile;
   - delete properties, rooms, reservations;
   - remove guest contact data associated with that owner;
   - document backup/log retention.
5. Later improvement: automate deletion end-to-end after re-authentication.

Exit criteria:

- Users can initiate deletion from inside the app.
- Users can request deletion from the web.
- Support/admin has a documented deletion procedure.

## Phase 4 - Production Backend And Database

Goal: make the current backend/database setup production-grade enough for public users.

1. Decide hosting model.
   - Current architecture can remain: Render + Supabase + Vercel.
   - Avoid free-tier sleeping backend for public mobile release.
2. Configure HTTPS production URLs.
   - API must be absolute for Android builds.
3. Configure production `CORS_ORIGIN`.
   - Include production web origin.
   - Include Capacitor origins required by Android, currently `https://localhost` and possibly `http://localhost`.
   - Remove unnecessary dev origins from production.
4. Configure Supabase Auth custom SMTP.
   - Follow `docs/operational/auth-smtp.md`.
5. Confirm Supabase email confirmation is enabled.
6. Confirm Supabase redirect URLs:
   - production web login URL;
   - local dev URL;
   - future mobile deep link if implemented.
7. Confirm migrations are fully applied.
   - Follow `server/supabase/README.md`.
8. Confirm RLS policies are enabled.
9. Configure production backups.
   - Use `docs/operational/backup-restore.md`.
10. Run a restore test to a non-production database.
11. Configure monitoring.
   - Backend Sentry project;
   - frontend/mobile Sentry project;
   - alerts for 5xx/auth/Supabase/network errors.
12. Review server secrets.
   - `SUPABASE_SERVICE_ROLE_KEY` must be server-only.
   - Never expose service role key to Vite/client.

Exit criteria:

- Production API URL is stable and HTTPS.
- SMTP works.
- Backups and restore test are done.
- Monitoring is configured or explicitly deferred.

## Phase 5 - App Production Changes

Goal: make the app binary and web bundle suitable for release.

1. Add in-app privacy policy link.
2. Add account deletion request UI.
3. Review auth storage.
   - Current storage uses WebView/browser `localStorage`.
   - Acceptable for early MVP only after explicit risk acceptance.
   - Consider native secure storage before broader public launch.
4. Review `android:allowBackup`.
   - Current value: `true`.
   - Decide whether local WebView/session data should be backed up by Android.
5. Review source maps.
   - Current Vite config has `sourcemap: true`.
   - For production, either disable public source maps or upload source maps privately to Sentry and avoid public serving.
6. Review versioning in `client/android/app/build.gradle`.
   - Increment `versionCode` for each Play upload.
   - Set `versionName` for the release.
7. Confirm app icon and splash are final.
8. Run mobile UX smoke tests:
   - register;
   - confirm email;
   - login;
   - logout;
   - dashboard;
   - create/edit/delete reservation;
   - create/edit/delete property;
   - create/edit/delete room;
   - language switch;
   - Android back button;
   - keyboard behavior in forms;
   - network error/cold start.
9. Test on at least:
   - one physical phone;
   - one emulator or second device;
   - a small viewport around 360px wide.

Exit criteria:

- Privacy and deletion UI exists.
- Release version is set.
- Source map decision is applied.
- Smoke tests pass on real Android device.

## Phase 6 - CI And Release Workflow

Goal: prevent accidental broken releases.

1. Add or configure CI for backend:
   - `cd server && npm ci && npm test`.
2. Add or configure CI for frontend:
   - `cd client && npm ci && npm run lint && npm run build`.
3. Add Android validation:
   - `cd client && npm run build:android && npm run cap:sync`;
   - optionally `cd client/android && ./gradlew assembleDebug`.
4. Keep release signing secrets out of repo.
5. Build release AAB only from protected branch or release tag.
6. Use simple branch strategy:
   - protected `main`;
   - short feature branches;
   - PR checks;
   - release tags, for example `android-v1.0.0`.
7. Document release notes per Play upload.

Exit criteria:

- PR/release checks are repeatable.
- Release signing secrets are stored safely.
- Release tagging/versioning process is clear.

## Phase 7 - Google Play Console Setup

Goal: prepare the app listing and compliance forms.

1. Create or access Google Play Developer account.
2. Complete developer identity verification if required.
3. Create new app in Play Console.
4. Enter app details:
   - app name;
   - default language;
   - app or game;
   - free or paid.
5. Add store listing:
   - short description;
   - full description;
   - app icon;
   - feature graphic;
   - phone screenshots;
   - optional tablet screenshots.
6. Add contact details:
   - support email;
   - website, if available.
7. Add privacy policy URL.
8. Complete App content sections:
   - Data safety;
   - account deletion URL;
   - target audience/content rating;
   - ads declaration;
   - app access instructions if login is required for review.
9. Create internal testing track first.
10. Add testers.

Exit criteria:

- Play Console app is created.
- Store listing is complete enough for internal testing.
- Privacy/Data safety/account deletion forms are complete.

## Phase 8 - Signing And Release Build

Goal: produce a Play-uploadable `.aab`.

1. Generate upload keystore.
   - Store outside repo.
   - Store password in a password manager or CI secret store.
2. Configure release signing.
   - Locally through Android Studio, or Gradle with env/secret values.
3. From `client`, build and sync:

```bash
npm ci
npm run lint
npm run build:android
npm run cap:sync
```

4. From `client/android`, build bundle:

```bash
./gradlew bundleRelease
```

5. Locate generated `.aab`.
6. Upload to Play Console internal testing.
7. Configure Play App Signing.

Exit criteria:

- Signed AAB uploads successfully to Play Console.
- Internal testing release is available to testers.

## Phase 9 - Internal And Closed Testing

Goal: catch store, device, backend, and privacy issues before production rollout.

1. Install from Google Play internal testing, not only Android Studio.
2. Test a fresh account:
   - register;
   - receive confirmation email;
   - confirm email;
   - login.
3. Test core app flows:
   - create property;
   - create room;
   - create reservation;
   - edit reservation;
   - delete reservation;
   - delete room/property;
   - logout/login again.
4. Test privacy/deletion:
   - open privacy policy link;
   - initiate account deletion request;
   - verify public deletion URL works.
5. Test reliability:
   - backend cold start if still relevant;
   - no network;
   - slow network;
   - expired token.
6. Check monitoring:
   - backend logs;
   - Sentry events if enabled;
   - Play Console Android vitals after testers use the app.
7. Fix blockers, increment `versionCode`, upload a new internal build.
8. Move to closed testing when internal testing is stable.

Exit criteria:

- Internal testing passes without release blockers.
- Closed testing feedback is acceptable.
- No privacy/store policy blockers remain.

## Phase 10 - Production Rollout

Goal: publish gradually and keep rollback options clear.

1. Prepare final release notes.
2. Confirm backend is on production plan and healthy.
3. Confirm backups are recent.
4. Confirm support inbox is monitored.
5. Promote release from testing to production.
6. Use staged rollout if available.
7. Monitor:
   - Play Console crashes/ANRs;
   - backend 5xx;
   - auth errors;
   - Supabase errors;
   - support emails.
8. Pause rollout if crash rate, login failure, or data integrity issues appear.
9. For fixes:
   - patch issue;
   - increment `versionCode`;
   - build/upload new AAB;
   - release to testing first when practical.

Exit criteria:

- App is live.
- Monitoring is watched during the first release window.
- Post-release issues are tracked.

## Suggested First Work Sprint

Do these first, in order:

1. Confirm package id, domain, support email, privacy contact.
2. Draft and publish privacy policy page.
3. Implement in-app privacy link.
4. Implement account deletion request path.
5. Configure Supabase custom SMTP.
6. Decide production API domain/Render plan.
7. Disable public source maps or configure private Sentry source map upload.
8. Set Android `versionCode`/`versionName`.
9. Create Play Console app and complete Data safety draft.
10. Generate signed AAB and upload to internal testing.
