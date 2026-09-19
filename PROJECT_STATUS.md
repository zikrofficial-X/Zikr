# ZIKR — Current Project Status

**Last audited:** 19 September 2026  
**Canonical branch:** `main`  
**Repository:** `Zikrmediaofficial/Zikr`

## Current state

The repository has been consolidated onto a single canonical branch. Obsolete feature wrappers, duplicate assets, legacy hook/service paths, and root-level historical release clutter were removed or archived.

The current verification chain is green on the audited `main` commit:

`9ecefb83bbd24bd697604c35a8263371de5a56f6`

The GitHub Admin 2.0 Quality Gate passed all configured checks, including migration validation/replay, route and import validation, hygiene, placeholder-media validation, project integrity, mobile/offline checks, content/auth checks, social/AdSense/Search Console checks, TypeScript, ESLint, unit/integration tests, and the production build. CircleCI also reports a successful `ci-check` on the audited commit.

## Repository architecture

- `src/app/` — Next.js routes and API routes.
- `src/features/` — canonical domain modules; feature services/hooks/types/data live here.
- `src/components/ui/` and `src/components/layout/` — shared application UI and shell.
- `src/lib/` — cross-cutting infrastructure only.
- `supabase/migrations/` — canonical database migration chain.
- `supabase/functions/` — active Edge Functions.
- `scripts/` — deterministic verification and operational tooling.
- `__tests__/` — automated tests.
- `docs/releases/archive/` — historical release notes retained outside the product root.

No legacy `src/hooks/` layer or duplicate `src/lib/services/` domain implementation layer remains.

## Supabase

The production database currently exposes **104 public tables**, all with RLS enabled.

The live security audit found:
- No duplicate RLS policy names.
- No public `SECURITY DEFINER` functions executable by `anon` or `authenticated`.
- No duplicate index definitions detected.

The performance advisor currently reports INFO-level unused-index observations. These are advisory workload observations, not runtime errors, and are not being deleted blindly because many support low-frequency, future, foreign-key, or search workloads.

One Supabase Auth security warning remains: leaked-password protection is disabled. This is an Auth project setting rather than an application-code defect and must be enabled in the Supabase Auth settings.

### Database cleanup completed

The following obsolete, empty runtime tables were retired through a migration:

- `episodes`
- `research_requests`
- `generated_research`
- `payments`
- `user_subscriptions`
- `subscriptions`
- `saved_stories`

The active application alternatives are the current videos/YouTube pipeline, source-verified content pipeline, and `story_favorites`/current account infrastructure.

The existing `tasks` and `user_behavior` tables were intentionally retained because the active admin automation and analytics code still consumes them.

## Content and data

Current populated production content includes Quran tafsir/audio, hadiths, stories, articles, prophets, companions, battles, conquests, duas, scholars, children's content/games, tawasheeh, social-sync queues, and prayer notification history.

The Quran catalog tables `quran_surahs`, `quran_ayahs`, and `quran_reciters` currently contain no rows. The application deliberately uses a DB-first/API-fallback architecture for those resources; this is a data-population gap, not a build failure.

## Mobile

Capacitor runtime packages are currently on major version 7, with Android/iOS native projects present and the mobile readiness gate passing. The CLI version discrepancy should be normalized during the next dependency maintenance cycle using a regenerated lockfile rather than hand-editing dependency resolution data.

## Deployment

Vercel production deployment for the current audited HEAD is **not certified** yet. Vercel is currently rejecting new deployments at the account/project build-rate limit. A previous production deployment of the older `b4d14fd...` commit was READY, but that does not certify the current HEAD.

The latest Vercel runtime-error query returned no runtime errors in the selected 24-hour window; this is not a substitute for a successful deployment of the current HEAD.

## Rules for future changes

- Use `main` as the canonical branch.
- Use feature-first imports for domain logic.
- Keep `src/lib/` limited to shared infrastructure.
- Apply database changes through `supabase/migrations/`.
- Never reintroduce duplicate compatibility layers without a concrete migration requirement.
- Do not remove Supabase indexes solely because they are currently unused according to the advisor.
- Do not treat archived reports as current project state.
