# Phase 8 — Quran Canonicalization
## ZIKR Finalization — 2026-10-02

### Objective

Establish one deterministic public path for Quran text, surah metadata, search, reciters, and audio lookup while preserving a cold fallback for exceptional outages.

### Live Quran integrity audit

Production Supabase currently contains:

- 114 surahs.
- 6,236 ayahs.
- All 114 surahs have ayahs.
- 0 empty `text_ar` rows.
- 0 invalid ayah keys.
- 0 orphan ayahs.
- Every `quran_surahs.ayahs_count` matches the actual ayah count and maximum ayah number.
- 172 reciters.
- 19,608 audio rows.
- 0 duplicate reciter codes.
- 0 duplicate `(reciter_id, surah_id)` audio pairs.
- 0 empty audio URLs.
- 0 orphan audio-reciter relations.
- 0 orphan audio-surah relations.

The audio matrix is complete at 172 × 114 = 19,608 rows.

### Architectural issue found

The public rendered Quran pages already used the local tracked Hafs/Uthmani corpus through `quran-server.ts`, but client-side reciter consumers and Spiritual AI still imported `quran.ts`, which queried Supabase directly. That created two possible source paths for the same Quran domain.

### Changes

- Added `src/features/quran/services/quran-client.ts` as the client boundary for reciters.
- Added `GET /api/quran/reciters`, backed by the canonical server service with the existing fallback catalogue only on failure/empty DB state.
- Updated the Quran audio player and both reciter pages to use the new client boundary.
- Updated Spiritual AI Quran retrieval to use `searchLocalQuran`, aligning AI retrieval with the same tracked Quran corpus rendered by the public pages.
- Added `scripts/verify-quran-canonicalization.mjs` and wired it into `verify:pr` and `verify`.

### Data safety

No Quran text, ayah number, surah metadata, reciter, or audio row was rewritten or deleted. The phase changes only routing/source selection.

### Release gate

The local/source audit is deterministic and does not require a database migration. The remaining project-wide release verification uses the same GitHub quality-gate exception carried from Phase 7: the connected GitHub interface does not expose the PR workflow result, so production promotion still requires the repository's normal quality gate.
