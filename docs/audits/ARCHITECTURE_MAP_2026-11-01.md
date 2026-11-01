# ZIKR Architecture and Route Map — 2026-11-01

## Baseline

- Repository: `zikrofficial-X/Zikr`
- Source baseline: `9e429094ae9f296f1d2875d1d2a648148e7a7f9d`
- Page entries: **132**
- Route handlers: **73** total
- API route handlers: **66**
- Non-API route handlers: **7**
- Admin page entries: **58**
- Dynamic page entries: **16**
- Dynamic API handlers: **4**
- Feature module directories: **39**
- GitHub workflows: **14**
- CircleCI config: `.circleci/config.yml`
- Supabase migrations: **388**

## Runtime ownership map (first pass)

| Area | Feature module directory | Route entries |
|---|---|---:|
| (root) | Shared/multi-feature or no exact folder | 1 |
| about | Shared/multi-feature or no exact folder | 1 |
| adhkar | src/features/adhkar | 1 |
| admin | src/features/admin | 58 |
| articles | src/features/articles | 2 |
| audio | src/features/audio | 1 |
| auth | src/features/auth | 4 |
| battles | src/features/battles | 2 |
| companions | src/features/companions | 2 |
| competitions | src/features/competitions | 1 |
| conquests | src/features/conquests | 2 |
| contact | src/features/contact | 1 |
| content | src/features/content | 1 |
| data-deletion | Shared/multi-feature or no exact folder | 1 |
| dua | src/features/dua | 2 |
| duas | Shared/multi-feature or no exact folder | 1 |
| editorial-policy | Shared/multi-feature or no exact folder | 1 |
| faq | Shared/multi-feature or no exact folder | 1 |
| favorites | src/features/favorites | 1 |
| hadith | src/features/hadith | 3 |
| kids | src/features/kids | 9 |
| knowledge | Shared/multi-feature or no exact folder | 1 |
| library | Shared/multi-feature or no exact folder | 1 |
| memorization | src/features/memorization | 1 |
| mushaf | Shared/multi-feature or no exact folder | 1 |
| offline-library | Shared/multi-feature or no exact folder | 1 |
| platform | Shared/multi-feature or no exact folder | 1 |
| poetry | src/features/poetry | 1 |
| prayer-times | Shared/multi-feature or no exact folder | 1 |
| privacy | Shared/multi-feature or no exact folder | 1 |
| profile | src/features/profile | 1 |
| prophets | src/features/prophets | 2 |
| qibla | src/features/qibla | 1 |
| quran | src/features/quran | 3 |
| radio | Shared/multi-feature or no exact folder | 1 |
| reciters | Shared/multi-feature or no exact folder | 2 |
| scholars | src/features/scholars | 2 |
| search | src/features/search | 1 |
| sections | Shared/multi-feature or no exact folder | 1 |
| settings | Shared/multi-feature or no exact folder | 1 |
| spiritual-ai | src/features/spiritual-ai | 1 |
| stories | src/features/stories | 2 |
| tafsir | Shared/multi-feature or no exact folder | 1 |
| tasbeeh | src/features/tasbeeh | 1 |
| tawasheeh | Shared/multi-feature or no exact folder | 1 |
| terms | Shared/multi-feature or no exact folder | 1 |
| videos | src/features/videos | 2 |
| wird | src/features/wird | 1 |
| youtube | Shared/multi-feature or no exact folder | 1 |
| zakat | src/features/zakat | 1 |

