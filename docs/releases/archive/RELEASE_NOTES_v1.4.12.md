# ZIKR v1.4.12

## Release highlights

- Free FFmpeg template rendering is the default automated video-generation path; HeyGen is optional and not required for production Quran video automation.
- Social retry actions process failed and partial queue items immediately through the protected publisher path.
- Facebook and YouTube remain queue-driven with per-platform result tracking, safe retries, and automatic publishing enabled by default.
- Android release metadata is aligned to versionName `1.4.12`, versionCode `43`, applicationId `com.zikr.app`, target SDK `36`.
- Release qualification includes migration validation, route/import/project checks, TypeScript, lint, tests, production build, mobile readiness, signing validation, and release artifact checks.

## Important operational note

Provider credentials are never committed to source control. GitHub Actions Secrets supply the Facebook Page Access Token, Page ID, YouTube OAuth refresh token, and other server credentials at runtime.
