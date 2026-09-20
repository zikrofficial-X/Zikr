# ZIKR — Current Project Status

**Finalization branch under review:** `finalization-src-20260920`
**Last source-verified HEAD:** `718a2b540e4b203c434ada20a1ac1a817e29acd0` (`fix(notifications): import salawat audio clip`)
**Branch relation before this status update:** 291 commits ahead of `main`, 0 behind.
**Status document:** refreshed September 20, 2026 after the final source compile-risk sweep.

**Last audited:** 20 September 2026
**Canonical branch:** `main`
**Repository:** `Zikrmediaofficial/Zikr`

## Current state

The route inventory contains 164 routes: 100 page routes and 64 API route handlers. The route verifier is inventory-driven and no duplicate normalized page-route groups were found.

The finalization branch is the clean integration branch for the requested source layers. Public content modules are consolidated around canonical feature services and tracked offline snapshots, with duplicated page-local catalogues removed where equivalent repository data already exists.

The latest source compile-risk sweep identified and corrected a real TypeScript defect in `src/features/notifications/services/notifications.ts`: `playSalawatClip()` was called without an import. The fix is committed in `718a2b540e4b203c434ada20a1ac1a817e29acd0`.

Vercel has not produced a deployment for the corrected source commit. The most recent completed finalization deployments before the fix failed during `pnpm build` with `lint_or_type_error`; a current Vercel GitHub status remains `failure` because of the connected Vercel build-rate-limit/account gate. Therefore a successful build of the corrected source is not claimed.

The repository has been consolidated onto the canonical source architecture; obsolete feature wrappers, duplicate assets, legacy hook/service paths, and root-level historical release clutter were removed or archived.

GitHub Actions are retired from the active repository. Application verification is handled by the existing external CI/deployment systems.

## Repository architecture

- `src/app/` — Next.js routes and API routes.
- `src/features/` — canonical domain modules; feature services/hooks/types/data live here.
- `src/components/ui/` and `src/components/layout/` — shared application UI and shell.
- `src/lib/` — cross-cutting infrastructure only.
- `supabase/migrations/` — canonical database migration chain.
- `supabase/functions/` — active Edge Functions.
- `scripts/` — deterministic verification and operational tooling.
- `docs/releases/archive/` — historical release notes retained outside the product root.

No legacy `src/hooks/` layer or duplicate `src/lib/services/` domain implementation layer remains.

## Source finalization coverage

The requested source layers have been processed through the feature-first service pass:

- admin
- auth
- profile
- notifications
- social
- media
- spiritual-ai
- kids
- prayer
- qibla
- audio
- offline
- shared UI
- API routes

The final pass centralized admin mutations, profile/auth synchronization, favorites, notifications/reminders, contact, kids game persistence, Quran reading progress, wird/memorization progress, media assets, Android release resolution, Quran audio access, and related API adapters behind explicit service boundaries. Legacy Server Action contracts were retained where existing consumers require them.

## Structural verification

- Page routes: 100
- API route files: 64
- Total route inventory: 164
- Duplicate normalized page groups: none
- Duplicate migration timestamp prefixes: none
- Migration files: 250
- Removed shared UI files confirmed absent: `copy-button.tsx`, `empty-state.tsx`, `icon-button.tsx`, `skeleton.tsx`
- `/duas` remains the intentional compatibility redirect to `/dua`

## Static/security verification

- No audited authorization path derives admin role from editable `user_metadata`.
- Admin role assignments remain DB-backed.
- Secret-bearing feature services have explicit server-only boundaries.
- Client-side notification/audio code remains browser-safe and is not marked server-only.
- Public API inputs are validated/bounded in the audited routes.
- Favorites item types match the canonical database enum: `quran`, `hadith`, `story`, `scholar`, `dua`.
- Memorization service fields match the updated tracked Supabase type shape.

## Supabase

Static migration inspection remains completed, including the 250-file migration chain and duplicate-prefix check.

Live SQL/RLS verification is blocked in the current session because the connected Supabase account exposes no accessible projects. Consequently this pass does not claim fresh live table counts, RLS policy checks, migration-ledger equality, scheduler rows, or Auth security-setting verification.

## Mobile

- Android application id: `com.zikr.app`
- Android version: `1.0.0`, versionCode `53`
- Android compile/target SDK: `36`
- iOS bundle id: `com.zikr.app`
- iOS version/build: `1.0.0 / 53`
- Native Capacitor runtime/plugins: 7.x
- `@capacitor/cli`: 8.5.1 while native Android/iOS projects and iOS Pods reference 7.4.3

The Capacitor version mismatch remains explicitly documented and was not changed blindly. Native `cap sync`, Gradle release, and Xcode archive cannot be executed in the current environment.

## Deployment

Current external gate state at the end of this pass:

| Gate | State | Interpretation |
|---|---|---|
| Source branch | Completed | Requested source finalization and compile-risk correction committed |
| Vercel | Blocked / failure | Build-rate-limit/account gate; corrected source has no successful Vercel build yet |
| CircleCI | Pending | `ci/circleci: ci-check` has not completed successfully |
| Supabase | Blocked | No accessible project through current connector, so live SQL/RLS cannot be executed |
| Android/iOS | Not executable here | Release environment is required for native sync and signed builds |

The production `main` branch has previously had READY deployments, but those are not used as evidence for the finalization branch.

## Release gate

Release-ready is not asserted until the corrected finalization HEAD is built successfully, CircleCI completes successfully, live Supabase SQL/RLS verification is available and passes, and native Android/iOS release builds pass in the release environment.

## Canonical rules

- Use `main` as the canonical production branch.
- Use feature-first imports for domain logic.
- Keep `src/lib/` limited to shared infrastructure.
- Apply database changes only through `supabase/migrations/`.
- Never reintroduce duplicate compatibility layers without a concrete migration requirement.
- Do not weaken RLS or authentication to make deployment checks pass.
- Do not treat archived reports as current state.
