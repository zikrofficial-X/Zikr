# Offline and production smoke test — 2026-09-01

- Production home page responded successfully at https://zikrmediaofficial.vercel.app/.
- Public navigation exposed core routes including Quran, Hadith, Adhkar, Prayer Times, Qibla, Prophets, Companions, Scholars, Offline Library, and Android download.
- `https://zikrmediaofficial.vercel.app/manifest.webmanifest` returned valid JSON with `display: standalone`, `scope: /`, RTL Arabic metadata, icons at 192px and 512px, and shortcuts for Quran, prayer times, adhkar, and wird.
- `https://zikrmediaofficial.vercel.app/api/download/android` triggered an APK download in the browser; the downloaded file was saved as `/home/ubuntu/Downloads/app-release.apk`.
- The currently deployed `https://zikrmediaofficial.vercel.app/sw.js` still reports `CACHE_NAME = 'zikr-v9'` and therefore does not yet contain the local repository's v10 offline fixes. A deployment of the pending repository changes is required.
- The home page footer currently displays Version 1.1.8, which indicates the public deployment is behind the repository's local package version 1.2.5; this is a deployment synchronization issue, not a local build failure.

## Local validation after fixes

- `pnpm check`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed, 73 tests / 73 passed.
- `pnpm build`: passed.
- `pnpm verify-mobile-readiness`: passed after synchronizing cache assertions.
- `pnpm offline:check`: passed after synchronizing cache assertions.
- `pnpm project:check`: pending final rerun after assertion formatting update.
