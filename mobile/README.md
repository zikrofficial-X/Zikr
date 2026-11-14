# ZIKR mobile runtime

This repository keeps one Next.js codebase and runs the production web app inside Capacitor for Android and iOS. The canonical web deployment remains `https://zikrmediaofficial.vercel.app`; native shells use that origin so SSR, API routes, Supabase auth callbacks, SEO, sitemap, robots, PWA and Vercel deployment behavior stay intact.

## Advertising policy

The native Android/iOS application is ad-free. Monetag tags and SmartLinks,
Google Funding Choices, Google Tag Manager, and AdSense ad slots are loaded
only in the website runtime and are not requested by Capacitor. The app keeps
offline caching, Quran/audio storage, prayer notifications, authentication,
and other native capabilities.

## Required store values

- Android package: `com.zikr.app`
- iOS bundle id: `com.zikr.app`
- Minimum iOS version: `15.0` (aligned with Capacitor 7 support)
- App name: `ZIKR | ذِكرٌ`
- Custom scheme redirect: `com.zikr.app://auth/callback`
- HTTPS redirect: `https://zikrmediaofficial.vercel.app/auth/callback`
- Associated domain / app link host: `zikrmediaofficial.vercel.app`

## Supabase / Google OAuth redirect URLs

Add all URLs below in Supabase Auth URL configuration and Google OAuth clients:

```text
https://zikrmediaofficial.vercel.app/auth/callback
com.zikr.app://auth/callback
```

## Native capability checklist

Capacitor configuration enables splash screen, status bar, keyboard, local notifications, push notification presentation, app links, universal links, deep links, camera, filesystem, share, network, preferences-backed local settings, haptics and background-task extension points. The current release does not expose a biometric UI or install a biometric plugin, and it does not request Face ID permission. The iOS plist intentionally omits `NSFaceIDUsageDescription` until a supported native biometric feature is implemented and reviewed; the old `@capacitor-community/biometric-auth` reference was removed because that package is not published under that name.

Prayer and Quran reminders use the bundled `adhan.wav` notification sound on iOS; salawat reminders use the bundled `salawat.wav` sound. iOS notifications deliberately use these app-bundled WAV assets even when a remote or MP3 audio choice is selected, because notification sounds must be packaged in a supported native format. Android uses the selected bundled native sound where available (including the MP3 fallback). Android notification channel IDs are versioned from the selected audio key (`zikr-audio-…-v2`), created for prayer/Quran/salawat, and refreshed before reminders are rescheduled after an audio-setting change; users may need to enable sound for the new channel in Android settings. The salawat clip says `صل على سيدنا محمد` and is generated locally for this application. The short clips are also available under `public/audio` for foreground playback and offline PWA use.

## Dependency installation

The root `package.json` includes the Capacitor 7 runtime/platform/plugin packages and the CLI pinned in `mobile/capacitor-dependencies.json`. The current CLI is `7.4.3`, aligned with the Capacitor 7 native runtime; keep all Capacitor versions on the supported 7.x line and change them only as a controlled migration. Run `pnpm install --frozen-lockfile` before syncing native projects.

## Build sequence

The Capacitor CLI requires `webDir` to contain a root `index.html`. The repository uses Next.js SSR and loads the live canonical origin inside native shells, so `mobile-shell/index.html` is a minimal local fallback entry point—not a static export of the Next.js application. Keep `capacitor.config.json` pointed at this directory; do not point it at `.next`, which is a server build output rather than a Capacitor web-asset bundle.

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm exec cap sync android
pnpm exec cap sync ios
pnpm exec cap open android
pnpm exec cap open ios
```

Provision release signing in Android Studio / Xcode; do not commit keystores, provisioning profiles, or App Store Connect API keys.
