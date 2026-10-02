# Phase 7 — Content Canonicalization
## ZIKR Finalization — 2026-10-02

### Objective

Make the public content catalogue deterministic: the published Supabase catalogue is authoritative whenever it has records; offline/static datasets remain cold fallbacks only.

### Live content audit performed before implementation

Current production counts:

| Content | Total | Published |
|---|---:|---:|
| Articles | 91 | 51 |
| Stories | 21 | 21 |
| Duas | 33 | 33 |
| Prophets | 25 | 25 |
| Companions | 17 | 12 |
| Scholars | 8 | 8 |
| Videos | 17 | 17 |
| Hadiths | 2,964 | published catalogue |

Canonical slug duplication was **0 groups** across articles, stories, duas, prophets, companions, scholars, and videos. The database already has unique slug indexes for those canonical content tables.

### Quality findings

- Articles: 13 published rows are below the existing 1,800-character public threshold. They are already filtered from article detail/public-quality output.
- Duas: 19 rows are below the existing 80-character public detail threshold. Detail pages already reject those rows; Phase 7 keeps this behavior.
- Companion, prophet, and scholar biography length alone is not treated as a publication failure because those domains expose structured stories/sections or intentionally concise profiles.
- No destructive content rewrite was performed.

### Code changes

- Added `resolveCanonicalPublished()` to `src/lib/data/content-merge.ts`.
- Refactored articles, duas, companions, and prophets list services to use the canonical resolver.
- Database records now win as a complete published catalogue instead of being merged with potentially stale offline/static publication records.
- Existing detail-page fallbacks remain available when the canonical record is unavailable.
- Existing stories, scholars, and hadith services already follow DB-first published filtering and were not rewritten unnecessarily.
- `/duas` remains an alias redirect to canonical `/dua`.

### Safety boundary

No religious text was rewritten, normalized, paraphrased, or deleted. Phase 7 changes **source selection**, not source content.

### Verification

The repository now has a dedicated `scripts/verify-content-canonicalization.mjs` regression guard. It is wired into both PR and full verification.

### Remaining Phase 7 gate

Run repository verification and one live post-change content read. Do not proceed to Phase 8 until the Phase 7 checkpoint is green.
