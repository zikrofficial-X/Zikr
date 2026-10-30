# ZIKR — Current Project Status

**Production branch:** `main`  
**Last reconciled:** 2026-10-30  
**Repository:** `zikrofficial-X/Zikr`  
**Production origin:** `https://zikrmediaofficial.vercel.app`

## Consolidated closeout checkpoint — 2026-10-30

This checkpoint supersedes the older deployment and schema snapshots below.

- Latest verified production deployment: `dpl_6A7XdBAjUWrMrp6KSxKKYtuTHSpw`, state `READY`, production commit `0adf4c3b701bbb18ec9d3bf674d972b7e0af5c39` (branding PR #149).
- Production aliases verified on that deployment: `zikrmediaofficial.vercel.app`, `zikr-zikr3.vercel.app`, and `zikr-git-main-zikr3.vercel.app`.
- Main Quality Gate run `41041147885` passed the full `pnpm verify` suite. CircleCI application-build/docs and config-guard statuses for the main commit also passed.
- Supabase project `ymxdswkaxafakugktsim` is `ACTIVE_HEALTHY`; live migration ledger contains **384** versions, latest `20261030110000`.
- Supabase Security Advisor still reports **Leaked Password Protection Disabled**. The Supabase organization is currently on the **Free** plan; Supabase documents this feature as available on Pro or above, so enabling it requires an owner-approved plan upgrade or formal acceptance of the warning as an exception. Performance Advisor reports **68 unused-index observations** at this checkpoint; these are informational and are not grounds for bulk index deletion.
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

The production Vercel project `zikr` is configured against Supabase project `ymxdswkaxafakugktsim` and the repository's active runtime validation files use the same canonical Supabase URL.

The repository's active production configuration was rechecked during the 2026-10-08 reconciliation:

- `supabase/config.toml` points to `ymxdswkaxafakugktsim`.
- `scripts/validate-deployment-env.mjs` enforces `https://ymxdswkaxafakugktsim.supabase.co`.
- `scripts/verify-auth-config.mjs` uses the same Supabase Auth provider callback.
- `scripts/verify-hygiene.mjs` treats obsolete Supabase/repository URLs as forbidden runtime references rather than active configuration.

## Source and route integrity

The repository contains the previously verified application route, API, content, offline, authentication, and hygiene checks. Historical audit results remain historical and are not treated as proof of the current live schema.

## Supabase production state

The selected production target is `ymxdswkaxafakugktsim`.

The live reconciliation previously confirmed that the production database has the newer migration chain through the October 2026 changes, including the background reminder Quran fields that were missing from an older deployment's runtime error.

Security-advisor findings still require deliberate review of permissive/public policies and internal server-only tables. No broad RLS rewrite is performed merely to silence advisory output.

## CI / deployment

- GitHub repository access is now confirmed with admin/maintain/push permissions.
- The active `.github/workflows/supabase-production-health.yml` is already pinned to the canonical Supabase project `ymxdswkaxafakugktsim`.
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
