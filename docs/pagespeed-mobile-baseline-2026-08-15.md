# Zikr Mobile PageSpeed Baseline — 2026-08-15

Source report: https://pagespeed.web.dev/analysis/https-zikrmediaofficial-vercel-app/fjpw06s5g2?hl=en&form_factor=mobile

The report was captured on 2026-08-15 at 06:59 UTC using Lighthouse 13.4.1, emulated Moto G Power, slow 4G, initial page load.

| Metric | Baseline |
|---|---:|
| Performance | 68 |
| Accessibility | 96 |
| Best Practices | 88 |
| SEO | 100 |
| First Contentful Paint | 0.9 s |
| Largest Contentful Paint | 2.6 s |
| Total Blocking Time | 530 ms |
| Cumulative Layout Shift | 0.312 |
| Speed Index | 2.2 s |
| Total network payload | 3,752 KiB |
| Main-thread work | 2.8 s |
| JavaScript execution | 1.3 s |
| Long tasks | 8 |

## Reported opportunities and diagnostics

The report identified render-blocking requests with estimated savings of 230 ms; layout shift culprits; a critical request dependency chain; inefficient cache lifetimes with estimated savings of 16 KiB; legacy JavaScript with estimated savings of 14 KiB; third-party code; unused JavaScript with estimated savings of 268 KiB; unused CSS with estimated savings of 11 KiB; excessive main-thread work; JavaScript execution time; an enormous network payload; and eight long main-thread tasks.

Best Practices also reported browser console errors/issues and a geolocation permission request on page load. Accessibility reported a contrast opportunity. SEO passed at 100.

## Initial code evidence

The root layout is force-dynamic because the navbar reads Supabase session cookies. It mounts SiteShell, Vercel Analytics, Speed Insights, Service Worker registration, native bridge, PWA prompts, prayer alerts, notification permission UI, and an idle-delayed AdSense/Funding Choices loader on every route. The homepage is a client component and contains an animated star canvas, a one-second clock interval, offline IndexedDB initialization, a client Supabase auth lookup, and an immediate geolocation request followed by an Aladhan prayer-time request. The homepage uses no obvious LCP image; the hero is text/gradient based.

Potential root causes to validate in the build and runtime include the large client graph caused by the client homepage and global client shell, immediate permission/geolocation work, third-party AdSense/analytics/Speed Insights execution, global client components, layout shift from late-mounted banners/prompts, and production cache/header behavior. Do not remove authentication, prayer calculations, notification behavior, or religious content; fixes must defer non-critical work and reserve layout space rather than replace functionality.

The PageSpeed API endpoint returned HTTP 429 during a direct re-fetch, so the supplied report and production/network inspection remain the authoritative baseline for this pass.

## Production inspection

The production homepage returned Brotli-compressed HTML, with `content-type: text/html`, `cache-control: private, no-cache, no-store, max-age=0, must-revalidate`, and `x-vercel-cache: MISS` at the inspection time. The HTML was approximately 90,031 bytes and referenced one CSS bundle plus multiple route/runtime JavaScript chunks. The downloaded route assets were approximately 1.0 MiB uncompressed before third-party resources; the largest JS chunks were about 252 KiB, 228 KiB, 156 KiB, and 113 KiB.

The live homepage was visually and semantically present, including Arabic RTL navigation, prayer times, search, content cards, and install prompt. The browser console view showed no console output during the inspection session, although PageSpeed had reported browser errors/issues in its own Lighthouse run. The homepage currently includes a visible install prompt near the bottom of the initial document and requests geolocation from the homepage prayer-time effect.

## Local production validation after first fixes

The local production build started successfully and the homepage rendered the full Arabic navigation, search form, prayer cards, location button, featured content, Quran statistics, CTA, footer, and install prompt. The newly added `موقعي` control is user-triggered rather than an automatic geolocation request. The browser console was empty on the local production page after hydration.

## Production deployment validation

Commit `d1cf752` created production deployment `dpl_FQU76EoGS1h4gkLsk6Pesu9JSv4X`, which reached `READY` and is aliased to `https://zikrmediaofficial.vercel.app`. The live page rendered prayer times, search, navigation, content cards, and the user-triggered location control. The production browser console was empty during the validation session.

The local asset comparison showed the initial route assets drop from 14 to 13 files, from 1,042,606 to 1,012,123 raw bytes and from 298,406 to 288,075 gzip bytes. Initial HTML dropped from 90,031 to 83,508 bytes. These are route-asset comparisons between the previous production deployment and the new local production build, not a replacement for the final PageSpeed lab score.

## Final PageSpeed rerun

A fresh PageSpeed Insights Mobile analysis was started for `https://zikrmediaofficial.vercel.app/` after deployment `dpl_FQU76EoGS1h4gkLsk6Pesu9JSv4X`. The result is still loading at this checkpoint and will be recorded when complete.

## Fresh PageSpeed result after deployment

