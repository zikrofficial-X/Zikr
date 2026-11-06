# ZIKR Project Release & Build Status

Last reconciled: 2026-11-07  
Repository: https://github.com/zikrofficial-X/Zikr  
Production URL: https://zikrmediaofficial.vercel.app

## Production web deployment

| Item | Verified state |
|---|---|
| Source commit | `a712708004942b99fceab0993592cef6c5112afe` |
| Vercel deployment | `dpl_9d8LhBw1xDjNfWWcnTkv46sfdV3C` |
| Deployment state | READY (Production) |
| Production alias | `zikrmediaofficial.vercel.app` |
| Deployment URL | https://zikr-dwr37r69d-zikr3.vercel.app |
| Deployment created | 2026-11-06 (UTC) |
| Runtime logs | No error/fatal logs returned by the latest 30-minute query; older error clusters belong to older deployments |

The inspected production deployment is built from the latest `main` commit observed during this reconciliation. Its aliases include `zikrmediaofficial.vercel.app`. PR #232 is merged into `main`, but the deployment inspected here still points to its pre-merge base commit; a new controlled production release is required before merged changes are considered live.

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
| Android version | 1.1.12 |
| Android versionCode | 66 |
| Application ID | `com.zikr.app` |
| Compile / Target SDK | 36 / 36 |
| Release tag | https://github.com/zikrofficial-X/Zikr/releases/tag/v1.1.12 |
| Tag target commit | `c8cf106d709aa4f10e94a0d45e668794e41f94f3` |
| Git tag signature | Annotated tag, **unsigned**; GitHub reason: `unsigned` |
| Release state | Published, immutable |
| Published at | 2026-11-02 03:30:37 UTC |

### Published assets

| Asset | Size | SHA-256 |
|---|---:|---|
| app-release.apk | 40,854,242 bytes | `04368ac54509ad22b4cf01eb66580bc1a014c544c85e74f4f4bda049b3e3fdfe` |
| app-release.aab | 35,668,096 bytes | `5dbe99ff97db5e014bda39646dd94e2012710d6e8a7202f2080785f827b3894b` |
| release-metadata.json | 635 bytes | `e4f57173e62ebf5c052499188f3ecccfdb26a871276b0b7b9c44c53a2667bf78` |
| SHA256SUMS | 243 bytes | `73278c0c4b824e76e45507b960bed0a20fe89a4c5eacf3288dd162368b135216` |

Release: https://github.com/zikrofficial-X/Zikr/releases/tag/v1.1.12

The release publisher verified the exact source/tag provenance, APK signature and manifest, AAB signature, SHA-256 checksums, release metadata, and immutable GitHub release attestations. Both Android artifacts are signed; the Git tag itself remains unsigned.

Publisher evidence: [GitHub Release v1.1.12](https://github.com/zikrofficial-X/Zikr/releases/tag/v1.1.12) and [release notes](docs/releases/1.1.12.md).

## Git tag signature and immutable release attestation

The published `v1.1.12` tag is an annotated Git tag object, but its Git object signature is **unsigned**. GitHub reports tag object `0aee16eb5f6f4e1d2ee27a282ae03e27b3b955c5` as `verified: false`, reason `unsigned`. It points to source commit `c8cf106d709aa4f10e94a0d45e668794e41f94f3`.

The associated GitHub Release `431036231` is immutable. GitHub release attestations verified successfully for both `app-release.apk` and `app-release.aab`. This release-level attestation is separate from a GPG/SSH signature on the Git tag; keep describing the tag itself as unsigned.

Never delete, recreate, or retarget the immutable `v1.1.12` release or tag. To sign future tags, configure an owner-managed GPG/SSH signing key in protected CI secrets and verify the tag signature before publication; do not store signing material in source or public artifacts.

Official verification commands:

```bash
gh release verify v1.1.12
gh release verify-asset v1.1.12 ./app-release.apk
gh release verify-asset v1.1.12 ./app-release.aab
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
