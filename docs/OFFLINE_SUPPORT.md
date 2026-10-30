# ZIKR Offline Support

## Architecture

ZIKR offline mode uses IndexedDB for structured public datasets, local settings, favorites, and the bounded kids-game result queue. Cache Storage and the Service Worker hold the app shell, explicit public HTML routes, same-origin static assets, and versioned offline datasets. The IndexedDB schema is version 5 and the matching Service Worker/Cache Storage version is `zikr-v14`.

## Full offline library

Open `/offline-library` while online and select **تحديث وتجهيز المكتبة كاملة**. The page:

1. Loads the latest offline manifest, supplemental public route list, and sitemap.
2. Downloads each dataset and atomically replaces its IndexedDB store. A failed refresh cannot leave old rows mixed with the new snapshot.
3. Stops before route caching if any dataset fails validation.
4. Caches public routes in batches of 160; the Service Worker caps each message at 400 routes and uses bounded concurrency.
5. Verifies every expected dataset count and every route in Cache Storage before writing the durable completion marker.

A failed or partial run is never marked complete. Re-running the operation retries the full versioned pack.

## Data coverage

The build-time export refreshes these public content datasets from Supabase: Quran surahs and ayahs, the complete tafsir corpus, hadith books and published hadith, prophets and sections, battles and events, conquests and events, published articles, duas, active published kids content, companions and stories, scholars, published tawasheeh, Quran reciters and audio references, kids games and published levels.

The live database audit on 2026-10-30 found 6,236 tafsir records (the checked-in snapshot previously held only 2), 38 published articles, 33 published duas, 59 active published kids records, 12 published companions, 84 battle events, 15 published conquests, 172 Quran reciters, 19,608 Quran audio references, 8 published scholars, 12 active published tawasheeh, 13 published kids games, and 1,170 published game levels. The exporter refreshes these counts from the source rather than hardcoding them.

The export runs only in the build process and writes public content tables to `public/offline-content/v1`. It prefers `SUPABASE_SERVICE_ROLE_KEY`, but can use `SUPABASE_PUBLIC_KEY`, `SUPABASE_ANON_KEY`, or `NEXT_PUBLIC_SUPABASE_ANON_KEY` because every selected table has public read access governed by its RLS policy. It never writes a key to a file or bundles a service-role key into client code. Run `pnpm offline:export` to require a refresh; normal builds attempt the export when credentials exist and retain the checked-in snapshot when they do not.

## What stays local and what is intentionally excluded

- Local settings, selected choices, favorites, and queued game results are preserved when the content pack is cleared or refreshed.
- Admin, profile, favorites, settings, auth, and API mutation routes are not included in public HTML route caching.
- External audio/video streams are not downloaded automatically. Reciter metadata and audio references may be available offline, but playback of remote files still needs a connection unless the actual file is packaged locally.
- AI generation, live YouTube/Facebook sync, server writes, and account synchronization require connectivity.
- The Capacitor shell uses the production origin, so first launch still requires an internet connection. After service worker registration and full-pack preparation, public cached content can be read offline.

## Verification

```bash
pnpm offline:check
pnpm mobile:check
pnpm offline:export # requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
```

`offline:check` verifies JSON parseability, manifest/file record-count equality, route safety, store mappings, atomic dataset replacement, completion verification, and Service Worker cache-version alignment.

## Android device acceptance test

A physical Android test is still required to certify WebView behavior, force-stop/restart, reboot, storage pressure, and service-worker persistence:

1. Open the app online and visit `/offline-library`.
2. Run the full refresh and wait for the explicit verified-complete message.
3. Confirm the dataset list includes all published content groups and the route count is complete.
4. Enable Airplane Mode and force-stop/reopen the app.
5. Open the Quran, Hadith, Dua, Adhkar, Prophets, Companions, Scholars, Battles, Conquests, Articles, Kids, Audio catalogue, and other cached public routes.
6. Confirm local settings, favorites, and queued game results remain intact.
7. Reconnect and confirm game-result and account synchronization resumes.

Do not mark offline support production-certified until this physical-device acceptance test passes.

**Last updated:** 2026-10-30
