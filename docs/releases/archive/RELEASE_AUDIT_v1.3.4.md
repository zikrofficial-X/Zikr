# ZIKR v1.3.4 — Release & Full-System Audit

**Audit date:** 2026-09-06
**Target:** Zikrmediaofficial/Zikr
**Release:** v1.3.4
**Android versionCode:** 30

## Audit scope

- Web application source and tracked configuration
- Next.js/React/TypeScript build path
- pnpm lockfile and CI install mode
- Vercel deployment and production runtime telemetry
- Supabase production database, migrations, security and performance advisors
- Android/Capacitor configuration and release pipeline
- Google OAuth native callback path
- Prayer-times location, caching and refresh path
- GitHub release publication path

## Verified conditions

- Production Vercel deployment is healthy and the current production runtime-error scan for the last hour reports no runtime error clusters.
- Main branch CI is configured to run frozen-lockfile install plus import, mobile, offline, project, lint, TypeScript, test and production-build checks.
- Android release CI uses JDK 21, Android API 36, signed APK/AAB generation, signature verification, package/version/target-SDK verification and SHA-256 checksums.
- Android application ID is `com.zikr.app`, min SDK is 24, compile/target SDK are 36.
- Native Google OAuth uses the app WebView's Supabase browser client for PKCE state, a system Custom Tab for Google, and `com.zikr.app://auth/callback` for return to the app.
- Prayer-times caching/deduplication exists to prevent repeated identical network requests.

## Production database hardening applied

- Revoked direct EXECUTE privileges for `anon` and `authenticated` on the SECURITY DEFINER trigger function `public.prevent_admin_audit_events_mutation()`.
- Updated the `admin_audit_events_admin_select` RLS predicate to use an initplan-safe `(select auth.uid())` form.
- Removed three exact duplicate indexes on `public.admin_audit_events` while retaining their canonical equivalents.

## Known non-blocking advisor findings

- `admin_rate_limits` intentionally has RLS enabled without public policies, which is a deny-by-default posture.
- `pg_net` placement is covered by existing project migrations/documentation.
- Supabase still reports many INFO-level unused indexes; these are not removed blindly because usage can change with production traffic and dropping useful future indexes is not a safe blanket optimization.
- Leaked-password protection remains a Supabase Auth dashboard setting and is not modified by application code.

## Release acceptance gates

A release is considered final only when all gates are green:

1. Frozen lockfile installation
2. Full CI static checks
3. Production Next.js build
4. Capacitor sync
5. Android release build
6. APK signature validation
7. Package ID/version/target SDK validation
8. GitHub Release publication with APK, AAB and SHA-256 file
9. Production deployment ready
10. Physical Android smoke test for Google sign-in, callback return, location permission and prayer-times stability

## Manual acceptance matrix

- Google sign-in: account selection -> app callback -> authenticated profile
- Google sign-in cold start: callback launches app -> session restored
- Google sign-in cancellation: return without stuck loading state
- Prayer location: current location -> stable schedule -> no repeated refresh loop
- City search: city selection -> stable schedule -> no repeated refresh loop
- Offline reload: cached schedule remains visible when the network is unavailable
- Audio/azan controls: permission and toggle state remain stable
- Android back/navigation: no Chrome/Custom Tab stranded after OAuth callback
