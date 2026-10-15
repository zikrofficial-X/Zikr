# ZIKR Project Release & Build Status

**Last Updated:** 2026-10-08  
**Repository:** https://github.com/zikrofficial-X/Zikr  
**Production URL:** https://zikrmediaofficial.vercel.app

## Current release state

| Item | Status |
|---|---|
| Application version | **1.1.4** |
| Android versionCode | **58** |
| Application ID | `com.zikr.app` |
| Compile / Target SDK | **36** |
| Canonical release tag | **[`v1.1.4`](https://github.com/zikrofficial-X/Zikr/releases/tag/v1.1.4)** |
| Latest published stable Android release | **v1.1.4 — published** |
| APK + AAB + checksums + metadata | **Uploaded and verified** |
| Android asset publisher | **[GitHub Actions run #5: success](https://github.com/zikrofficial-X/Zikr/actions/runs/38749157361)** |
| Main branch | Active |
| CI/CD ownership cleanup | Applied |
| Production Vercel promotion | Latest `main` deployment process remains controlled |

Release assets are public on the [v1.1.4 Release page](https://github.com/zikrofficial-X/Zikr/releases/tag/v1.1.4). The workflow verified the signed APK and AAB, their checksums, and the exact bytes published on GitHub. Detailed asset sizes, SHA-256 values and tag provenance are recorded in [`docs/releases/1.1.4.md`](./docs/releases/1.1.4.md).

**Provenance issue to carry into the next release:** the annotated `v1.1.4` tag targets `a2fbc9f6bafdf9a91202d11270cdae984173e1f1`, while the successful asset publication run validated Android artifacts from `c3186f774d4a1889153c3ab7375f8fa2a0190dc1`. The binaries and uploaded assets passed the publisher's validation, but the tag target and artifact source are not the same commit. Do not rewrite the already-published tag; enforce exact tag/source-SHA equality when preparing the next release.

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

The latest `main` commit is deployed to Vercel production and the verified production domain `zikrmediaofficial.vercel.app` resolves to the latest production deployment.

## Verification requirements

Before treating a release as complete:

`pnpm verify:pr`

The final web release has passed the canonical Quality Gate, CircleCI application-build/documentation certification, and Vercel production build/deployment. Android `v1.1.3` remains a repository-prepared release and is not claimed as the latest published Android release.

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