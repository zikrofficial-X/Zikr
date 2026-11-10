# ZIKR Continuous Closeout Ledger

**Last reconciled:** 2026-11-10 15:08 Africa/Cairo  
**Repository:** `zikrofficial-X/Zikr`  
**Base snapshot:** `main@c91f64ccd6162e5107b3edb8be3c7aa521865c2f`  
**Working PR:** [#275](https://github.com/zikrofficial-X/Zikr/pull/275)  
**State:** IN PROGRESS — not a final certification.


## Latest execution checkpoint — 2026-11-10 15:08 Africa/Cairo

- **Canonical identities:** GitHub `zikrofficial-X/Zikr`; `main@c91f64ccd6162e5107b3edb8be3c7aa521865c2f`; Vercel project `zikr` / `prj_bnBQb7DIXB5iE2mZJAghtAoZuKGs` with production deployment `dpl_7Czpzb6ckFDezvMbAFaih8WYuk9E` READY on that exact main SHA; Supabase `zqtssvlvmkzeeyqghqfk`, `ACTIVE_HEALTHY`, PostgreSQL 17.11.
- **Inventory:** main tree remains 2,130 entries (1,639 files, 491 directories), recursive response not truncated. PR #275 head is `695aacfee5bed657e607faf79e1e65608c711073`, 2,140 entries (1,649 files, 491 directories), 10 PR-only additions, zero removed paths, 56 changed files. Main remains the production baseline; PR is still Draft and unmerged.
- **Cumulative coverage:** the file matrix now classifies 128/1,639 main files; 1,511 remain `REVIEW_REQUIRED`. This is source-content classification, not 100% manual/functional review. Modules closed: 0. Directory inventory is complete; runtime/browser/device acceptance remains open.
- **New safety fixes in PR #275:** commit `c93eae7` replaces the weak raw-string Supabase target check with strict direct-endpoint or Supabase-pooler host validation, exact project-qualified database role, and mandatory secure `sslmode`. The canonical tafsir restore script and migration-history reconciliation now call this validator. The manual seed-restore workflow now reuses the canonical guarded restore script, removes dynamic grep-based migration discovery, and requires exactly 6,236 source-verified tafsir rows. Regression cases cover valid direct/pooler URLs, foreign host with the project ref only in a password, wrong pooler role, weak/missing TLS, retired role, and credential redaction.
- **Social insights least privilege:** commit `73a5e99` narrows the daily insights workflow to `BACKGROUND_JOB_TARGET=insights` with publishing disabled. It removes unused YouTube upload credentials, Facebook publishing readiness flags/scopes, queue-alert webhook/email credentials and Resend key. The runner trace confirms this target does not execute video generation, internal content publishing, social queue processing, queue alerts, or automation-run writes; it calls the published-post insights sync only. A CI architecture assertion protects this isolation.
- **Production release gate:** commit `695aacf` changes controlled release concurrency so an active production release cannot be cancelled mid-deploy/migration. It verifies the dispatch SHA is still current `main`, requires successful CircleCI `config-guard`, `source-verify`, `application-build-docs`, `android-release-draft` and the latest `ZIKR / Quality Gate`, then rechecks `main` immediately before deployment. The workflow remains manual-only and requires typed `RELEASE`; it was not dispatched.
- **Current CI on exact PR head:** CircleCI `source-verify` 4448 and `application-build-docs` 4447 are pending; `config-guard` 4449 is pending at this checkpoint. GitHub Quality Gate run 42823397094 is pending and CircleCI Config Validation run 42823397100 is queued. Earlier commit `18094251` passed its Quality Gate and config validation, but that does not certify the newer code. Do not merge until all checks pass on the exact current head.
- **Live Supabase counts (read-only):** 415 migrations, latest `20261110085520`; 92 public tables with RLS enabled, 211 policies, 45 triggers, 9 Storage buckets and 0 Storage objects. Health Advisor has no findings; Security Advisor still warns leaked-password protection is disabled; Performance Advisor lists 89 unused-index candidates. No migration, policy, Auth setting, index, bucket or production row was changed.
- **Content and delivery state:** 6,236 Quran ayahs and 6,236 tafsir rows; 2,964 hadiths; 113 articles. `videos` has 127 rows (22 published, 105 hidden); 112 generation requests are marked completed, but 64 have no `video_url`. Social queue has 98 rows: 79 published, 6 failed and 3 partial video rows (all 9 flagged `sourceMediaMissing`), plus 10 queued `written_post` rows. The 10 queued rows are written posts, not missing video retries. Internal content queue has 121 published rows. Insights table has 148 records (72 Facebook Reels, 76 YouTube), latest capture 2026-11-10 06:55 UTC. No retries, regeneration or public posts were triggered.
- **Release state:** Android `v1.1.14` remains published from older commit `d055980...`; no signed APK/AAB built from current main was verified in this run. No Vercel production deployment, Supabase migration, Cloudinary deletion, storage cleanup, OAuth mutation or social publishing was performed.
- **Open blockers:** 9 non-published video queue rows still lack source media; 64 completed generation requests have no recorded `video_url` and require per-row reconciliation before any regeneration; PR CI is pending; the PR has no isolated safe Preview because Preview integrations are production-backed; Storage owner-policy migration is not applied; leaked-password protection requires an owner-level Auth/plan decision; Android artifacts need a new release from current main. Main branch protection remains disabled; no protection setting was changed.
- **No deletion:** no tracked file, branch, migration, index, database row, Storage object, Cloudinary asset or external post was deleted by this run.

## Additional checkpoint — Android release publishing gate (2026-11-10)

- **New defect confirmed in the Android publisher:** the release-branch path could enter the publisher without `workflow_dispatch` plus `retry=true`, and the CircleCI prerequisite step was skipped for all manual retries. A manual retry could therefore bypass source verification and the Supabase production gate even though the artifact/tag SHA check still existed.
- **Fix in PR #275:** commit `4ee6a5b` restricts recovery branches to explicit `workflow_dispatch` with `inputs.retry=true`, resolves the immutable tag target for every path, and runs the release prerequisite gate for tag pushes and all retries. It waits for `config-guard`, `source-verify`, `application-build-docs`, `android-release-draft`, `supabase-production-gate`, `android-rebuild`, `android-release-dispatch`, the combined commit status, and the latest `ZIKR / Quality Gate` on the exact tag target SHA.
- **Contract correction in commit `e6f7e3b`:** updated the release-contract and CI-architecture assertions to enforce the new exact-source checks, retry guard and complete CI gate. A failing combined commit status now fails immediately instead of waiting for the timeout.
- The separate `dispatch-android-release-recovery.yml` was read end-to-end: it is workflow-dispatch-only, requires the `RELEASE_RETRY.flag`, checks version/tag/release notes, exact recovery branch SHA, successful Android rebuild and an eligible draft release, then dispatches the publisher. The publisher now adds the full CI/Quality Gate checks before upload.
- **No release action was triggered.** Android `v1.1.14` remains the existing immutable release; no APK/AAB was rebuilt or uploaded. Current PR #275 code head is `e6f7e3baf8c6ad904a0082e67c5740c2a3ed9a5a`, PR remains Draft, 58 changed files, 10 added paths, no removals.
- **Exact-head CI is pending:** CircleCI `source-verify` 4459 and `application-build-docs` 4460 pending; `config-guard` 4461 success; GitHub Quality Gate 42824891836 queued; CircleCI Config Validation 42824891750 in progress. The release contract is not certified until these checks complete on the exact current head.
- Coverage increases to 129/1,639 main files classified; 1,510 remain `REVIEW_REQUIRED`. No module is closed. No production database, deployment, release, storage, media or social state was changed.

## Latest execution checkpoint — 2026-11-10 14:48 Africa/Cairo

- Canonical identities rechecked: GitHub `zikrofficial-X/Zikr`; `main@c91f64ccd6162e5107b3edb8be3c7aa521865c2f`; Vercel project `zikr` / `prj_bnBQb7DIXB5iE2mZJAghtAoZuKGs`; Supabase `zqtssvlvmkzeeyqghqfk` (`ACTIVE_HEALTHY`).
- PR #275 head: `8f835e824bb4f848e0304294a04464d8c08903bf`. CircleCI `source-verify` job 4412 failed in the YouTube OAuth contract test because the test passed `undefined`, invoking the function's default `process.env.YOUTUBE_CHANNEL_ID`, which was populated in CI. The test now clears the environment override for the no-override assertion, tests a configured mismatch, and restores the original value in `finally`. No runtime OAuth code or credential changed.
- Validation on the exact PR head passed: CircleCI source-verify 4415, application-build-docs 4414, config-guard 4416, GitHub Quality Gate 42818371121, and CircleCI Config Validation workflow 42818371229.
- Vercel Production deployment `dpl_7Czpzb6ckFDezvMbAFaih8WYuk9E` remains READY on the exact main SHA. Health endpoint and 10 sampled routes/APIs returned HTTP 200, including `/api/kids/videos`. These are production-main smoke checks, not a Preview check for the PR.
- Live migration ledger remains 415/415 unique versions. Security Advisor has one warning (leaked-password protection disabled), Performance Advisor reports 89 unused-index candidates, and Health Advisor has no findings. No index, policy, migration, or Auth setting was changed.
- Video queue reconciliation: 78 published, 6 failed and 3 partial video rows. All 9 non-published rows are marked `sourceMediaMissing` and held with a far-future schedule; no retries, regeneration, provider calls, media deletion, or public posts were performed.
- Four Supabase cron jobs remain: three active and the legacy YouTube/Facebook sync disabled. No cron commands or secrets were read.
- Vercel isolated Sandbox creation returned HTTP 402 because the team's Snapshots Storage quota is exhausted until the plan reset; no local sandbox test was run. CircleCI provided the successful source/build verification instead. No safe Vercel Preview exists for this PR because its Preview environment shares production-backed integrations. Keep PR #275 Draft and unmerged pending isolated Preview strategy and full diff review.
- No production data, secrets, storage objects, OAuth credentials, or social posts were modified. No files were deleted. Audit coverage advanced to 5/1639 full-content reads; modules closed remain 0.


## Latest execution checkpoint — 2026-11-10 14:59 Africa/Cairo

- Latest verified PR head before this documentation refresh: `1b49ff8e236a6cb6a6a424e7c102251db45baeba`; CircleCI source-verify 4427, application-build-docs 4426, config-guard 4428, GitHub Quality Gate 42819681898, and CircleCI Config Validation 42819681906 all passed. PR #275 remains Draft and unmerged.
- Current inventory: 2,130 tracked entries, 1,639 files, 491 directories; manifest coverage 100%. File matrix records 122/1,639 full source-content reads (1,517 still `REVIEW_REQUIRED`), 5/1,639 full manual/functional reviews, 0 closed modules and 0 safe deletions.
- Environment consumer trace: code search found 33 `getServerEnv` and 6 `getPublicEnv` references. Key auth, Supabase and YouTube paths were mapped; no direct client-component call was found. Full consumer and transitive import tracing remains open.
- Vercel environment inventory: 55 records / 50 unique names. Seventeen `sensitive`-type variables target Preview and thirteen target Development. No values were decrypted. The project has no custom environments (`accountLimit.total = 0`); Preview shares production-backed integrations and is not safe for authenticated write tests. No environment targets or secrets were changed.
- Vercel Sandbox creation remains blocked by HTTP 402 (Snapshots Storage quota). CircleCI is therefore the available isolated source/build runner for this run.
- Production Vercel deployment `dpl_7Czpzb6ckFDezvMbAFaih8WYuk9E` remains READY on `main@c91f64ccd6162e5107b3edb8be3c7aa521865c2f`. Health and 10 sampled public routes/APIs returned HTTP 200. This is sampled production-main smoke, not full browser acceptance or a PR Preview.
- Supabase project remains `ACTIVE_HEALTHY`; migration ledger is 415/415 unique versions. Security Advisor: one leaked-password-protection warning. Performance Advisor: 89 unused-index candidates. Health Advisor: no findings. Four cron jobs exist (three active, legacy social sync disabled). No data, schema, policy, index or Auth setting was changed.
- Video queue: 78 published, 6 failed, 3 partial. All nine non-published rows are marked `sourceMediaMissing` and held. Exact Cloudinary searches for all nine referenced public IDs returned zero active assets; no asset/version IDs were available for a safe backup restore. No retries, regeneration, uploads, provider calls, media deletion or social posts occurred.
- Android: last verified published release remains `v1.1.14` from the older `d055980` release baseline; no signed APK/AAB for current `main@c91f64c` was built in this run.
- No files or production data were deleted or modified. No OAuth credentials or environment values were read or changed. PR #275 remains blocked from merge by the lack of isolated Preview and the broad 49-file diff review.

## 1. Progress checkpoint

| Measure | Current result | Meaning |
|---|---:|---|
| Recursive tracked-tree entries | 2130/2130 | GitHub recursive tree API returned a complete, non-truncated tree |
| Files in manifest | 1639/1639 | 100% automated inventory coverage; includes tracked dotfiles and assets |
| Directories in manifest | 491/491 | Directory metadata captured recursively |
| Full source-content reads | 122/1639 | Full file content was fetched and reviewed for this subset; 1517 files still require full content and dependency review |
| Full functional/manual file reviews | 5/1639 | Three high-risk workflows plus the YouTube OAuth credential service and its contract test read in full; remaining source areas are unreviewed or only selectively inspected |
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
- Nine Storage buckets; current `storage.objects` count is zero in every bucket. This is expected for the current delivery architecture: 19,608 Quran audio rows are external MP3Quran URLs with `storage_status='external'` and no storage paths; 30 site-audio rows use `curated:` keys resolved through the Cloudinary curated library; Android download routes use GitHub Releases and explicitly prohibit Supabase Storage binary redirects. Cloudinary verification found all 30 curated audio assets under `zikr/audio/` (30 expected, 30 found).
- Scheduled storage-retention run `42746805266` completed with zero video candidates and zero Android copies; it performed no deletions in the current project. The older 148-object snapshot belongs to the retired project ref `ymxdswkaxafakugktsim`; that project is not accessible through the current connector, and no migration/restore/delete was attempted.
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
| SAFE-008 | Stored YouTube refresh tokens were selected by provider/scopes without matching the persisted channel ID to configured `YOUTUBE_CHANNEL_ID` | P1 | PR #275 loads `channel_id` in both analytics and publishing reads and fails closed when the configured provider ID differs or the stored ID is missing | `809bbda5d08a4a32e540e210eb899681ea3c76af`, `568a4d790af57a6211617514aebe8e0c1848b48f`, `97bc37205e474a17b71e2612c896cd3af78ebcc4` | `youtube-oauth-credentials.test.ts` pending |
| SAFE-005 | Admin video purge could delete generated Cloudinary MP4s still referenced by non-published social queue rows | P0 | PR #275 checks pending queue media before Cloudinary inventory and fails closed on protected references or an incomplete 1,000-row scan | `eb58c09d55ff32f9cb9fbc3dd1dcb95936a2e736`, `ca0b86ac8d1597af05d1ae03f70c2433634a48a7`, `f5c55566cfc0407c4958ee897e8acaf85e36a099`, `5abc544906543ba8369a8dd772ec95890e8e3fb2` | `video:purge:check` pending |

No production data, storage objects, migrations, policies, indexes, OAuth credentials, or social content were changed. No file deletion was performed.

## 5. Operational incident — media references

- Scheduled publisher run `42792340735` processed five items and recorded five Facebook Reels HTTP 422 failures; the batch ended with zero successes, zero deferrals, and five failures.
- Live queue inventory shows nine non-published video rows with Cloudinary URLs: four `failed`, three `partial`, two `queued`.
- The live `admin_audit_events` record at 2026-11-10 08:35:56 UTC confirms 44 Cloudinary MP4 deletions (212,392,150 bytes), 105 generated catalog rows hidden, social queue rows preserved, and no external posts deleted.
- Cloudinary `list_videos(prefix='auto-')` returns zero assets. The nine non-published queue URLs resolve to nine distinct `auto-*` public IDs, and none exists in the current Cloudinary inventory. This confirms the HTTP 422 root cause is missing media, not cooldown or a transient provider outage.
- The nine queue references remain unresolved. Do not retry, requeue, regenerate, purge, or publish them until media recovery and remote delivery state are reconciled. PR #275 adds a fail-closed purge guard, but it does not restore already-deleted assets.

## 6. Open pull requests / decisions

- #275 — active current-main safety remediation; draft, Quality Gate/CircleCI/Preview checks pending. It includes typed production workflow gates, preview dispatch isolation, OAuth provider-ID checks, video-purge protection, queue fairness, route baseline, manifest, matrix and ledger.
- #269, #270, #271, #272, #274 — closed as superseded after their useful changes were ported into #275 or confirmed applied by merged #273. Their branches were retained; no force-push or branch deletion was performed.
- #273 — merged; includes the applied `20261110085520_add_hadith_chapter` migration.
- GitHub code search found all current `dispatchGitHubWorkflow` call sites route through `src/lib/github/dispatch-workflow.ts`; no direct `actions/workflows/.../dispatches` REST call was found. PR #275 adds the environment guard at this shared entry point.

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


## 9. Continuous closeout checkpoint — 2026-11-10 12:12 Africa/Cairo

**State: IN PROGRESS. No module is closed and this is not a final baseline certification.**

### Source of truth and inventory

- GitHub repository: `zikrofficial-X/Zikr`; canonical baseline branch `main` remains at `c91f64ccd6162e5107b3edb8be3c7aa521865c2f`.
- Active repair PR: #275, draft, base `main`; working branch `codex/zikr-comprehensive-repair-safety-20261110`. Latest branch head at this checkpoint: `66ec209d1d86056af89fa107241b0230e39c5666`. No merge, force-push, or branch deletion was performed.
- Vercel project `zikr` / `prj_bnBQb7DIXB5iE2mZJAghtAoZuKGs`, team `team_RxPjmgZoSFmKGjScefYmwIVv`; the latest Production deployment is READY on the exact main baseline SHA above. Its canonical aliases remain `zikrmediaofficial.vercel.app`, `zikr-zikr3.vercel.app`, and `zikr-git-main-zikr3.vercel.app`. Deployment metadata confirms repository `zikrofficial-X/Zikr`. No production deploy was triggered.
- Vercel environment inventory: 55 variable records across development/preview/production. Only names, targets and encrypted/sensitive/plain classifications were inspected; values were not read or copied into this ledger.
- Supabase project `zqtssvlvmkzeeyqghqfk` is ACTIVE_HEALTHY. Local and live migration ledgers both contain 415 unique versions, latest `20261110085520`; no migration was applied during this run.
- Recursive Git tree: 2,130 entries = 1,639 files + 491 directories, 138,209,705 file bytes; the API response was not truncated. Matrix inventory coverage is 1,639/1,639 (100% automated). This does not include ignored/untracked local files.

### Measured review progress

- Full source-content reads recorded in the matrix: **21/1,639**. One additional PR-only test file was read but is outside the main-baseline inventory.
- 21 matrix rows now carry evidence and non-final states such as `CONTENT_READ_PENDING_TRACE`, `FIXED_PENDING_CI`, or `TEST_UPDATED_PENDING_CI`. The remaining **1,618** baseline files remain `REVIEW_REQUIRED`.
- Content reading is not equivalent to full dependency/runtime/acceptance verification. Imports, dynamic references, all consumers, browser/device acceptance and module-level tests remain open.
- Modules closed: **0**. No file or product module is marked complete solely because static checks passed.
- Automated workflow scan covered all 19 tracked GitHub workflow files for triggers, production environments, write permissions, secret references, branch gates and checkout refs. Nine high-risk workflow files were also read in full; the 21 file reads include the three workflows noted in the previous checkpoint.

### Code and CI remediation in PR #275

| Finding | Change | Commit | Verification |
|---|---|---|---|
| Approved-video eligibility test included competing written posts while claiming none competed | Isolated the video-only eligibility assertion; retained a separate fairness test with mixed candidates | `eae0a949d0f8701b47dcc1e303b73b2824d05b52` | The earlier Quality Gate run failed later in the suite at the YouTube OAuth source assertion; the corrected queue test itself passed before that failure |
| Production storage-retention workflow could be manually dispatched from a non-main branch and execute branch-controlled code with production secrets | Added a main-only job gate and pinned checkout to `main` | `111e8c012a2c2e0515e1d8317f08a5cb688b1cdb` | Regression assertion added in `dfee14252c7de92b700d7ef07bcffdb8dcec39e4`; latest full gate pending |
| Offline snapshot workflow could be manually dispatched from a non-main branch while using production Supabase credentials | Added a main-only job gate; it already checked out main and continues to publish generated data through a PR | `11cee4fdbb2c87a9fdaba84ebc50acc0dc688278` | Offline verifier assertion added in `69b325dec4e0519ee5e5f3bad13364490357813a`; CI pending |
| YouTube OAuth test regex was over-escaped and matched zero source call sites although both analytics/publishing readers enforce channel identity | Corrected the regex to match the actual TypeScript calls | `5cba3a850083f73deaf6b74dc9c41c381a6efecb` | Latest Quality Gate is still running on that code head; no merge |
| CI architecture verifier now explicitly checks the storage-retention and offline workflow source-ref gates | Added regression assertions | `8db50d502a03e8e83d0113066c40a6ab5494ddeb` | CircleCI config guard passed; source/build and full Quality Gate still need green results |

- Prior PR Quality Gate failure on `9fbcd0028a4395544f34cbec15fe46cd5196c503`: the approved-video assertion selected `post-1` because the test fixture included eligible written posts. Corrected as above; no production selector change was made for that test failure.
- Quality Gate run `42797491221` on `eae0a949d0f8701b47dcc1e303b73b2824d05b52` then failed at `scripts/tests/youtube-oauth-credentials.test.ts:67` (`actual 0, expected 2`); corrected in commit `5cba3a850083f73deaf6b74dc9c41c381a6efecb`.
- For commit `5cba3a850083f73deaf6b74dc9c41c381a6efecb`, CircleCI `config-guard` was successful, while `source-verify` and `application-build-docs` reported failures. Their CircleCI job logs were not accessible through the connected tools, so the root causes are not yet verified. GitHub Quality Gate run `42797998682` was in progress when this checkpoint was written. Subsequent documentation commits have not yet completed their own checks. Do not merge until all required checks are green.

### Production video/social incident — read-only reconciliation

- Main-branch scheduled social publisher run `42797712830` failed after processing five queue items: one item published successfully, one was deferred by the persisted Facebook Reels cooldown, and three items failed Facebook Reels with HTTP 422. The successful Kids-series item has confirmed YouTube and Facebook remote IDs. Three other items have confirmed YouTube success but Facebook Reels failure.
- A read-only Supabase query found **12** non-published queue rows with generated Cloudinary URLs: six older rows from batch `20763` (four failed, two queued) and six newer rows from batch `20767` (four partial, two queued).
- A read-only Cloudinary `list_videos` lookup found only **3 of those 12** assets. **Nine queue references have no matching Cloudinary video asset**: the six older batch-`20763` rows and three newer partial rows (`auto-dua-20767-2-0b3b03617196e4cc`, `auto-story-20767-4-770e425b83476d95`, `auto-adhkar-20767-3-da6313300ae0834f`). The three present assets correspond to two queued rows and one cooldown-deferred partial row.
- This confirms a media-reference/data-consistency incident; it is not evidence of a transient Meta outage or a cooldown defect. The three new YouTube uploads are already recorded as successful. **No queue retry, requeue, regeneration, deletion, purge, or manual social publish was performed.** Do not retry these items until media restoration/replacement and remote delivery state are reconciled.
- The previously added video-purge guard in PR #275 protects remaining referenced assets from future cleanup; it cannot restore the 44 assets deleted in the earlier incident. A backup/restore source has not yet been proven.

### Supabase security and data-plane snapshot

Read-only SQL against the active project returned:

- 92 public tables; RLS enabled on all 92.
- 211 public RLS policies; 45 non-internal public triggers.
- 40 public functions; 20 are SECURITY DEFINER; all 20 have a pinned `search_path`; zero direct EXECUTE grants to `anon` or `authenticated` on those 20 functions.
- Four pg_cron jobs (three active, one disabled).
- Nine Storage buckets, zero objects in the current project.
- Security Advisor still reports `auth_leaked_password_protection` WARN (leaked-password protection disabled). This is an owner-level Auth setting and was not changed.
- Performance Advisor reports 91 unused-index candidates. No index was dropped because workload/usage evidence is insufficient.
- No schema, policy, role, grant, function, trigger, extension, cron, bucket, row, or storage object was modified.

### Other release domains

- GitHub main remains unprotected; this run did not change branch protection. PR #275 remains draft and unmerged.
- Vercel production remains on main SHA `c91f64ccd6162e5107b3edb8be3c7aa521865c2f`; no production deployment or alias change occurred.
- Android: no new APK/AAB was built or signed in this run. The earlier `v1.1.14` release remains the last recorded signed release; it was not re-verified against the current main commit.
- No file deletion, migration replay, production data cleanup, OAuth credential update, provider consent, or manual social publishing occurred in this audit run. The scheduled main-branch social workflow ran independently as described above.

### Open blockers and next actions

1. Obtain accessible CircleCI job output or reproduce `pnpm verify:pr` and `pnpm build` on the exact failing SHA; fix confirmed causes and wait for new required checks.
2. Continue from the next unreviewed operational files: `src/features/social/services/published-video-cleanup.ts`, `src/features/social/services/social-publishing.ts`, `scripts/jobs/social-publishing.ts`, `src/lib/github/dispatch-workflow.ts`, and their callers/tests.
3. Add/verify bounded pagination for `unblockFacebookAuthBlockedQueue`; it currently reads only the first 250 failed/partial rows, so later auth-blocked rows may not be released in one pass.
4. Review Facebook OAuth expiry introspection and Page task verification; OAuth callback currently persists `expires_at: null` for Page tokens, while health checks rely on Graph API validation.
5. Keep the nine missing Cloudinary assets and their queue rows untouched until a verified backup/restore or owner-approved replacement plan exists.
6. Owner action remains required to enable leaked-password protection. Browser/admin role checks, accessibility/SEO, physical Android acceptance, and all remaining file/module reviews are still open.

**No modules closed. No `FINAL BASELINE READY` claim.**

  
## Continuous closeout checkpoint — 2026-11-10 13:25 Africa/Cairo

- **Source of truth revalidated:** Vercel team `zikr3` / project `zikr` is linked to `zikrofficial-X/Zikr`; production deployment `dpl_7Czpzb6ckFDezvMbAFaih8WYuk9E` is READY on `main@c91f64ccd6162e5107b3edb8be3c7aa521865c2f`. Main SHA has not moved. No production deploy was initiated.
- **PR #275:** still draft/open, based on the current main SHA, head `1a522cd910d2eca3a9094feebef654aa7b58b2a6`. It remains unmerged. Latest CircleCI `config-guard` passed, `source-verify` failed (job 4339), `application-build-docs` is pending; GitHub Quality Gate run `42807450137` is in progress. CircleCI job output is not accessible through the connected account, so the failing source-verify root cause is not asserted. Do not merge until all required checks pass.
- **Inventory/progress:** the untruncated recursive Git tree remains 2,130 entries: 1,639 files, 491 directories, 138,209,705 bytes. Manifest remains anchored to main SHA `c91f64c`. Full source-content reads are now 91/1,639 (5.55%); 1548 files remain `REVIEW_REQUIRED`. This run fetched all 59 `src/lib` files plus `src/proxy.ts`, `package.json`, route baseline, and social/OAuth operational files. Static scan over the 59 `src/lib` files enumerated imports/exports/env references and found zero U+FFFD replacement characters, zero TODO/FIXME/XXX/HACK markers, and zero matches for the scanned private-key/API-key marker patterns. This is automated source scanning, not a manual semantic audit. Modules closed: 0.
- **Code fix committed:** `1a522cd910d2eca3a9094feebef654aa7b58b2a6` normalizes both object- and array-shaped legacy `platformResults`, preserves confirmed remote provider IDs during admin retries, respects per-platform `authBlockedPlatforms` / `permanentFailurePlatforms` when result maps are missing, and keeps unselected Facebook auth blocks intact. Regression assertions were added to `scripts/tests/social-platform-isolation.test.ts`. No production queue rows were changed. GitHub Quality Gate is still running; CircleCI source-verify is failing, so the fix is not accepted/merged yet.
- **Social queue snapshot (read-only):** 98 rows total: 77 published, 13 queued, 4 partial, 4 failed. Current unresolved rows include three partial HTTP 422 outcomes and one cooldown-deferred partial; four failed rows also carry HTTP 422. Main scheduled publisher run `42801008492` failed after processing five items (1 succeeded, 1 deferred, 3 failed). No retry, requeue, regeneration, or manual publish was performed. The nine previously identified missing Cloudinary assets remain unresolved; no restore source has been proven.
- **Supabase (read-only):** active project `zqtssvlvmkzeeyqghqfk`; local/live migration ledgers remain 415/415 unique versions. SQL snapshot: 92/92 public tables RLS-enabled, 211 policies, 45 non-internal triggers, 40 public functions (20 SECURITY DEFINER, zero direct client EXECUTE grants), four cron jobs (three active), nine Storage buckets, zero Storage objects. Security Advisor still warns that leaked-password protection is disabled. Performance Advisor now reports 89 unused-index candidates (previous checkpoint 91); no index was dropped.
- **Vercel/runtime:** production remains on current main SHA. Runtime telemetry shows six transient `fetch failed` groups (UND_ERR_SOCKET/ECONNRESET; last 2026-11-10 08:38:56 UTC) and one admin social error reporting an invalid/revoked server token (last 2026-11-10 08:33:39 UTC). No token was read, rotated or requested in chat.
- **Android:** no APK/AAB was built or signed against this baseline. Last recorded signed release remains v1.1.14, not re-verified against current main.
- **Deletion/data safety:** no files, branches, migrations, tables, rows, buckets, storage objects, indexes, OAuth credentials or social posts were deleted or mutated. No migration was replayed. No module is closed; no FINAL BASELINE READY claim.

### Next checkpoint
1. Retrieve/reproduce the failing CircleCI `source-verify` job on the exact head and fix only a confirmed cause; the GitHub Quality Gate run must finish first.
2. Continue from the newly read `src/lib` group with consumer/dynamic-reference tracing and risk-specific tests, beginning with `env.ts`, Supabase clients/guards, auth helpers, proxy and workflow dispatch.
3. Continue OAuth callback/credential integration and the social-video retention worker trace; keep the nine missing Cloudinary references untouched pending verified restore/replacement.
4. Keep owner-gated items open: leaked-password protection, invalid/revoked provider token reauthorization, browser/admin acceptance, mobile device acceptance and any irreversible storage/data action.

**State: IN PROGRESS. No modules closed.**

  
## Additional checkpoint — 2026-11-10 13:35 Africa/Cairo

- **Admin health defect fixed in PR #275:** `src/lib/services/api-health.ts` awaited `assertSupabaseConnection()` but discarded its boolean return, so a false data-plane probe was incorrectly reported as `ok`. Commit `32606b903c4628226a8ef4cbf60a940d055dc61a` adds a pure status mapper and unit test; `fe5112dae122b038c5e90dc0cd8a4c4da33bb665` removes an unused type import. The test is added to `pnpm test`, and `scripts/verify-admin-health.mjs` enforces propagation. No live health probe was triggered by this edit.
- **Supabase auth boundary traced:** all seven discovered `requireSupabaseAuth()` route consumers delegate to feature services that call `supabase.auth.getUser()` and scope user data by that identity. The helper itself is only a provider-availability check, not an authentication guard; PR #275 clarifies this, and clarifies that `requireSupabaseAdmin()` is not RBAC. No authorization bypass was found in those seven traced routes. The admin helper has no discovered consumer; it is retained pending dynamic-reference review.
- **Supabase client ownership traced:** `src/lib/supabase/server.ts` is the Next server module (Next headers, service-role REST, validated table/filter names); `src/lib/supabase/admin-rest.ts` is a distinct Node/worker-safe client used by jobs. They are not duplicate implementations. No Edge-runtime route importing `server.ts` was found in the code search. The worker-safe `supabaseServerAdminCount` export has no discovered external consumer but is not deleted.
- **Storage helper remains open:** `src/lib/services/storage.ts` is server-only and relies on Storage RLS for owner-path enforcement. Storage-schema policies and every signed-URL caller still need a full audit before changing this path.
- **Current PR head:** `fe5112dae122b038c5e90dc0cd8a4c4da33bb665`, PR #275 remains draft/open and unmerged. Earlier head `1a522cd` passed GitHub Quality Gate, but CircleCI `source-verify` failed; later commits have not yet reported final CI results. Do not infer success from the earlier head.
- **Progress:** inventory 1,639 files / 491 directories; full source-content evidence remains 92/1,639; 1547 REVIEW_REQUIRED; modules closed 0. New helper/test files in this PR are supplemental and do not alter the main-baseline manifest until merged.

**State: IN PROGRESS.**


## Additional checkpoint — 2026-11-10 13:45 Africa/Cairo

### Source of truth and progress
- Re-resolved Vercel project `zikr` under team `team_RxPjmgZoSFmKGjScefYmwIVv`; it is linked to `zikrofficial-X/Zikr`. The connected Supabase project is `zqtssvlvmkzeeyqghqfk`, matching the repository configuration and production environment metadata.
- Main baseline remains `main@c91f64ccd6162e5107b3edb8be3c7aa521865c2f`. Production deployment `dpl_7Czpzb6ckFDezvMbAFaih8WYuk9E` is READY on that SHA with the `zikrmediaofficial.vercel.app` alias. No production deployment was initiated.
- Main manifest remains 2,130 tracked entries: 1,639 files, 491 directories. The PR branch tree at checkpoint is 2,139 entries: 1,648 files, 491 directories; its two new files are not part of the main-baseline manifest until merge.
- File matrix now records 117/1,639 full source-content reads (7.1%), 1,522 REVIEW_REQUIRED (92.9%), 99 CONTENT_READ_PENDING_TRACE, 10 FIXED_PENDING_CI, and 8 TEST_UPDATED_PENDING_CI. Automated inventory coverage is 100%; modules closed remain 0. No file is marked complete from static presence alone.
- PR #275 remains draft/open/unmerged, 48 changed files and 81 commits at the checkpoint. Head before this ledger update: `46a8b66c27c9b5c7c771c3e97794854e3b3f1ac7`.

### Storage/RLS defect found and repaired in the PR branch
- Full source reads covered `src/lib/services/storage.ts`, all three static route consumers, `supabase/config.toml`, the relevant active/archive migrations, and the migration replay validator.
- Live `storage.objects` policies cover public-assets, site-audio and videos, but none cover the user-managed `avatars`, `media`, `audio`, or `documents` buckets. The authenticated presign route uses the session client and owner-prefixed paths, so those uploads/downloads were denied by RLS. Bucket visibility and limits were not changed.
- Added forward-only migration `20261110115000_restore_owner_scoped_user_storage_policies.sql` with authenticated owner-path SELECT/INSERT/UPDATE/DELETE policies for those four buckets only. Commit: `87c058fd28d7e32553ac4b26321fe1310bcc08e2`. It is not applied to production; live migration history remains 415/415 at latest version `20261110085520`.
- Corrected the storage helper to enforce per-purpose MIME allowlists matching live bucket configuration and to report Supabase's fixed 7,200-second signed-upload URL lifetime instead of the caller-supplied 300/900-second value. The admin video route no longer passes an unsupported 900-second override. Final helper correction commit: `376b3587ca735cb49e0c9154c7a6c83237a5ebac`; route commit: `acfdc60791d8cd56c0a9a4383c3e9e34ce19b9f7`.
- Added `scripts/tests/storage-service-contract.test.ts` and wired it into `pnpm test` (test commit `ffa40ce20aae5f6edef2d3f778e8dcaaa9a7c2ed`; package commit `5b6434e4fc6c626269bef39347685d1d18311dfa`). Migration replay and the test are pending CI. No production migration or Storage object was changed.

### Video/social queue containment and written-post visibility
- Read-only Cloudinary inventory checks confirmed that nine approved, non-published social queue rows reference nine missing `auto-*` Cloudinary video public IDs. The 2026-11-10 09:37:58Z scheduled publisher run `42792340735` recorded five Facebook Reels HTTP 422 failures with only a generic “Meta upload response did not confirm success” detail. The exact provider-side reason/trace body is unavailable; the missing source assets are a strong, independently verified cause, but no provider response body was available to prove the exact 422.
- To prevent automatic retries against missing media, a reversible queue hold was applied to exactly those nine approved rows. Three queued rows became failed, three partial rows remain partial, and three failed rows remain failed. All received `sourceMediaMissing=true`, `permanentFailurePlatforms=[facebook_reels]`, and a future `scheduled_at` hold until 2099-01-01. Existing YouTube remote IDs were preserved. Audit event: `5de18dd5-8bcc-4784-a471-e1c7821405dc`. No provider call, requeue, regeneration, or social post was created by this action.
- The one newer partial row with an active Cloudinary asset and successful YouTube remote ID `xdVYEEr7bhQ` was left untouched; Facebook was previously cooldown-deferred. No manual retry was triggered. Current queue snapshot: 77 published videos, 4 partial videos, 6 failed videos, 10 queued written posts, and 1 published written post (98 rows total); no video rows remain queued.
- The dedicated written-post studio already existed at `/admin/social/written-studio`, requires `social.manage`, and is present in the admin navigation. The main social dashboard previously lacked a direct entry point; PR #275 now adds a prominent link with a count of unpublished `written_post` rows. Commits: `ac9bd72cb36897472e37a3a1781d0b7659a3a360` and verifier update `70019f928aba23e4516f6d485ca1261287fbe9fa`. The API returns the latest 100 written posts; its generation POST requires both `social.manage` and `social.publish`. Ten written posts are currently queued. No generation request was dispatched.

### Service, CI and release state
- Supabase: 415 live migrations, latest `20261110085520`; 92/92 public tables have RLS; nine Storage buckets and zero Storage objects; four cron jobs (three active); security advisor warns that leaked-password protection is disabled; performance advisor reports 89 unused-index candidates; health advisor returned no findings. No indexes or production policies were removed.
- GitHub checks on checkpoint head `46a8b66`: CircleCI config-guard passed (run 4389); source-verify (4388) and application-build-docs (4387) were pending; ZIKR Quality Gate run 42812689522 was in progress. A prior source-verify run (4358) failed on earlier head `6e1845a`; its detailed log was not available through the connected tools. Do not merge while the current source-verify/build checks are pending.
- No Vercel Preview deployment exists for the PR branch. Creating a Vercel sandbox was blocked by the team's storage quota; the local container could not resolve GitHub DNS, so no local install/build/lint/typecheck was claimed. GitHub CI remains the required execution evidence.
- Android signing/build was not run. No APK/AAB is claimed. No files, branches, migrations, buckets, Storage objects, indexes or social posts were deleted. No production deployment or migration apply was performed.

### Next checkpoint
1. Resolve the CircleCI source-verify failure using the actual failed step output when available; wait for current source-verify, application-build-docs and full Quality Gate before merge.
2. Run migration replay and the new Storage contract test in CI, then apply the forward migration only after merge and verify authenticated owner uploads/downloads in a browser.
3. Restore the nine missing media assets only from a verified backup or approved regeneration source; keep their queue rows blocked until media is restored and remote-post state is reconciled.
4. Complete authenticated browser acceptance for written studio/social dashboard and role-based navigation; do not trigger generation or publishing during acceptance.
5. Continue from the first remaining REVIEW_REQUIRED operational files. Android/device and remaining product-module acceptance are still open.

**State: IN PROGRESS. No modules closed. No FINAL BASELINE READY claim.**


### Storage testability refinement — 2026-11-10 13:45 Africa/Cairo
- Extracted the pure bucket/path/MIME/TTL contract to `src/lib/services/storage-contract.ts` so the contract test does not import the server-only Supabase client module. The server integration re-exports the same helpers; existing route imports remain compatible.
- Commits: pure contract `8dbeebb0440ed9da62c0b973e94e40bac7c20d3c`; server integration `c7c78c22cf545ccbccddc3747171c9453235f7b0`; test import `93cdeb03f166ca8ecafed4c7c6d0939799d89699`.
- PR tree is now 2,140 entries: 1,649 files and 491 directories. The main baseline remains 1,639 files; coverage remains 117/1,639 and 1,522 REVIEW_REQUIRED. The pure contract, forward migration and test are supplemental PR paths, not yet part of main.
- PR #275 head at this refinement: `241840744a606e42519b7f0e9c9930363651c7e0`; draft/open/unmerged. CI must run against the final head.



## Safety follow-up — 2026-11-10 16:18 Africa/Cairo

### Current verified baseline and CI correction
- Repository identity remains `zikrofficial-X/Zikr`; production project `zikr` is linked to Supabase `zqtssvlvmkzeeyqghqfk`.
- Production remains `dpl_7Czpzb6ckFDezvMbAFaih8WYuk9E` on `main@c91f64ccd6162e5107b3edb8be3c7aa521865c2f`; no production deployment or database migration was run.
- PR #275 current base is `c91f64c`; its branch has 143 commits and 65 changed files. The existing manifest header is stale (captured at `8133aab`, 2,144 tree entries/1,653 files) and must be regenerated at the final head. The main baseline remains 2,130 entries/1,639 files/491 directories.
- The tracked-file matrix still records only 117/1,639 main files as full source-content reads (7.1%); 1,522 remain REVIEW_REQUIRED. Inventory is not a substitute for file-level review; no modules are closed.
- The failing Quality Gate log identified a stale assertion in `scripts/tests/video-contract.test.ts`: it expected the Cloudinary host check to remain inline in `videos.ts` after validation moved to `video-media-contract.ts`. Updated the test to assert delegation and the shared HTTPS/Cloudinary allowlist. Commit: `65392967fad877502118d44f24ddeae87060c6d8`. CircleCI was re-triggered by that branch update; final status must be checked on the new head.

### New P0 queue-safety gap found and patched on the PR branch
- The containment audit event `5de18dd5-8bcc-4784-a471-e1c7821405dc` still identifies nine source-media-missing rows (six failed, three partial); all nine retain non-null historical media URLs and `sourceMediaMissing=true`. No rows were republished or requeued.
- Source review found a bypass: `retry_all_failed`/manual retry could set a held row back to queued; Facebook reauthorization could also release it because the recovery policy did not check `sourceMediaMissing`. The worker selector and video-approval path likewise lacked a universal source-media hold.
- Added fail-closed checks to platform availability, queue selection, video approval, Facebook auth recovery and admin retry actions. Retry responses now report `sourceMediaMissingSkipped`; publish-now diagnostics identify the missing source explicitly. Regression coverage added for worker selection, retryability and Facebook reauthorization.
- Found a second scope gap in `video-purge`: the file-only scope checked queue rows with non-null `video_url`, but the broader generation-reference guard ran only for memory scope. Changed the guard so file-only and memory cleanup both stop on any non-published video queue reference, including rows without `video_url`. Updated the purge contract test.
- These are code/test changes on the PR branch only. They do not mutate the live queue, call social providers, delete assets or change production settings. New head CI and Vercel Preview validation are required before merge.

### Fresh downstream observations
- Supabase migration history remains 415/415; public tables 92/92 have RLS; six current Storage policies cover public-assets, site-audio and videos. The four owner-scoped policies in the PR migration are absent from production and remain pending; no migration was applied.
- Current Facebook credential row is enabled/connected with no stored error code; last validation `2026-11-10 08:36:36 UTC`. YouTube OAuth row is present with read-only, upload and analytics scopes; no token value was read.
- Current queue snapshot: nine held video rows (six failed, three partial), zero queued video rows, ten queued written posts and one published written post. The nine held rows have `sourceMediaMissing=true`; none is marked auth-blocked at this snapshot. 112 generation requests are completed; 48 have Cloudinary URLs and 64 have no `video_url` (these 64 are not assumed to be all broken without cross-table reconciliation).
- Vercel Production is READY on the main SHA. A fresh runtime event at `2026-11-10 14:09:32 UTC` recorded `ETIMEDOUT` while reading a hadith detail page. `src/features/hadith/services/hadith.ts` catches Supabase read failures and falls back to the external Hadith API; this is a resilience warning, not proof that the page failed. Supabase logs for 14:00–14:18 UTC contained 45 Postgres records: 44 LOG/00000 and one ERROR/42703, not yet tied to a concrete application query.
- Vercel environment metadata shows 17 sensitive variables target Preview and 13 target Development. No values were decrypted or changed. Preview still shares the production Supabase URL; environment isolation requires explicit approval.

### Remaining gates
1. Confirm the new PR head's CircleCI Source Verify, Application Build, and GitHub Quality Gate all pass.
2. Review the new queue-hold and file-only purge guards on the exact final head; then obtain a Vercel Preview isolated from production before merge.
3. Reconcile and restore/rebuild the nine missing media assets while preserving successful remote YouTube IDs; do not dispatch retries until media and external publication state are verified.
4. Regenerate the PR manifest and continue the remaining file-content review. Current 117/1,639 source reads are not full-project review.
5. Keep the owner-scoped Storage migration, Preview secret isolation, Auth hardening, branch protection and all destructive cleanup behind their existing approval gates.

**State: IN PROGRESS / CRITICAL. No production data, secrets, OAuth settings, domains, Storage objects, Cloudinary assets, branches or releases were modified.**


## CI correction — 2026-11-10 16:28 Africa/Cairo

- The new full-scope Quality Gate reached `social-platform-isolation.test.ts` and exposed one missed guard: `getRetryableSocialPlatforms()` still returned an independent YouTube target for a row flagged `sourceMediaMissing`. The failing assertion was explicit; the provider was not called.
- Added the same fail-closed `sourceMediaMissing` guard directly to `getRetryableSocialPlatforms()`. This complements the worker selector, platform attempt gate, video approval, admin retry skip and Facebook reauthorization guard.
- No production queue row, social provider, asset, secret, OAuth setting, database object or deployment was changed. The new commit must pass the complete Quality Gate and CircleCI checks before any merge decision.
