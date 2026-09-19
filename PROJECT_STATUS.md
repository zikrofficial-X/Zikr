# ZIKR — Current Project Status

**Last audited:** 19 September 2026  
**Canonical branch:** `main`  
**Repository:** `Zikrmediaofficial/Zikr`

## Current state

The repository has been consolidated onto a single canonical branch. Obsolete feature wrappers, duplicate assets, legacy hook/service paths, and root-level historical release clutter were removed or archived.

The current repair work is committed on `main`; the latest repository commit is `9f5c58f734d5ab6b193513a29097594c8332dd44`.

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

The production Quran catalog is populated and repaired: `quran_surahs` = 114, `quran_ayahs` = 6236, `quran_reciters` = 7, `quran_audio` = 798, and `quran_tafsir` = 6236. The surah catalog now has canonical `ayahs_count` metadata totaling 6236, with no zero/null counts. Quran audio covers all 114 surahs for all 7 current reciters, with no duplicate `(surah_id, reciter_id)` pairs.

## Mobile

Capacitor runtime packages are currently on major version 7, with Android/iOS native projects present and the mobile readiness gate passing. The CLI version discrepancy should be normalized during the next dependency maintenance cycle using a regenerated lockfile rather than hand-editing dependency resolution data.

## Deployment

Vercel's last READY production deployment is still commit `2dec7d45c57a01927f10b499ca405e6b07c31739`; the current `main` repair commits have been pushed to GitHub but are not yet present in a newer READY deployment. The latest Vercel runtime-error query returned no runtime errors in the selected 24-hour window.

## Canonical Auth and Quran invariants

- Supabase Auth `site_url` is locked in repository configuration to `https://zikrmediaofficial.vercel.app/`.
- The approved redirect allowlist is exactly `com.zikr.app://auth/callback`, `http://localhost:3000/**`, and `https://zikrmediaofficial.vercel.app/auth/callback`.
- Deployment/auth verification scripts fail on redirect-list drift.
- Production client code uses the canonical ZIKR origin instead of a Vercel deployment alias.

## Rules for future changes

- Use `main` as the canonical branch.
- Use feature-first imports for domain logic.
- Keep `src/lib/` limited to shared infrastructure.
- Apply database changes through `supabase/migrations/`.
- Never reintroduce duplicate compatibility layers without a concrete migration requirement.
- Do not remove Supabase indexes solely because they are currently unused according to the advisor.
- Do not treat archived reports as current project state.
