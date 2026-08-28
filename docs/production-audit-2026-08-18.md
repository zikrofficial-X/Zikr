
## Vercel deployment verification

- Deployment: `dpl_DdLatbeVQ432MjFLS7vpwk1Rtjet`
- Commit: `8ed7d058f2badcb39597b80c0dbfb66a3bfeb574`
- State: `READY`
- Alias: `https://zikr-git-main-zikr.vercel.app`
- Homepage loaded with the Arabic-first navigation, search, prayer-time cards, six featured cards, expanded library grid, statistics, footer, and PWA install prompt.
- Public stats endpoint returned: 114 surahs, 6236 ayahs, 6236 tafsir entries, 2964 hadiths, 47 duas, 46 articles, 25 prophets, 12 companions, 8 scholars, 21 battles, 19 conquests, and 37 kids content rows.
- No 5xx response was observed for the homepage or stats endpoint.

## Quran route verification

The deployed `/quran` page loaded successfully. It rendered the search field and the complete 114-surah index with Arabic names, transliterations, ayah counts, and links such as `/quran/1` through `/quran/114`. No error page or failed top-level response appeared during this check.

## Hadith route verification

The deployed `/hadith` page loaded successfully. It rendered selected hadith cards, six hadith-book links, the search entry point, and the main navigation without a top-level runtime error. The database audit separately confirms 2,964 hadith rows and nine hadith books in Supabase; the page presents the supported six-book catalogue.

## Prophets route verification

The deployed `/prophets` page loaded successfully and rendered all 25 named prophets with individual links. The page displayed the full-content framing and live summary values (25 prophets, 6,236 Quran ayahs, and the expanded story-section count). The cards expose the detailed pages rather than replacing them with a static list-only experience.

## Mushaf route verification

The deployed `/mushaf` page loaded successfully. It displayed the Mushaf header, 114-surah and 6,236-ayah indicators, the Quran index/search, and links intended for reading, tafsir, and recitation. No top-level error was observed.

## Production domain HTTP smoke

The real domain `https://zikrmediaofficial.vercel.app` returned successful responses for all 40 checked public pages, content APIs, PWA manifest, robots, and sitemap endpoints. Thirty-nine checks returned 200; `/memorization` returned the expected 307 protected-route redirect for anonymous visitors and was still classified as reachable. No 4xx or 5xx response was found.

The preview alias `zikr-git-main-zikr.vercel.app` is protected by Vercel SSO and therefore returns 302 to `vercel.com/sso-api` for unauthenticated HTTP clients; this is preview protection, not a production route failure. The production domain remains publicly reachable.

## Articles route verification

The production `/articles` page loaded successfully after the OAuth-fix deployment. It displayed 52 published articles, category filters, article cards, author labels, and links to detail pages. The visible titles include source-verification, Quran reflection, prayer, family, ethics, study, and practical-life topics; the editorial metadata keeps original educational writing separate from quoted religious text.

## Runtime verification after OAuth deployment

Vercel runtime error aggregation for the last hour reported no runtime errors after production deployment `dpl_5TdrysrKeXYNRd2cBn5zrWJcrvJK`. The earlier historical `invalid flow state` cluster was addressed by classifying stale flow state as a recoverable OAuth restart and adding a regression test.
