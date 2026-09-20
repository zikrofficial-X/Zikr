# ZIKR — Current Project Status

**Finalization branch under review:** `finalization-src-20260920`
**Current finalization HEAD:** `4efd9a40b6009f702b98217ac6feb782619d1e75`
**Branch relation:** 72 commits ahead of `main`, 0 behind.


**Last audited:** 20 September 2026  
**Canonical branch:** `main`  
**Repository:** `Zikrmediaofficial/Zikr`

## Current state

The finalization branch is being reviewed as the clean integration branch. Public content modules are being consolidated around canonical feature services and tracked offline snapshots, with duplicated page-local catalogues removed where equivalent repository data already exists.

The current HEAD has not yet been certified by a fresh Vercel build after the latest changes. Static inspection of the modified paths is complete; a successful build and route smoke pass are still required before the branch is declared final.

The repository has been consolidated onto a single canonical branch. Obsolete feature wrappers, duplicate assets, legacy hook/service paths, and root-level historical release clutter were removed or archived.

The GitHub Actions workflows have now been **fully retired from the active repository**. The `.github/workflows/` directory no longer exists on `main`, so new GitHub-hosted runner jobs cannot be started from repository workflow files.

Application verification is handled by the existing external CI/deployment systems. This removes the repository-level GitHub Actions execution path that was previously blocked by the account billing/spending restriction.

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

Tracked offline content currently includes 114 Quran surahs / 6236 ayahs, 9 hadith books / 2964 hadith records in the tracked snapshot, 25 prophets / 150 story sections, 11 companions / 21 companion stories, 21 battles / 104 battle events, 19 conquests / 60 conquest events, 23 duas, 26 articles, 2 tafsir sources, and 28 kids records.

Current populated production content includes Quran tafsir/audio, hadiths, stories, articles, prophets, companions, battles, conquests, duas, scholars, children's content/games, tawasheeh, social-sync queues, and prayer notification history.

The last recorded production audit reported `quran_surahs` = 114, `quran_ayahs` = 6236, `quran_reciters` = 7, `quran_audio` = 798, and `quran_tafsir` = 6236. These live counts were not re-queried during this pass because the current Supabase management connector does not have sufficient permissions. The surah catalog now has canonical `ayahs_count` metadata totaling 6236, with no zero/null counts. Quran audio covers all 114 surahs for all 7 current reciters, with no duplicate `(surah_id, reciter_id)` pairs.

## Mobile

Capacitor runtime packages are on major version 7, while the repository pins `@capacitor/cli` to 8.5.1 in both `package.json` and `mobile/capacitor-dependencies.json`. This is documented as a dependency-maintenance item; the lockfile is kept internally consistent and was not hand-edited to force a speculative major-version migration.

## Deployment

Recent Vercel deployments for `finalization-src-20260920` are ERROR on older branch commits. No newer READY deployment for the current finalization HEAD was present during this audit.

## Canonical Quran storage

- Quran text is bundled and versioned in Git at `public/quran/mushaf-hafs.json` (114 surahs / 6236 ayahs), with `public/quran/manifest.json` and `public/quran/NOTICE.md` for integrity and attribution.
- The Quran reader reads the Git-tracked corpus first and uses Supabase `quran_surahs/quran_ayahs` only as a compatibility fallback.
- Quran runtime services no longer depend on Al Quran Cloud or any other external Quran API.
- `quran_audio` is modeled as 798 deterministic Supabase Storage targets: one whole-surah track for each of 114 surahs × 7 current reciters.
- Bucket: `quran-audio` (public read, controlled writes).
- Audio import remains available through the canonical importer script under `scripts/`; it is no longer exposed through a GitHub Actions workflow.
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
- Do not recreate `.github/workflows/` unless the GitHub account billing state has been deliberately reviewed and the execution model is explicitly approved.
- Do not treat archived reports as current project state.
