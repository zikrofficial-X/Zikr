# ZIKR mobile runtime

This repository keeps one Next.js codebase and runs the production web app inside Capacitor for Android and iOS. The canonical web deployment remains `https://zikrmediaofficial.vercel.app`; native shells use that origin so SSR, API routes, Supabase auth callbacks, SEO, sitemap, robots, PWA and Vercel deployment behavior stay intact.

## Required store values

- Android package: `com.zikr.app`
- iOS bundle id: `com.zikr.app`
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

Capacitor configuration enables splash screen, status bar, keyboard, local notifications, push notification presentation, app links, universal links, deep links, camera, filesystem, share, network, preferences-backed local settings, haptics and background-task extension points. The current release does not expose a biometric UI or install a biometric plugin; the old `@capacitor-community/biometric-auth` reference was removed because that package is not published under that name.

Prayer notifications use the bundled `adhan.wav` asset and the `zikr-prayer-adhan-v2` Android channel. Salawat reminders use the bundled `salawat.wav` asset and the `zikr-salawat-v2` channel; the clip says `صل على سيدنا محمد` and is generated locally for this application. The short clips are also available under `public/audio` for foreground playback and offline PWA use.

## Dependency installation

The root `package.json` includes the Capacitor 7 runtime/platform/plugin packages and the CLI pinned in `mobile/capacitor-dependencies.json`. The current CLI is `7.4.3`, aligned with the Capacitor 7 native runtime; keep all Capacitor versions on the supported 7.x line and change them only as a controlled migration. Run `pnpm install --frozen-lockfile` before syncing native projects.

## Build sequence

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm exec cap sync android
pnpm exec cap sync ios
pnpm exec cap open android
pnpm exec cap open ios
```

Provision release signing in Android Studio / Xcode; do not commit keystores, provisioning profiles, or App Store Connect API keys.
