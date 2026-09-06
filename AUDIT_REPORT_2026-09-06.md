# ZIKR — Comprehensive Audit Record

**Audit date:** 2026-09-06
**Canonical branch:** `main`
**Canonical HEAD:** `6e464a96b5c9b1a62a2677f686cead68b539916d`
**Application version:** `1.3.4`
**Android version code:** `30`

## Scope

The audit covered repository structure, Next.js application code, TypeScript, routing, API boundaries, authentication/OAuth, Supabase schema/migrations/security, offline/PWA content, Capacitor/native bridge, Android release configuration, CI configuration, package/lockfile consistency, deployment state, and production runtime error telemetry.

## Fixes completed

1. Stabilized prayer-times location callbacks so the refresh effect does not recreate the location request on every `prayerData` update.
2. Retained client-side prayer-times cache and in-flight request de-duplication.
3. Retained Android Google OAuth PKCE + Custom Tab + `com.zikr.app://auth/callback` flow.
4. Hardened Supabase admin-audit security and aligned the security migration filename/version with the production migration ledger.
5. Removed temporary release marker files.
6. Aligned `package.json` dependency ranges with `pnpm-lock.yaml` so frozen-lockfile CI installation can resolve deterministically. The corrected ranges are `@tailwindcss/typography ^0.5.15` and `autoprefixer ^10.4.20`.
7. Android release metadata is `versionName 1.3.4`, `versionCode 30`, `applicationId com.zikr.app`, `targetSdk 36`.

## Verified project gates

The repository contains automated gates for imports, mobile readiness, offline content, project integrity, routes, AdSense readiness, lint, TypeScript, tests, and production build. CI is configured for Node 22 and pnpm 9.15.0 with `pnpm install --frozen-lockfile`.

## Runtime audit

Current Vercel runtime error telemetry for the last 24 hours contains one historical React streaming boundary error on `/dua/[slug]`. No current 24-hour Supabase environment-variable error cluster is present in the latest aggregated production telemetry. Earlier clusters were associated with an older deployment and reported missing `NEXT_PUBLIC_SUPABASE_URL`.

## Current deployment gate

The latest attempted Vercel deployments are blocked by the account-level deployment quota (`api-deployments-free-per-day`, more than 100 deployments). This is an account/platform limitation, not a code compilation error. The last known production deployment that is still READY is retained as a rollback candidate.

## Release gate

`v1.3.4` must not be represented as a fully validated production release until:

- CircleCI `ci-check` is green on the final `main` commit.
- A fresh Vercel production deployment is created successfully after the deployment quota is available.
- A signed Android APK/AAB is built by the release pipeline.
- A physical Android smoke test verifies Google sign-in/callback, location permission, prayer refresh stability, notifications/audio behavior, and offline/resume behavior.

## Source of truth

GitHub `Zikrmediaofficial/Zikr` `main` is the canonical source. The uploaded ZIP snapshot is not used as the release source because it is a stale local snapshot relative to the canonical repository state.
