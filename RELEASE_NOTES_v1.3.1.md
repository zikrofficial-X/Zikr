# ZIKR v1.3.1 — Android Release

## Release summary

- Aligns the web package version and native Android metadata at `1.3.1`.
- Increments Android `versionCode` from `26` to `27` for a valid upgrade path.
- Includes the current ZIKR `main` branch, including the offline/PWA and native reminder improvements already merged.
- Keeps the Node 22 and pnpm 9 toolchain used by the verification pipeline.

## Release gates

The release pipeline must pass the complete CI verification before the Android job proceeds. The Android job then verifies dependency installation, the production web build, Capacitor synchronization, mobile readiness, signed APK/AAB generation, APK signature validity, application ID `com.zikr.app`, version name `1.3.1`, and SHA-256 checksums.

## Artifacts

The release pipeline publishes:

- `app-release.apk`
- `app-release.aab`
- `SHA256SUMS`

## Verification status

Local verification completed successfully after dependency installation: the complete `pnpm verify` gate passed, the clean production build passed, `pnpm mobile:sync` passed, and Android mobile checks passed. A local signed release build cannot be claimed without the protected production keystore; CircleCI must provide the protected signing variables and publish the final artifacts.

## Release source

The release must be cut from the exact verified commit on the configured Android release tag. The pipeline should create or update the immutable GitHub Release only after both signed artifacts and their checksums pass validation.
