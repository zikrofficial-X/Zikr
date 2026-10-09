# ZIKR — Supabase Preview payload and CircleCI workflow repair

**Date:** 2026-10-09  
**Scope:** repository-only repair; no production database, secrets, or deployment settings changed.

## Root causes confirmed

- The failed `Supabase Preview` check reported HTTP 413 `EntityTooLarge`.
- `supabase/migrations/20260929010000_seed_canonical_quran_catalog.sql` was approximately 8.0 MB and embedded 6,236 Quran-ayah records in one JSON payload.
- CircleCI configuration uses conditional workflows and branch filters. A pipeline invoked with a parameter/branch combination that excludes all existing workflows can display `No workflows for this pipeline`.
- The current production Supabase migration history includes `20261009145051`; new continuation migrations are versioned after that point so normal `db push` ordering remains usable without enabling `--include-all`.

## Changes in this repair branch

1. Retained the original catalog migration version and its Surah/reciter/audio statements, while keeping the first 422 ayah records in its payload. The file is now below 1 MiB.
2. Added 13 ordered continuation migrations containing the remaining 5,814 records in bounded chunks. Every chunk preserves input order and the original conflict-update fields. Continuation migrations avoid no-op updates when all canonical Quran fields already match.
3. Added a 1 MiB per-file size guard to `scripts/validate-migrations.mjs`, so oversized migrations fail the verification suite before reaching Preview.
4. Added an unconditional, lightweight `configuration-guard` CircleCI workflow. The existing branch- and parameter-specific workflows keep their current behavior.
5. Added this incident note to preserve the reason for the split and the release constraints.

## Safety and release notes

- The seed stays data-driven and idempotent; no row is intentionally discarded. The payload is partitioned by record boundaries, with 6,236 records across 14 total chunks.
- The original migration's version is unchanged. Supabase does not rerun already-recorded migration versions on production; the 13 later migrations are the new pending work.
- No Supabase migration was applied to production by this repair. Do not run a production migration push until the Preview/CI checks pass and the pending migration list has been reviewed.
- The Supabase GitHub integration currently reports that automatic Preview-branch creation is disabled on at least one PR path. Re-enable it in the integration settings if the Preview check remains skipped; a skipped Preview is not a successful migration test.
- The `android-signing` CircleCI context referenced by PR #300 must exist and contain all four protected signing variables before merging that separate Android signing change.

## Verification criteria

- All SQL migration files are at or below 1 MiB.
- The migration verification suite replays the complete ordered migration chain.
- The CircleCI configuration parses and always selects the lightweight fallback workflow.
- A fresh Supabase Preview successfully applies the migration chain.
- Production remains unchanged until an explicitly reviewed release migration is run.

## Follow-up diagnosis — Android release bucket 413 (2026-10-09)

- The later `Supabase Preview` 413 was not the already-fixed oversized Quran migration. The Supabase workflow log showed `All migrations are up to date`, then `Updating Storage bucket... bucket_id=android-releases`, immediately followed by HTTP 413 `EntityTooLarge`.
- The connected Supabase organization is on the Free plan. The project-wide `storage.file_size_limit` is 50 MiB, but the `android-releases` bucket was declared at 512 MiB. The current verified APK/AAB objects are 36,939,736 bytes and 31,872,484 bytes, both below 50 MiB.
- The fix is to align the bucket configuration to 50 MiB and add a new forward-only migration to reduce the already-applied bucket limit. Historical migration `20261009145051` is intentionally unchanged.
- CircleCI and GitHub Actions now have explicit size checks so future signed APK/AAB uploads fail with a clear message before the Supabase upload request.
