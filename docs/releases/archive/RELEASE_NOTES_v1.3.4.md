# ZIKR v1.3.4

## Release scope

Production release focused on stability and hardening after the v1.3.3 Google OAuth and v1.3.3 prayer-times fixes.

### Included fixes

- Google OAuth Android callback remains inside the app session flow and returns from the system Custom Tab to `com.zikr.app://auth/callback`.
- Prayer-times requests are cached and de-duplicated to prevent repeated identical network refreshes.
- Supabase admin audit SECURITY DEFINER trigger function is no longer directly executable by `anon` or `authenticated`.
- Admin audit RLS predicate uses an initplan-safe `select auth.uid()` form.
- Duplicate admin-audit indexes were removed.
- Lockfile-aligned Capacitor dependencies are preserved for deterministic frozen-lockfile builds.

## Android build

- Version: `1.3.4`
- Version code: `30`
- Application ID: `com.zikr.app`
- minSdk: `24`
- compileSdk: `36`
- targetSdk: `36`
- JDK: `21`
- Gradle: `8.13`
- Android Gradle Plugin: `8.13.2`

## Verification

Release publication is gated on frozen-lockfile installation, TypeScript, lint, tests, production build, mobile readiness, signed APK/AAB build, package/version/target SDK verification, SHA-256 checksums and GitHub Release publication.

## Manual device acceptance

Verify Google account sign-in, OAuth callback return, cancellation/back navigation, current-location permission and prayer-times stability on a physical Android device.