Feature directories:
- `src/features/adhkar/`
- `src/features/admin/`
- `src/features/articles/`
- `src/features/audio/`
- `src/features/auth/`
- `src/features/battles/`
- `src/features/companions/`
- `src/features/competitions/`
- `src/features/conquests/`
- `src/features/contact/`
- `src/features/content/`
- `src/features/content-library/`
- `src/features/dua/`
- `src/features/favorites/`
- `src/features/hadith/`
- `src/features/home/`
- `src/features/kids/`
- `src/features/media/`
- `src/features/memorization/`
- `src/features/notifications/`
- `src/features/offline/`
- `src/features/poetry/`
- `src/features/prayer/`
- `src/features/profile/`
- `src/features/prophets/`
- `src/features/qibla/`
- `src/features/quran/`
- `src/features/releases/`
- `src/features/reminders/`
- `src/features/scholars/`
- `src/features/search/`
- `src/features/site-content/`
- `src/features/social/`
- `src/features/spiritual-ai/`
- `src/features/stories/`
- `src/features/tasbeeh/`
- `src/features/videos/`
- `src/features/wird/`
- `src/features/zakat/`

This is a route-to-feature ownership hint, not a proven import graph. Route handlers may use shared services, adapters, or cross-feature services. Do not infer that a directory is unused because its name does not match the route segment.

## Page route inventory

