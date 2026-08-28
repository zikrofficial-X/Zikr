# Mushaf and Slow 3G Audit — 2026-08-15

## Mushaf route

The canonical Mushaf page is implemented at `app/mushaf/page.tsx`, uses the route `/mushaf`, and is live at https://zikrmediaofficial.vercel.app/mushaf. It renders the title `المصحف الشريف`, states 114 surahs and 6236 ayahs, links to `/quran`, and delegates the surah catalogue to `app/quran/page.tsx`. The production browser opened `/mushaf` successfully and displayed the surah search and catalogue.

The Service Worker static shell explicitly includes `/mushaf`, `/quran`, `/prayer-times`, `/adhkar`, and other core routes. Its current cache name is `zikr-v7`. It network-first caches same-origin HTML and selected public content APIs, falls back to cached HTML/offline.html for failed HTML requests, and leaves authenticated APIs, external media, audio, and video requests network-only.

## Slow 3G test design

The test must cover first load with a deliberately delayed network, Service Worker registration after the performance delay, retry behavior when the connection is initially unsuitable, cache population and offline fallback for `/mushaf` and `/quran`, the `SHOW_PRAYER_NOTIFICATION` and `SHOW_DHIKR_NOTIFICATION` client messages, encrypted Web Push fallback behavior, notification click routing, and absence of duplicate registrations or duplicate hydration attempts. Browser notification display cannot be fully confirmed in a headless environment without a real permission-capable browser profile; event dispatch and Service Worker handler completion can still be tested with controlled mocks.

## Performance improvements that do not touch Offline files

Safe next improvements include reducing global client JavaScript by moving more static shell UI to Server Components, loading the star canvas only after idle or disabling it on low-end/slow devices, replacing repeated inline SVG/large global client dependencies where measurable, reserving fixed space for the install prompt rather than mounting it late, and reducing third-party script scope. These should be implemented only after the Slow 3G and notification behavior is verified. Offline JSON files must remain unchanged.

## Final production result

The deployed Service Worker fix was tested on `https://zikrmediaofficial.vercel.app/mushaf` under a 400 ms latency and approximately 50 KB/s download/upload profile, followed by a forced offline interval and recovery.

| Check | Result |
|---|---|
| Mushaf first render | Passed: title and surah search rendered |
| Service Worker | Passed: active and controlling the page |
| Forced offline state | Passed: browser reported offline while the Service Worker remained controlling |
| Offline Mushaf probe | Passed: `/mushaf` returned HTTP 200 and contained `المصحف الشريف` while offline |
| Direct prayer notification | Passed: notification shown |
| Direct dhikr/salawat notification | Passed: notification shown |
| Push handler simulation | Passed: safe Push notification created |
| Notification click handler | Passed: `/mushaf` target handled and existing client routing path exercised |
| Browser console errors | 0 |
| Unexpected browser page errors | 0 |

The isolated Service Worker handler test registered and exercised `install`, `activate`, `fetch`, `message`, `push`, and `notificationclick`, and produced three expected simulated notifications: prayer, salawat, and Push. The browser-level test produced two direct notifications because the encrypted Push event was covered by the isolated worker-handler test, avoiding duplicate real notifications.

The test completed with exit code 0 in approximately 44 seconds. The production deployment containing the Service Worker fix is `dpl_6D9UVBLESiNHUgwy1g5u5GfXaQfk`, associated with commit `01d170b`.
