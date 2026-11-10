# ZIKR Project Release & Build Status

## Current verified checkpoint — 2026-11-10T18:49:41Z

**Current main:** `a637558965b10c52ae1c9a8bf17a0948155e5725`  
**Production Vercel:** `dpl_8SDdkrR2AutQBe8fXLTkJEK9dAD8`, READY on the exact main SHA; canonical alias `https://zikrmediaofficial.vercel.app`. Live `/api/health` returned HTTP 200 with `ok=true` and commit `a637558965b10c52ae1c9a8bf17a0948155e5725`.

### Latest published Android release

| Item | Verified state |
|---|---|
| Android version | 1.1.15 |
| Android versionCode | 69 |
| Application ID | `com.zikr.app` |
| Target SDK | 36 |
| Release | https://github.com/zikrofficial-X/Zikr/releases/tag/v1.1.15 |
| Git tag target commit | `faf16ea2450ab22f44c336161cd841806d97bbe6` |
| Annotated tag object | `7bc78b5c406abf850ca6a142ed35a27bb795f7c1` |
| Git tag signature | Annotated tag, **unsigned** (GitHub verification reason: `unsigned`) |
| GitHub Release ID | `440588928` |
| Published at | 2026-11-10 18:29:21 UTC |
| Release state | Published; APK/AAB and metadata/checksum assets present |

### Published asset metadata

| Asset | Size | GitHub-reported SHA-256 |
|---|---:|---|
| app-release.apk | 41,498,367 bytes | `90140be1f44e81d9d93011e8c78c882c6e045ba35e61495077039b7e1e6faee9` |
| app-release.aab | 36,312,681 bytes | `ec611f1e3b643c0c80349ae6b3a41602950e92cf32f28a9e3d0ccbb7dbb15f1f` |
| release-metadata.json | 635 bytes | `6eb724755eec9c7cdda750c0e4bf3ce6e2c3887d086b11aac15edb482fcbe59b` |
| SHA256SUMS | 243 bytes | `bc6f093f5cfd57a9678da7295f5dd57f9db0b4302c6ef7847aa75a063264258c` |

