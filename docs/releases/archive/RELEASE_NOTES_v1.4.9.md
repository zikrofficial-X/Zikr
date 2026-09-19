# ZIKR v1.4.9

## Release highlights

- Free deterministic FFmpeg video renderer is the production default for automated Quran videos; HeyGen is no longer required for the primary generation path.
- Social retry actions now invoke the protected background worker immediately instead of only waiting for the scheduled runner.
- Facebook and YouTube publishing remain queue-based with per-platform result tracking and safe retry semantics.
- Android release metadata is aligned to `versionName 1.4.9` and `versionCode 40`.
- Release verification requires the full web/mobile verification suite, signed APK/AAB validation, package-id validation, target SDK 36, and SHA-256 checksums.

## Validation policy

A release is considered ready only after GitHub Actions quality checks pass, the production deployment is READY, and the Android release workflow produces a verified signed APK and AAB.
