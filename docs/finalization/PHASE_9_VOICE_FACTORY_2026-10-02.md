# Phase 9 — Voice Factory
## ZIKR Finalization — 2026-10-02

### Objective

Reduce voice generation to one verified production TTS path while preserving explicit distinctions between Quran recitation, human narration, and generic Arabic TTS.

### Live audit

Production database:

- `video_narrations`: 0 rows.
- `free_tier_usage`: 0 rows.
- `free_tier_statistics`: legacy reporting view still exists.
- `quran_audio`: 19,608 canonical Quran recitation rows, audited in Phase 8.
- `site_audio_assets`: 0 rows; this remains an admin-managed site-audio catalogue, not the generic video narration path.

The legacy `track_free_tier_usage()` function still references `video_narrations` and `free_tier_usage`. Therefore those database objects are **not** deleted in this phase. They remain a coordinated legacy subsystem for a later DB-retirement phase.

### Production voice path

The active video worker uses `scripts/generate-arabic-voice.py` with Edge TTS:

- Edge TTS package is pinned to `7.2.8`.
- Default voice: `ar-SA-ZariyahNeural`.
- Rate/pitch remain environment-configurable.
- Input is sanitized and capped at 8,000 characters.
- Output is rejected when missing or smaller than 1 KiB.
- Video rendering rejects output without an audio stream.

GitHub Actions and CircleCI both pin the same Edge TTS version.

### Cleanup performed

- Removed the legacy `scripts/jobs/free-tier-video-narration.ts` runtime file.
- No active source-file caller was found; repository search showed documentation/migration/deprecation references only.
- Historical documentation is intentionally retained as audit material.
- Updated the deprecation matrix to record the script as removed while keeping the related DB subsystem pending coordinated retirement.

### Verification

Added `scripts/verify-voice-factory.mjs` and registered `voice:factory:check` in both `verify:pr` and `verify`.

### Safety boundaries

- Quran recitation is never substituted with generic TTS.
- No live database deletion was performed.
- No audio records were rewritten.
- The legacy quota tables/functions remain untouched because they have cross-object dependencies.

### Release gate

The Phase 9 source/data audit is deterministic. Project-wide GitHub Actions results remain subject to the existing observability exception documented in previous checkpoints.