| URL path | Source file | Route kind |
|---|---|---|
| `/about` | `src/app/about/page.tsx` | Static |
| `/adhkar` | `src/app/adhkar/page.tsx` | Static |
| `/admin/ai-video/curated` | `src/app/admin/ai-video/curated/page.tsx` | Static |
| `/admin/ai-video` | `src/app/admin/ai-video/page.tsx` | Static |
| `/admin/alerts` | `src/app/admin/alerts/page.tsx` | Static |
| `/admin/analytics` | `src/app/admin/analytics/page.tsx` | Static |
| `/admin/android` | `src/app/admin/android/page.tsx` | Static |
| `/admin/audio/adhan` | `src/app/admin/audio/adhan/page.tsx` | Static |
| `/admin/audio` | `src/app/admin/audio/page.tsx` | Static |
| `/admin/audio/quran` | `src/app/admin/audio/quran/page.tsx` | Static |
| `/admin/audio/site-audio` | `src/app/admin/audio/site-audio/page.tsx` | Static |
| `/admin/audio/tts` | `src/app/admin/audio/tts/page.tsx` | Static |
| `/admin/audit` | `src/app/admin/audit/page.tsx` | Static |
| `/admin/automation` | `src/app/admin/automation/page.tsx` | Static |
| `/admin/battles` | `src/app/admin/battles/page.tsx` | Static |
| `/admin/categories` | `src/app/admin/categories/page.tsx` | Static |
| `/admin/content` | `src/app/admin/content/page.tsx` | Static |
| `/admin/control` | `src/app/admin/control/page.tsx` | Static |
| `/admin/editorial` | `src/app/admin/editorial/page.tsx` | Static |
| `/admin/health` | `src/app/admin/health/page.tsx` | Static |
| `/admin/kids/analytics` | `src/app/admin/kids/analytics/page.tsx` | Static |
| `/admin/kids/assets` | `src/app/admin/kids/assets/page.tsx` | Static |
| `/admin/kids/content` | `src/app/admin/kids/content/page.tsx` | Static |
| `/admin/kids/games` | `src/app/admin/kids/games/page.tsx` | Static |
| `/admin/kids/levels` | `src/app/admin/kids/levels/page.tsx` | Static |
| `/admin/kids` | `src/app/admin/kids/page.tsx` | Static |
| `/admin/knowledge` | `src/app/admin/knowledge/page.tsx` | Static |
| `/admin/library` | `src/app/admin/library/page.tsx` | Static |
| `/admin/media` | `src/app/admin/media/page.tsx` | Static |
| `/admin/notifications` | `src/app/admin/notifications/page.tsx` | Static |
| `/admin` | `src/app/admin/page.tsx` | Static |
| `/admin/prophets` | `src/app/admin/prophets/page.tsx` | Static |
| `/admin/queues` | `src/app/admin/queues/page.tsx` | Static |
| `/admin/release` | `src/app/admin/release/page.tsx` | Static |
| `/admin/search` | `src/app/admin/search/page.tsx` | Static |
| `/admin/sections` | `src/app/admin/sections/page.tsx` | Static |
| `/admin/security` | `src/app/admin/security/page.tsx` | Static |
| `/admin/security/step-up` | `src/app/admin/security/step-up/page.tsx` | Static |
| `/admin/seo` | `src/app/admin/seo/page.tsx` | Static |
| `/admin/settings` | `src/app/admin/settings/page.tsx` | Static |
| `/admin/site-audio` | `src/app/admin/site-audio/page.tsx` | Static |
| `/admin/social` | `src/app/admin/social/page.tsx` | Static |
| `/admin/social/youtube-import` | `src/app/admin/social/youtube-import/page.tsx` | Static |
| `/admin/sources` | `src/app/admin/sources/page.tsx` | Static |
| `/admin/users` | `src/app/admin/users/page.tsx` | Static |
| `/admin/video-factory` | `src/app/admin/video-factory/page.tsx` | Static |
| `/admin/video-factory/publishing` | `src/app/admin/video-factory/publishing/page.tsx` | Static |
| `/admin/video-factory/qa` | `src/app/admin/video-factory/qa/page.tsx` | Static |
| `/admin/video-factory/queue` | `src/app/admin/video-factory/queue/page.tsx` | Static |
| `/admin/video-factory/scheduler` | `src/app/admin/video-factory/scheduler/page.tsx` | Static |
| `/admin/video-factory/scripts` | `src/app/admin/video-factory/scripts/page.tsx` | Static |
| `/admin/video-factory/sources` | `src/app/admin/video-factory/sources/page.tsx` | Static |
| `/admin/video-factory/templates` | `src/app/admin/video-factory/templates/page.tsx` | Static |
| `/admin/video-factory/visuals` | `src/app/admin/video-factory/visuals/page.tsx` | Static |
| `/admin/video-factory/voices` | `src/app/admin/video-factory/voices/page.tsx` | Static |
| `/admin/video` | `src/app/admin/video/page.tsx` | Static |
| `/admin/video/requests` | `src/app/admin/video/requests/page.tsx` | Static |
| `/admin/video/studio/curated` | `src/app/admin/video/studio/curated/page.tsx` | Static |
| `/admin/video/studio` | `src/app/admin/video/studio/page.tsx` | Static |
| `/admin/videos` | `src/app/admin/videos/page.tsx` | Static |
| `/articles/[slug]` | `src/app/articles/[slug]/page.tsx` | Dynamic |
| `/articles` | `src/app/articles/page.tsx` | Static |
| `/audio` | `src/app/audio/page.tsx` | Static |
| `/auth/forgot` | `src/app/auth/forgot/page.tsx` | Static |
| `/auth/login` | `src/app/auth/login/page.tsx` | Static |
| `/auth/register` | `src/app/auth/register/page.tsx` | Static |
| `/auth/reset` | `src/app/auth/reset/page.tsx` | Static |
| `/battles/[slug]` | `src/app/battles/[slug]/page.tsx` | Dynamic |
| `/battles` | `src/app/battles/page.tsx` | Static |
| `/companions/[slug]` | `src/app/companions/[slug]/page.tsx` | Dynamic |
| `/companions` | `src/app/companions/page.tsx` | Static |
| `/competitions` | `src/app/competitions/page.tsx` | Static |
| `/conquests/[slug]` | `src/app/conquests/[slug]/page.tsx` | Dynamic |
| `/conquests` | `src/app/conquests/page.tsx` | Static |
| `/contact` | `src/app/contact/page.tsx` | Static |
| `/content/[slug]` | `src/app/content/[slug]/page.tsx` | Dynamic |
| `/data-deletion` | `src/app/data-deletion/page.tsx` | Static |
| `/dua/[slug]` | `src/app/dua/[slug]/page.tsx` | Dynamic |
| `/dua` | `src/app/dua/page.tsx` | Static |
| `/duas` | `src/app/duas/page.tsx` | Static |
| `/editorial-policy` | `src/app/editorial-policy/page.tsx` | Static |
| `/faq` | `src/app/faq/page.tsx` | Static |
| `/favorites` | `src/app/favorites/page.tsx` | Static |
| `/hadith/[book]/[id]` | `src/app/hadith/[book]/[id]/page.tsx` | Dynamic |
| `/hadith/[book]` | `src/app/hadith/[book]/page.tsx` | Dynamic |
| `/hadith` | `src/app/hadith/page.tsx` | Static |
| `/kids/[slug]` | `src/app/kids/[slug]/page.tsx` | Dynamic |
| `/kids/achievements` | `src/app/kids/achievements/page.tsx` | Static |
| `/kids/adventures` | `src/app/kids/adventures/page.tsx` | Static |
| `/kids/audio` | `src/app/kids/audio/page.tsx` | Static |
| `/kids/games` | `src/app/kids/games/page.tsx` | Static |
| `/kids` | `src/app/kids/page.tsx` | Static |
| `/kids/parent-dashboard` | `src/app/kids/parent-dashboard/page.tsx` | Static |
| `/kids/progress` | `src/app/kids/progress/page.tsx` | Static |
| `/kids/puzzle` | `src/app/kids/puzzle/page.tsx` | Static |
| `/knowledge` | `src/app/knowledge/page.tsx` | Static |
| `/library` | `src/app/library/page.tsx` | Static |
| `/memorization` | `src/app/memorization/page.tsx` | Static |
| `/mushaf` | `src/app/mushaf/page.tsx` | Static |
| `/offline-library` | `src/app/offline-library/page.tsx` | Static |
| `/` | `src/app/page.tsx` | Static |
| `/platform` | `src/app/platform/page.tsx` | Static |
| `/poetry` | `src/app/poetry/page.tsx` | Static |
| `/prayer-times` | `src/app/prayer-times/page.tsx` | Static |
| `/privacy` | `src/app/privacy/page.tsx` | Static |
| `/profile` | `src/app/profile/page.tsx` | Static |
| `/prophets/[slug]` | `src/app/prophets/[slug]/page.tsx` | Dynamic |
| `/prophets` | `src/app/prophets/page.tsx` | Static |
| `/qibla` | `src/app/qibla/page.tsx` | Static |
| `/quran/[surah]/[ayah]` | `src/app/quran/[surah]/[ayah]/page.tsx` | Dynamic |
| `/quran/[surah]` | `src/app/quran/[surah]/page.tsx` | Dynamic |
| `/quran` | `src/app/quran/page.tsx` | Static |
| `/radio` | `src/app/radio/page.tsx` | Static |
| `/reciters/[slug]` | `src/app/reciters/[slug]/page.tsx` | Dynamic |
| `/reciters` | `src/app/reciters/page.tsx` | Static |
| `/scholars/[slug]` | `src/app/scholars/[slug]/page.tsx` | Dynamic |
| `/scholars` | `src/app/scholars/page.tsx` | Static |
| `/search` | `src/app/search/page.tsx` | Static |
| `/sections` | `src/app/sections/page.tsx` | Static |
| `/settings` | `src/app/settings/page.tsx` | Static |
| `/spiritual-ai` | `src/app/spiritual-ai/page.tsx` | Static |
| `/stories/[slug]` | `src/app/stories/[slug]/page.tsx` | Dynamic |
| `/stories` | `src/app/stories/page.tsx` | Static |
| `/tafsir` | `src/app/tafsir/page.tsx` | Static |
| `/tasbeeh` | `src/app/tasbeeh/page.tsx` | Static |
| `/tawasheeh` | `src/app/tawasheeh/page.tsx` | Static |
| `/terms` | `src/app/terms/page.tsx` | Static |
| `/videos/[slug]` | `src/app/videos/[slug]/page.tsx` | Dynamic |
| `/videos` | `src/app/videos/page.tsx` | Static |
| `/wird` | `src/app/wird/page.tsx` | Static |
| `/youtube` | `src/app/youtube/page.tsx` | Static |
| `/zakat` | `src/app/zakat/page.tsx` | Static |

