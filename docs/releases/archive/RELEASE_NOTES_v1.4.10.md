# ZIKR v1.4.10

## Release

- Production default remains the free deterministic FFmpeg video renderer; HeyGen is optional and not required for automated Quran video generation.
- Social retry actions invoke the protected background worker immediately.
- Facebook and YouTube remain queue-driven with per-platform result tracking and retry safety.
- Android release metadata is aligned to versionName `1.4.10`, versionCode `41`, applicationId `com.zikr.app`, targetSdk `36`.
- Release qualification requires the full verification suite and signed APK/AAB validation.

## Release verification

The release pipeline must complete without failures for migrations, routes, imports, project integrity, TypeScript, lint, tests, mobile readiness, build, package identity, signature verification, and SHA-256 checksums.
