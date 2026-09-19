# ZIKR v1.4.11

## Release highlights

- Free FFmpeg template rendering is the default automated video generation path.
- HeyGen is no longer required for the production generation workflow.
- Social retry actions invoke the protected processing worker immediately.
- Facebook and YouTube publishing remain queue-driven with per-platform status and retry tracking.
- Android release metadata: applicationId `com.zikr.app`, versionName `1.4.11`, versionCode `42`, targetSdk `36`.

## Qualification

The release workflow must pass the full web/mobile verification suite, produce a signed APK and AAB, verify package identity and target SDK, validate APK signatures, and publish SHA-256 checksums.
