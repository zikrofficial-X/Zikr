# ZIKR v1.3.4 — Full Release Audit Record

**Date:** 2026-09-06
**Repository:** Zikrmediaofficial/Zikr
**Release target:** v1.3.4
**Android versionCode:** 30

## Scope audited

Repository structure, Next.js/React/TypeScript application, API routes, Supabase integration and migrations, authentication and native Google OAuth handoff, prayer-times/location flow, offline/cache paths, Android/Capacitor configuration, CI/CD, Vercel production telemetry, security/performance advisors, and release metadata.

The repository contains the application source, CI configuration, Android wrapper, database migrations, tests, and release documentation. The existing CI contract runs frozen-lockfile installation followed by import checks, mobile readiness, offline checks, project integrity, ESLint, TypeScript, tests, and the production build.

## Corrections made for this release

1. Prayer-times page refresh loop fixed by making `requestLocation` stable. Its callback no longer depends on `prayerData`, so the mount effect cannot re-trigger after every successful schedule update.
2. City search callback was also stabilized so selecting a city does not recreate unrelated refresh callbacks.
3. Prayer-times service already contains response caching and in-flight request de-duplication for identical requests.
4. Native Google OAuth fix from v1.3.3 remains included: in-app Supabase browser client creates PKCE state, Google runs in a system Custom Tab, and `com.zikr.app://auth/callback` returns to the same application session.
5. Supabase production security hardening was applied: direct execution of the admin audit trigger function was revoked for `anon` and `authenticated`; admin audit RLS uses initplan-safe `select auth.uid()`; three exact duplicate audit indexes were removed.
6. Temporary release-marker files were removed from `main`.
7. Android release metadata is advanced to v1.3.4 / versionCode 30 while keeping target SDK 36 and JDK 21.

## Build/release gates

The release is not considered final unless all are green:

- `pnpm install --frozen-lockfile`
- import validation
- mobile readiness
- offline content validation
- project integrity
- ESLint
- TypeScript
- unit/integration tests
- production Next.js build
- Capacitor Android sync
- signed APK build
- signed AAB build
- APK signature verification
- package/version/target SDK verification
- SHA-256 checksum generation
- GitHub Release publication
- Vercel production deployment ready

## Production evidence

At the audit point, the latest `main` commit had successful CircleCI `ci-check` and successful Vercel status. Vercel runtime-error telemetry for the recent production window returned no grouped runtime-error cluster requiring remediation.

## Database evidence

Supabase production was queried directly. Security and performance advisor findings were reviewed. The applied hardening is designed to preserve deny-by-default access to administrative data while removing unnecessary direct function execution and duplicate indexes.

Unused-index INFO findings were intentionally not removed wholesale because the safe decision depends on actual traffic and query plans.

## Required device acceptance

A physical Android smoke test remains mandatory before distributing v1.3.4 broadly:

- Google account sign-in and account selection
- Custom Tab -> app callback return
- cold-start OAuth callback
- OAuth cancellation/back navigation
- current-location permission
- prayer schedule stability after location resolution
- city search stability
- offline cached schedule visibility
- azan/local-notification permissions and toggles

A CI-green build proves the code compiles and automated gates pass; it does not substitute for a physical-device verification of Android deep-link behavior or OEM-specific location/browser behavior.
