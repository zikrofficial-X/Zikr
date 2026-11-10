# ZIKR Continuous Closeout Ledger

**Last reconciled:** 2026-11-10 11:38 Africa/Cairo  
**Repository:** `zikrofficial-X/Zikr`  
**Base snapshot:** `main@c91f64ccd6162e5107b3edb8be3c7aa521865c2f`  
**Working PR:** [#275](https://github.com/zikrofficial-X/Zikr/pull/275)  
**State:** IN PROGRESS — not a final certification.

## 1. Progress checkpoint

| Measure | Current result | Meaning |
|---|---:|---|
| Recursive tracked-tree entries | 2130/2130 | GitHub recursive tree API returned a complete, non-truncated tree |
| Files in manifest | 1639/1639 | 100% automated inventory coverage; includes tracked dotfiles and assets |
| Directories in manifest | 491/491 | Directory metadata captured recursively |
| Full functional/manual file reviews | 3/1639 | Three high-risk workflows read in full; other source areas remain unreviewed or only selectively inspected |
| Files marked complete | 0/1639 | No file is closed by metadata-only evidence |
| Product modules closed | 0 | Runtime/browser/device acceptance is not complete |
| Safe deletions | 0 | No candidate met the dependency and recovery proof threshold |

Manifest: `docs/audits/REPO_MANIFEST_2026-11-10.jsonl`  
File matrix: `docs/audits/FILE_STATUS_MATRIX_2026-11-01.md`  
Both are snapshots of the exact parent baseline `c91f64ccd6162e5107b3edb8be3c7aa521865c2f`; the manifest intentionally excludes its own self-referential blob.

### Inventory delta

- Prior matrix: 1,631 file rows.
- Current tree: 1639 files and 491 directories.
- Added paths (9): `docs/audits/ADMIN_CONSOLE_CLOSEOUT_2026-11-10.md`, `scripts/tests/admin-screen-fixes.test.mjs`, `scripts/tests/social-published-video-cleanup.test.ts`, `src/app/api/kids/videos/route.ts`, `src/features/admin/components/kids-content-manager.tsx`, `src/features/social/services/facebook-public-posts.ts`, `src/features/social/services/published-video-cleanup.ts`, `src/proxy.ts`, `supabase/migrations/20261110085520_add_hadith_chapter.sql`.
- Removed paths (1): `proxy.ts`.
- `proxy.ts` is no longer at the repository root; the current Next.js 16 entrypoint is `src/proxy.ts`. No proxy functionality was deleted.

## 2. Module status

| Module / unit | Status | Evidence | Remaining acceptance |
|---|---|---|---|
| Repository inventory | <badge color="success">Automated snapshot complete</badge> | Recursive Git tree: 1639 files, 491 directories, not truncated | File-by-file dependency and functional review |
| Route inventory | In progress | 142 pages, 80 route handlers; PR #275 updates shared baseline to 80 and requires Kids videos route | Run route verifier and full route/browser smoke |
| Automation safety | In progress | PR #275 removes implicit QA apply, scheduled storage deletion, direct offline snapshot push, and blocks Vercel Preview/Development workflow dispatch before reading a write-capable token | Quality Gate, CircleCI and Preview checks |
| Facebook OAuth recovery | In progress | PR #275 calls existing auth-blocked queue recovery after validated Page credential storage | CI and live admin-role acceptance; no publish dispatch |
| Admin console | Partially remediated | PR #265 merged; 66 Admin pages, 27 Admin API route files, 43 handlers in permission matrix | Authenticated browser acceptance for each role/permission |
| Kids content | Partially remediated | PR #266 merged; Kids feed requires published + kids audience + passed Kids QA + playable media | Editorial review and real device/browser acceptance |
| Written Facebook posts | Partially remediated | PR #268 merged; one written post published, ten queued | Verify provider delivery without replaying existing content |
| Admin knowledge/data | Partially remediated | PR #273 merged; `hadiths.chapter` migration applied and present in live schema | Authenticated Admin read/write acceptance |
| Video media lifecycle | In progress / recovery blocked | 44 Cloudinary MP4s recorded deleted; nine non-published queue rows still reference Cloudinary URLs; PR #275 adds a fail-closed purge guard | Recover/reconcile assets and queue states; do not purge or retry |
| Social publisher | Operational failure | Run `42792340735`: five HTTP 422 Facebook Reels failures, zero successes | Provider/media-state reconciliation; no blind retry |
| Supabase migration ledger | Reconciled | 415 local versions = 415 live versions; no missing/extra IDs | Continue schema/RLS/function dependency audit |
| Supabase security/permissions | In progress | 92/92 public tables have RLS; 211 policies; 20 SECURITY DEFINER functions have no direct anon/authenticated EXECUTE grants | Inspect policy semantics, role matrix and function bodies |
| Android | Partially verified | Previous signed release `v1.1.14` remains published; current main Android release-draft check green | Signed APK/AAB for current main not built/verified in this run |
| SEO/accessibility/browser/mobile | Open | Only earlier sampled smoke evidence exists | Exhaustive route, link, accessibility, SEO and device acceptance |

## 3. Verified infrastructure snapshot

### GitHub / Vercel

- GitHub repository: `zikrofficial-X/Zikr`; main baseline `c91f64ccd6162e5107b3edb8be3c7aa521865c2f`.
- Main branch protection reported disabled by GitHub API; no settings were changed.
- Vercel project `zikr` / `prj_bnBQb7DIXB5iE2mZJAghtAoZuKGs` is connected to the same repository.
- Production deployment `dpl_7Czpzb6ckFDezvMbAFaih8WYuk9E` is READY on `c91f64ccd6162e5107b3edb8be3c7aa521865c2f`; canonical alias is `zikrmediaofficial.vercel.app`.
- Main Quality Gate `42789168100`, Supabase Production Health `42789168307`, CircleCI config guard, source verify, application build/docs and Android release-draft statuses passed.
- The controlled release workflow previously failed at Vercel token identity validation; it did not deploy. A GitHub Actions credential authorized for team `zikr3` remains an owner-managed release prerequisite; no secret value was read or changed.
- PR #275 is draft and awaiting its own Quality Gate, CircleCI and Vercel Preview checks; it now includes the production-only workflow dispatch guard. Its Preview must remain read-only because the Preview environment currently uses production-backed integrations.

### Supabase

- Project: `zqtssvlvmkzeeyqghqfk`, ACTIVE_HEALTHY, PostgreSQL 17.
- Migrations: 415 local / 415 live, latest `20261110085520`, exact version-set parity.
- Public schema: 92 tables, all 92 RLS-enabled; 211 public policies; 45 public triggers; 40 public functions, including 20 SECURITY DEFINER functions.
- Direct EXECUTE grants on those 20 SECURITY DEFINER functions: none for `anon` or `authenticated`.
- Nine installed extensions: `pg_cron`, `pg_net`, `pg_stat_statements`, `pg_trgm`, `pgcrypto`, `plpgsql`, `supabase_vault`, `unaccent`, `uuid-ossp`.
- Four Edge Functions are active: `source-verified-content-agent`, `prayer-notification-worker`, `spiritual-ai`, `health`.
- Four cron jobs: three active, one disabled. The disabled legacy `zikr-youtube-facebook-sync` job references a retired project host and must stay disabled until separately reconciled.
- Nine Storage buckets; current `storage.objects` count is zero in every bucket.
- Security Advisor warning: leaked-password protection is disabled. This is a dashboard/Auth configuration action and was not changed.
- Performance Advisor reports 91 unused indexes. These are informational candidates only; no index was dropped because usage history and workload impact have not been proven.

## 4. Confirmed defects and remediation record

| ID | Finding | Priority | Decision / remediation | Commit | Test / evidence |
|---|---|---|---|---|---|
| SAFE-001 | Legacy QA workflow allowed production writes from a commit-message marker | P0 | PR #275 changes apply to manual dispatch + typed `APPLY_QA_BACKFILL` only | `0914cfb7b472d51474f8cd3c6f5dfac4c06701bf`, `ead57902fde95e66081ada64df8d9aeef76ce95b` | `video:qa:check` pending |
| SAFE-002 | Scheduled storage retention ran destructive apply automatically | P0 | PR #275 makes schedule dry-run; manual apply requires typed `DELETE_STAGING_COPIES` | `f9c96ef2f741a010639840e491d1122920cae712`, `93843d756b2791f5b847984c66711825eb47ac3e` | `pnpm test` / storage retention contract pending |
| SAFE-003 | Offline snapshot workflow pushed generated data directly to main | P1 | PR #275 routes updates through stable branch + reviewable PR + Quality Gate dispatch | `9c66e17edd349e67ec15aede06de4f2953844806`, `d93c8ca78f0c068ce48f638359a3be1f49bd707d` | `offline:check` pending |
| SAFE-004 | Facebook OAuth reconnect stored a valid Page credential but did not release explicitly auth-blocked queue rows | P1 | PR #275 calls existing recovery function after credential storage; no publisher dispatch from callback | `5fb47866ae5994405fec1ae8adde35b694adee40`, `4c761738ed9156c7e10fbb5e7549dc855bd9b28e` | `social:publish:check` pending |
| ROUTE-001 | New Kids videos API route was missing from the shared 79-handler baseline and required-route list | P1 | PR #275 updates expected handler count to 80 and adds `src/app/api/kids/videos/route.ts` to required routes | `eece9ea5eea08b2b31fef40ce8b9b60445e8cea1`, `804edee88edc475fd8e33c4216136cb05fd47d4f` | `routes:check` pending |
| SAFE-006 | Written Facebook posts could starve behind a full batch of video retries | P1 | PR #275 reserves one batch slot for an eligible non-video post while preserving the configured batch limit | `148c5d5ee12577520b30d1959338afcad8753c99`, `6cc8893d445ddd62dc8dbd16b28c3a2727c60298` | `social-queue-selection.test.ts` via `pnpm test` pending |
| SAFE-007 | Vercel Preview/Development could call the GitHub workflow dispatcher with production repository credentials | P0 | PR #275 rejects Vercel non-production or non-main runtime before reading the write-capable GitHub token; local development remains allowed | `2ffe84422043501de434f2f24b2bda289244efaa`, `76dd38f8f647ec69e5ef97948ee73479d4ba3346`, `87bd7b0c71971ef808dd9d6c524a902f86737ffa`, `67f1dbb9477e42fa02a7c5dfbd6fdc45503c5069` | `github-workflow-dispatch-policy.test.ts` via `pnpm test` pending |
| SAFE-005 | Admin video purge could delete generated Cloudinary MP4s still referenced by non-published social queue rows | P0 | PR #275 checks pending queue media before Cloudinary inventory and fails closed on protected references or an incomplete 1,000-row scan | `eb58c09d55ff32f9cb9fbc3dd1dcb95936a2e736`, `ca0b86ac8d1597af05d1ae03f70c2433634a48a7`, `f5c55566cfc0407c4958ee897e8acaf85e36a099`, `5abc544906543ba8369a8dd772ec95890e8e3fb2` | `video:purge:check` pending |

No production data, storage objects, migrations, policies, indexes, OAuth credentials, or social content were changed. No file deletion was performed.

## 5. Operational incident — media references

- Scheduled publisher run `42792340735` processed five items and recorded five Facebook Reels HTTP 422 failures; the batch ended with zero successes, zero deferrals, and five failures.
- Live queue inventory shows nine non-published video rows with Cloudinary URLs: four `failed`, three `partial`, two `queued`.
- Prior purge audit evidence in PR #271 records 44 Cloudinary MP4 deletions (212,392,150 bytes), 105 generated catalog rows hidden, zero social queue rows deleted, and zero external posts deleted.
- The nine queue references remain unresolved. Do not retry, requeue, regenerate, purge, or publish them until media existence and remote delivery state are reconciled. PR #271's fail-closed purge guard remains a draft and does not restore already-deleted assets.

## 6. Open pull requests / decisions

- #275 — current-main safety remediation; draft, CI/Preview pending.
- #270 — social queue fairness; draft. Do not dispatch duplicate publishing while media failures remain.
- #271 — fail-closed purge guard; draft. Required before any future destructive media cleanup.
- #274 — production-only GitHub dispatch guard; draft; its own description records the Preview isolation blocker.
- #269 — older audit branch is divergent from current main (20 commits ahead, 13 behind at the last comparison); do not force-push or merge its stale snapshot. Its useful safety changes are being ported into current-main PRs.
- #272 — closed as superseded by merged #273 because the duplicate `hadiths.chapter` migration was already applied and present.
- #273 — merged; includes the applied `20261110085520_add_hadith_chapter` migration.

## 7. Explicit blockers and acceptance gaps

1. Owner-level Supabase Auth setting: enable leaked-password protection after reviewing the signup impact.
2. Owner-managed GitHub Actions Vercel credential: previous controlled-release run could not validate the token against team `zikr3`; no credential values were read or changed.
3. Video recovery: the deleted Cloudinary assets and nine queue references require a verified restore/replacement plan; no retry is safe yet.
4. Browser acceptance: authenticated Admin role/permission and mutation checks have not been performed.
5. Android acceptance: current-main signed APK/AAB and physical-device installation/runtime checks have not been performed.
6. Full repository review: every remaining `REVIEW_REQUIRED` file must have its import/reference/runtime/test contracts traced before module closure.

## 8. Next checkpoint order

1. Wait for PR #275 Quality Gate, CircleCI source/build and Vercel Preview; fix only confirmed failures.
2. Reconcile PR #271 purge guard and the nine affected queue rows without re-running publish or purge workflows.
3. Review auth/OAuth, social publisher, queue reconciliation and video media lifecycle source files and tests.
4. Continue through `src/lib`, `src/proxy.ts`, APIs, components/layouts, services, workers, workflows, schema and migrations.
5. Complete browser, role, accessibility, SEO, mobile and Android device acceptance before closing modules.

**Do not set `FINAL BASELINE READY` until the inventory and module acceptance requirements are fully met.**
