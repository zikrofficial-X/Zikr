# ZIKR — Current Project Status

## Latest verified checkpoint — 2026-11-10T17:54:24.231Z

**Audit state: IN PROGRESS. This is not a FINAL BASELINE READY certification.**

- Canonical GitHub repository: `zikrofficial-X/Zikr`, branch `main`, baseline `ab0bd0e7ad5e5dd2d86250ed0b63ae257dc237b4`. Recursive tracked-tree inventory: 2152 entries, 1661 files, 491 directories, 139706706 bytes; API response not truncated. Delta from previous baseline: +4 files, 37 modified existing blobs, 0 removed files. Route inventory by file names: 142 App Router pages and 80 route handlers; 19 GitHub workflow files; 64 test-related files.
- Automated inventory coverage is 1661/1661 (100%); minimum documented full source-content reads are 132/1661; 1508 files remain `REVIEW_REQUIRED`; modules closed: 0. The inventory is not a claim that every file has been manually reviewed.
- Vercel team `zikr3` / project `zikr` is linked to `zikrofficial-X/Zikr`. Latest production deployment `dpl_4ZyKHwS2rStF3MDURJ3E2rLxDM7h` is READY on `faf16ea2450ab22f44c336161cd841806d97bbe6`. Main is one CI/release-contract-only commit ahead; no app source change is waiting for deployment. `/api/health`, `/`, `/videos`, `/kids`, and `/hadith` returned HTTP 200.
- Main CI: CircleCI config-guard, source-verify, application-build-docs, android-release-draft and Vercel check all SUCCESS. PR #306 merged into main at `ab0bd0e7ad5e5dd2d86250ed0b63ae257dc237b4` after its corrected branch filters and all required CI checks passed. PR #307 is the open Android release-draft single-owner repair; audit added its branch to both CircleCI source/build filters in `bb4ceea1b4ce895a2cfdcc408f107dabd76fcc24`. Current PR #307 head `9a15b6d982b879170392f0b96c98e4de7e3cb149` has config-guard, source-verify and application-build-docs pending. Its prior head failed on stale release-contract assertions, now changed to require Admin Release ownership. Owner review remains required.
- Supabase `zqtssvlvmkzeeyqghqfk` is ACTIVE_HEALTHY. Live migration ledger: 418 versions, latest `20261110170000`, matching 418 migration files on main. Public schema: 92 tables, all 92 RLS-enabled; 211 policies; 53 public triggers; 40 public functions; 20 SECURITY DEFINER functions, 0 unpinned search_path; 9 storage buckets, 0 objects, 10 storage-object policies.
- Video catalog: 130 rows (83 published, 47 hidden). Generation requests: 117 total (115 completed, 2 cancelled); 64 completed requests have no video_url, but all 64 match a catalog row by `videoGenerationRequestId` and `contentHash`. Of these, 58 previously public rows were restored with verified YouTube fallback and 6 remain hidden. The 64 original Cloudinary masters remain unavailable; 11 active `auto-*` assets are newer renders and do not prove recovery of the old masters.
- Social queue: 82 published, 9 queued, 4 partial, 6 failed. All 6 failed and 3 partial records report the approved source video missing from Cloudinary; the 4 partial rows target YouTube + Facebook Reels, the 6 failed rows are Facebook Reels, and the 9 queued rows are Facebook written posts. Do not replay or republish them blindly.
- Vercel runtime errors: 8 intermittent `fetch failed` events in the last 24 hours, latest 17:32 UTC on current production, with `ETIMEDOUT` / `UND_ERR_SOCKET` causes across home, Hadith and admin routes. Trace lookup was unavailable, so the upstream caller is not proven. Two missing-service-role errors came from historical Preview deployment `dpl_9jg1eFabED8NUuv7jEcFVbQRdAFY`, not current production.
- Android `v1.1.15` remains a draft. The immutable tag points to `faf16ea2450ab22f44c336161cd841806d97bbe6`; one draft contains APK/AAB and checksum/metadata assets, while a second empty draft exists for the same tag. PR #307 makes Admin Release the sole creator and fails closed on duplicate drafts; the empty duplicate must be resolved by the release owner before the post-merge Android draft gate can pass. No draft was published or deleted; `v1.1.14` remains latest published.
- Three Supabase cron jobs are active; the legacy YouTube/Facebook sync cron is inactive. No cron state changed.
- This run fixed malformed CircleCI branch filters on PR #306 (now merged), added the PR #307 branch to both source/build filters, diagnosed and recorded its stale release-contract assertion failure, refreshed the recursive manifest/matrix and reconciled live video/social state. No production migration, database record, Storage object, Cloudinary asset, external post, Android release, or production deployment changed; files deleted: 0.
- Remaining blockers: exact original Cloudinary media recovery for 64 masters; safe reconciliation of 9 blocked social rows; root-cause trace for 8 transport errors; PR #307 CODEOWNERS review and current CI completion; owner resolution of one duplicate empty Android draft; authenticated Storage owner-session acceptance; full source/dependency/browser/device review and closure of all `REVIEW_REQUIRED` rows.

## Current verified checkpoint — 2026-11-10T16:01:46.706Z

**Audit state: IN PROGRESS. This is not a FINAL BASELINE READY certification.**

