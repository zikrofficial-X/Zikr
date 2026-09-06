# ZIKR v1.3.4

**Release date:** 2026-09-06

## Stability release

v1.3.4 consolidates the current Android and web stability fixes and records the full release gates.

### Fixed

- Prayer-times location loading no longer recreates its request callback when `prayerData` changes, preventing the recurring `جاري تحديث المواقيت...` loop.
- Prayer-times API requests retain the existing cache and in-flight request de-duplication.
- Native Google OAuth from v1.3.3 remains based on the app's Supabase browser session with PKCE, system Custom Tab, and `com.zikr.app://auth/callback`.
- Supabase production admin-audit hardening is aligned with the remote migration ledger.
- Temporary release marker files are removed from the main branch.

### Android

- Version name: `1.3.4`
- Version code: `30`
- Application ID: `com.zikr.app`
- minSdk: `24`
- compileSdk: `36`
- targetSdk: `36`
- JDK: `21`
- Gradle: `8.13`
- Android Gradle Plugin: `8.13.2`

### Automated release gates

- Frozen pnpm lockfile install
- Import/mobile/offline/project checks
- ESLint and TypeScript
- Unit/integration tests
- Production Next.js build
- Capacitor Android sync
- Signed APK + AAB build
- Signature/package/version/target verification
- SHA-256 checksums
- GitHub Release publication
- Vercel production deployment

### Final device validation

A physical Android test is required for distribution: Google account sign-in and callback return, cold-start OAuth, cancellation/back navigation, location permission, stable prayer times, city search, offline cache, and notification/azan controls.
