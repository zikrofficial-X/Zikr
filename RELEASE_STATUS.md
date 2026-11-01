# ZIKR Project Release & Build Status

Last reconciled: 2026-11-01  
Repository: https://github.com/zikrofficial-X/Zikr  
Production URL: https://zikrmediaofficial.vercel.app

## Production web deployment

| Item | Verified state |
|---|---|
| Source commit | 3eeaa292716b09ec42119833659d6c1b7c7f53d3 |
| Vercel deployment | dpl_HKb4e5QoVVvqS5aLDgnMVcRKE1qC |
| Deployment state | READY |
| Production alias | zikrmediaofficial.vercel.app |
| Deployment URL | https://zikr-esv89ap9k-zikr3.vercel.app |
| Runtime error clusters | None found in the inspected one-hour window |
| Runtime error/fatal logs | None found for the deployment in the inspected 30-minute window |

The deployment was explicitly built from the verified main commit above. Automatic Git deployment remains disabled; production deployment was performed through the controlled Vercel path.

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
| Android version | 1.1.11 |
| Android versionCode | 65 |
| Application ID | com.zikr.app |
| Compile / Target SDK | 36 / 36 |
| Release tag | https://github.com/zikrofficial-X/Zikr/releases/tag/v1.1.11 |
| Tag target commit | dabfeee915a6f1e0b86732eb0409ffeb6de69665 |
| Git tag signature | Annotated tag, **unsigned**; GitHub reason: `unsigned` |
| Release state | Published |
| Published at | 2026-11-01 19:36:08 UTC |

### Published assets

| Asset | Size | SHA-256 |
|---|---:|---|
| app-release.apk | 40,840,191 bytes | 490b3fc815221c2ad3b316a3a43ea4fbc57b76352204f1ac5dbb143f98a82fe5 |
| app-release.aab | 35,654,052 bytes | 200557b1bff6333cb01877b185fa18ca94a873d596130f8a08a954c71b2826cd |
| release-metadata.json | 737 bytes | f94d55fad03ecd197284d238cb0f5acd9427f755427a2f1d931d2a3af88dc44b |
| SHA256SUMS | 243 bytes | 228b65b91d249c097f6becfbe88c7faae37c50f1fdd2e8604b4436dfcc8139a8 |

Release: https://github.com/zikrofficial-X/Zikr/releases/tag/v1.1.11

CircleCI source-verify, supabase-production-gate, android-rebuild, and android-release-dispatch succeeded for the exact tag source commit. GitHub Actions verified source/tag provenance, metadata, checksums, APK signature and manifest, AAB signature, uploaded all four assets, published the release, and downloaded the published assets again to compare them byte-for-byte.

Publisher run: https://github.com/zikrofficial-X/Zikr/actions/runs/41341409736

## Git tag signature and immutable release attestation

The published `v1.1.11` tag is an annotated Git tag object, but its Git object signature is **unsigned**. GitHub reports tag object `461b1991606bf720ed1c463ce05174c54db1ccb3` as `verified: false`, reason `unsigned`. It points to source commit `dabfeee915a6f1e0b86732eb0409ffeb6de69665`.

The associated GitHub Release `430802506` has `immutable: true`. GitHub automatically creates a cryptographically verifiable release attestation for immutable releases, binding the release tag, source commit, and release assets. This signed release-level attestation is distinct from the Git tag's own GPG/SSH signature; the tag itself must continue to be described as unsigned.

The immutable release protection prevents moving or deleting `v1.1.11` while the release exists. Do not attempt to delete/recreate the canonical tag or retarget it to retrofit a signature. Its existing tag target and APK/AAB assets remain preserved.

Official verification commands (GitHub CLI, authenticated to the repository):

```bash
gh release verify v1.1.11
gh release verify-asset v1.1.11 ./app-release.apk
gh release verify-asset v1.1.11 ./app-release.aab
```

SHA-256:
- APK: `490b3fc815221c2ad3b316a3a43ea4fbc57b76352204f1ac5dbb143f98a82fe5`
- AAB: `200557b1bff6333cb01877b185fa18ca94a873d596130f8a08a954c71b2826cd`

For future semantic releases, the protected release workflow must create the Git tag **with a configured owner-managed GPG or SSH signing key before publishing the release**, verify the tag signature and exact tag-to-source commit identity, and fail closed unless the signature is valid. Store signing material only in protected CI secrets; never in source files or public artifacts.

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
