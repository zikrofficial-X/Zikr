# ZIKR Project Release & Build Status

**Last reconciled:** 2026-11-01  
**Repository:** https://github.com/zikrofficial-X/Zikr  
**Production URL:** https://zikrmediaofficial.vercel.app

## Current source and production state

| Item | State |
|---|---|
| Main branch head | [`dabfeee915a6f1e0b86732eb0409ffeb6de69665`](https://github.com/zikrofficial-X/Zikr/commit/dabfeee915a6f1e0b86732eb0409ffeb6de69665) |
| Vercel production | Previous verified deployment remains `READY` on `42c08f67e5a7a4a3dfff700aa71033851dc0a956` |
| Android release tag | [`v1.1.11`](https://github.com/zikrofficial-X/Zikr/tree/v1.1.11) |
| Tag target | `dabfeee915a6f1e0b86732eb0409ffeb6de69665` |
| Git tag type/signature | Annotated tag; **unsigned** |
| GitHub Release | [ZIKR Android v1.1.11](https://github.com/zikrofficial-X/Zikr/releases/tag/untagged-469128052e224f0a4879) — **Draft** |
| Public Android assets | **Not published yet**; draft currently has no assets |

The Android release action was triggered from the production Admin Release page. It updated release metadata, created the semantic tag and draft, and pushed the source commits to `main`. The v1.1.11 tag resolves to the final release-preparation commit above. The tag is annotated but not cryptographically signed; do not describe it as a signed Git tag.

## Version metadata verified on the release source

| Platform/file | Verified value |
|---|---|
| `package.json` | `1.1.11` |
| `android/app/build.gradle` | `versionName 1.1.11`, `versionCode 65` |
| `src/components/layout/footer.tsx` | `APP_VERSION = 1.1.11` |
| iOS Xcode project | `MARKETING_VERSION 1.1.11`, `CURRENT_PROJECT_VERSION 65` |
| iOS Info.plist | `CFBundleShortVersionString 1.1.11`, `CFBundleVersion 65` |
| `.release-tag` | `v1.1.11` |
| Application ID / Target SDK | `com.zikr.app` / `36` |

## v1.1.11 CI status at reconciliation

The following checks were read from the exact tag-source commit `dabfeee915a6f1e0b86732eb0409ffeb6de69665`:

| Check | State | Details |
|---|---|---|
| CircleCI `config-guard` | **SUCCESS** | [Build 2072](https://circleci.com/gh/zikrofficial-X/Zikr/2072) |
| CircleCI `source-verify` | **SUCCESS** | [Build 2074](https://circleci.com/gh/zikrofficial-X/Zikr/2074) |
| CircleCI `supabase-production-gate` | **SUCCESS** | [Build 2075](https://circleci.com/gh/zikrofficial-X/Zikr/2075) |
| CircleCI `application-build-docs` | **FAILED** | [Build 2071](https://circleci.com/gh/zikrofficial-X/Zikr/2071) |
| CircleCI `android-rebuild` | **PENDING** | [Build 2076](https://circleci.com/gh/zikrofficial-X/Zikr/2076) |
| GitHub Android asset publisher | **WAITING** | [Publisher workflow](https://github.com/zikrofficial-X/Zikr/actions/runs/41341409736) |

The Android publisher has successfully resolved the exact tag and draft, but is waiting for CircleCI's `android-rebuild` success status. Until the signed APK/AAB, release metadata, checksums and signature checks finish, v1.1.11 must remain a draft. The most recently published stable Android release remains [v1.1.10](https://github.com/zikrofficial-X/Zikr/releases/tag/v1.1.10).

The CircleCI status summary identifies `application-build-docs` as failed but does not expose its failing step or error text. The build detail is linked above; do not invent a root cause or mark the job as passed.

## Release automation issue identified

The current `prepareAndroidRelease()` implementation writes the Android, package, footer, iOS project, iOS plist, tag metadata and release notes through separate GitHub Contents API updates. Each update creates its own commit on `main`, and each main commit triggers another CircleCI pipeline. The v1.1.11 preparation therefore created a sequence of release-metadata commits and repeated application-build attempts, including builds against partially updated metadata.

**Required engineering fix for the next release:** change the release manager to create all release metadata blobs, one Git tree and one Git commit through the Git Data API; update `main` once using a non-force ref update; then create the annotated semantic tag and Draft Release against that exact commit. Add a regression contract proving one release preparation creates one main commit. Do not retarget or recreate the already-existing v1.1.11 tag.

## Android publication gate

The existing publisher is intentionally gated:

1. CircleCI `source-verify` and `supabase-production-gate` must pass for the exact tag commit.
2. CircleCI `android-rebuild` must build and sign APK and AAB from that same tag commit.
3. CircleCI uploads the artifacts, release metadata and SHA-256 file to the configured Supabase Storage path and verifies the uploaded bytes.
4. GitHub Actions checks tag/source provenance, metadata, APK signature and manifest, AAB signature, checksums, and Draft Release state.
5. Only after every check succeeds may the GitHub Release become public.

Do not manually attach older binaries to v1.1.11, reuse v1.1.10 assets, retarget the immutable tag, or publish while the Android build is pending.

## Controlled web production gate

Vercel automatic Git deployment is disabled. The web app must be promoted through the controlled production release workflow after the exact main commit passes its quality gate. The existence of an Android tag or a Vercel `READY` deployment alone is not evidence that the web release and Android package are both complete.

## Current published release

- Latest published stable Android: **v1.1.10**, versionCode `64`, target SDK `36`.
- Assets: APK, AAB, `release-metadata.json`, and `SHA256SUMS`.
- Release: https://github.com/zikrofficial-X/Zikr/releases/tag/v1.1.10
