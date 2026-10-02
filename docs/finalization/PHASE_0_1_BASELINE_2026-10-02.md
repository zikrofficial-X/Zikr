# ZIKR Finalization — Phase 0/1 Baseline

Date: 2026-10-02
Repository: zikr-org/Zikr
Base commit: e1b84fac78d1ddb1fb971f7ec456b5ae37936edf
Working branch: audit/phase-0-1-finalization
Production Vercel project: zikr
Supabase project: kdotmrjfecgafiommzwz

## Phase 0 — Freeze / Reference Point

- [x] Created a dedicated audit branch from the exact current production/main commit.
- [x] No changes made to main.
- [x] No production database mutation performed during this audit step.
- [x] No production environment secret changed during this audit step.
- [ ] Disable automatic video publishing before the first functional refactor. This requires a production configuration change; the current GitHub workflow still sets AUTO_VIDEO_PUBLISH_ENABLED=true and AUTO_VIDEO_PUBLISH_REQUIRES_APPROVAL=false.
- [ ] Capture and attach the first clean CI/Vercel/Supabase verification results after the repository baseline is documented.

## Current production observations

### Vercel

- Latest observed production deployment is READY and points at commit e1b84fac78d1ddb1fb971f7ec456b5ae37936edf.
- The deployment history also contains recent BLOCKED/CANCELED deployments associated with schema/migration repair work. These are not the current production state but demonstrate release instability during the repair window.

### Supabase

- Target project status is ACTIVE_HEALTHY.
- Canonical production tables currently include video_generation_requests, social_publish_queue, video_automation_runs, content_library, media_assets, quran_audio, quran_reciters, the kids-game tables, and the admin audit/settings structures.
- Current advisory findings include four RLS-enabled internal tables without client policies and disabled leaked-password protection.
- Performance advisor currently reports 91 unused indexes. These must be reviewed against actual query workload before removal; they are not a delete-all list.

### Current/Recent runtime failures verified from Vercel telemetry

- Repeated historical failures from deployments prior to the current HEAD included missing Supabase environment variables, Supabase storage quota restrictions, missing/unknown schema objects, old Gemini model references, and stale-schema API requests.
- The most recent 24-hour telemetry query returned a small number of current groups, including Supabase ECONNRESET failures and a media_assets.source_id schema mismatch on an older production deployment.
- A current production error must not be considered fixed solely because the schema now contains the missing object; the release/deployment chain must also be revalidated.

## Non-negotiable release rule

No functional cleanup PR may be merged directly to main until the change passes:

1. TypeScript check.
2. Lint.
3. Repository verification suite.
4. Migration validation.
5. Route/API inventory validation.
6. A fresh Vercel production build.
7. Production Supabase health/data-plane verification.
8. Relevant end-to-end smoke checks.

## Source-of-truth rule

- main at the recorded commit is the baseline for runtime behavior.
- supabase/migrations/ is the canonical migration chain.
- supabase/migrations_archive/ and supabase/legacy_migrations/ are historical references only and must not be reintroduced as active migrations.
- Existing ZIP exports are audit inputs only and are not allowed to override the live GitHub state.