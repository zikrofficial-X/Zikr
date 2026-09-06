# ZIKR v1.3.4 — Release Audit

**Date:** 2026-09-06
**Repository:** `Zikrmediaofficial/Zikr`
**Android:** `1.3.4` (`versionCode 30`)

## Scope

Repository structure, application source, API routes, authentication, Supabase integration, database migrations, security/performance configuration, prayer-times/location flow, offline/cache behavior, Android/Capacitor build configuration, CI/CD, Vercel deployment state, and release metadata were reviewed.

## Findings and remediation

### 1. Prayer-times refresh loop — fixed

`requestLocation` previously depended on `prayerData` while the mount effect depended on `requestLocation`. Every successful schedule update recreated the callback and retriggered the mount effect. The callback is now stable and does not depend on `prayerData`; city-search refresh is stable for the same reason.

The prayer service also retains caching and in-flight request de-duplication for identical requests.

### 2. Google OAuth on Android — retained and audited

The Android path uses the Supabase browser client to establish PKCE state, opens Google through a system Custom Tab, and returns through `com.zikr.app://auth/callback`. A dedicated native callback handler supports both `appUrlOpen` and cold-start launch URLs and closes the external browser before returning to the requested app route.

### 3. Dependency/lockfile consistency — checked

The repository uses `pnpm@9.15.0` with a frozen-lockfile CI installation. Capacitor iOS remains present in `package.json` and lockfile alignment is preserved.

### 4. Supabase security hardening — applied

Production privileges for direct execution of the admin audit trigger function were revoked for public-facing roles. The admin audit RLS predicate uses an initplan-safe `select auth.uid()` form. Exact duplicate audit indexes were removed. The migration filename was aligned with the production migration ledger (`20260906164530`).

### 5. Repository hygiene — corrected

Temporary release marker files that had accumulated during the Android release work were removed from `main`.

## Existing automated verification contract

CircleCI runs frozen-lockfile installation followed by import validation, mobile readiness, offline-content validation, project-integrity checks, ESLint, TypeScript, tests, and the production Next.js build. The Android release job additionally installs JDK 21, builds signed APK/AAB artifacts, validates package/version/target SDK and generates SHA-256 checksums before publication.

## Production evidence

The latest known healthy `main` commit had successful CircleCI and Vercel statuses before the final release work. Vercel runtime telemetry for the recent production window showed no grouped runtime-error cluster requiring immediate remediation.

New preview deployments during this audit hit Vercel's free-plan deployment quota (`api-deployments-free-per-day`), which is an account/platform limit rather than an application build error. This prevents claiming a fresh preview deployment until the quota resets.

## Release acceptance gates

v1.3.4 is not considered a completed public release until all of the following are true:

- CI green
- Vercel deployment ready
- signed APK/AAB successfully built
- GitHub Release contains APK, AAB, and SHA-256 checksums
- physical Android smoke test passes Google OAuth, callback return, location permission, and stable prayer-times behavior

This document intentionally distinguishes automated evidence from device-level acceptance; CI cannot prove every OEM-specific Android browser/deep-link behavior.
