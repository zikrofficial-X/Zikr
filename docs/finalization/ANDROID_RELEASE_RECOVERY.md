# Android Release Recovery

The canonical CircleCI release branches use the format `android-release-vX.Y.Z` and must match both `package.json.version` and `.release-tag`.

For a tag whose APK/AAB assets are missing or whose prior Android build failed:

1. Create or update the canonical `android-release-vX.Y.Z` branch from the intended release commit.
2. CircleCI validates the release metadata, builds and signs the APK/AAB, uploads the artifacts and checksums to the `android-releases` Supabase bucket, and updates the `android_release` site setting.
3. The Android publisher runs from that exact release branch, waits up to 60 minutes for the CircleCI artifacts, verifies release metadata, checksums, APK signature, manifest, and signed AAB, then uploads (replacing stale files) the verified binaries to the matching GitHub Release and publishes it.
4. Do not manually mark a release complete before the signed binaries, checksum file, and metadata pass validation.

The normal semantic tag trigger remains supported. The branch recovery path exists specifically for release tags that already exist but previously failed to publish Android assets.
