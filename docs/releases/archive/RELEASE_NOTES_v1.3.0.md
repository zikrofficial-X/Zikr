# ZIKR v1.3.0 — Production Android Release

## Release summary
- Promotes the post-v1.2.9 Supabase migration-history reconciliation and hardening fixes into the next Android release.
- Aligns web package version and native Android metadata at `1.3.0`.
- Increments Android `versionCode` from `25` to `26` for a valid upgrade path.
- Keeps the supported Node 22 / pnpm 9.15 toolchain and the existing verification pipeline.

## Release gates
CircleCI must pass the complete `ci-check` before the Android release job proceeds. The Android release job then verifies:
- dependency installation with the frozen lockfile
- web build and Capacitor synchronization
- mobile release readiness
- signed APK and AAB generation
- APK signature validity
- application ID `com.zikr.app`
- Android version name `1.3.0`
- SHA-256 checksums

## Artifacts
The release pipeline publishes:
- `app-release.apk`
- `app-release.aab`
- `SHA256SUMS`

## Release source
The release is cut from the dedicated `android-release-v1.3.0` branch. The CircleCI release pipeline creates the immutable Git tag `v1.3.0` from the exact verified commit and publishes the GitHub Release only after the signed artifacts pass validation.

## Operational note
Supabase migration parity was repaired before this release. The latest verification run reported `All migrations are up to date`, so the previously observed remote/local migration-history failure is not part of the release state.
