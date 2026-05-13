# MyResCal Android Runbook

## Purpose

This runbook explains how to build and run the Android version of MyResCal.

The Android app is built with Capacitor and uses the existing React/Vite client. The mobile API target is:

```txt
https://myrescal.onrender.com/api
```

## Commands

Run commands from the `client` directory.

```bash
npm install
npm run build:android
npm run cap:sync
npm run android:open
```

## Local Requirements

- Node.js 22 or newer.
- Android Studio 2025.2.1 or newer for Capacitor 8.
- Android SDK with API 24 or newer installed.
- A Java runtime available to Gradle. Android Studio installs the correct JDK, but command-line builds still need the environment configured so `./gradlew` can find Java.

## Development Flow

1. Change React code in `client/src`.
2. Run `npm run build:android`.
3. Run `npx cap sync android`, or use `npm run cap:sync`.
4. Rebuild/run from Android Studio.

## Notes

- The Android package id is `com.myrescal.app`.
- The app display name is `MyResCal`.
- The Android build must not rely on Vite's local `/api` proxy.
- The Render backend `CORS_ORIGIN` must include `https://localhost` and `http://localhost`, because those are the Capacitor Android WebView origins used by current and older installed builds.
- Local Android build outputs are ignored by git.
- The first target is a debug APK for device testing, not Play Store release signing.
