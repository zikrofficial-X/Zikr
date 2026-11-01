# ZIKR Project Release & Build Status

**Last reconciled:** 2026-11-01  
**Repository:** https://github.com/zikrofficial-X/Zikr  
**Production URL:** https://zikrmediaofficial.vercel.app

## Latest verified production source

| Item | Verified state |
|---|---|
| Source branch | `main` |
| Source commit at this checkpoint | [`42c08f67e5a7a4a3dfff700aa71033851dc0a956`](https://github.com/zikrofficial-X/Zikr/commit/42c08f67e5a7a4a3dfff700aa71033851dc0a956) |
| Source commit message | `fix(actions): offset social publisher schedule` |
| Vercel project | `zikr` |
| Production deployment | `dpl_peDiydBCDx7LgdywtHTUi5WZ65tr` — **READY** |
| Deployment commit | `42c08f67e5a7a4a3dfff700aa71033851dc0a956` |
| Production aliases | `zikrmediaofficial.vercel.app`, `zikr-zikr3.vercel.app`, `zikr-git-main-zikr3.vercel.app` |
| Main commit checks observed | CircleCI `config-guard`: success; CircleCI `application-build-docs`: success; Vercel: success |

The production deployment is on the same application source commit shown above. The combined commit-status check returned the three successful contexts listed here; this record does not claim that an unobserved full GitHub Quality Gate has passed.

## Latest published stable Android release

| Item | Verified state |
|---|---|
| Application version | **1.1.10** |
| Android versionCode | **64** |
| Application ID | `com.zikr.app` |
| Compile / Target SDK | **36 / 36** |
| Canonical release tag | [`v1.1.10`](https://github.com/zikrofficial-X/Zikr/releases/tag/v1.1.10) |
| Published | 2026-10-30 |
| Git tag target commit | [`d50c580db24c0a79c5f7526670f4e93f0cae54c1`](https://github.com/zikrofficial-X/Zikr/commit/d50c580db24c0a79c5f7526670f4e93f0cae54c1) |
| Annotated tag object | `88be5ebd3abfb6e86a7b93c53a455ae22afd4570` |
| Git tag signature | **Unsigned** (GitHub verification reason: `unsigned`) |
| Release state | Published and immutable |

### Published Android assets

GitHub lists all four expected release assets. The asset digests below are the SHA-256 digests returned by GitHub.

| Asset | Size | SHA-256 |
|---|---:|---|
| `app-release.apk` | 40,574,860 bytes | `ac7576b9f1b1f165e7287a43e9a60f4d4fc965c8acf1bbe3854a28f1b6578e99` |
| `app-release.aab` | 35,388,091 bytes | `3b124300f4bed8b1d59ae8ce6f60cd3210488ce51d9721ec49ac2f00507192b5` |
| `release-metadata.json` | 737 bytes | `5e440e3703c0e504de58551a007bc0349aa99ef7fe67bb6ff1730fa84b02c2fb` |
| `SHA256SUMS` | 243 bytes | `49e39b9ffeb258d2840a561e3b5462a32ee241f17bd8fe2940aab9ba27f854a9` |

Download page: https://github.com/zikrofficial-X/Zikr/releases/tag/v1.1.10

The exact tag-source commit has successful CircleCI statuses for `source-verify`, `application-build-docs`, `config-guard`, `supabase-production-gate`, and `android-rebuild`. The published APK/AAB assets and their GitHub SHA-256 digests are present. The unsigned Git tag is a separate provenance property from Android APK/AAB signing.

## Current source version versus published Android version

At the verified main-source checkpoint, the repository metadata remains aligned at:

- `package.json`: `1.1.10`
- `android/app/build.gradle`: `versionName "1.1.10"`, `versionCode 64`
- `.release-tag`: `v1.1.10`

Main has newer commits than the Android release source commit. The current web application is deployed to production, but **a newer Android package has not yet been built or published**. Do not describe v1.1.10 binaries as builds of the newer main commit.

## Next Android release — controlled procedure

The canonical release path is the protected Admin Release action, not a manual version-file edit or an independently-created tag:

1. Open https://zikrmediaofficial.vercel.app/admin/release with an account that has `release.manage`.
2. Run **إطلاق أحدث نسخة Android**. The current release manager computes the next patch version and increments `versionCode`; from the recorded source values, the expected next version is `1.1.11` / versionCode `65`.
3. The release manager updates the canonical Android, package, footer, iOS, tag, and release-note metadata; creates the annotated semantic tag; and opens a GitHub Draft Release against the exact resulting main commit.
4. CircleCI must complete the `android-rebuild` signing job for that exact tag commit. The GitHub Actions publisher then validates the source SHA, release metadata, APK/AAB, checksums, and signatures before publishing the Draft Release.
5. Verify that the release is public and contains `app-release.apk`, `app-release.aab`, `release-metadata.json`, and `SHA256SUMS`.

The Admin action requires an authenticated administrator with `release.manage` and the server-side GitHub token. That protected action was not invoked during this documentation reconciliation. **No `v1.1.11` tag, Draft Release, or new Android binaries are claimed as created here.** The previous immutable release must never be retargeted or reused for newer source code.

## Current automation ownership

| Responsibility | Owner |
|---|---|
| PR/main source verification | GitHub Actions — `ZIKR / Quality Gate` |
| Video generation | GitHub Actions — `generate-ai-video.yml` |
| Social publishing | GitHub Actions — `publish-social.yml` |
| Controlled production web release | GitHub Actions — `release-finalization.yml` |
| Production smoke verification | GitHub Actions — `release-vercel.yml` |
| Android tag and draft creation | Admin Release service — `prepareAndroidRelease()` |
| Android asset verification and publication | GitHub Actions — `publish-android-release-assets.yml` |
| Android build and signing | CircleCI — `android-rebuild` |
| Application build/documentation | CircleCI — `application-build-docs` |
| Runtime hosting | Vercel |
| Database, Auth, Storage | Supabase |
| Prayer/source-agent scheduling | Supabase `pg_cron` and Edge Functions |

There is no active Vercel Cron scheduler for the video/social workers. Do not add duplicate schedulers to the existing ownership model.

## Release sign-off requirements

A release is not **PUBLISHED**, **PRODUCTION READY**, or **FULLY VERIFIED** solely because Vercel reports `READY`. Record and verify all applicable evidence:

- exact source commit and tag target;
- passing source and production database gates;
- Vercel production deployment ID, URL, state, and live smoke result;
- Android build result for the exact tag commit;
- APK/AAB presence, signing verification, release metadata, and SHA-256;
- active Supabase cron/Edge Function state for scheduler-owned tasks;
- unresolved security, storage, and owner-approval exceptions.

Historical audit snapshots are not proof of current production state. Do not bulk-drop indexes or delete storage objects merely to silence advisor or quota observations; review workload, retention, and ownership first.