The fresh Mobile report was captured at 2026-08-15 07:22:27 UTC using the same Lighthouse 13.4.1 mobile setup. The score improved from 68 to 99. Accessibility remained 96, Best Practices improved from 88 to 92, SEO remained 100, and Agentic Browsing reported 2/2.

| Metric | Before | After |
|---|---:|---:|
| Performance | 68 | 99 |
| First Contentful Paint | 0.9 s | 0.9 s |
| Largest Contentful Paint | 2.6 s | 1.8 s |
| Total Blocking Time | 530 ms | 74 ms |
| Cumulative Layout Shift | 0.312 | 0.01 |
| Speed Index | 2.2 s | 2.4 s |

The new report reduced long tasks from 8 to 4 and no longer listed the previous `Minimize main-thread work` and `Reduce JavaScript execution time` diagnostics in the visible result. Remaining insights include render-blocking CSS with estimated savings of 110 ms, cache lifetimes mainly involving third-party resources, legacy JavaScript estimated savings of 14 KiB, unused JavaScript estimated savings of 265 KiB, unused CSS estimated savings of 11 KiB, layout-shift investigation, LCP breakdown, third-party code, and document request latency/DOM-size/manual checks.

A second fresh PageSpeed Mobile run was started after deployment `dpl_Ge7vEQfVCpkfJABbQCxFZAr5YB7P` reached `READY`. At this checkpoint PageSpeed was still showing `Running analysis / data loading`; the final result will be captured after completion.

The second PageSpeed run for deployment `dpl_Ge7vEQfVCpkfJABbQCxFZAr5YB7P` was still displaying `loading` after repeated checks, even though Vercel reported the deployment `READY`. The earlier completed fresh run at 07:22:27 UTC remains the authoritative post-fix measurement for this task; the second run is retained as an attempted confirmation and is not counted as a score.

## Final functional verification

The final `pnpm verify` exited 0: 121 migration checks passed, local import and mobile readiness checks passed, 56 tests passed with 0 failures, TypeScript and ESLint passed, and the Next.js production build completed. The production smoke test also exited 0: `/`, Quran routes, Hadith, Dua, search, settings, protected redirects, and anonymous Supabase reads for Quran, Hadith, Duas, and Videos all returned the expected HTTP statuses.

## References

[1] [PageSpeed Insights report supplied by the user](https://pagespeed.web.dev/analysis/https-zikrmediaofficial-vercel-app/fjpw06s5g2?hl=en&form_factor=mobile)

[2] [Fresh PageSpeed Insights Mobile run after the first performance deployment](https://pagespeed.web.dev/analysis/https-zikrmediaofficial-vercel-app/wnlfi4l70k?form_factor=mobile)

[3] [Google Lighthouse performance scoring documentation](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/)

## PWA safety follow-up

After adding retry logic for slow connections, the local production build passed TypeScript, ESLint, and Next build. In the browser, the page rendered normally and `navigator.serviceWorker.getRegistrations()` returned one active registration with scope `/`, an active controller, online connectivity, and a 4G/no-Data-Saver connection. This confirms the delayed registration still results in an active controlling Service Worker.

The follow-up full verification after the retry change exited 0: 121 Supabase migration checks passed, imports and mobile readiness passed, 56 tests passed with 0 failures, and the Next.js production build completed. The browser console remained free of runtime errors after the active Service Worker was registered.

## Live production PWA validation after retry fix

After deployment `dpl_FoJwYtfx5TTKQ4kPGGnXZVtm6wgg` reached `READY` and was aliased to `https://zikrmediaofficial.vercel.app`, the live homepage rendered normally. Browser inspection returned one active Service Worker controlling the official origin with no waiting worker. The browser was online and `Notification.permission` remained `default`, confirming the page did not trigger an automatic notification permission prompt during passive load.

## Follow-up clarification and hardening

The first performance implementation correctly preserved Service Worker registration, but its initial offline hydration attempt skipped 2G/Data Saver sessions without an explicit retry. This was hardened in commit `1a61aaf`: the offline pack now retries after `online`, connection-type changes, focus, visibility changes, and the existing 60-second update cycle. Hydration remains deduplicated and only runs when the connection is suitable.

The Capacitor native bridge is intentionally mounted directly in the root layout rather than behind the web performance delay. This preserves immediate native deep-link listeners, SplashScreen handling, StatusBar setup, push/local notification permission flow, and native network events. The web-only PWA, prayer-alert provider, and third-party scripts remain deferred. After this hardening, the full verification suite exited 0 with 56 passing tests and 0 failures, and the production build completed.

The final hardening deployment `dpl_4FkmaBtTRjCLUdt23ctuYgXwMJn8` reached `READY` and was aliased to the official origin. The live browser check returned a normal homepage, one active Service Worker controlling `https://zikrmediaofficial.vercel.app/`, no waiting worker, online status, and notification permission `default` without an automatic prompt.