## API route inventory

| URL path | Source file | Route kind |
|---|---|---|
| `/api/admin/analytics` | `src/app/api/admin/analytics/route.ts` | Static |
| `/api/admin/cloudinary/image` | `src/app/api/admin/cloudinary/image/route.ts` | Static |
| `/api/admin/content` | `src/app/api/admin/content/route.ts` | Static |
| `/api/admin/media` | `src/app/api/admin/media/route.ts` | Static |
| `/api/admin/overview` | `src/app/api/admin/overview/route.ts` | Static |
| `/api/admin/page-view` | `src/app/api/admin/page-view/route.ts` | Static |
| `/api/admin/sections` | `src/app/api/admin/sections/route.ts` | Static |
| `/api/admin/site-audio` | `src/app/api/admin/site-audio/route.ts` | Static |
| `/api/admin/site-audio/upload` | `src/app/api/admin/site-audio/upload/route.ts` | Static |
| `/api/admin/social/facebook/callback` | `src/app/api/admin/social/facebook/callback/route.ts` | Static |
| `/api/admin/social/facebook/connect` | `src/app/api/admin/social/facebook/connect/route.ts` | Static |
| `/api/admin/social` | `src/app/api/admin/social/route.ts` | Static |
| `/api/admin/video-generation/narration-upload` | `src/app/api/admin/video-generation/narration-upload/route.ts` | Static |
| `/api/admin/video-generation` | `src/app/api/admin/video-generation/route.ts` | Static |
| `/api/admin/video-generation/sources` | `src/app/api/admin/video-generation/sources/route.ts` | Static |
| `/api/admin/videos/[id]/retry` | `src/app/api/admin/videos/[id]/retry/route.ts` | Dynamic |
| `/api/admin/videos/[id]` | `src/app/api/admin/videos/[id]/route.ts` | Dynamic |
| `/api/admin/videos/create` | `src/app/api/admin/videos/create/route.ts` | Static |
| `/api/admin/videos` | `src/app/api/admin/videos/route.ts` | Static |
| `/api/admin/videos/upload` | `src/app/api/admin/videos/upload/route.ts` | Static |
| `/api/admin/youtube-facebook/register-media` | `src/app/api/admin/youtube-facebook/register-media/route.ts` | Static |
| `/api/admin/youtube-facebook/upload-url` | `src/app/api/admin/youtube-facebook/upload-url/route.ts` | Static |
| `/api/app-version` | `src/app/api/app-version/route.ts` | Static |
| `/api/auth/profile-sync` | `src/app/api/auth/profile-sync/route.ts` | Static |
| `/api/contact` | `src/app/api/contact/route.ts` | Static |
| `/api/content/articles` | `src/app/api/content/articles/route.ts` | Static |
| `/api/content/companions` | `src/app/api/content/companions/route.ts` | Static |
| `/api/content/prophets` | `src/app/api/content/prophets/route.ts` | Static |
| `/api/content/stats` | `src/app/api/content/stats/route.ts` | Static |
| `/api/content/stories` | `src/app/api/content/stories/route.ts` | Static |
| `/api/content/videos/[slug]` | `src/app/api/content/videos/[slug]/route.ts` | Dynamic |
| `/api/download/android/aab` | `src/app/api/download/android/aab/route.ts` | Static |
| `/api/download/android` | `src/app/api/download/android/route.ts` | Static |
| `/api/duas/categories` | `src/app/api/duas/categories/route.ts` | Static |
| `/api/duas` | `src/app/api/duas/route.ts` | Static |
| `/api/geocode/reverse` | `src/app/api/geocode/reverse/route.ts` | Static |
| `/api/hadith/books` | `src/app/api/hadith/books/route.ts` | Static |
| `/api/health` | `src/app/api/health/route.ts` | Static |
| `/api/internal/youtube-facebook/cleanup-media` | `src/app/api/internal/youtube-facebook/cleanup-media/route.ts` | Static |
| `/api/kids/content/[slug]` | `src/app/api/kids/content/[slug]/route.ts` | Dynamic |
| `/api/kids/content` | `src/app/api/kids/content/route.ts` | Static |
| `/api/kids/games/achievements` | `src/app/api/kids/games/achievements/route.ts` | Static |
| `/api/kids/games/progress` | `src/app/api/kids/games/progress/route.ts` | Static |
| `/api/kids/games/score` | `src/app/api/kids/games/score/route.ts` | Static |
| `/api/kids/games/submit-result` | `src/app/api/kids/games/submit-result/route.ts` | Static |
| `/api/kids/games/validate` | `src/app/api/kids/games/validate/route.ts` | Static |
| `/api/kids/games/verse` | `src/app/api/kids/games/verse/route.ts` | Static |
| `/api/kids/track-share` | `src/app/api/kids/track-share/route.ts` | Static |
| `/api/poetry-insight` | `src/app/api/poetry-insight/route.ts` | Static |
| `/api/prayer-location` | `src/app/api/prayer-location/route.ts` | Static |
| `/api/prayer-times` | `src/app/api/prayer-times/route.ts` | Static |
| `/api/push/public-key` | `src/app/api/push/public-key/route.ts` | Static |
| `/api/push/subscription` | `src/app/api/push/subscription/route.ts` | Static |
| `/api/quran/audio` | `src/app/api/quran/audio/route.ts` | Static |
| `/api/quran/reciters` | `src/app/api/quran/reciters/route.ts` | Static |
| `/api/quran/surahs` | `src/app/api/quran/surahs/route.ts` | Static |
| `/api/reminders/background` | `src/app/api/reminders/background/route.ts` | Static |
| `/api/search` | `src/app/api/search/route.ts` | Static |
| `/api/site-audio` | `src/app/api/site-audio/route.ts` | Static |
| `/api/site-settings` | `src/app/api/site-settings/route.ts` | Static |
| `/api/storage/presign` | `src/app/api/storage/presign/route.ts` | Static |
| `/api/tawasheeh/categories` | `src/app/api/tawasheeh/categories/route.ts` | Static |
| `/api/tawasheeh` | `src/app/api/tawasheeh/route.ts` | Static |
| `/api/user/favorites` | `src/app/api/user/favorites/route.ts` | Static |
| `/api/user/notifications` | `src/app/api/user/notifications/route.ts` | Static |
| `/api/user/profile` | `src/app/api/user/profile/route.ts` | Static |

