# ZIKR — Current Project Status

**Production branch:** `main`  
**Last reconciled:** 2026-11-10 11:38 Africa/Cairo  
**Repository:** `zikrofficial-X/Zikr`  
**Production origin:** `https://zikrmediaofficial.vercel.app`

## Current verified checkpoint — 2026-11-10 11:38 Africa/Cairo

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
