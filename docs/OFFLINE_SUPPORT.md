# ZIKR Offline Support

**Last updated: 2026-10-30**  
**Client pack marker:** `offline-content-version-v7`  
**Manifest version:** regenerated from the live public catalog during each CI/production build  
**Service worker cache:** `zikr-v15`  
**IndexedDB schema:** `ZikrOfflineDB` version 6

## What is available offline

ZIKR uses two local storage layers:

1. **IndexedDB** stores the versioned structured public-content package, local favorites, preferences and supported offline queues.
2. **Service Worker + Cache Storage** stores the app shell, explicitly prepared public HTML routes, same-origin static assets and versioned offline-content files.

The native Capacitor application currently uses the production origin `https://zikrmediaofficial.vercel.app`. The first-ever launch therefore needs an internet connection. Once the service worker is installed and the offline package is prepared, the cached public pages and structured content can be read without a network connection.

## Preparing the complete library

Open `/offline-library` while online and press **«تحديث وتجهيز المكتبة كاملة»**.

The action now runs as one verified operation:

- Reads the current manifest and public route snapshot.
- Adds the essential public routes, route snapshot routes, same-origin sitemap routes and the current page inventory.
- Rejects private routes before they are sent to the service worker.
- Downloads each declared dataset and validates that it is a JSON array with the exact manifest record count.
- Downloads and validates every dataset first, then swaps all IndexedDB stores in one read-write transaction. A failed fetch or write leaves the previous dataset pack intact; the completion marker is updated only after the route cache is verified.
- Caches public HTML routes in controlled batches and records route-level failures.
- Persists a completion marker only after every dataset and every required route is verified.
- Shows failed datasets and failed routes instead of reporting a partial download as complete.
- Requests persistent browser storage during the explicit download action when the browser supports it.

The offline page distinguishes **dataset completion** from **full-library completion**. A complete data download with failed route downloads is not marked as a complete library.

## Current structured content package

The manifest is refreshed from currently published/approved Supabase records. It contains:

| Dataset | Records |
|---|---:|
| Surahs | 114 |
| Quran ayahs | 6,236 |
| Tafsir records | 6,236 |
| Hadith books | 9 |
| Published hadith | 2,964 |
| Prophets | 25 |
| Prophet sections | 175 |
| Published battles | 21 |
| Battle events linked to published battles | 84 |
| Published conquests | 15 |
| Conquest events linked to published conquests | 60 |
| Published articles | 38 |
| Published duas | 43 |
| Active, published kids content | 65 |
| Published companions | 12 |
| Companion stories linked to published companions | 21 |
| Published scholars | 8 |
| Published and approved stories | 21 |
| Active, published article categories | 5 |
| Active, published dua categories | 6 |
| Published tawasheeh | 12 |
| Quran reciters | 172 |
| Quran audio references | 19,608 |
| Published kids games | 13 |
| Published kids game levels | 1,170 |

The build-time export produces 25 public datasets. Unpublished article drafts are intentionally excluded. Tables without public records are not fabricated: there are currently no published hadith explanations or memorization plans.

## Public route inventory and privacy

The versioned supplemental route inventory currently contains **259 unique public detail routes**. The offline library also combines this with the manifest route list, essential public section pages and routes discovered from the current sitemap.

The pack deliberately excludes:

- `/api`, `/auth`, `/admin`
- `/profile`, `/favorites`, `/settings`
- `/account`, `/dashboard`
- Cross-origin routes and non-page files such as JSON, scripts, stylesheets, images, audio and video.

The Service Worker applies the same private-route checks as the offline library client, excludes settings/account paths, and fetches public HTML without session cookies. It will not cache a public route that redirects to a private path. Cache cleanup only removes older cache entries with the ZIKR `zikr-` prefix; unrelated same-origin Cache Storage entries are preserved.

Favorites and local preferences remain in their own IndexedDB stores when the user clears the offline content package. The clear action removes downloaded public datasets and cached public routes, not favorites or local settings.

## What does not become offline automatically

Offline support does not turn external services into local services:

- Gemini/AI generation and live YouTube/Facebook synchronization still require internet access.
- Radio streams and external recitation/video media are not downloaded as part of the text-content package. Reciter profiles and Quran audio references are stored, but playback of remote audio still requires a connection.
- Server writes, authentication, profile changes and account synchronization require connectivity.
- A first launch on a fresh install still requires internet because the native shell loads the production SSR origin.
- Notification delivery, background work and storage retention depend on browser/WebView and Android operating-system behavior.

The UI reports these limitations rather than implying that a stream or remote service is available offline.

## Verification commands

Run these checks from the repository root:

```bash
pnpm offline:check
pnpm offline:export # requires Supabase URL and a service-role or public anon key
pnpm mobile:check
pnpm project:check
pnpm typecheck
pnpm lint
pnpm build
```

The offline verifier parses each manifest dataset file and fails when the actual JSON row count differs from the manifest count. It also validates the supplemental route inventory, private-route exclusions, IndexedDB store mappings, cache-version alignment and the full-completion contract.

The full repository gate is:

```bash
pnpm verify
```

## Android device acceptance test

A physical-device test is still required before claiming that every Android WebView/device combination has been certified:

1. Install or update the Android application while online.
2. Open the application once so the service worker registers and activates.
3. Open `/offline-library` and run the full library update.
4. Wait for the UI to report full completion, with zero failed datasets and zero failed routes.
5. Enable Airplane Mode and force-close/reopen the application.
6. Open the home page, Mushaf, Quran, Hadith, articles, duas, prophets, companions, scholars, battles, conquests, stories and kids sections.
7. Confirm that previously downloaded local preferences and favorites remain available.
8. Reconnect and confirm that server-backed functions return to normal.

This test is especially important for Android WebView storage eviction, device storage pressure, force-stop/restart behavior and notifications.

## Build-time content refresh

The prebuild exporter reads public, RLS-protected Supabase content in pages of 1,000 rows and regenerates the JSON files and manifest counts. It includes Quran, the full tafsir corpus, hadith, prophets and sections, battles and events, conquests and events, published articles and duas, dua categories, kids content, companions and stories, scholars, tawasheeh, Quran reciters/audio references, and kids games/levels. It prefers the server-only service-role key but can use the public anon key where the database grants public read access. No user records or admin-only data are exported. Approved user-submitted stories are exported using an explicit public-field selection that omits `user_id` and internal search columns.

The 2026-10-30 content expansion added 10 canonical Quranic duas, 6 original bilingual children's stories, and 25 Quran reading guides. Eleven article drafts remain unpublished for editorial review. Four original poems and three optional tasbeeh counters were added to the static content modules. The new stories and Quranic duas are included in the next build-time offline export.

The project plan requires offline game-result queues to survive content refreshes. The content clear operation intentionally leaves the `gameResultsQueue`, favorites, and local settings stores intact.
