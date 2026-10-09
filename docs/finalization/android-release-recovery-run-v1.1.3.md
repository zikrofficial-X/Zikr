# Android v1.1.3 Asset Recovery Run

- Release tag: `v1.1.3`
- Application version: `1.1.3`
- Android versionCode: `57`
- Application ID: `com.zikr.app`
- Target SDK: `36`
- Purpose: rebuild the missing signed APK/AAB for the already-published release tag.
- Build authority: CircleCI `android-rebuild`.
- Artifact publication authority: GitHub Actions `publish-android-release-assets.yml`.

Acceptance criteria:
- CircleCI Android build completes successfully.
- APK and AAB signatures verify.
- Application ID, versionName and target SDK match the release contract.
- SHA256SUMS and release metadata match the exact binaries.
- The GitHub Release contains `app-release.apk`, `app-release.aab`, `SHA256SUMS`, and `release-metadata.json`.

Do not publish or mark the release as ready before all checks pass.
