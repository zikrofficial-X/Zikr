# ZIKR — Content & Page Audit

Date: 29 September 2026
Repository: zikr-org/Zikr
Branch: main

## Scope

The page inventory covers 100 page routes: 70 public-facing pages and 30 admin pages. The route tree was enumerated from GitHub and the public pages were scanned for content size, headings, data/service usage, forms, explicit empty-state text, and placeholder/development wording.

The audit distinguishes between a genuinely weak/empty page, a thin route wrapper that delegates to a feature component, an intentional redirect/alias, and a data-driven page whose content is supplied from Supabase.

## Targeted content improvements implemented

- /adhkar — usage guide plus primary source links for selected adhkar references.
- /quran — reading/listening guide and source/architecture notes.
- /prayer-times — location, calculation, fallback, and notification guidance.
- /qibla — bearing/compass/location guidance and accuracy notes.
- /scholars — editorial methodology and source-handling guidance.
- /tafsir — explanation of the distinction between Quran text and tafsir material.
- /kids/achievements — parent/child usage and purpose guidance.
- /kids/audio — audio content and recording guidance.
- /kids/games — educational-game usage and safety guidance.
- /kids/progress — interpretation of progress and non-competitive usage.
- /offline-library — clear offline scope and external-data limitations.
- /tasbeeh — clarified that the counter is a technical tool and that specific religious claims require sources.

A reusable ContentGuide component was added at src/components/content/content-guide.tsx to keep these explanatory blocks consistent.

## Thin routes that were explicitly checked

- src/app/admin/control/page.tsx — 351 bytes (thin route wrapper or redirect; reviewed as delegation rather than missing content)
- src/app/admin/site-audio/page.tsx — 547 bytes (thin route wrapper or redirect; reviewed as delegation rather than missing content)
- src/app/auth/forgot/page.tsx — 381 bytes (thin route wrapper or redirect; reviewed as delegation rather than missing content)
- src/app/auth/register/page.tsx — 151 bytes (thin route wrapper or redirect; reviewed as delegation rather than missing content)
- src/app/auth/reset/page.tsx — 167 bytes (thin route wrapper or redirect; reviewed as delegation rather than missing content)
- src/app/duas/page.tsx — 417 bytes (thin route wrapper or redirect; reviewed as delegation rather than missing content)
- src/app/kids/progress/page.tsx — 585 bytes (thin route wrapper or redirect; reviewed as delegation rather than missing content)

These thin files are mostly intentional delegation to feature components. Examples include the Quran, prayer-times, Qibla, scholars, kids, authentication, and offline-library routes. Their file size alone must not be interpreted as an empty page.

## Content-quality findings

### Strong/data-driven areas

The following families already contain substantial UI/data handling and were treated as content systems rather than simple static pages:

- Quran catalog, surah, ayah and tafsir
- Hadith
- Articles
- Stories
- Companions
- Prophets
- Battles and conquests
- Videos and radio
- Reciters
- Prayer times and Qibla
- Kids adventures, puzzle and core games
- Spiritual AI
- Poetry
- Search
- Profile/settings
- Library/memorization
- Editorial policy, FAQ, privacy and contact

### Empty-state policy

Where a page is data-driven, an empty database result is handled as an explicit state rather than silently inventing content. This is intentional for scholars, prophets, battles, companions, stories, videos, and other catalog pages.

### Religious-content policy for this project

New explanatory content added during this audit is operational/editorial guidance unless a specific source is linked. Specific Quranic or hadith claims should remain tied to a named source. The /adhkar guidance links to Quran.com and Sunnah.com references for the cited examples.

## Remaining work

The next content pass should focus on database-backed depth, not adding filler to route components:

- audit every published article/story/prophet/companion/scholar record for length, source, Arabic quality, metadata, and missing sections;
- identify database categories with zero or very low published records;
- expand those records from approved, source-verified material;
- then re-run the content integrity, AdSense, route, and build checks.

This avoids the common failure mode of making pages look full while their underlying content catalog remains weak.
