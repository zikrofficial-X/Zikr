# ZIKR v1.3.3

**Release date:** 2026-09-06

## Release scope

This release fixes Google account sign-in in the Android app. OAuth now uses the Supabase browser client inside the app WebView to create and retain the PKCE verifier, opens Google in the system Custom Tab, and consumes the callback back inside the same WebView before returning the user to the requested page.

## Google OAuth fix

- Android no longer starts Google OAuth through a server-side PKCE session that can be separated from the app WebView.
- Native Google OAuth uses `skipBrowserRedirect` and `com.zikr.app://auth/callback`.
- Google authentication runs in the system Custom Tab instead of an embedded WebView.
- The Android app listens for both `appUrlOpen` and cold-start launch URLs.
- The callback exchanges the authorization code with the same browser Supabase client that created the PKCE verifier.
- The Custom Tab is closed after callback handling so the user returns to the ZIKR app instead of remaining in Chrome.
- New-user profile bootstrap is preserved through an authenticated server-side profile sync endpoint.
- Relative `next` paths are sanitized to prevent open redirects.

## Android release changes

- `versionName`: `1.3.3`
- `versionCode`: `29`
- Application ID: `com.zikr.app`
- `minSdkVersion`: `24`
- `compileSdkVersion`: `36`
- `targetSdkVersion`: `36`
- Android Gradle Plugin: `8.13.2`
- Gradle wrapper: `8.13`
- Release build JDK: `21`

## Release artifacts

The CI release job publishes:

- `app-release.apk` — signed Android APK for direct installation/testing.
- `app-release.aab` — signed Android App Bundle for Google Play distribution.
- `SHA256SUMS` — SHA-256 checksums for artifact integrity verification.

## Verification gates

The Android release pipeline must pass all of the following before publishing:

1. Frozen pnpm dependency installation.
2. Project verification and production build.
3. Capacitor Android synchronization.
4. Mobile release-readiness checks.
5. Release keystore validation.
6. Clean Gradle APK and AAB build.
7. APK signature verification.
8. Application ID verification.
9. Version name verification.
10. Target SDK verification (`36`).
11. SHA-256 checksum generation.
12. GitHub Release publication through the canonical repository and GitHub API.

## Callback configuration required

Supabase Auth must allow the native redirect URL:

`com.zikr.app://auth/callback`

The production web callback remains:

`https://zikrmediaofficial.vercel.app/auth/callback`

Google Cloud OAuth continues to use the Supabase provider callback URL configured for the Google provider; the native custom scheme is the post-login redirect handled by Supabase Auth.

## Known validation boundary

CI verifies the build and artifact integrity. The final acceptance test remains a physical Android device test covering Google sign-in, returning from the Custom Tab, cold-start callback handling, account creation/profile sync, cancellation/back navigation, and repeated sign-in attempts.
