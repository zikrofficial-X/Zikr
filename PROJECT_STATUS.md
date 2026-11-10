# ZIKR — Current Project Status

**Production branch:** `main`  
**Last reconciled:** 2026-11-10  
**Repository:** `zikrofficial-X/Zikr`  
**Production origin:** `https://zikrmediaofficial.vercel.app`

## Current verified checkpoint — 2026-11-10 (continuous closeout)

**Audit state: IN PROGRESS. This is not a FINAL BASELINE READY certification.**

### Source of truth and deployment

- The GitHub repository attached to the Vercel production deployment is `zikrofficial-X/Zikr`, branch `main`. Current main SHA: `2bfedae38e3818d076d9f1eb8a36132c3b8d0a79` — “Fix written Facebook post generation and admin studio (#268)”.
- Vercel project `zikr` belongs to team `zikr3` (project `prj_bnBQb7DIXB5iE2mZJAghtAoZuKGs`). Latest production deployment `dpl_EnVi4cmLBN6G2R34rUgRmCKhVyty` is `READY` and built from this exact main SHA. Verified production domain: `zikrmediaofficial.vercel.app`.
- Supabase target is `zqtssvlvmkzeeyqghqfk`, status `ACTIVE_HEALTHY`, PostgreSQL 17. This run did not change project settings, secrets, schema or data.
- Main is currently unprotected in GitHub. No protection setting was changed. A merge to main has been observed to create a Vercel production deployment automatically; the proposed code fix remains PR-only pending release authorization.

### Inventory and measurable progress

- Main recursive Git tree: **2125 entries, 1634 files, 491 directories**, untruncated; tracked file bytes: **138,150,372**.
- Route inventory: **142 pages and 80 API handlers**. The main route-baseline source still expects 79; correction is proposed on the audit branch.
- Other inventory: **19 GitHub Actions workflows, 56 test-file paths, 414 active Supabase migration files**.
- Previous matrix contained **1631 file rows** at baseline `84deeb994a9f33bd0b685adfe081c09ccbf86861`; it is refreshed to 1634 rows against main `2bfedae38e3818d076d9f1eb8a36132c3b8d0a79`. Stale prior file paths: 0; new current paths: 3.
- Full recursive manifest: `docs/audits/REPO_MANIFEST_2026-11-10.jsonl`. It records path, type, mode, Git object hash and size for all 2125 entries in the main baseline, including tracked dotfiles.
- File-status ledger: `docs/audits/FILE_STATUS_MATRIX_2026-11-01.md` (same central file, refreshed rather than duplicated). Status counts: REVIEW_REQUIRED=1600, FIX_PROPOSED=12, VERIFIED_BY_CI=2, REVIEWED_STATIC=19, VERIFIED_RUNTIME=1.
- Evidence-backed classification covers 34/1634 files (2.08%): 19 static-reviewed auth/admin files, 2 CI-verified cleanup files, 1 runtime-smoke-tested Kids API, and 12 files in proposed fixes. This is not module closure.
- The three new main paths are `src/app/api/kids/videos/route.ts`, `src/features/social/services/published-video-cleanup.ts`, and `scripts/tests/social-published-video-cleanup.test.ts`. No deletion candidate was proven safe.

### Code repair in progress — PR #269

- Stable branch: `audit/continuous-closeout`, created from main `2bfedae38e3818d076d9f1eb8a36132c3b8d0a79`.
- Commit `300f9c43632050040f6c69cba71165c335aaf76a` moves Next.js 16 Proxy from root `proxy.ts` to `src/proxy.ts`, updates active consumers, changes the expected API route count to 80 and adds the Kids feed route to the required route list.
- Commit `9dc8727f07ed3d2ff35926b0c4b42428efd248b1` resumes auth-blocked Facebook queue rows after a verified OAuth reconnect, records the recovery outcome and leaves actual publishing to the scheduled worker. The live queue currently has zero auth-blocked rows, so no production queue row was changed.
- PR #269 is draft. Its first code/audit head passed the GitHub Quality Gate; the Facebook OAuth recovery commit has just been pushed and its checks are rerunning. Vercel Preview for the newest head is pending.
- Next.js requires Proxy beside `src/app` when using `src`. References: https://nextjs.org/docs/app/api-reference/file-conventions/src-folder and https://nextjs.org/docs/app/getting-started/proxy.
- No merge or production deployment was initiated. Main auto-deploys to production on pushes, so PR #269 stays unmerged until all checks and the release gate are cleared.

### Auth and admin security review

- Static review covered 19 auth/admin files: environment aliases, auth origin and next-path handling, Supabase browser/server/middleware clients, Google web/native OAuth, callback exchange, login/register/password actions, HIBP screening, admin permission resolution, protected layout/API, profile self-service and profile sync.
- Live RLS check: `profiles` and `admin_role_assignments` policies restrict reads/writes to the session owner or authorized admins; the `guard_profile_sensitive_fields` trigger prevents non-service-role users from changing role/email. Current profile/assignment role mismatches: 0; orphan assignments: 0.
- The profile-sync API derives its user from `auth.getUser()`; it does not accept a caller-supplied user ID. Admin dashboard API requires `dashboard.view`.
- Security gap remains: Supabase leaked-password protection is disabled. The app-level HIBP range check fails open on HIBP outage by design. Enabling Supabase's control or changing the app to fail closed is an owner security-policy decision; neither was changed.
- Anonymous browser/API acceptance is not closed: the Vercel fetch connector returned a share-link authentication failure for admin API paths, so the 200 HTML responses for protected pages cannot be treated as anonymous access proof.

### GitHub, CI and Android

- Main Quality Gate run `42773328668` succeeded on `2bfedae38e3818d076d9f1eb8a36132c3b8d0a79`. CircleCI `config-guard`, `source-verify`, `application-build-docs`, and `android-release-draft` statuses all succeeded; the Vercel commit check succeeded.
- The superseded Quality Gate run `42771714082` was cancelled; the subsequent run `42771744803` succeeded. No failed Quality Gate result was observed for the current main head.
- Android release `v1.1.14` is published. Its tag points to `d05598035de7b51ba460a0c2424a58b22b4f4e81`, not the newer main SHA. Release workflow `42758799773` succeeded, including APK/AAB signature and manifest checks. The annotated Git tag object itself is unsigned. Assets: APK 41,277,148 bytes; AAB 36,091,440 bytes.
- This does not prove newer main-only social/admin changes are in a new Android artifact. Physical-device acceptance remains open.

### Supabase schema and security

- Live migration ledger: **414** versions. Local `supabase/migrations/*.sql`: **414**. Exact version-set parity, no duplicates, no local-only or live-only versions. No migration was applied or replayed.
- Public schema: **92/92 tables have RLS enabled**, 211 public policies, 53 public triggers, 20 public SECURITY DEFINER functions, and 9 extensions.
- Four cron jobs exist: three active (history cleanup, prayer push dispatch, source-verified content agent) and the YouTube/Facebook sync cron is inactive. Four deployed Edge Functions are ACTIVE.
- Storage: 9 buckets (7 public), **0 objects**. No bucket, object, row or metadata was deleted.
- Supabase health advisor returned no health lints. Security advisor reports one owner-setting warning: leaked-password protection is disabled. No account/security setting was changed.

### Video and social operations

- Live counts: 107 video-generation requests (all completed), 122 video catalog rows, 94 social queue rows (72 published, 4 partial, 18 queued), and 116 content-publish rows (113 published, 3 queued).
- All 4 partial social rows are YouTube successes with Facebook Reels not successful and cooldown metadata present. This is provider rate limiting, not evidence of a code failure; no duplicate publish was attempted.
- Confirmed remote IDs are unique: 72 Facebook Reels IDs and 76 YouTube IDs, with zero duplicates in queue metadata.
- Facebook and YouTube each have one connected credential record. Facebook has the required page permissions and a non-expired connection; YouTube has a refresh token, channel ID and upload/read/analytics scopes. No token values were read or exposed; no OAuth refresh was forced.
- Latest observed successful social publisher run: `42768521252` on `f314ffba187a292b063def1b8c4779bd2e30d368`, before current main. Latest video worker run: `42753189127` (success); written-content generator run: `42753982582` (success). No worker was manually dispatched because it can publish externally.
- Production `GET /api/kids/videos` returned HTTP 200 with 13 approved items; sampled items include story text, social captions and confirmed publication metadata. This was read-only; no test content was generated or published.
- Storage cleanup is not authorized by the zero-object count. Retention behavior remains under review; public Cloudinary masters and user content must remain protected.

### Vercel runtime findings

- Production error aggregation shows one `TypeError: fetch failed` cluster with 4 occurrences across `/`, `/hadith/[book]/[id]`, and `/admin/audio/adhan`. Last occurrence: 2026-11-10 03:54 UTC on an older deployment; causes include socket-close and `ETIMEDOUT`.
- No production error/fatal log entries were returned for the latest 50-minute window. The older fetch cluster remains open for upstream/dependency tracing; it was not misclassified as a deterministic application defect.

### Existing pull request and blockers

- Existing PR #265 (`codex/admin-console-full-audit-20261110`) remains open, 21 files changed, 42 commits. Its base is `f314ffba187a292b063def1b8c4779bd2e30d368`, while current main is `2bfedae38e3818d076d9f1eb8a36132c3b8d0a79`; GitHub reports `mergeable_state=dirty`. Its head has only a CircleCI config-guard success and no Quality Gate run. It is not safe to merge without resolving conflicts and rerunning CI.
- Remaining gates: PR #269 latest-head Quality Gate, CircleCI and Vercel Preview; browser login/logout, OAuth callback, anonymous API and role-by-role admin checks; Android physical-device checks; OAuth refresh and provider read-only validation; editorial/religious review; owner decision on leaked-password protection; trace of old upstream fetch errors.
- No public social post, production data deletion, migration, bucket deletion, or production deployment was initiated by this audit.

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
