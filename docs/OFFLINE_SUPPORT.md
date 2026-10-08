# ZIKR Offline Support

## What is actually offline

ZIKR uses two local layers:

1. **IndexedDB** stores the complete public content pack and user-local settings/favorites.
2. **Service Worker + Cache Storage** stores the app shell, visited HTML, public API responses, versioned offline datasets, and — when the user explicitly downloads the full offline pack — the public content routes and their same-origin static assets.

The native Capacitor application currently points at the production origin (`https://zikrmediaofficial.vercel.app`). Therefore the first-ever launch still requires network access. After the service worker and offline pack are installed, the cached public application can continue working without network access.

## Complete offline pack

Open **/offline-library** while online and press **"تحديث وتجهيز الحزمة كاملة"**.

The operation:

- refreshes every dataset declared by `public/offline-content/v1/manifest.json`;
- validates each dataset against its expected record count;
- saves the verified rows into IndexedDB;
- persists the manifest locally;
- asks the service worker to cache the public route inventory;
- caches same-origin Next/static assets referenced by those HTML pages;
- reports failed datasets and failed routes instead of silently claiming success.

The route pack includes the manifest inventory plus additional public routes such as Quran, Hadith, stories, articles, prophets, companions, scholars, battles, conquests, kids, videos, YouTube, tafsir, reciters, radio, qibla, tasbeeh, wird, zakat, poetry, competitions, FAQ, platform, legal pages, settings, and the offline library.

Personalized or privileged routes are deliberately excluded from full route caching: `/admin`, `/profile`, `/favorites`, authentication routes, and API mutation endpoints.

## Offline data package

The current manifest contains these datasets:

- 114 surahs
- 6,236 ayahs
- 2 tafsir rows
- 9 hadith books
- 2,964 hadith rows
- 25 prophets
- 150 prophet sections
- 21 battles
- 104 battle events
- 19 conquests
- 60 conquest events
- 26 articles
- 23 duas
- 28 kids records
- 11 companions
- 21 companion stories

The exact counts are validated during hydration, so a partial or corrupted download is not marked as complete.

## Settings and choices

User-local settings are already designed to survive offline operation through browser storage and the existing IndexedDB settings store. Examples include prayer alert choices, salawat reminder choices, and selected audio choices. Server-backed settings require connectivity to be synchronized to Supabase; the application must continue using the last locally stored value when the network is unavailable.

Admin settings are different: actions such as selecting a pinned Android release or changing server-managed media cannot be committed to Supabase while the device is offline. Such actions must report failure rather than pretending that a server change was saved.

## Service worker strategy

- **Offline manifest:** network first, local Cache Storage fallback.
- **Versioned `/offline-content/*`:** cache first, then network when not already cached.
- **Public content APIs:** network first with cached response fallback.
- **Prayer time API:** network first with cached response fallback.
- **HTML:** network first, cached HTML fallback, then `/offline.html`.
- **Static assets:** cache first.
- **Audio/video streams and cross-origin media:** intentionally not intercepted by the service worker.
- **Private/admin/auth APIs:** network only.

## Limitations

Some features cannot be made fully functional without their external service:

- Gemini/AI generation requires network access.
- Live YouTube/Facebook synchronization requires network access.
- Radio/streaming audio from external CDNs requires network access unless a specific file was packaged locally.
- Server writes and account synchronization require network access.
- The native Capacitor shell still needs an initial online load because the project uses the production SSR origin rather than a static-export bundle.

Offline support means the public content and previously prepared application shell remain readable and navigable; it does not mean every live service becomes local.

## Verification

Run:

```bash
pnpm offline:check
pnpm mobile:check
```

Full CI verification also includes `pnpm verify`.

The repository now validates that the offline manifest exists, every declared dataset file exists, sensitive routes are excluded from the offline manifest, the offline pack exposes route caching, and the service worker contains the expected offline-pack logic.

## Manual device test

On an Android device:

1. Open the production app while online.
2. Wait for the service worker registration.
3. Open `/offline-library` and run **"تحديث وتجهيز الحزمة كاملة"**.
4. Verify the page reports all datasets complete and the expected route count cached.
5. Enable Airplane Mode.
6. Relaunch the application.
7. Verify `/`, `/mushaf`, Quran, Hadith, prophets, battles, conquests, articles, kids, and other public cached routes render without network access.
8. Verify local settings and favorites still appear.
9. Reconnect and confirm normal server synchronization resumes.

A physical-device test is still required to certify behavior across Android WebView versions, battery restrictions, force-stop/restart, notification delivery, and storage pressure.

**Last Updated:** 2026-08-28
