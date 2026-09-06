# ZIKR v1.3.2

**Release date:** 2026-09-06

## Release scope

This release packages the latest merged ZIKR production code as a documented Android production release and updates the Android build baseline for Android 16 / API 36.

## Application changes

- Includes the merged prayer-location reliability improvements from PR #21.
- Keeps native notification permission prompts deferred until the user explicitly enables the related reminder features.
- Retains the existing ZIKR production URL and Capacitor native bridge configuration.

## Android release changes

- `versionName`: `1.3.2`
- `versionCode`: `28`
- Application ID: `com.zikr.app`
- `minSdkVersion`: `24`
- `compileSdkVersion`: `36`
- `targetSdkVersion`: `36`
- Android Gradle Plugin: `8.13.2`
- Gradle wrapper: `8.13`
- Release build JDK: `21`

Android 16 / API 36 is the current required target level for new Google Play submissions and app updates as of August 31, 2026.

## Release artifacts

The CI release job publishes:

- `app-release.apk` — signed Android APK for direct installation/testing.
- `app-release.aab` — signed Android App Bundle for Google Play distribution.
- `SHA256SUMS` — SHA-256 checksums for artifact integrity verification.

## Verification gates

The Android release pipeline must pass all of the following before publishing:

1. Frozen pnpm dependency installation.
2. Project verification and production build.
3. Capacitor Android asset synchronization.
4. Mobile release-readiness checks.
5. Release keystore validation.
6. Clean Gradle build of APK and AAB.
7. APK signature verification.
8. Application ID verification.
9. Version name verification.
10. Target SDK verification (`36`).
11. SHA-256 checksum generation.
12. GitHub Release publication using the canonical repository through the GitHub API.

## Signing

The production signing keystore is never committed to the repository. CI restores it only from protected environment secrets and removes the temporary signing material after the build.

## Known validation boundary

CI can verify the production build and artifact integrity, but a physical Android device test remains the final validation step for location behavior, notification permission flows, exact alarms, audio focus, background/resume behavior, OAuth callback handling, and offline content.

## Release provenance

Source branch: `android-release-v1.3.2`

Release tag: `v1.3.2`
