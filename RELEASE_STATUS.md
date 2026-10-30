# ZIKR Project Release & Build Status

**Last Updated:** 2026-10-30  
**Repository:** https://github.com/zikrofficial-X/Zikr  
**Production URL:** https://zikrmediaofficial.vercel.app

## Current release state

| Item | Status |
|---|---|
| Application version | **1.1.8** |
| Android versionCode | **62** |
| Application ID | `com.zikr.app` |
| Compile / Target SDK | **36** |
| Canonical release tag | **[`v1.1.8`](https://github.com/zikrofficial-X/Zikr/releases/tag/v1.1.8)** (annotated tag; unsigned) |
| Latest published stable Android release | **[v1.1.8 — published 2026-10-28](https://github.com/zikrofficial-X/Zikr/releases/tag/v1.1.8)** |
| APK + AAB + checksums + metadata | **Present on the v1.1.8 GitHub Release** |
| Android asset publisher | **CircleCI signed build passed; GitHub Release lists APK, AAB, release metadata and SHA256SUMS** |
| Main branch | Active; branding PR #149 merged |
| CI/CD ownership cleanup | Applied |
| Production Vercel promotion | Controlled-release path; latest verified production deployment is recorded in `PROJECT_STATUS.md` |

The current public Android stable release is [v1.1.8](https://github.com/zikrofficial-X/Zikr/releases/tag/v1.1.8), published on 2026-10-28. The GitHub Release lists `app-release.apk`, `app-release.aab`, `release-metadata.json`, and `SHA256SUMS`; CircleCI status checks for the tag source commit report `android-rebuild` and `supabase-production-gate` success. The annotated `v1.1.8` tag resolves to commit `3bddc73c9d9c35c90b6c84d1a7bb825c0d1cc04e` and is unsigned. APK/AAB signing verification and Git-tag signature verification are separate checks.

**Native branding gap:** PR #149 merged the gold-crescent web/PWA and native launcher assets after the v1.1.8 source commit. The immutable v1.1.8 tag is 229 commits behind the current main branding commit and its published APK/AAB do not contain the newest native identity. Do not retarget or mutate v1.1.8. Distribute the native identity through the next controlled semantic Android release after the current closeout changes merge and the release manager creates a new tag/draft from main.

**Historical v1.1.4 provenance defect:** the annotated tag targets `a2fbc9f6bafdf9a91202d11270cdae984173e1f1`; the published Release notes name `a1eec652a7d20ac22dafb6bf72e560260e5f568b`; the successful asset publication run verified artifacts from `c3186f774d4a1889153c3ab7375f8fa2a0190dc1`. The APK/AAB signature, checksums, and published bytes passed validation, but the three commit identities differ. GitHub reports the annotated tag is unsigned. **Safeguard merged:** [PR #36](https://github.com/zikrofficial-X/Zikr/pull/36) blocks tag/recovery publication unless the tag target and signed artifact source SHA match exactly. Do not retarget the immutable `v1.1.4` tag; resolve lineage through a later controlled semantic release.

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

Production must be recorded per release using the exact commit, Vercel deployment ID/state, and live smoke result. At the start of the 2026-10-28 audit, Vercel deployment `dpl_C2ir1BurQUdkqdxXdAgqXwerhMWm` was READY on commit `c7dbd229f827aecffc5ce7c01c93cbe90d6cc7b7`; main has since advanced, and this baseline is not proof that later commits are deployed.

## Verification requirements

Before treating a release as complete:

`pnpm verify:pr`

Android `v1.1.7` is the latest published stable release. Its GitHub Release lists the APK, AAB, release metadata, and SHA256SUMS. The historical `v1.1.4` tag/source commit mismatch remains a provenance lesson; it must not be hidden by marking older source-to-tag correspondence as fully reconciled. The `v1.1.7` tag itself is also unsigned, which is distinct from APK/AAB signing.

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