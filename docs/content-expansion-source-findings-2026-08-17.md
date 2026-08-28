# Content Expansion Source Findings — 17 August 2026

## Quran and tafsir

[Al Quran Cloud API](https://alquran.cloud/api) publishes a REST API reference for the Noble Quran, including read, audio/CDN, and developer resources. The existing ZIKR service already uses `https://api.alquran.cloud/v1` for surahs, ayahs, and the `ar.jalalayn` edition, so future Quran/tafsir expansion should reuse the existing server-side service and preserve the edition/source metadata rather than manually copying text.

[Quran Foundation](https://api-docs.quran.foundation/) provides official Content APIs for Quran chapters, verses, translations, tafsir, recitations, and related resources. Its documentation requires a registered backend application for protected integrations; any credentials must remain server-side.

## Hadith

[Sunnah.com Developers](https://sunnah.com/developers) states that its API exposes a portion of its data, is expanded after manual checks, and requires an API key requested through the project issue workflow. It also notes that an offline dump is not yet available. ZIKR must therefore not scrape or bulk-import Sunnah.com content without the required access and permission. The current open hadith seed data must retain collection, book, number, grade, and source references.

## Current expansion baseline from Supabase production

| Section/table | Rows |
|---|---:|
| Quran surahs | 114 |
| Quran ayahs | 6,236 |
| Quran tafsir | 2 |
| Quran audio | 0 |
| Quran reciters | 7 |
| Hadith books | 9 |
| Hadiths | 2,964 |
| Hadith explanations | 0 |
| Duas | 23 |
| Prophets | 25 |
| Prophet sections | 150 |
| Companions | 17 |
| Companion stories | 33 |
| Battles | 21 |
| Battle events | 104 |
| Scholars | 8 |
| Articles | 26 |
| Videos | 9 |
| Tawasheeh | 4 |

## Safe expansion decision

The largest verified opportunities are tafsir, Quran audio, hadith explanations, duas, companions, scholars, articles, videos, and tawasheeh. No religious record should be added solely to increase row counts. Each imported or authored record must carry a source URL or bibliographic reference, a retrieval date, a stable slug/identifier, and a review state. If a source requires an API key or permission that is not configured, the section remains unchanged and the reason is recorded.

## Applied expansion evidence

The following content was applied to Supabase production and verified with read-only counts:

| Expansion | Verified rows | Source coverage |
|---|---:|---:|
| `quran_tafsir` — Tafsir al-Muyassar | 6,236 | 6,236 rows have `source_url` and `retrieved_at` |
| `quran_audio` — 7 reciters × 114 surahs | 798 | 798 rows have `source_url` and `retrieved_at` |
| Quranic duas copied from `quran_ayahs` | 24 | 24 rows have Quran source metadata |

The migration was split into small files because the Supabase MCP request body limit rejected the original 6.1 MB single migration. The production migration versions were recorded by Supabase at execution time and the local filenames were reconciled to those exact versions: `20260817074018` through `20260817074401` for schema, tafsir, and audio, followed by `20260817075255` for Quranic duas.

The audio source templates were checked with HTTP HEAD requests for representative surahs across all seven reciters before insertion. The Quranic duas migration selects the Arabic text directly from the existing `quran_ayahs` table; it does not embed generated or manually invented verse text.

The application now reads source attribution for tafsir on the ayah page, exposes a validated `/api/quran/audio` route, uses database audio rows in the client player with a verified template fallback, and includes source URLs in spiritual retrieval records.

## Educational article expansion

A source-indexed editorial package added **12 original Arabic educational articles**, bringing the production article count from 26 to 38. The articles cover Quran study, memorization, prayer/time management, fasting, family ties, neighbor rights, sīrah research methodology, hadith verification, qibla/prayer technology, dua editorial policy, professional trust, and mental-health support. Each article is explicitly marked in metadata as editorial, not a hadith quotation, and not a fatwa, with a non-empty array of reference URLs. A production read-only check confirmed `total_articles=38`, `new_articles=12`, and `sourced_editorial_articles=12`.

## Media integrity correction

A first media query incorrectly treated `youtube_url` as the video source, while this schema uses `youtube_id`. The deeper production check confirmed all 9 published videos have non-empty YouTube IDs, so they were preserved and their metadata now records `content_source=youtube` and the existing ID. The four published tawasheeh rows used `example.com` placeholder audio URLs; migration `hide_unverified_media` set those rows to unpublished and preserved them with a `publication_block` reason. No media row was deleted, and no replacement URL was invented.
