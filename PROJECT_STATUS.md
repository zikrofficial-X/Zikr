# ZIKR — Current Project Status

**Finalization branch:** `finalization-src-20260920`
**Current HEAD:** `0ea41332192ebf7fbd44426305a83580aad69306`
**Branch relation:** 319 commits ahead of `main`, 0 behind.
**Last audited:** September 20, 2026

## Completion scope

The repository-wide finalization pass has covered the application source, feature services, API routes, Supabase functions/migrations, scripts, CI/deployment configuration, native Android/iOS projects, PWA/offline assets, and operational documentation.

### Source and routes

- 100 page route files
- 64 API route files
- 164 total route handlers/pages
- No duplicate normalized page-route groups
- Feature-first service boundaries are enforced
- Server-only services are explicitly bounded
- Legacy `src/hooks/` runtime layer is absent
- Domain implementations were not recreated under `src/lib/services/`; the remaining allowlisted modules are shared infrastructure

### Major source work completed

- Admin content/knowledge/prophets/battles services centralized.
- Admin mutations retain privileged server-side authorization.
- Profile and native auth-profile synchronization centralized.
- Favorites reads/writes/deletes centralized and aligned to the database enum.
- Notifications/reminders centralized; salawat audio import defect fixed.
- Quran audio lookup and reading progress centralized.
- Wird/memorization persistence centralized with legacy action contracts retained.
- Kids game/content persistence centralized.
- Media asset upload/rights/publish operations centralized.
- Android release metadata/lookup centralized.
- Contact persistence and public content reads consolidated.
- Shared UI duplicate files removed.
- Search, Qibla, offline, audio and public content paths reviewed.

### Concrete repository fixes completed in this final pass

- `src/features/notifications/services/notifications.ts`: imported the missing `playSalawatClip` used by the salawat notification path.
- `ios/App/Podfile`: aligned Capacitor iOS pod paths with the locked runtime versions and restored the missing Geolocation pod.
- `.github/CODEOWNERS`: corrected stale root `app/` and `lib/` ownership paths to the current `src/app/` and `src/lib/` layout.
- `components.json`: removed the obsolete `@/hooks` alias because the runtime hook layer no longer exists.
- `.env.example`: removed unused NextAuth variables.
- `vercel.json`: removed obsolete NextAuth build environment configuration.
- `.github/dependabot.yml`: removed the retired GitHub Actions dependency-scan target; npm dependency updates remain.
- Multiple deployment/auth/offline/mobile/SEO documents were rewritten to match the current architecture and remove stale paths or false readiness claims.

### Dependency/configuration integrity

- Direct dependencies in `package.json`: 49
- No direct dependency is missing from `pnpm-lock.yaml`.
- No `package-lock.json`, `yarn.lock`, or npm shrinkwrap file is tracked.
- Mobile dependency manifest and `package.json` agree on the declared Capacitor packages.
- Android generated Capacitor project paths match the locked 7.x runtime packages.
- iOS Podfile now matches the locked plugin versions.
- Android: `com.zikr.app`, version 1.0.0, code 53, target SDK 36.
- iOS: `com.zikr.app`, version 1.0.0, build 53.
- Capacitor runtime/plugins remain 7.x; the repository CLI is 8.5.1. This mismatch is documented and must not be changed without an intentional lockfile/native-toolchain migration.

### Supabase

- 250 active migration files under `supabase/migrations/`.
- Static duplicate migration-prefix check completed.
- Canonical Auth site URL and three redirect entries remain locked in `supabase/config.toml`.
- Edge Function scheduler/security boundaries were reviewed.
- Live SQL/RLS/scheduler verification is still blocked because the current Supabase connector exposes no accessible project in this session.

### PWA / offline / assets

- Canonical Quran corpus remains Git-tracked under `public/quran/`.
- Offline v1 datasets and manifest are tracked.
- Service worker cache strategy was reviewed; generic personalized HTML is not pre-cached.
- Local audio/branding/icons required by the application are present.
- Quran audio import remains an explicit operational job; it does not silently run during normal builds.

### CI / deployment

- GitHub Actions workflows remain intentionally retired.
- CircleCI remains the external CI/recovery path.
- Vercel build command is `pnpm build` with a frozen pnpm install.
- The latest visible finalization deployments before the source fix failed at the build stage with `lint_or_type_error`.
- The current Vercel status is still a build-rate-limit/account gate, so a successful production build of the current finalization HEAD has not been established.
- CircleCI `ci-check` remains pending/unverified from this session.

## Release blockers

The codebase has undergone the requested repository-wide cleanup and source finalization, but release certification is intentionally not claimed until these external gates are actually successful:

1. A fresh Vercel build of the corrected finalization HEAD completes successfully.
2. Supabase live SQL/RLS/migration/scheduler checks run with valid project access.
3. CircleCI required validation completes successfully.
4. Native Android/iOS sync and signed release builds pass in a real release environment.

Older READY production deployments are not used as proof for the finalization branch.
