# MyResCal Android Mobile App Specification

## 1. Objective

Package the existing MyResCal React/Vite web application as an installable Android mobile app first, while preserving a clear path to iOS later.

The recommended implementation approach is Capacitor. This allows the project to reuse the current React frontend, Material UI components, routing, API layer, authentication flow, and backend contract without a full React Native rewrite.

The first mobile milestone is an Android debug build that can be installed and tested on an emulator or physical Android device. A production Android App Bundle for Google Play is a later release milestone.

## 2. Functional Requirements

- The app must install and launch as a native Android application.
- The app display name must remain `MyResCal`.
- The Android app must load the existing React application from the local Capacitor WebView bundle.
- The app must use the deployed backend API hosted on Render.
- The backend base URL is `https://myrescal.onrender.com`.
- API requests from the mobile app must target `https://myrescal.onrender.com/api`.
- The app must preserve all existing core user flows:
  - registration
  - login
  - logout
  - authenticated dashboard access
  - property selection
  - room selection
  - reservation calendar browsing
  - reservation creation
  - reservation editing
  - reservation deletion
  - settings management for properties and rooms
  - language switching
- The app must persist authentication state across app restarts.
- The app must clear authentication state and route the user to login when the backend returns `401`.
- The app must handle slow API startup or temporary Render wake-up delays using the existing global network feedback pattern.
- The Android hardware back button must navigate inside the app when possible and exit only when there is no useful in-app history.
- The app must support Android soft keyboard behavior in forms and dialogs.
- The app must respect Android status bar, navigation bar, and safe-area constraints.

## 3. Non-Functional Requirements

- Maintain one shared frontend codebase for web, Android, and future iOS.
- Avoid duplicating business logic into platform-specific code.
- Keep native platform logic minimal and isolated.
- Use environment-based API configuration instead of hard-coded local development proxy behavior.
- The mobile build must be reproducible from documented commands.
- The app must remain usable on common Android viewport widths from 360px upward.
- Primary touch targets should be at least 44px high where practical.
- The UI must not require horizontal scrolling for primary workflows on mobile.
- The app should continue to build as a regular Vite web app.
- The current web deployment on Vercel must not be broken by Android support.
- Sensitive authentication storage should be reviewed before production release. Current browser `localStorage` is acceptable for an early debug build but should not be treated as the final security posture.

## 4. Assumptions

- Android is the first target platform.
- iOS should remain possible later but is not part of the first implementation milestone.
- The current React/Vite app remains the source of truth for UI and business logic.
- The Express/Supabase backend on Render is the production API for mobile.
- The Vercel URL `https://myrescal.vercel.app` is the hosted web frontend, not the backend API.
- Offline-first functionality is not required for the first mobile version.
- Push notifications are not required for the first mobile version.
- Native device features such as camera, contacts, calendar integration, files, and sharing are not required for the first mobile version.
- Store submission, signing, and Play Console setup are not required for the first debug milestone.
- The initial package id can be `com.myrescal.app` unless a different id is chosen before Android project generation.

## 5. Impacted Files and Components

Expected existing files:

- `client/package.json`: add Capacitor dependencies and Android scripts.
- `client/package-lock.json`: update dependency lockfile after installing Capacitor packages.
- `client/vite.config.js`: verify mobile-compatible build output and base path.
- `client/index.html`: review mobile metadata, viewport behavior, icons, and app title.
- `client/src/api/client.js`: ensure API base URL works for native mobile builds.
- `client/src/context/authStorage.js`: candidate for future native secure storage abstraction.
- `client/src/router/router.jsx`: review browser history behavior inside Capacitor WebView.
- `client/src/components/Layout.jsx`: review safe-area spacing, Snackbar placement, and mobile shell behavior.
- `client/src/components/Navbar.jsx`: verify mobile drawer and app-like navigation behavior.
- `client/src/components/ReservationCalendar.jsx`: highest-risk mobile UX area because calendar density is complex.
- `client/src/components/ReservationFormDialog.jsx`: verify Android keyboard, date inputs, and dialog scrolling.
- `client/src/components/Settings/Settings.jsx`: verify mobile property/room management layout.
- `server/app.js`: confirm CORS policy is compatible with the mobile app and deployed frontend.

Expected new files/directories:

- `client/capacitor.config.*`
- `client/android/`
- Android app icon and splash assets
- mobile build/run documentation

## 6. Implementation Plan

1. Confirm mobile architecture.
   - Use Capacitor, not a React Native rewrite.
   - Keep the existing Vite React app as the shared frontend.

