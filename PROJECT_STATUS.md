# ZIKR — Current Project Status

**Production branch:** `main`  
**Last reconciled:** 2026-11-10  
**Repository:** `zikrofficial-X/Zikr`  
**Production origin:** `https://zikrmediaofficial.vercel.app`

## Current verified checkpoint — 2026-11-10

**Audit state: IN PROGRESS. This checkpoint is not a FINAL BASELINE READY certification.**

- Canonical repository and Vercel Git binding were rechecked: `zikrofficial-X/Zikr`, branch `main`; current main SHA `bb22f511281ea83b4c64e97f391f6ff1fcb07208`. Vercel team `zikr3`, project `zikr` (`prj_bnBQb7DIXB5iE2mZJAghtAoZuKGs`), Node `22.x`.
- Supabase production project `zqtssvlvmkzeeyqghqfk` is `ACTIVE_HEALTHY`, region `eu-west-2`, PostgreSQL 17.11.
- Recursive main tree baseline: **2127 entries, 1636 files, 491 directories**, with 142 App Router pages and 80 API route handlers. The recursive tree was not truncated. The manifest at `docs/audits/REPO_MANIFEST_2026-11-10.jsonl` inventories every entry at `bb22f511281ea83b4c64e97f391f6ff1fcb07208`; this is automated inventory coverage, not manual review of every file.
- Local Supabase migration inventory: 414 versioned files. Live ledger: 414 versions, latest `20261110031431`. Exact local/live version-set comparison: **MATCH**.
- Live database snapshot: 92 public tables; 211 public policies; 53 public triggers; 40 public functions. The inspected public-table inventory reports RLS enabled for all public tables. Four Edge Functions are active. Three `pg_cron` jobs are active; one legacy social-sync job remains disabled and still references a retired project URL, so it is retained disabled rather than modified or deleted.
- Supabase advisors: one Security warning remains — leaked-password protection is disabled and requires an owner-level Auth/plan decision. Performance Advisor reports 91 unused-index candidates; these are informational and are not dropped without workload evidence. Health Advisor returned no findings.
- Vercel production deployment for main `bb22f511281ea83b4c64e97f391f6ff1fcb07208` is `READY` (deployment `dpl_BNc8zDChgH2WE9ELYijvfv6w5UoE`). PR #270 preview for `e8044cb4f8e29341a9dfa694e84a1a7b82b432ae` is also `READY`; this audit did not trigger a production deployment.
- GitHub main Quality Gate and CircleCI `source-verify`, `application-build-docs`, `android-release-draft`, and `config-guard` statuses passed for `bb22f511281ea83b4c64e97f391f6ff1fcb07208`. PR #269 is rebased onto this main baseline and its Quality Gate/CircleCI checks are running. PR #270 now includes CircleCI source/build filters and a regression fixture for combined YouTube/Reels retries; its Vercel preview is ready and Quality Gate/CircleCI checks are running. PR #271 adds the purge-media safety guard; its preview and full CI are running. PR #272 contains an additive hadith schema migration but remains blocked from merge/application pending explicit production schema approval.
- Live social queue snapshot: 94 rows — 75 `published`, 3 `partial`, 14 `queued`, 2 `failed`. All 107 video-generation requests currently report `completed`. The latest scheduled publisher run `42784372262` failed after five Facebook Reels uploads returned HTTP 422 without a provider error code/message; two queue rows are failed and three are partial with YouTube success preserved. The provider error is now traced to a prior `video.library.purge` audit event at 08:35:56 UTC that deleted 44 Cloudinary MP4 assets (212,392,150 bytes) while preserving social queue rows. Five failed/partial and four additional queued video rows still reference generated Cloudinary media (9 non-published references). PR #271 adds a fail-closed guard before any purge deletion; no retry/replay or asset restoration was dispatched. Ten written Facebook posts remain scheduled for later dates. PR #270 addresses written-post starvation separately.
- Live hadith schema reconciliation: `public.hadiths.chapter` is absent from production although the admin knowledge query/action selects and writes it. The original `CREATE TABLE IF NOT EXISTS` migration did not add the column to an already-existing table. PR #272 adds an idempotent nullable column migration and generated-type/test updates; it has not been applied to production pending explicit owner approval and coordinated deployment.
- Facebook Page credential is enabled/connected and includes the checked page-read, page-post, and insights scopes. The YouTube credential table has no `expires_at` column; runtime refresh-token exchange handles expiry/revocation, but proactive expiry-time checks are unavailable from the stored schema.
- Vercel runtime monitoring shows six `fetch failed` events (ETIMEDOUT/UND_ERR_SOCKET) across public/admin routes and one invalid server-token rejection on `/api/admin/social`. No source change is justified without a reproducible upstream/caller diagnosis.
- No production data, storage objects, migrations, indexes, credentials, or social queue rows were changed. No real content was published by this audit run. No files or branches were deleted.

### Remaining closure gates

- Reconcile the 91 unused-index findings with query/workload evidence before any index retirement.
- Resolve or formally accept the Supabase Free-plan leaked-password-protection warning.
- Diagnose the Facebook Reels HTTP 422 response using provider-safe diagnostics; do not replay attempted rows until the cause and idempotency state are verified.
- Investigate intermittent Vercel transport errors with a reproducible trace and upstream attribution.
- Complete authenticated browser/role E2E, accessibility/SEO route acceptance, physical Android device acceptance, and qualified editorial/religious/Kids educator review.
- Verify the latest Android tag/release assets and signing artifacts before claiming a new APK/AAB. This checkpoint does not certify a new APK/AAB.
- Keep production/social release gates unchanged. No public content or production release is authorized by this audit checkpoint.

