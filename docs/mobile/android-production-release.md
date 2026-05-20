# MyResCal Android Production Release Checklist

## Current State

The Android app is already generated with Capacitor and can run on a device.
The current package identity is:

- app name: `MyResCal`
- Android application id: `com.myrescal.app`
- min SDK: `24`
- target SDK: `36`
- API target status: OK for the current Google Play requirement of Android 15 / API 35 or newer for new apps and updates.

The current documentation covers debug-device development. This file covers the remaining production work before Google Play publication.

## Release Blockers

These items should be completed before any public or open testing track:

1. Create and publish a privacy policy URL.
2. Add an in-app privacy policy link or text.
3. Add an account/data deletion request path in-app and a public web URL for deletion requests.
4. Complete Google Play Data safety declarations from the real data inventory.
5. Configure production email delivery for Supabase Auth.
6. Decide production backend plan: keep Render/Supabase or move to a managed alternative; avoid free-tier cold starts for public release.
7. Create a signed Android App Bundle (`.aab`) with an upload key.
8. Configure Play App Signing in Play Console.
9. Run production smoke tests on a release build, not only debug.
10. Review source map handling before production release.

## Android Build And Store Tasks

Google Play requires new apps to be published as Android App Bundles. Android builds must also be signed before upload.

Recommended sequence:

1. Confirm final package id before the first Play upload.
   - Current: `com.myrescal.app`.
   - Changing it later means publishing as a different app.
2. Set production versioning in `client/android/app/build.gradle`.
   - Increment `versionCode` for every Play upload.
   - Set user-facing `versionName`, for example `1.0.0`.
3. Generate an upload keystore and store it outside the repo.
   - Do not commit keystores, passwords, or signing configs with raw secrets.
4. Configure the release signing config locally or through CI secrets.
5. Build a signed release AAB.
6. Upload the AAB to Play Console.
7. Start with internal testing, then closed testing, then production.
8. Prepare store listing assets:
   - app name;
   - short and full description;
   - phone screenshots;
   - optional tablet screenshots;
   - app icon and feature graphic;
   - support email;
   - privacy policy URL;
   - account deletion URL.

Useful commands from `client`:

```bash
npm ci
npm run lint
npm run build:android
npm run cap:sync
cd android
./gradlew bundleRelease
```

The exact signing command/config depends on where the keystore is stored.

## Current Android Config Notes

- `targetSdkVersion = 36`, which is above the current Play minimum.
- `versionCode = 1` and `versionName = "1.0"` are still initial values.
- `android:allowBackup="true"` is enabled. Review whether WebView/local app data should be included in Android cloud backups before public release.
- `minifyEnabled false` is acceptable for an initial release, but shrinking/obfuscation can be enabled later after testing.
- `client/vite.config.js` currently has `sourcemap: true`. For production, either disable public source maps or upload them privately to Sentry during release.
- The app currently uses only `android.permission.INTERNET`; this is good from a Play permission-review perspective.

## Backend And Infrastructure

The current backend shape is acceptable for an MVP release if operated as production infrastructure:

- frontend/web: Vercel or equivalent static hosting;
- API: Render or equivalent Node hosting;
- database/auth: Supabase;
- monitoring: Sentry;
- transactional email: custom SMTP for Supabase Auth.

You do not need to own a physical server. You do need stable production services.

Minimum production requirements:

1. HTTPS everywhere.
   - Vercel, Render, and Supabase can provide HTTPS.
   - Mobile API URL must stay absolute, for example `https://myrescal.onrender.com/api` or a custom domain.
2. Paid or non-sleeping backend plan.
   - Free cold starts are a user-facing reliability problem for mobile.
3. Custom domain.
   - Strongly recommended for trust, email deliverability, privacy policy, deletion URL, and future deep links.
   - Example: `myrescal.com`, `api.myrescal.com`, `app.myrescal.com`.
4. Strict CORS.
   - Include only production web origins and Capacitor origins needed by the Android app.
5. Secrets managed outside Git.
   - Supabase service role key must stay server-only.
6. Backups and restore tests.
   - Keep using the documented backup/restore runbook.
7. Production SMTP.
   - Supabase default email sender is not enough for production registration.

## Data Safety Draft Inventory

This is a technical inventory for Play Console. The final answers must match the actual production configuration and privacy policy.

Data collected by app functionality:

- account data: email, password handled by Supabase Auth, user id;
- owner profile: first name, last name, optional phone, optional company name;
- reservation guest data: guest first name, last name, optional phone, optional email;
- reservation business data: dates, adults/children counts, status, notes, price/deposit values, property/room linkage;
- diagnostics, if Sentry is enabled: error events, request ids, endpoint/status metadata, user id and possibly email.

Data processors/providers likely involved:

- Supabase: auth and database;
- Render: backend hosting;
- Vercel: web frontend hosting, if public web app remains deployed;
- Sentry: diagnostics, if DSNs are configured;
- SMTP provider, for example Resend: auth emails, if configured;
- Google Play: app distribution and Play Console metadata.

Current app permissions:

- Internet only.
- No location, contacts, camera, microphone, SMS, calendar, or file permission is currently declared.

## Privacy And Account Deletion Tasks

Before public release:

1. Publish a privacy policy as a normal public web page, not a PDF.
2. Add a privacy link inside the app, preferably in Settings and/or auth screens.
3. Add a data deletion URL for Play Console.
4. Add an in-app path to request account deletion.
5. Implement or document an operational deletion process:
   - verify requester identity;
   - delete Supabase auth user;
   - delete owner profile;
   - delete properties, rooms, reservations, and associated guest data;
   - retain only data that has a documented legal/security reason and retention period.

There is currently no account deletion endpoint or in-app deletion request flow in the codebase.

## Pipeline Recommendation

Docker is optional for the current architecture. It is useful if you want identical local/CI/production backend runtime, but it is not required to publish the Android app.

Minimum CI should exist before public release:

1. Backend:
   - `cd server && npm ci && npm test`
2. Frontend:
   - `cd client && npm ci && npm run lint && npm run build`
3. Android:
   - `cd client && npm run build:android && npm run cap:sync`
   - optionally `cd client/android && ./gradlew assembleDebug` for pull requests;
   - `bundleRelease` only on release tags or protected branches with signing secrets.

Git flow recommendation:

- Use a simple trunk-based flow:
  - protected `main`;
  - short feature branches;
  - pull request checks;
  - semantic tags for mobile releases, for example `android-v1.0.0`;
  - every Play upload increments `versionCode`.
- Full GitFlow with long-lived `develop`, `release/*`, and `hotfix/*` branches is likely heavier than this project needs right now.

## Official References

- Google Play publish overview: https://developer.android.com/studio/publish/
- Android app signing: https://developer.android.com/studio/publish/app-signing
- Google Play target API requirements: https://developer.android.com/google/play/requirements/target-sdk
- Google Play Data safety form: https://support.google.com/googleplay/android-developer/answer/10787469
- Google Play User Data policy: https://support.google.com/googleplay/android-developer/answer/10144311