2. Confirm app identity.
   - App display name: `MyResCal`.
   - Tentative Android package id: `com.myrescal.app`.
   - Confirm final package id before generating release builds.

3. Configure API targeting.
   - Use `VITE_API_URL=https://myrescal.onrender.com/api` for Android builds.
   - Keep local web development behavior intact.
   - Confirm Render CORS allows required origins.

4. Add Capacitor.
   - Install Capacitor core and CLI packages.
   - Add Android platform support.
   - Configure Capacitor to use the Vite `dist` directory.

5. Add mobile scripts.
   - Add scripts for building the web bundle.
   - Add scripts for syncing the Android project.
   - Add scripts for opening Android Studio or running Android where practical.

6. Generate Android project.
   - Create `client/android/`.
   - Verify Gradle project opens successfully.
   - Confirm app name, package id, app icon placeholder, splash behavior, status bar, and keyboard behavior.

7. Add native app lifecycle handling.
   - Handle Android back button.
   - Verify app resume behavior after backgrounding.
   - Verify auth state after app restart.

8. Audit mobile UX.
   - Test login/register.
   - Test dashboard.
   - Test calendar interaction.
   - Test reservation form.
   - Test settings.
   - Record UI issues separately from packaging issues.

9. Build Android debug artifact.
   - Produce a debug APK for testing.
   - Install on emulator or physical Android device.

10. Document final commands.
    - Document development, build, sync, Android Studio, and debug APK steps.

## 7. Test Plan

Build and static checks:

- Run `npm run lint` in `client`.
- Run `npm run build` in `client`.
- Run Capacitor sync.
- Open/build the generated Android project.

Android smoke tests:

- App installs successfully.
- App launches without a blank screen.
- Login works against `https://myrescal.onrender.com/api`.
- Authenticated dashboard loads.
- Logout clears session.
- App restart preserves valid session.
- Expired/invalid session redirects to login.
- Property selector loads options.
- Room selector loads options.
- Calendar loads reservations.
- User can create a reservation.
- User can edit a reservation.
- User can delete a reservation.
- Settings screen can create/edit/delete properties and rooms.
- Language switch persists after restart.
- Android back button behaves predictably.
- Keyboard does not hide active form fields.
- Dialogs remain scrollable on small screens.

Network tests:

- Backend online.
- Backend cold start or slow response.
- No network connection.
- Backend returns `401`.
- Backend returns `409` reservation conflict.
- Backend returns `500`.

Viewport tests:

- 360x800
- 390x844
- 412x915
- Small landscape viewport if orientation is not locked.

## 8. Edge Cases

- Mobile builds cannot rely on Vite's local `/api` proxy.
- `localhost` from a physical phone points to the phone, not the development machine.
- Capacitor WebView history may differ from desktop browser history.
- Android hardware back button can accidentally close the app if not handled.
- MUI dialogs can become awkward with the Android soft keyboard.
- Native date inputs can behave differently across Android WebView versions.
- Render free-tier cold starts can make the first API call slow.
- Browser `localStorage` inside WebView may not be sufficient for production-grade token storage.
- Google Fonts may not load when the device is offline or slow.
- Calendar density may be too high for some Android screens.
- Long Polish labels may overflow compact buttons or selects.
- Existing modified work in `client/src/components/ReservationFormDialog.jsx` must be preserved.

## 9. Open Questions

- Should the final Android package id be `com.myrescal.app`, or do you want a different id?
- Should the first deliverable be only a debug APK, or should we also prepare a release AAB structure now?
- Do you already have final app icon and splash screen assets?
- Should Android orientation be portrait-only for the first version?
- Should auth storage be upgraded to native secure storage before any production release?
- Should UI redesign happen before or after Android packaging?

Recommended answer for UI redesign: package Android first, then redesign. The reason is practical: Android packaging will reveal real constraints around keyboard behavior, WebView viewport, navigation, and calendar density. A redesign done before seeing those constraints risks being reworked. Small blocking mobile usability fixes can happen during packaging, but broader color/theme/layout redesign should be a separate phase after the app runs on Android.

## 10. Out of Scope

- React Native rewrite.
- Full native Android UI rebuild.
- iOS generation in the first Android milestone.
- Offline-first sync.
- Push notifications.
- Play Store submission.
- Production signing and release management.
- Backend redesign.
- Supabase schema changes.
- New reservation business features.
- Major visual redesign, except for fixes required to make the current UI usable on Android.