- Canonical main: `035ea4568572eea36c82b79b1e9cd212113e8e32` (PR #275 merged). Recursive inventory: 2148 entries, 1657 files, 491 directories, 139372949 file bytes. The refreshed matrix and manifest record this exact pre-documentation main baseline.
- Vercel production is READY on older commit `c91f64ccd6162e5107b3edb8be3c7aa521865c2f`; main is ahead and the manual `RELEASE` gate remains untouched. Main CI has all four required contexts passing.
- Supabase `zqtssvlvmkzeeyqghqfk` is ACTIVE_HEALTHY with 417/417 applied migrations matching main, 92/92 public tables RLS-enabled, 211 public policies, 45 public triggers, 40 public functions, 20/20 SECURITY DEFINER functions with pinned search_path, 10 storage-object policies, 9 buckets and 0 storage objects.
- The PR #275 owner-scoped storage migration is live; its four new policies are present, but authenticated owner upload/read/delete acceptance is still pending. The PR #275 video-catalog restore migration is also live but restored zero rows because the old purge lacked explicit provenance.
- New read-only production evidence proves 58 of 105 purged generated videos (50 general, 8 Kids) were site-published and socially published before the exact purge event, had Cloudinary media disposed before it, were updated inside its timestamp window, match request hashes/provider IDs, and passed QA. PR #281 prepares a fail-closed, idempotent forward migration to restore only those 58; it is not applied. The other 47 remain hidden.
- Live offline datasets: all 25 PR #280 dataset counts exactly match Supabase, including `public.quran_tafsir=6236`. PR #280 corrects source metadata and adds stale/source consistency validation.
- Video/social queue: 112 generation requests completed (64 lack `video_url`); 80 social jobs published, 9 written-content jobs queued, 3 partial, 6 failed. No provider retries or external posts were triggered.
- PR #278's optional Facebook feed guard has all three CircleCI checks passing; exact-head Preview is pending. PR #279 native-ad exclusion and PR #280 offline snapshot are awaiting remaining source/build checks. PR #281 has all three CircleCI checks passing; PR #283's full content/SQL scan has config-guard passing with source/build pending.
- Production runtime logs still show seven Supabase transport failures and two missing-service-role errors on the old PR #275 Preview, plus one rejected Meta token attempt. The Preview-only missing-key case is addressed in PR #278 but not yet revalidated on a new Preview.
- Android v1.1.14 remains the latest published release. No new APK/AAB, production deployment, social post, production data deletion, or file deletion was performed.
- Progress: 100% automated inventory coverage; at least 129/1,657 full source-content reads; 1,507 files still `REVIEW_REQUIRED`; 0 modules closed. The cumulative audit remains open.

## Latest execution checkpoint — 2026-11-10 17:18 Africa/Cairo

**Audit state: IN PROGRESS. Not a final certification.**

- Production identity reverified: `zikrofficial-X/Zikr@c91f64c`, Vercel `zikr` deployment `dpl_7Czpzb6ckFDezvMbAFaih8WYuk9E` READY on that exact main SHA, Supabase `zqtssvlvmkzeeyqghqfk` ACTIVE_HEALTHY.
- PR #275 code snapshot: `3f4e1e60670c27382a957151ad3c35029b8b7b48`; recursive tree 2,148 entries, 1,657 files, 491 directories. Main baseline remains 2,130 entries, 1,639 files, 491 directories. No tree truncation.
- Fixed duplicate recovery provenance and repeated-purge idempotence; commits `564c002`, `6773c27`, `838297d`, `30b17ad`, `b063524`, `5e89550`, `e3baf37`.
- Fixed five malformed Arabic strings in the shared editorial-depth component. Expanded the content-integrity scanner from two subtrees to all `src`, so shared components and libraries are covered. Commits `3dadca1` and `3f4e1e6`; current-head CI is still required.
- CI had not yet populated on the latest head at the time of this checkpoint. The preceding head had config-guard PASS, source-verify and application-build-docs PENDING, and GitHub Quality Gate IN PROGRESS. Do not merge until all checks pass on the exact latest head.
- Live Supabase: 415 migrations; 92/92 public tables with RLS; 211 policies; 66 foreign keys; 45 non-internal triggers; 40 public functions; 20 SECURITY DEFINER functions all pinned to search_path; 9 buckets, 0 objects; 4 cron jobs (3 active); 4 Edge Functions active. Health Advisor clear; one Auth warning for leaked-password protection disabled; 89 unused-index advisories. No migration or production data change.
- Video/social: 127 videos (22 public, 105 hidden); 112 completed generation requests, 64 without a video URL; 9 non-published social video rows remain held for missing media; 10 queued rows are written posts. No retries or public posts were triggered.
- Vercel 24-hour errors: 7 intermittent Supabase socket/TLS fetch failures (latest 14:09 UTC) and one historical rejected Meta Server Token event. No speculative code change.
- No Preview is safe for authenticated writes because it shares production-backed credentials; production remains on main. Android v1.1.14 remains the last verified release; no artifact from current main was produced.
- Full review remains incomplete: 129/1,639 main files have full source-content reads recorded; 1,509 were REVIEW_REQUIRED before this checkpoint; modules closed = 0. The PR manifest and matrix were refreshed to the current code snapshot.
- No production migrations, data, media, indexes, buckets, external posts, branches or tracked files were deleted or changed in this run.


## Latest execution checkpoint — 2026-11-10 17:14 Africa/Cairo

**Audit state: IN PROGRESS. Not a final certification.**

- Production identity reverified: `zikrofficial-X/Zikr@c91f64c`, Vercel `zikr` deployment `dpl_7Czpzb6ckFDezvMbAFaih8WYuk9E` READY on that exact main SHA, Supabase `zqtssvlvmkzeeyqghqfk` ACTIVE_HEALTHY.
- PR #275 code snapshot: `e3baf37d5c503f454b19ba1f6116a3e0ea639c1d`; recursive tree 2,148 entries, 1,657 files, 491 directories. Main baseline remains 2,130 entries, 1,639 files, 491 directories. No tree truncation.
- New PR fixes: duplicate recovery requires evidence that an existing purged catalog row was public before purge; repeated purges preserve that evidence. Commits: `564c002`, `6773c27`, `838297d`, `30b17ad`, `b063524`, `5e89550`, `e3baf37`. Regression tests were updated; current-head CI remains pending.
- CI on the code snapshot: CircleCI config-guard PASS; source-verify and application-build-docs PENDING; GitHub Quality Gate IN PROGRESS; CircleCI Config Validation PASS. Do not merge until all checks pass on the resulting exact head.
- Live Supabase: 415 migrations, 92/92 public tables with RLS; Health Advisor clear; one Auth warning for leaked-password protection disabled; 89 unused-index advisories. No migration or production data change.
- Video/social: 127 videos (22 public, 105 hidden); 112 completed generation requests, 64 without a video URL; 9 non-published social video rows remain held for missing media; 10 queued rows are written posts. No retries or public posts were triggered.
- Vercel 24-hour errors: 7 intermittent Supabase socket/TLS fetch failures (latest 14:09 UTC) and one historical rejected Meta Server Token event. No speculative code change.
- No Preview is safe for authenticated writes because it shares production-backed credentials; production remains on main. No Android artifact from current main was produced.
- Full review remains incomplete: 129/1,639 main files have full source-content reads recorded; 1,509 remain REVIEW_REQUIRED; modules closed = 0. The PR manifest and matrix were refreshed to the current code snapshot.
- No production migrations, data, media, indexes, buckets, external posts, branches or files were deleted or modified in this run.


## Additional verified fix — Android release publishing gate (2026-11-10)

PR #275 now fixes a second release-control defect. The Android asset publisher previously allowed a recovery branch to run without the explicit retry input and skipped the full CircleCI prerequisite check on manual retries. It now resolves the exact immutable tag target for every path, requires `workflow_dispatch` plus `retry=true` for recovery branches, and waits for all required CircleCI contexts and the latest `ZIKR / Quality Gate` on that exact source commit before publishing. The combined commit status must also be successful.

Commits: `4ee6a5b` (workflow gate), `e6f7e3b` (release-contract and CI-architecture tests, fail-fast combined status). No Android release workflow was dispatched. The existing `v1.1.14` release remains unchanged.

PR #275 code head at that checkpoint: `e6f7e3baf8c6ad904a0082e67c5740c2a3ed9a5a`; 58 changed files; still Draft. CircleCI source-verify 4459 and application-build-docs 4460 are pending; config-guard 4461 passed; GitHub Quality Gate 42824891836 is queued; CircleCI Config Validation 42824891750 is in progress. Do not merge until all checks pass on the exact current head.

## Previous verified checkpoint — 2026-11-10 15:08 Africa/Cairo

**Audit state: IN PROGRESS. This checkpoint is not a FINAL BASELINE READY certification.**

- Main production source remains `zikrofficial-X/Zikr@c91f64ccd6162e5107b3edb8be3c7aa521865c2f`. Vercel project `zikr` is READY on the exact main SHA; Supabase `zqtssvlvmkzeeyqghqfk` is `ACTIVE_HEALTHY`.
- Recursive main inventory: 2,130 entries (1,639 files, 491 directories), not truncated. The matrix classifies 128/1,639 files; 1,511 remain `REVIEW_REQUIRED`. No module is closed. PR #275 has 1,649 files, 491 directories, 10 added paths, no removals and 56 changed files; it remains Draft.
- PR #275 now contains three safety hardening commits: `c93eae7` (strict Supabase DB endpoint/role/TLS validation and canonical guarded tafsir restore), `73a5e99` (least-privilege analytics-only social insights workflow), and `695aacf` (CI-gated, stale-SHA-safe production release that cannot be cancelled mid-migration).
- Exact current PR CI is not complete: CircleCI source-verify 4448 and application-build-docs 4447 pending; config-guard 4449 pending; GitHub Quality Gate 42823397094 pending. PR must remain unmerged until all checks pass on the same head.
- Supabase: 415 migrations (latest `20261110085520`), 92/92 public tables with RLS, 211 policies, 45 triggers, 9 buckets, 0 Storage objects. Security Advisor: leaked-password protection disabled. Performance Advisor: 89 unused-index candidates. Health Advisor: no findings. No production DB writes or migrations were made.
- Live content snapshot: 6,236 Quran ayahs/tafsir rows, 2,964 hadiths, 113 articles. Video catalog 127 rows (22 published, 105 hidden); 112 completed generation requests, 64 without a recorded video URL. Social queue 98 rows: 79 published, 6 failed and 3 partial video items with missing source media, and 10 queued written posts. Content queue 121 published; insights 148 (72 Facebook Reels, 76 YouTube).
- Android `v1.1.14` is still the published release from older SHA `d055980...`; no signed APK/AAB from current main was produced in this run. No production deployment or external social post was made.
- Remaining blockers: missing source media for 9 video queue rows; 64 completed requests without video URLs need reconciliation; CI pending; no isolated safe Preview; Storage owner-policy migration awaits controlled release; leaked-password protection needs owner-level decision; current-main Android release pending.

**Production branch:** `main`  
**Last reconciled:** 2026-11-10 15:08 Africa/Cairo  
**Repository:** `zikrofficial-X/Zikr`  
**Production origin:** `https://zikrmediaofficial.vercel.app`

## Current verified checkpoint — 2026-11-10 14:59 Africa/Cairo

**Audit state: IN PROGRESS. This checkpoint is not a FINAL BASELINE READY certification.**

- Latest verified PR #275 audit head before this documentation refresh: `1b49ff8e236a6cb6a6a424e7c102251db45baeba`. CircleCI source-verify 4427, application-build-docs 4426, config-guard 4428, GitHub Quality Gate 42819681898, and CircleCI Config Validation 42819681906 passed. PR remains Draft and unmerged.
- Main remains `c91f64ccd6162e5107b3edb8be3c7aa521865c2f`. Production Vercel deployment `dpl_7Czpzb6ckFDezvMbAFaih8WYuk9E` is READY on that exact SHA; `/api/health` and 10 sampled routes/APIs returned HTTP 200. This is not exhaustive browser/device acceptance.
- Supabase remains `ACTIVE_HEALTHY`, with 415/415 unique migrations. Security Advisor reports one leaked-password-protection warning; Performance Advisor reports 89 unused-index candidates; Health Advisor has no findings. No database or Auth changes were made.
- Video/social queue: 78 published, 6 failed, 3 partial. All 9 non-published rows are marked `sourceMediaMissing`; exact Cloudinary public-ID searches returned zero active assets for all nine. No asset/version identifiers were available for safe backup restore. No retry, regeneration, provider call or public post was made.
- Vercel environment inventory: 55 records / 50 unique names; 17 sensitive-type variables include Preview and 13 include Development. Values were not decrypted. No custom environments are available, so the Preview environment remains production-backed and unsafe for write tests. Sandbox creation was blocked by HTTP 402 Snapshots Storage quota.
- Android's last verified published release is still `v1.1.14` on the older `d055980` baseline; no signed APK/AAB for current main was built in this run.
- File inventory remains 1,639 files / 491 directories with 100% automated manifest coverage. Full source-content reads: 122/1,639; full manual/functional reviews: 5/1,639; modules closed: 0; safe deletions: 0.
- No production data, media, credentials, environment values, migrations, policies, indexes, or social posts were modified. No files were deleted.


## Historical checkpoint — 2026-11-10 14:48 Africa/Cairo

**Audit state: IN PROGRESS. This checkpoint is not a FINAL BASELINE READY certification.**

- GitHub main remains `c91f64ccd6162e5107b3edb8be3c7aa521865c2f`; active PR #275 is Draft at `8f835e824bb4f848e0304294a04464d8c08903bf`. The PR-only test fix isolates `YOUTUBE_CHANNEL_ID` for the no-override test; CircleCI 4415/4414/4416 and GitHub Quality Gate 42818371121 all passed on this exact head. No runtime OAuth code changed.
- The PR remains unmerged. No matching Vercel Preview exists; Preview uses production-backed integrations. Vercel Sandbox creation was blocked by the team's exhausted Snapshots Storage quota (HTTP 402), so no isolated sandbox run was possible. Do not merge until an isolated/read-only Preview strategy and full diff review are complete.
- Production Vercel deployment `dpl_7Czpzb6ckFDezvMbAFaih8WYuk9E` is READY on main. `/api/health` reports the same main SHA. Ten sampled routes/APIs returned HTTP 200: `/`, `/quran`, `/hadith`, `/adhkar`, `/prayer-times`, `/kids`, `/videos`, `/api/kids/videos`, `/api/quran/surahs`, and `/api/hadith/books`.
- Supabase remains `ACTIVE_HEALTHY`. Live migration ledger is 415/415 unique versions. Security Advisor: one warning for disabled leaked-password protection; Performance Advisor: 89 unused-index candidates; Health Advisor: no findings. No database or Auth changes were made.
- Video/social queue now reports 78 published, 6 failed, 3 partial video rows. All 9 non-published rows carry `sourceMediaMissing` and remain held; no media recovery, retry, regeneration, or public publishing was attempted.
- Current inventory baseline remains 1,639 files / 491 directories; full content reads advanced from 3 to 5/1,639 for this ledger's manually reviewed set (the manifest and file matrix still cover the full tracked tree automatically). Modules closed: 0. No files deleted.


## Historical checkpoint — 2026-11-10 11:38 Africa/Cairo

**Audit state: IN PROGRESS. This checkpoint is not a FINAL BASELINE READY certification.**

- **GitHub source of truth:** `zikrofficial-X/Zikr`, branch `main`, commit `c91f64ccd6162e5107b3edb8be3c7aa521865c2f`. GitHub reports the `main` branch as unprotected; this audit did not change repository protection settings.
- **Recursive inventory:** 2130 entries (1639 files, 491 directories, 138209705 file bytes), complete and not truncated. The refreshed matrix contains 1639 file rows; automated tree coverage is 100%, but functional/manual review remains 0/1639. The delta from the prior 1,631-row matrix is 9 new paths and 1 removed path(s). The removed root `proxy.ts` is replaced by canonical `src/proxy.ts`.
- **Routes:** 142 App Router pages and 80 `route.ts` handlers are present. The shared route baseline is being updated from 79 to 80 because `src/app/api/kids/videos/route.ts` is now present; the route verifier is being updated to require that route.
- **Vercel:** project `zikr` (`prj_bnBQb7DIXB5iE2mZJAghtAoZuKGs`) is linked to this repository. Production deployment `dpl_7Czpzb6ckFDezvMbAFaih8WYuk9E` is READY on the exact `c91f64ccd6162e5107b3edb8be3c7aa521865c2f` main commit, with aliases `zikrmediaofficial.vercel.app`, `zikr-zikr3.vercel.app`, and `zikr-git-main-zikr3.vercel.app`. No production deployment was triggered by this audit.
- **Supabase:** project `zqtssvlvmkzeeyqghqfk` is ACTIVE_HEALTHY on PostgreSQL 17. Local and live migration ledgers both contain exactly 415 unique versions, latest `20261110085520`; there are no missing or extra versions. Live public schema has 92/92 tables with RLS enabled, 211 policies, 45 triggers, 40 public functions (20 SECURITY DEFINER), and no direct `anon` or `authenticated` EXECUTE grants on those 20 functions. Nine extensions are installed; four Edge Functions are active; four pg_cron jobs exist (three active, one disabled).
- **Supabase operations:** nine Storage buckets currently contain zero objects. This is consistent with the current architecture: all 19,608 `quran_audio` rows are external MP3Quran URLs with no Supabase storage paths; all 30 `site_audio_assets` use `curated:` keys resolved to Cloudinary; Android binaries are delivered from GitHub Releases, not Supabase Storage. Cloudinary inventory confirms 30/30 curated audio assets exist. The scheduled storage-retention run `42746805266` completed with zero video candidates and zero Android copies, so it deleted nothing. The disabled `zikr-youtube-facebook-sync` cron entry still references the retired project host `ymxdswkaxafakugktsim`; it remains disabled and was not modified. A historical 2026-11-01 snapshot for that former project records 148 storage objects, but the former project is not the Vercel-linked project and was not accessible through the current connector; no restore or deletion was attempted. Security Advisor warns that leaked-password protection is disabled. Performance Advisor reports 91 unused indexes; no index was dropped because usage history and workload evidence are insufficient.
- **Video/social incident:** the live purge audit event at 2026-11-10 08:35:56 UTC records 44 Cloudinary MP4 assets deleted (212,392,150 bytes), 105 generated catalog rows hidden, social queue rows preserved, and no external posts deleted. Cloudinary inventory now returns zero `auto-*` video assets, and all nine non-published queue rows (4 failed, 3 partial, 2 queued) reference public IDs that are absent from Cloudinary. The latest scheduled publisher run `42792340735` then failed five Facebook Reels uploads with HTTP 422. No retry, requeue, regeneration, purge, or public social dispatch was performed. PR #275 now includes a fail-closed purge guard and a written-post fairness reserve; the older PRs #270 and #271 were closed as superseded. Ten written Facebook posts remain queued and one written post is published. The 30 curated audio assets are unaffected and all 30 exist in Cloudinary.
- **CI:** main Quality Gate `42789168100` and Supabase Production Health `42789168307` passed for `c91f64ccd6162e5107b3edb8be3c7aa521865c2f`. CircleCI `config-guard`, `source-verify`, `application-build-docs`, and `android-release-draft` statuses are green. The scheduled social-publisher failure above remains an operational failure, not a passing check.
- **Android:** the last verified signed release remains `v1.1.14` from its earlier exact release baseline. This audit did not build or verify a new signed APK/AAB for `c91f64ccd6162e5107b3edb8be3c7aa521865c2f`; the current CircleCI Android release-draft status alone is not a signed-artifact claim.
- **Review progress:** three high-risk workflow files were inspected in full, with targeted inspection of the Facebook OAuth callback/service, YouTube OAuth scopes/callback and stored channel identity, media-purge guard, queue selector, and route-verification contracts. PR #275 adds a fail-closed YouTube channel-ID match for stored refresh tokens; the callback requests offline access and required upload/read/analytics scopes. The full repository file matrix remains `REVIEW_REQUIRED`; no product module is closed yet. PR #275 contains code guardrails and route-baseline reconciliation and is awaiting its own CI/Preview checks.
- **Open follow-ups:** PRs #269, #270, #271, #272, and #274 were closed as superseded after their required changes were ported into PR #275 or confirmed applied by PR #273. PR #275 is the active current-main safety remediation and includes the refreshed manifest, matrix, ledger, route baseline, purge guard, queue fairness, OAuth recovery, production-only workflow dispatch guard, and workflow protections.
- **Safety:** no production user data, storage objects, migrations, policies, indexes, OAuth credentials, environment values, Android signing material, or social content were changed by this audit. No files were deleted.

## Current verified checkpoint — 2026-11-10 11:38 Africa/Cairo

**Audit state: IN PROGRESS. This checkpoint is not a FINAL BASELINE READY certification.**

- **GitHub source of truth:** `zikrofficial-X/Zikr`, branch `main`, commit `c91f64ccd6162e5107b3edb8be3c7aa521865c2f`. GitHub reports the `main` branch as unprotected; this audit did not change repository protection settings.
- **Recursive inventory:** 2130 entries (1639 files, 491 directories, 138209705 file bytes), complete and not truncated. The refreshed matrix contains 1639 file rows; automated tree coverage is 100%, but functional/manual review remains 0/1639. The delta from the prior 1,631-row matrix is 9 new paths and 1 removed path(s). The removed root `proxy.ts` is replaced by canonical `src/proxy.ts`.
- **Routes:** 142 App Router pages and 80 `route.ts` handlers are present. The shared route baseline is being updated from 79 to 80 because `src/app/api/kids/videos/route.ts` is now present; the route verifier is being updated to require that route.
- **Vercel:** project `zikr` (`prj_bnBQb7DIXB5iE2mZJAghtAoZuKGs`) is linked to this repository. Production deployment `dpl_7Czpzb6ckFDezvMbAFaih8WYuk9E` is READY on the exact `c91f64ccd6162e5107b3edb8be3c7aa521865c2f` main commit, with aliases `zikrmediaofficial.vercel.app`, `zikr-zikr3.vercel.app`, and `zikr-git-main-zikr3.vercel.app`. No production deployment was triggered by this audit.
- **Supabase:** project `zqtssvlvmkzeeyqghqfk` is ACTIVE_HEALTHY on PostgreSQL 17. Local and live migration ledgers both contain exactly 415 unique versions, latest `20261110085520`; there are no missing or extra versions. Live public schema has 92/92 tables with RLS enabled, 211 policies, 45 triggers, 40 public functions (20 SECURITY DEFINER), and no direct `anon` or `authenticated` EXECUTE grants on those 20 functions. Nine extensions are installed; four Edge Functions are active; four pg_cron jobs exist (three active, one disabled).
- **Supabase operations:** nine Storage buckets currently contain zero objects. The disabled `zikr-youtube-facebook-sync` cron entry still references the retired project host `ymxdswkaxafakugktsim`; it remains disabled and was not modified. Security Advisor warns that leaked-password protection is disabled. Performance Advisor reports 91 unused indexes; no index was dropped because usage history and workload evidence are insufficient.
- **Video/social incident:** the latest scheduled publisher run `42792340735` failed after five Facebook Reels uploads returned HTTP 422. Live queue inspection found nine non-published video rows still referencing Cloudinary media URLs (4 failed, 3 partial, 2 queued). The prior purge incident recorded 44 deleted MP4 assets; no retry, purge, regeneration, or public social dispatch was performed during this audit. PR #271 contains a fail-closed purge guard but remains a draft. Ten written Facebook posts remain queued and one written post is published.
- **CI:** main Quality Gate `42789168100` and Supabase Production Health `42789168307` passed for `c91f64ccd6162e5107b3edb8be3c7aa521865c2f`. CircleCI `config-guard`, `source-verify`, `application-build-docs`, and `android-release-draft` statuses are green. The scheduled social-publisher failure above remains an operational failure, not a passing check.
- **Android:** the last verified signed release remains `v1.1.14` from its earlier exact release baseline. This audit did not build or verify a new signed APK/AAB for `c91f64ccd6162e5107b3edb8be3c7aa521865c2f`; the current CircleCI Android release-draft status alone is not a signed-artifact claim.
- **Review progress:** three high-risk workflow files were inspected in full, with targeted inspection of the Facebook OAuth callback/service and route-verification contracts. The full repository file matrix remains `REVIEW_REQUIRED`; no product module is closed yet. PR #275 contains code guardrails and route-baseline reconciliation and is awaiting its own CI/Preview checks.
- **Open follow-ups:** PR #270 (social queue fairness), #271 (purge guard), and #274 (production-only dispatch guard) remain draft. PR #272 was closed as superseded by merged PR #273. Older PR #269 remains a stale, divergent audit branch and is not used as the current baseline. PR #275 is the active current-main safety remediation.
- **Safety:** no production user data, storage objects, migrations, policies, indexes, OAuth credentials, environment values, Android signing material, or social content were changed by this audit. No files were deleted.

## Previous checkpoint — 2026-11-10 (superseded by the 11:38 reconciliation)

**Audit state: IN PROGRESS. This checkpoint is not a FINAL BASELINE READY certification.**

- Canonical repository: `zikrofficial-X/Zikr`; production branch: `main`; audited application source commit: `d05598035de7b51ba460a0c2424a58b22b4f4e81`. The latest `main` tip observed during documentation closeout is `33596bb3b952263c6258433c2dffd3b2b631ce8a` (`fix(ci): skip existing Android releases on later main updates`), which changes only `.circleci/config.yml` and `scripts/verify-release-contract.mjs`.
- Vercel project: `zikr` (`prj_bnBQb7DIXB5iE2mZJAghtAoZuKGs`), Node `22.x`; Supabase project: `zqtssvlvmkzeeyqghqfk`, status `ACTIVE_HEALTHY`, PostgreSQL 17.
- Repository inventory at this commit: 2,121 tree entries (1,631 files and 490 directories), 142 `page.*` files, 79 `route.*` handlers, 47 component files, 19 GitHub Actions workflows, 55 test-file paths, and 414 versioned Supabase migration files. The 414 migration versions match the live ledger, with no duplicate version IDs.
- Main GitHub Quality Gate run `42758477048` passed. CircleCI statuses for config guard, application build/docs, Android release draft, source verification, Supabase production gate, Android rebuild, and Android release dispatch all passed for this commit.
- Android `v1.1.14` is published at https://github.com/zikrofficial-X/Zikr/releases/tag/v1.1.14. Its annotated tag targets this exact commit. GitHub Actions run `42758799773` passed all release checks, including release metadata, checksums, APK signature/manifest, AAB signature, and post-publication asset verification. Published assets: APK 41,277,148 bytes (SHA-256 `c982ad8449432ed3128ae97d1d69dbe48ab619159238443757d945958a39202f`); AAB 36,091,440 bytes (SHA-256 `bfd01d055cafd04a61d3bff1c06ba59d6143c4ded51d44b1044dc37327f828e6`); `release-metadata.json` and `SHA256SUMS` are also published.
- Latest verified Vercel production deployment: `dpl_AK3uuUj4nAouG4tcNF9bNnsKpCDM`, state `READY`, source commit `6bcc456eb0977cd9688dc837fee3236bb43a2053`; canonical production aliases are attached. The audited `main` commit `d055980...` has no matching production deployment in the inspected production deployment list. Production deployment remains manual-only through `.github/workflows/release-finalization.yml` and requires explicit `RELEASE` confirmation.
- Live HTTP smoke checks returned 200 for `/`, `/quran`, `/hadith`, `/adhkar`, `/prayer-times`, `/kids`, `/videos`, `/audio`, `/dua`, `/articles`, `/admin`, `/admin/audio/adhan`, `/api/quran/surahs`, and `/api/hadith/books`. These are sampled route checks, not an exhaustive interactive browser/E2E pass across all 142 pages.
- Live Supabase inspection: 92 public tables, all with RLS enabled; 211 public policies; 53 public triggers; 20 public `SECURITY DEFINER` functions with pinned `search_path` and no direct `anon` or `authenticated` EXECUTE grants. Current data counts include 19,608 Quran audio rows, 172 reciters, 2,964 hadiths, 113 articles, 30 site-audio asset records, 122 videos, 107 video-generation requests, 83 social publishing queue rows, 142 social insight rows, and 116 content publishing queue rows.
- Video/social delivery snapshot from the live queue: 113/122 website videos are published; all 107 generation requests are completed. Of 83 social queue rows, 69 are published to both YouTube and Facebook Reels, 4 are partial (YouTube succeeded while Facebook Reels was deferred by provider cooldown), and 10 remain queued (7 Facebook-only, 3 targeting both platforms). The site-content publishing queue has 113 published and 3 queued. Recent autonomous video-worker and social-publisher runs succeeded; the latest insights sync fetched and updated 19 Facebook Reels records successfully. One earlier analytics-only run failed for 25 historical Facebook Reel candidates because Meta Graph API returned HTTP 400 OAuthException code 12 while listing Page posts; a subsequent scheduled sync succeeded. Do not force replay the partial/queued rows or publish duplicates; let the configured cooldown-aware publisher retry them and monitor exact per-platform outcomes.
- All nine Supabase Storage buckets currently report zero objects in `storage.objects`. This differs from the October 30 inventory documented below; treat the old 409-object / 1.874 GB snapshot as historical, not live. Do not delete buckets or media metadata based on this empty-object result alone.
- Supabase Security Advisor reports one warning: leaked-password protection is disabled. The organization is currently on the Free plan; this Auth-level setting is not a code migration and requires an owner-level plan/settings decision. Performance Advisor still flags unused-index candidates; do not bulk-drop indexes without query/workload evidence. Health Advisor returned no findings.
- Vercel runtime error monitoring reported four recent `fetch failed` events across `/`, `/admin/audio/adhan`, and `/hadith/[book]/[id]`, with underlying `ETIMEDOUT` / `UND_ERR_SOCKET` transport errors. The shared Supabase REST helper already has bounded GET retries; no code change is justified until the failure is reproduced and its actual caller/upstream is identified. Hobby runtime-log retention prevented a full 24-hour raw-log read.
- GitHub branch inventory returned only `main` at the start of this audit; no open PRs were returned then. The repository reported `main` as unprotected. Enabling required branch protections needs a deliberate owner decision because release and automation workflows must be checked for compatibility first.
- Existing repository contracts passed on `main`, including route inventory, local-import, hygiene, architecture, security, migration, mobile-readiness, content, media/video, social publishing, and admin contracts through the successful `verify:pr` gate. This does not replace full visual QA, authenticated browser E2E, or physical-device acceptance.

### Remaining closure gates

- Decide whether to upgrade the Supabase organization or formally accept the leaked-password-protection warning, then rerun Security Advisor.
- Reconcile the zero-object Storage inventory with the application’s active media/CDN references before considering any bucket or file cleanup.
- Investigate the intermittent Vercel transport failures with retained runtime/request logs and a reproducible route-level trace.
- Complete authenticated browser/mobile E2E and physical Android acceptance; complete qualified editorial/religious and Kids educator review where required by the project acceptance checklist.
- The current `main` commit has not been verified as deployed to production. Keep production manual-only; deploy only through the protected finalization workflow after the release decision and production smoke checks.
- No source files, database rows, storage buckets, indexes, or branches were deleted or moved during this checkpoint: the available remote inspection has not yet proven a safe orphan candidate across the complete dependency graph. Continue that analysis before destructive cleanup.

Historical sections below are retained for audit trail. Their counters and deployment states are point-in-time snapshots and must not be treated as current unless reverified.

## Historical consolidated closeout checkpoint — 2026-10-30

This checkpoint supersedes the older deployment and schema snapshots below.

- Latest verified production deployment: `dpl_6A7XdBAjUWrMrp6KSxKKYtuTHSpw`, state `READY`, production commit `0adf4c3b701bbb18ec9d3bf674d972b7e0af5c39` (branding PR #149).
- Production aliases verified on that deployment: `zikrmediaofficial.vercel.app`, `zikr-zikr3.vercel.app`, and `zikr-git-main-zikr3.vercel.app`.
- Main Quality Gate run `41041147885` passed the full `pnpm verify` suite. CircleCI application-build/docs and config-guard statuses for the main commit also passed.
- Supabase project `zqtssvlvmkzeeyqghqfk` is `ACTIVE_HEALTHY`; live migration ledger contains **384** versions, latest `20261030110000`.
- Supabase Security Advisor still reports **Leaked Password Protection Disabled**. The Supabase organization is on the **Free** plan; this Auth feature requires Pro or above, so enabling it needs an owner-approved upgrade or formal acceptance as an exception. Live database size is **80.37 MiB**, below the 500 MB Free database-size quota. A live `storage.objects` inventory contains 409 objects / **1,874,392,887 bytes (~1.874 GB)** in `videos` and `android-releases`, above the 1 GB Free storage allowance snapshot. Check billed Storage Size GB-Hours and grace-period state in the Supabase Usage page; the owner must choose Pro or approve reference-safe retention cleanup. No assets were deleted. Performance Advisor reports **68 unused-index observations**, INFO; do not bulk-delete.
- Production counters at the latest live SQL check: video requests 375 completed, 9 pending, 1 processing, 1 retry-wait; social queue 286 published and 5 partial. The 5 partial rows are YouTube-success / Facebook Reels cooldown deferrals; do not retry or enable social automation without owner approval.
- Current Kids registry is **13 games**, superseding the older 12-game inventory. Automated registry/game/content contracts exist; educator/religious review and physical/browser acceptance remain separate gates.
- Vercel runtime monitoring still showed React streaming-boundary errors on `/articles/[slug]` and `/dua/[slug]`, with a historical 300-second article timeout cluster. PR #150 contains a targeted fix for short published duas, missing English article/dua translations, duplicate dua metadata reads, and regression smoke checks. This fix is **not yet a live-production fix** until the PR merges, the main gate passes, and a deployment/smoke run verifies it.
- PR #150 is the active closeout branch: [closeout/all-plans-2026-10-30](https://github.com/zikrofficial-X/Zikr/tree/closeout/all-plans-2026-10-30). Its current head requires its own PR Quality Gate and review before merge. Do not treat prior runs for earlier branch heads as evidence for the latest head.
- Android `v1.1.8` is published with APK, AAB, SHA256SUMS and release metadata. Its immutable tag targets `3bddc73c9d9c35c90b6c84d1a7bb825c0d1cc04e`, which predates the new branding rollout; the new Android launcher identity needs the next semantic release and must not be forced into the immutable v1.1.8 tag.
- The phase-by-phase dispositions, video pipeline, Kids/Games acceptance, growth/SEO/monetization status, and owner-required actions are recorded in [ZIKR_ALL_PLANS_CLOSEOUT_2026-10-30.md](docs/closeout/ZIKR_ALL_PLANS_CLOSEOUT_2026-10-30.md).
- Project-wide certification is not complete while Supabase Auth hardening, qualified editorial/educator review, device/browser acceptance, social deferrals, domain/CMP/AdSense, revenue decisions, storage retention and file-dependency cleanup remain open. These are listed explicitly in the closeout ledger rather than marked complete by documentation alone.

## Historical production audit checkpoint — 2026-10-28

- Current repository head at the time of this checkpoint: `704ef2d40b38bacec307fdcfc0016422e7fdafa5`.
- Last verified Vercel production deployment at audit time: `dpl_C2ir1BurQUdkqdxXdAgqXwerhMWm`, state `READY`, deployed commit `c7dbd229f827aecffc5ce7c01c93cbe90d6cc7b7`. The canonical alias was attached to that deployment. Main has since advanced; production must be redeployed through the controlled manual deployment path after reviewed changes merge.
- Direct live HTTP checks returned 200 for the 38 public section routes, all 13 kids game pages, and all 13 kids game-content APIs. Each kids content API returned matching slug, type, and gameId metadata. `GET /api/quran/surahs` returned the ordered 114-surah catalog. No Vercel runtime error clusters were reported in the inspected one-hour window.
- Repository and production Supabase migration ledgers each contained 372 versions with no missing or extra version IDs at this checkpoint.
- The admin queue alert RLS policy was optimized by migration `20261028112016_optimize_admin_queue_alert_rls_initplan.sql`; live SQL confirmed an optimized policy. The advisor no longer reported the per-row `auth.uid()` initplan warning.
- Supabase still reports `Leaked Password Protection Disabled`. This is a project-level Supabase Auth setting, not a database migration. Enable it in the supported Auth/security settings path, then re-run the advisor.
- Supabase initially reported `public.social_platform_credentials` with RLS enabled but no policies. A live privilege check confirmed neither `anon` nor `authenticated` can SELECT from this table. The explicit restrictive deny policies are now applied to production and verified; the migration ledger records two idempotent invocations as versions `20261028112823` and `20261028112833`. The active repository migration files align with both immutable versions in the 374-entry production ledger.
- Supabase also lists 71 unused-index observations. These are informational; do not drop indexes in bulk without workload/query evidence.
- The production smoke contract is being strengthened so an HTTP 200 response containing only the Quran loading shell cannot pass as a healthy Quran page. The checks will validate both the actual streamed surah content and the canonical 114-row Quran API.

## Current Vercel/Supabase binding

The production Vercel project `zikr` is configured against Supabase project `zqtssvlvmkzeeyqghqfk` and the repository's active runtime validation files use the same canonical Supabase URL.

The repository's active production configuration was rechecked during the 2026-10-08 reconciliation:

- `supabase/config.toml` points to `zqtssvlvmkzeeyqghqfk`.
- `scripts/validate-deployment-env.mjs` enforces `https://zqtssvlvmkzeeyqghqfk.supabase.co`.
- `scripts/verify-auth-config.mjs` uses the same Supabase Auth provider callback.
- `scripts/verify-hygiene.mjs` treats obsolete Supabase/repository URLs as forbidden runtime references rather than active configuration.

## Source and route integrity

The repository contains the previously verified application route, API, content, offline, authentication, and hygiene checks. Historical audit results remain historical and are not treated as proof of the current live schema.

## Supabase production state

The selected production target is `zqtssvlvmkzeeyqghqfk`.

The live reconciliation previously confirmed that the production database has the newer migration chain through the October 2026 changes, including the background reminder Quran fields that were missing from an older deployment's runtime error.

Security-advisor findings still require deliberate review of permissive/public policies and internal server-only tables. No broad RLS rewrite is performed merely to silence advisory output.

## CI / deployment

- GitHub repository access is now confirmed with admin/maintain/push permissions.
- The active `.github/workflows/supabase-production-health.yml` is already pinned to the canonical Supabase project `zqtssvlvmkzeeyqghqfk`.
- Vercel remains the production deployment platform for the linked `main` branch.
- GitHub Actions is the production owner for recurring video generation and social publishing.
- CircleCI is the application build/documentation, Android release, Supabase gate, and English-content lane; it does not run the production video/social worker.
- Final production release certification was completed on 2026-10-08 after PR #291 merged the repository-wide cleanup. The latest `main` is deployed successfully to Vercel production, the project domain `zikrmediaofficial.vercel.app` is verified and attached to the current production deployment, and the application-build/documentation lane is successful for the merged code.

## Historical references

Older audit documents may still mention retired project references such as `eydxvcamhjhajxjrsgym` or earlier repositories. They are retained when they are explicitly historical records. Active runtime configuration and current operational workflows must use the canonical project documented above.

## Post-release controls

1. Keep the production deployment and canonical alias under controlled-release ownership.
2. Monitor post-release runtime errors and worker queues.
3. Keep Supabase security-advisor cleanup and Auth security settings as separate, reviewed changes.


## Production Supabase cutover — 2026-11-06

- Active production project: `zqtssvlvmkzeeyqghqfk` (Zikrofficial, eu-west-2, PostgreSQL 17.11, ACTIVE_HEALTHY).
- The Vercel Production `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and public anon key were verified against this project.
- Current database snapshot: 90/90 public tables have RLS enabled; Health Advisor is clear. Security Advisor has only the Free-plan leaked-password-protection warning remaining after revoking public execution of the RLS event-trigger function.
- Active prayer and source-agent cron jobs were repointed to the new project with `cron.alter_job`; both remain active on their original schedules. The retired social-sync job remains disabled. The live migration ledger has 403 entries, matching this release branch.
- No video generation requests, social publish queue items, Facebook Page credentials, or YouTube upload credentials exist in the active project's current snapshot. Video automation settings `video_automation_enabled` and `video_automation_ai_enabled` are true. External publishing remains fail-closed until channel OAuth connections are completed.


## Production and worker reconciliation — 2026-11-07

This dated snapshot supersedes the queue/credential absence recorded in the 2026-11-06 cutover paragraph above:

- Active Supabase remains `zqtssvlvmkzeeyqghqfk` (eu-west-2, PostgreSQL 17.11, `ACTIVE_HEALTHY`). Vercel Production `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SITE_URL`, and `AUTH_CALLBACK_URL` were compared with the canonical values without revealing or logging any secret; all four matched.
- The inspected live snapshot contains 42 video-generation request rows, 46 video catalog rows, 7 social publish queue rows, and 3 automation audit rows. Checked worker/queue tables have RLS enabled.
- The latest recorded 10-item video batch completed 9 videos and left 1 Kids episode in retry state. Its Arabic narration contained decomposed Unicode; the merged PR #232 now validates canonical story snapshots after NFC normalization and lets a partially successful batch complete so valid items can reach the dependent publisher.
- The current Facebook OAuth-managed Page credential is enabled, connected, has a Page ID, and carries the required publishing/insights scopes. Seven current social queue records target Facebook Reels. The YouTube OAuth credential table has no connected channel, so YouTube publishing remains blocked until the owner connects a channel from Admin with the required upload/read-only/analytics scopes.
- The latest inspected Vercel Production deployment was `dpl_9d8LhBw1xDjNfWWcnTkv46sfdV3C`, state `READY`, on main commit `a712708004942b99fceab0993592cef6c5112afe`, with the canonical domain alias. PR #232 has since merged to main at `f606dab52996c76c483cf8944e9b218e8c283d70`; the deployment inspected here predates that merge and requires the controlled release workflow before its changes can be called live.
- Historical Vercel error clusters included a retired Supabase hostname, an old `pinned_messages.is_active` query, and an old video-template route permission error. Current Vercel URL variables match the canonical project, current pinned-message code uses `published`, and no error/fatal runtime logs were returned for the latest 30-minute query.
- The video-template version-creation RPC was also executed once as `service_role` inside a transaction that was explicitly rolled back; it succeeded. The service role remains intentionally unable to select `auth.users`; do not widen that grant to silence an error from an older deployment.
- Security Advisor continues to report the Free-plan leaked-password-protection warning. This is an owner-managed plan/security setting, not a source-code change.



## Quran tafsir restoration finding — 2026-11-07

The canonical production project currently contains all 114 surahs and 6,236 ayahs, but `public.quran_tafsir` has zero rows. The repository retains nine original, source-attributed `التفسير الميسر` seed migrations (AlQuranCloud `ar.muyassar`) covering exactly 6,236 unique ayah pairs across all 114 surahs. Their original `WHERE EXISTS (quran_surahs)` guard meant they could be marked applied before the surah seed data existed, leaving the table empty without migration-ledger drift.

PR follow-up branch `fix/quran-tafsir-backfill-release-preflight-20261107` adds a controlled correction: pre-deploy verification accepts only the known absent state (0) or complete state (6,236), production schema migrations run first, then the original nine immutable upsert-only source chunks are replayed atomically, and post-migration verification requires exactly 6,236 non-empty source-attributed records with matching Quran ayah coverage. Other tafsir authors are not changed. No production tafsir rows have been written during this audit; the restore runs only inside the protected release workflow.


## Post-merge CI scope correction — 2026-11-07

PR #234 merged into `main` at `1c9f44a6c55ad9f6d65b7552892fc44b6eed43c9`. Its GitHub Quality Gate and all PR-level CircleCI checks passed. The post-merge `push` run exposed a CI scope-selection defect: the shell gate selected `verify:pr` even though GitHub identified the event as a push to `main`. A follow-up replaces shell reads of default event/ref variables with a scope boolean computed directly from the GitHub Actions expression context. Full main-branch `pnpm verify` must pass before the controlled production release is dispatched.

The current Vercel Production deployment remains `dpl_9d8LhBw1xDjNfWWcnTkv46sfdV3C` on deployed commit `a712708004942b99fceab0993592cef6c5112afe`; it does not contain PRs #232–#234. No production Quran tafsir rows have been restored yet; the protected release is still required.

  
## Continuous closeout checkpoint — 2026-11-10 12:12 Africa/Cairo

- Canonical baseline: `zikrofficial-X/Zikr@main` = `c91f64ccd6162e5107b3edb8be3c7aa521865c2f`; active draft remediation is PR #275 on `codex/zikr-comprehensive-repair-safety-20261110`, head `66ec209d1d86056af89fa107241b0230e39c5666`.
- Recursive tracked inventory: 1,639 files / 491 directories / 2,130 entries; 100% automated inventory coverage. Matrix records 21 full source-content reads; 1,618 files remain `REVIEW_REQUIRED`; dependency/runtime/acceptance review is incomplete; 0 modules closed.
- PR #275 fixes two production workflow source-ref risks (storage retention and offline snapshot), two test defects (social queue fixture and YouTube OAuth regex), and adds regression checks. See `docs/audits/CONTINUOUS_CLOSEOUT_LEDGER.md` for commit IDs and pending CI.
- CI is not green: CircleCI `config-guard` passed, but `source-verify` and `application-build-docs` failed on commit `5cba3a850083f73deaf6b74dc9c41c381a6efecb`; job logs were inaccessible. GitHub Quality Gate run `42797998682` was still running on that code head. The newer audit-documentation head has not yet passed its own checks.
- Production video/social reconciliation found 12 non-published queue rows, of which nine Cloudinary source assets are missing. Three recent YouTube uploads are already successful; their Facebook Reels uploads failed HTTP 422. No retry or regeneration was performed. The main-branch scheduled publisher independently published one Kids-series item to both platforms during its normal run.
- Supabase: 415 local/live migrations match; 92/92 public tables have RLS; 211 policies; 45 triggers; 40 public functions (20 SECURITY DEFINER, all pinned search_path); 4 cron jobs (3 active); 9 buckets with 0 current objects. Leaked-password protection remains disabled (owner action); 91 unused-index candidates were not dropped.
- Vercel Production remains READY on main SHA `c91f64ccd6162e5107b3edb8be3c7aa521865c2f`; no production deploy. No Android APK/AAB was built or signed against this baseline. No files or production data were deleted or changed by this audit.

**State: IN PROGRESS — do not mark FINAL BASELINE READY.**

  
## Continuous closeout checkpoint — 2026-11-10 13:25 Africa/Cairo

- Main baseline remains `zikrofficial-X/Zikr@c91f64ccd6162e5107b3edb8be3c7aa521865c2f`; Vercel production is READY on that SHA and linked to the same GitHub repository.
- Recursive inventory: 1,639 files / 491 directories / 2,130 entries. Manifest coverage 100%; full source-content reads 91/1,639; 1548 remain REVIEW_REQUIRED; modules closed 0.
- All 59 `src/lib` files were fetched and statically scanned. Import/export/environment references were enumerated; no replacement-character or scanned private-key/API-key marker matches were found. Consumer tracing and runtime acceptance remain open.
- PR #275 head is `1a522cd910d2eca3a9094feebef654aa7b58b2a6`. It adds legacy social queue result normalization and preserves remote IDs / platform blocks during retries. GitHub Quality Gate is in progress; CircleCI config-guard passed, source-verify failed, application-build-docs pending. PR remains draft and unmerged.
- Supabase remains read-only: 415/415 migrations, 92/92 public tables RLS-enabled, 211 policies, 45 triggers, 40 functions, 20 SECURITY DEFINER with zero direct client EXECUTE grants, 4 cron jobs (3 active), 9 buckets / 0 objects. Leaked-password protection remains an owner action; 89 unused-index candidates were not dropped.
- Social queue: 98 rows (77 published, 13 queued, 4 partial, 4 failed); 3 partial and 4 failed rows carry HTTP 422, one partial is cooldown-deferred. No retries or live publishing were initiated. Nine previously identified Cloudinary assets remain unresolved.
- No production deploy, migration replay, data mutation, file deletion, or Android signing was performed. Latest signed Android release on record is v1.1.14 and is not verified against this baseline.

**State: IN PROGRESS — do not mark FINAL BASELINE READY.**

  
## Additional continuous closeout checkpoint — 2026-11-10 13:35 Africa/Cairo

- PR #275 head: `fe5112dae122b038c5e90dc0cd8a4c4da33bb665`, draft/open and not merged.
- Fixed a false-positive admin health result: failed Supabase connectivity probes now map to `error`, with a pure unit test wired into `pnpm test` and the admin-health verifier.
- Traced all seven `requireSupabaseAuth` consumers: their feature services call `auth.getUser()`; the guard is only provider availability. Its documentation now states that it is not identity or admin authorization.
- Confirmed `supabase/server.ts` and `supabase/admin-rest.ts` have separate Next-server and Node-worker responsibilities; no Edge-runtime route consumer of the Next server module was found in code search.
- Storage owner-path enforcement remains pending the Storage RLS policy audit. No data or policies were changed.
- Current inventory evidence remains 92/1,639 source-content reads; 1547 REVIEW_REQUIRED; modules closed 0. Earlier GitHub Quality Gate success belongs to commit `1a522cd`, not the current head; latest checks remain pending.

**State: IN PROGRESS — do not mark FINAL BASELINE READY.**


## Continuous closeout checkpoint — 2026-11-10 13:45 Africa/Cairo

- **Source of truth:** GitHub repository `zikrofficial-X/Zikr`, main baseline `c91f64ccd6162e5107b3edb8be3c7aa521865c2f`; Vercel project `zikr` is linked to that repository. Production remains READY on the same main SHA. Connected Supabase project: `zqtssvlvmkzeeyqghqfk`.
- **Inventory:** main baseline 1,639 files / 491 directories / 2,130 tracked entries; 100% automated inventory coverage. Full source-content reads 117/1,639; 1,522 REVIEW_REQUIRED; 99 CONTENT_READ_PENDING_TRACE; 10 FIXED_PENDING_CI; 8 TEST_UPDATED_PENDING_CI. Modules closed: 0.
- **PR #275:** draft/open/unmerged; head at checkpoint `46a8b66c27c9b5c7c771c3e97794854e3b3f1ac7`; 48 changed files. Branch tree: 1,648 files / 491 directories. Current CircleCI config-guard passed; source-verify and application-build-docs pending; full ZIKR Quality Gate in progress. Earlier source-verify failure on head `6e1845a` still needs a detailed cause.
- **Storage repair:** live Storage RLS lacked owner policies for avatars, media, audio and documents. PR adds a forward migration with authenticated owner-path policies, fixes MIME allowlists, corrects the signed-upload TTL to 7,200 seconds, and adds a contract test. Migration remains unapplied; live migrations remain 415/415.
- **Social containment:** nine approved queue rows referencing missing Cloudinary assets are held from retry. Three queued became failed; three partial and three failed remain held. Audit event `5de18dd5-8bcc-4784-a471-e1c7821405dc`. Existing YouTube remote IDs preserved. No provider call, generation or post was triggered.
- **Written posts:** ten written Facebook posts are queued and one is published. The dedicated page is `/admin/social/written-studio`; a direct link and pending count were added to the main social dashboard. The page requires `social.manage`; generation requires `social.publish` as well.
- **Supabase:** 92/92 public tables RLS-enabled; 89 unused-index candidates remain untouched; leaked-password protection remains an owner setting; health advisor returned no findings. No index, data, bucket or Storage object was deleted.
- **Vercel/Android:** no PR Preview deployment; production not redeployed. Vercel sandbox creation was blocked by storage quota and local GitHub DNS was unavailable, so no local build is claimed. No APK/AAB build or signature verification was performed.
- **No module is closed.** Browser/device acceptance, migration replay, current CI, missing-media restoration, and the remaining REVIEW_REQUIRED inventory are still open.

**State: IN PROGRESS — do not mark FINAL BASELINE READY.**


### Storage testability refinement — 2026-11-10 13:45 Africa/Cairo
- Extracted pure storage configuration/path/MIME/TTL logic into `src/lib/services/storage-contract.ts`; the server helper re-exports it and the new test imports the pure module, avoiding a server-only module in the Node test runtime.
- PR tree: 1,649 files / 491 directories / 2,140 entries. Main baseline remains 1,639 files; full source-content reads 117/1,639; 1,522 REVIEW_REQUIRED; modules closed 0.
- PR #275 head at this refinement: `241840744a606e42519b7f0e9c9930363651c7e0`, still draft/open/unmerged. CI has to pass on the final head.

## Additional verified audit checkpoint — 2026-11-10 16:59 Africa/Cairo

**Audit state: IN PROGRESS. This is not a FINAL BASELINE READY certification.**

### Canonical environment

- GitHub production branch remains main at c91f64ccd6162e5107b3edb8be3c7aa521865c2f.
- PR #275 remains Draft. The video-recovery code snapshot is 0d4744948c0d96cfd04f0d60a1d7364b7b624524; the latest audit-document update follows it.
- Vercel project zikr is READY in production from the unchanged main SHA c91f64c; canonical domain is zikrmediaofficial.vercel.app.
- Supabase project zqtssvlvmkzeeyqghqfk is ACTIVE_HEALTHY on PostgreSQL 17.11.
- Direct migration-ledger SQL confirms 415/415 unique local-main/live versions. Public RLS is enabled on all 92/92 tables. The only current Security Advisor warning is leaked-password protection disabled, which remains an owner-level settings/plan decision.

### Video catalog recovery finding

A read-only join of the video catalog, generation requests, social publishing queue, and site content publishing queue found 64 generated videos that were previously published on the ZIKR site, whose media was disposed after successful social publication, and whose YouTube remote ID matches the catalog record. All 64 have completed requests, matching content/source/template hashes, and automated QA passed.

- 50 general videos meet the recovery gate.
- 14 kids videos are split into 8 with kidsVideoQaStatus=passed and 6 with kidsVideoQaStatus=revalidation_required.
- The safe recovery set is 58 videos (50 general + 8 kids QA-passed). The 6 kids records remain hidden.
- Root cause: the earlier YouTube fallback migration skipped records when the YouTube ID and thumbnail were already populated, even if the media state remained purged and the fallback metadata was incomplete. It also did not restore the site published flag.

### Repair prepared in PR #275

- Added a fail-closed prior-publication/QA helper for late YouTube fallback restoration.
- The video purge route now records whether the catalog row was public before its media was purged.
- Successful YouTube catalog reconciliation can restore a previously public purged row only when that marker and the applicable automated/Kids QA gates pass.
- Added migration 20261110150000_restore_confirmed_purged_video_catalog.sql. It requires confirmed YouTube success, a published site queue record, matching canonical request hashes/template, valid and non-conflicting provider ID, and the appropriate QA state. It restores only evidence-qualified rows and performs no deletions.
- Added regression coverage for restoration eligibility, kids QA blocking, purge-state capture, migration guards, and YouTube catalog sync.
- The migration has not been applied to production. The 58-row candidate query was run read-only; no production catalog rows were modified.

### Current video/social state

- Internal generated catalog: 105 rows remain hidden in purged state; 5 internal rows remain published. There are also 17 published manual videos.
- Social publishing queue: 78 published video rows, 1 published written post, 10 queued written posts, 6 failed video rows, and 3 partial video rows. The 9 failed/partial rows are flagged sourceMediaMissing and remain held; no blind retry or duplicate publishing was performed.
- All 112 generation requests are currently completed.

### CI and release state

- The earlier Quality Gate run 42839488376 passed toolchain, PostgreSQL integration checks, and the new Supabase database URL regression test, then failed on the new migration contract because an intermediate migration edit was malformed.
- The migration was rewritten cleanly in commit 0d4744948c0d96cfd04f0d60a1d7364b7b624524. The current-head CI run must pass before merge; no production release or migration apply was initiated.
- PR #275 remains Draft with 70 changed files (9,842 additions / 2,262 deletions). No merge is authorized until current-head checks, isolated Preview, and acceptance gates pass.

No files or production data were deleted in this checkpoint. No Cloudinary assets were deleted, no social posts were published, and no production deployment was initiated. File-level review and browser/mobile acceptance remain incomplete; modules closed remains 0.
