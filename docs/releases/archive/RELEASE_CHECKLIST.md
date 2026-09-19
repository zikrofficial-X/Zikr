# ZIKR Release Checklist — v1.3.2

## Canonical production URL
- `PRODUCTION_URL`: `https://zikrmediaofficial.vercel.app`
- `NEXT_PUBLIC_SITE_URL`: `https://zikrmediaofficial.vercel.app`
- Supabase Auth `site_url`: `https://zikrmediaofficial.vercel.app`
- App OAuth callback: `https://zikrmediaofficial.vercel.app/auth/callback`

## Release baseline
- Base branch: `main`
- Source baseline commit: `6c2682beecd674315009485652a5946f87a1eb3e`
- Release branch: `android-release-v1.3.2`
- Target release: `v1.3.2`
- Web/package version: `1.3.2`
- Android version code: `28`

## Android production baseline
- Application ID: `com.zikr.app`
- Minimum SDK: `24`
- Compile SDK: `36`
- Target SDK: `36`
- Android Gradle Plugin: `8.13.2`
- Gradle: `8.13`
- JDK: `17`

## Mandatory CI gates
- Frozen dependency installation passes.
- Project verification passes.
- TypeScript check passes.
- ESLint passes.
- Unit and integration tests pass.
- Next.js production build passes.
- Capacitor Android synchronization passes.
- Mobile release-readiness checks pass.
- Release keystore is restored from protected CI secrets and validates successfully.
- Signed APK and AAB are both produced.
- APK signature verification passes.
- Package ID and version are verified.
- Target SDK `36` is verified from the final APK manifest.
- SHA-256 checksums are generated.

## Published artifacts
- `app-release.apk`
- `app-release.aab`
- `SHA256SUMS`

## Store/device validation
CI verification is necessary but not sufficient for claiming zero runtime defects. Before public store publication, validate on physical Android devices for location permission/accuracy, prayer time refresh, reminder permissions, exact alarms, audio playback/focus, OAuth, background/resume behavior, reboot/rescheduling, and offline content.

## Security
- Never commit `keystore.properties` or a release keystore.
- Keep all release signing credentials in protected CI secrets only.