## Non-API route handlers

| URL path | Source file |
|---|---|
| `/.well-known/apple-app-site-association` | `src/app/.well-known/apple-app-site-association/route.ts` |
| `/.well-known/assetlinks.json` | `src/app/.well-known/assetlinks.json/route.ts` |
| `/auth/callback` | `src/app/auth/callback/route.ts` |
| `/auth/google` | `src/app/auth/google/route.ts` |
| `/llms.txt` | `src/app/llms.txt/route.ts` |
| `/sitemap-content/[id]` | `src/app/sitemap-content/[id]/route.ts` |
| `/sitemap-index.xml` | `src/app/sitemap-index.xml/route.ts` |

## Dependency graph checkpoint

The repository contains a static route inventory and feature ownership map. A complete dependency graph still requires tracing:
- TypeScript/TSX imports and re-exports (including alias and dynamic imports);
- Next.js server actions and client/server boundaries;
- route handlers to service modules and external providers;
- scheduled GitHub/CircleCI workers to scripts and environment variables;
- SQL tables, views, triggers, RPC functions, and storage buckets to their callers;
- native Capacitor plugins to Android/iOS configuration.

No file is classified as unused or deleted based on route naming alone. Phase 2 remains open until those dependency edges are generated and cross-checked against runtime logs and the production database inventory.
