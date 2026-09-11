# ZIKR v1.4.8

**Release type:** Stable production release
**Application ID:** `com.zikr.app`
**Android versionCode:** `39`
**Target SDK:** `36`
**Release branch:** `release/v1.4.8`

## Included changes

- Align release metadata across `package.json`, `.release-tag`, `PACKAGE_VERSION.txt`, and Android `versionName`/`versionCode`.
- Fix the mobile dependency manifest drift that caused the production `pnpm verify` gate to fail in Vercel and CircleCI.
- Keep Capacitor mobile dependency declarations synchronized with the repository lockfile and package ranges.
- Remove the orphaned `BiometricAuth` configuration that had no matching installed plugin dependency.
- Preserve the existing native Google OAuth HTTPS callback bridge and Android/iOS deep-link configuration.
- Preserve the verified offline-content, service-worker, route, migration, import, media, lint, TypeScript, test, and production build checks.

## Verification baseline

The preceding production fix cycle verified that:

- Supabase preview check passed on the merged repair commit.
- Supabase migration replay reached the current migration set successfully in the Vercel build.
- Local import verification passed.
- Placeholder-media verification passed.
- Mobile readiness checks passed.
- Offline-content checks passed.
- The Android release workflow previously completed successfully through signed APK/AAB build and signature verification.

## Release gate

The `v1.4.8` tag is intended to be created from this exact release commit. The Android release workflow will then build and publish the signed `app-release.apk`, `app-release.aab`, and `SHA256SUMS` assets for the tag.

## Version policy

This release increments the Android `versionCode` from `38` to `39` and the semantic application version from `1.4.7` to `1.4.8` without performing an untested major Capacitor runtime migration.
