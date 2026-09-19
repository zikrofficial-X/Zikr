# ZIKR — Current Project Status

**Last audited:** 19 September 2026  
**Canonical branch:** `main`  
**Repository:** `Zikrmediaofficial/Zikr`

## Current state

The repository has been consolidated onto a single canonical branch. Obsolete feature wrappers, duplicate assets, legacy hook/service paths, and root-level historical release clutter were removed or archived.

The current repair work is committed on `main`; the latest repository commit is `9f5c58f734d5ab6b193513a29097594c8332dd44`.

The current repair commits are not yet certified by a green CI run. GitHub-hosted runners are unavailable for this account, the latest CircleCI `ci-check` is failing without exposed job logs in the current integration, and Vercel is currently rejecting deployments with a `build-rate-limit` platform status. The repository therefore remains under repair/verification rather than being marked release-green.

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

The last recorded production audit reported `quran_surahs` = 114, `quran_ayahs` = 6236, `quran_reciters` = 7, `quran_audio` = 798, and `quran_tafsir` = 6236. These live counts were not re-queried during this pass because the current Supabase management connector does not have sufficient permissions. The surah catalog now has canonical `ayahs_count` metadata totaling 6236, with no zero/null counts. Quran audio covers all 114 surahs for all 7 current reciters, with no duplicate `(surah_id, reciter_id)` pairs.

## Mobile

Capacitor runtime packages are on major version 7, while the repository pins `@capacitor/cli` to 8.5.1 in both `package.json` and `mobile/capacitor-dependencies.json`. This is documented as a dependency-maintenance item; the lockfile is kept internally consistent and was not hand-edited to force a speculative major-version migration.

## Deployment

Vercel's last READY production deployment is still commit `2dec7d45c57a01927f10b499ca405e6b07c31739`; the current `main` repair commits have been pushed to GitHub but are not yet present in a newer READY deployment. The last available Vercel runtime-error query showed no grouped runtime errors in the selected 24-hour window; the newer deployment attempts are currently blocked by the Vercel build-rate limit.

## Canonical Quran storage

- Quran text is now runtime-local to ZIKR: `quran_surahs` (114), `quran_ayahs` (6236), `quran_tafsir` (6236), and `quran_reciters` (7).
- Quran runtime services no longer depend on Al Quran Cloud or any other external Quran API.
- `quran_audio` is modeled as 798 deterministic Supabase Storage targets: one whole-surah track for each of 114 surahs × 7 current reciters.
- Bucket: `quran-audio` (public read, controlled writes).
- The storage import workflow is `.github/workflows/import-quran-audio.yml`; it requires the existing `SUPABASE_SERVICE_ROLE_KEY` repository secret.
- Audio objects are not yet uploaded: `quran-audio` currently contains 0 objects and all 798 rows are `storage_status='pending'`.
- The current Supabase project is on the Free storage quota shown in the dashboard (1 GB included, 50 MB maximum per file). Full retention of all seven complete reciter libraries should therefore be capacity-checked before the import is run; the importer refuses files above the configured per-file limit rather than silently truncating them.

## Canonical Auth and Quran invariants

- Supabase Auth `site_url` is locked in repository configuration to `https://zikrmediaofficial.vercel.app`.
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
