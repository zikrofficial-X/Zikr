# ZIKR Project Release & Build Status

**Last Updated:** 2026-10-08  
**Repository:** https://github.com/zikrcontact-del/Zikr  
**Production URL:** https://zikrmediaofficial.vercel.app

## Current release state

| Item | Status |
|---|---|
| Application version | **1.1.3** |
| Android versionCode | **57** |
| Canonical release tag | **v1.1.3** |
| Latest published stable release | **v1.1.2** |
| v1.1.3 release notes | ✅ Present |
| Main branch | ✅ Active |
| CI/CD ownership cleanup | ✅ Applied |
| Production Vercel promotion of the latest cleanup commit | ✅ READY — `dpl_FkavSSvEDy4vom7p6zvoFLN28aq9` |

`v1.1.3` is prepared in the repository but must not be described as published until the controlled Android/web release pipelines have completed successfully.

## Current automation topology

| Responsibility | Owner |
|---|---|
| PR/main verification | GitHub Actions — `ZIKR / Quality Gate` |
| Video generation | GitHub Actions — `generate-ai-video.yml` |
| Social publishing | GitHub Actions — `publish-social.yml` |
| Production web deploy | GitHub Actions — `release-finalization.yml` |
| Production smoke verification | GitHub Actions — `release-vercel.yml` |
| Android release tag/draft | Admin Release service — `prepareAndroidRelease()` |
| Android asset verification/publishing | GitHub Actions — `publish-android-release-assets.yml` |
| Application build/documentation | CircleCI — `application-build-docs` |
| Android build/signing | CircleCI — `android-rebuild` |
| English content schedule | CircleCI — `scheduled-english-content-sync` |
| Prayer notifications | Supabase pg_cron + `prayer-notification-worker` |
| Source-verified content agent | Supabase pg_cron + `source-verified-content-agent` |
| Runtime web hosting | Vercel |
| Database/Auth/Storage | Supabase |

There is no active CircleCI video/social worker, no Vercel Cron scheduler, and no active Supabase social/video scheduler.

## Android release pipeline

The Android release pipeline uses one canonical semantic release tag: `vX.Y.Z`.

The Admin Release page calls `prepareAndroidRelease()`, which updates the canonical release metadata, creates the single semantic Git tag, and opens a draft GitHub Release. CircleCI performs the Android build/signing lane for that tag. `Publish Android Release Assets` verifies the uploaded artifacts, checksums, signature, manifest, and publishes the GitHub Release.

The obsolete `vX.Y.Z-build` parallel lane has been removed to prevent duplicate Android builds.

## Production web release

Production Vercel Git auto-deployment is disabled in `vercel.json`. The intended production path is:

1. controlled `release-finalization.yml` dispatch from `main`;
2. exact-commit verification;
3. Vercel production build;
4. prebuilt production deployment;
5. smoke verification against the deployed artifact.

The cleaned production build is live on Vercel deployment `dpl_FkavSSvEDy4vom7p6zvoFLN28aq9`, built from commit `96b85222dfd18309688e4b5e09d35e55c0b44210`, and the canonical alias `zikrmediaofficial.vercel.app` resolves to that deployment.

## Verification requirements

Before treating a release as complete:

`pnpm verify:pr`

CircleCI must complete the production application build/documentation lane, and release-specific Android/Supabase gates must pass when applicable.

Production evidence must include:

- intended commit SHA;
- Vercel deployment URL/state;
- production smoke result;
- Android artifact metadata and SHA-256 when an Android release is performed;
- active Supabase cron/Edge Function state for scheduler-owned tasks.

## Remaining non-blocking platform finding

Supabase security advisors currently report **Leaked Password Protection Disabled** as a warning. This is a project-level Auth setting and is not represented as a migration in the repository; it must be enabled through the supported Supabase Auth/project configuration path.

Supabase performance advisors report unused-index observations. These are informational and must not be converted into bulk index drops without workload evidence.

## Sign-off rule

Do not mark a release **PUBLISHED**, **PRODUCTION READY**, or **FULLY VERIFIED** solely because a Vercel deployment is `READY`. The release evidence above is required.