Downloads: [APK](https://github.com/zikrofficial-X/Zikr/releases/download/v1.1.15/app-release.apk) · [AAB](https://github.com/zikrofficial-X/Zikr/releases/download/v1.1.15/app-release.aab) · [SHA256SUMS](https://github.com/zikrofficial-X/Zikr/releases/download/v1.1.15/SHA256SUMS) · [Metadata](https://github.com/zikrofficial-X/Zikr/releases/download/v1.1.15/release-metadata.json)

The tag commit's CircleCI contexts (config-guard, source-verify, Supabase production gate, Android rebuild and release dispatch) report SUCCESS. The initial GitHub publisher run `42851264285` failed at preflight because the tag's GitHub Quality Gate was not successful; the later CircleCI release dispatch passed and the GitHub Release is now published. This checkpoint records GitHub's asset digest metadata, not a fresh local digest calculation or independent APK/AAB signature verification. The Git tag itself is unsigned. Do not describe the tag as cryptographically signed.

### Current main CI

GitHub Quality Gate run `42874180774` and CircleCI config-guard, source-verify, application-build-docs and android-release-draft all passed on `a637558965b10c52ae1c9a8bf17a0948155e5725`.

---

**Historical release/deployment snapshots below are retained for audit history and are superseded by this current checkpoint.**

Last reconciled: 2026-11-10 18:49:41 UTC.
Repository: https://github.com/zikrofficial-X/Zikr  
Production URL: https://zikrmediaofficial.vercel.app

## Production web deployment

| Item | Verified state |
|---|---|
| Deployed source commit | `a712708004942b99fceab0993592cef6c5112afe` |
| Current main commit (not yet deployed) | `1c9f44a6c55ad9f6d65b7552892fc44b6eed43c9` |
| Vercel deployment | `dpl_9d8LhBw1xDjNfWWcnTkv46sfdV3C` |
| Deployment state | READY (Production) |
| Production alias | `zikrmediaofficial.vercel.app` |
| Deployment URL | https://zikr-dwr37r69d-zikr3.vercel.app |
| Deployment created | 2026-11-06 (UTC) |
| Runtime logs | No error/fatal logs returned by the latest 30-minute query; older error clusters belong to older deployments |

The inspected production deployment is READY and serves `zikrmediaofficial.vercel.app`, but it remains on the deployed source commit shown above. Current `main` is `1c9f44a6c55ad9f6d65b7552892fc44b6eed43c9`; PRs #232, #233 and #234 have merged after the deployed commit and are not live yet. The production release remains manual-only through `.github/workflows/release-finalization.yml` and requires explicit `RELEASE` confirmation.

## Atomic Android release preparation

The release manager reads all Android, package, footer, and iOS version files from one immutable main commit. It verifies their versions are aligned and fails closed when expected fields are missing, duplicated, or inconsistent.

It creates file blobs, assembles one Git tree, creates one child commit, and advances main once through a non-force fast-forward update. If main changes during preparation, the operation stops instead of overwriting a concurrent update. The semantic tag and Draft Release are bound to the exact created commit SHA.

Regression checks in scripts/verify-release-contract.mjs enforce the Git Data API flow, immutable source snapshot, single-parent commit, non-force ref update, exact tag provenance, absence of sequential Contents API writes, and version alignment across Android/iOS/footer/package.

Implementation commit: https://github.com/zikrofficial-X/Zikr/commit/3eeaa292716b09ec42119833659d6c1b7c7f53d3

## Release automation CI

The atomic release-manager fix commit passed:
- GitHub Actions — ZIKR / Quality Gate: SUCCESS.
- GitHub Actions — Supabase Preview: SUCCESS.
- CircleCI — application-build-docs on main: SUCCESS (build 2080).
- CircleCI — config-guard on main: SUCCESS (build 2081).

The v1.1.11 Android tag had one unrelated CircleCI application-build-docs failure (build 2071). Android's own source verification, Supabase production gate, signed build, and guarded publication all passed. The main web build/docs job passed independently; the tag-only web build result did not block or invalidate Android signing/publication.

Pipeline correction: CircleCI application-build-docs is main-only. Semantic Android tags continue to run source-verify, supabase-production-gate, android-rebuild, and the guarded Android release dispatch; they no longer trigger the separate web build/docs job. A regression assertion protects these filters.

## Latest published stable Android release

| Item | Verified state |
|---|---|
| Android version | 1.1.14 |
| Android versionCode | 68 |
| Application ID | `com.zikr.app` |
| Compile / Target SDK | 36 / 36 |
| Release tag | https://github.com/zikrofficial-X/Zikr/releases/tag/v1.1.14 |
| Tag target commit | `d05598035de7b51ba460a0c2424a58b22b4f4e81` |
| Annotated tag object | `a1e3bb90093bd37d56d64f0b4e0c031b8cc5b562` |
| Git tag signature | Annotated tag, **unsigned**; GitHub reason: `unsigned` |
| GitHub Release ID | `439960831` |
| Release state | Published, immutable |
| Published at | 2026-11-10 05:12:05 UTC |

### Published assets

| Asset | Size | SHA-256 |
|---|---:|---|
| app-release.apk | 41,277,148 bytes | `c982ad8449432ed3128ae97d1d69dbe48ab619159238443757d945958a39202f` |
| app-release.aab | 36,091,440 bytes | `bfd01d055cafd04a61d3bff1c06ba59d6143c4ded51d44b1044dc37327f828e6` |
| release-metadata.json | 635 bytes | `89f68c0d15de0ae09298c3ed23c3baa077060ce6ad67a923ed0243e1e3f9bd29` |
| SHA256SUMS | 243 bytes | `d2760afa945a2e26ad57eb17fd3d0c5ac44424bab783561038ad8d4b3bc34786` |

Release: https://github.com/zikrofficial-X/Zikr/releases/tag/v1.1.14

Published downloads:
- [Signed APK](https://github.com/zikrofficial-X/Zikr/releases/download/v1.1.14/app-release.apk)
- [Signed AAB](https://github.com/zikrofficial-X/Zikr/releases/download/v1.1.14/app-release.aab)
- [SHA256SUMS](https://github.com/zikrofficial-X/Zikr/releases/download/v1.1.14/SHA256SUMS)
- [Release metadata](https://github.com/zikrofficial-X/Zikr/releases/download/v1.1.14/release-metadata.json)

CircleCI Android rebuild and guarded release dispatch succeeded. The GitHub publisher also succeeded after verifying exact tag/source provenance, release metadata, checksums, APK signature and manifest, signed AAB, and the exact four published assets. GitHub marks the release immutable. Asset SHA-256 digests are recorded above.

Publisher evidence: [GitHub Actions — Publish Android Release Assets](https://github.com/zikrofficial-X/Zikr/actions/runs/42758799773), [CircleCI Android rebuild #3895](https://circleci.com/gh/zikrofficial-X/Zikr/3895), and [release notes](docs/releases/1.1.14.md).

## Git tag signature and immutable release attestation

The published `v1.1.14` tag is an annotated Git tag object, but its Git object signature is **unsigned**. GitHub reports tag object `a1e3bb90093bd37d56d64f0b4e0c031b8cc5b562` as `verified: false`, reason `unsigned`. It points to source commit `d05598035de7b51ba460a0c2424a58b22b4f4e81`. The Android APK and AAB signatures were verified separately by CircleCI and the GitHub release publisher.

GitHub Release `439960831` is marked immutable. The exact source provenance and all four release assets were checked before publication. This release immutability is separate from a GPG/SSH signature on the Git tag; keep describing the tag itself as unsigned.

Never delete, recreate, or retarget the immutable `v1.1.14` release or tag. To sign future tags, configure an owner-managed GPG/SSH signing key in protected CI secrets and verify the tag signature before publication; do not store signing material in source or public artifacts.

Official verification commands:

```bash
gh release verify-asset v1.1.14 ./app-release.apk
gh release verify-asset v1.1.14 ./app-release.aab
sha256sum -c SHA256SUMS
```

## Current CI ownership

| Responsibility | Owner |
|---|---|
| PR/main source verification | GitHub Actions — ZIKR / Quality Gate |
| Main web build and docs | CircleCI — application-build-docs |
| Android source and Supabase gates | CircleCI — source-verify, supabase-production-gate |
| Android signing build | CircleCI — android-rebuild |
| Android verification and publication | GitHub Actions — publish-android-release-assets.yml |
| Controlled production web deploy | Vercel |
| Video generation / social publishing | GitHub Actions |
| Prayer/source-agent scheduling | Supabase pg_cron and Edge Functions |

## Release safeguards

- Never reuse a published semantic tag for a different source SHA.
- Never place old APK/AAB files under a newer tag.
- Never publish before signature, manifest, metadata, and checksum verification.
- Keep Android, package, footer, and iOS version metadata aligned.
- Never force-update main; abort on concurrent changes during release preparation.
- Do not apply database migrations as part of a metadata-only release update.
