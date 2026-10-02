# Phase 12 — Video QA
## ZIKR Finalization — 2026-10-02

### Objective

Ensure public video records are renderable, have deterministic poster coverage, and do not present database rows with no playable media as if they were real videos.

### Live production audit

Current Supabase state:

- `videos`: 17 rows, all marked published.
- Duration integrity: 17/17 rows have a positive duration.
- Database thumbnail coverage: 0/17 rows have `thumbnail_url`.
- Media-reference coverage:
  - 9 rows have a `youtube_id`.
  - 8 published rows have neither a YouTube id nor a usable generated/source video URL in the inspected metadata.
- Video storage contains 44 objects under `videos/automated/`.
- Quran audio storage contains 0 objects; Quran audio uses the canonical external audio URLs audited in Phase 8.

### Code findings

#### 1. Published video rows without media

Eight database rows are published but do not identify a playable video. The public service now treats a row as publicly renderable only when it has:

- a valid HTTPS generated/source video URL in known metadata fields, or
- a valid YouTube id.

These rows are therefore excluded from the public video-detail catalogue until real media is attached. No database unpublish mutation was performed in Phase 12; this preserves auditability and leaves the records available for the later Video Factory/Admin phases.

#### 2. Missing thumbnails

No artificial thumbnail rows were written to production.

Thumbnail resolution now follows:

1. explicit `videos.thumbnail_url`;
2. validated thumbnail fields in metadata;
3. deterministic YouTube `hqdefault` thumbnail when a valid `youtube_id` exists;
4. canonical local ZIKR OG image as a neutral placeholder.

This means public rendering has poster coverage without fabricating content-specific imagery.

#### 3. Public video detail

The detail page now exposes the resolved poster in metadata and uses it for direct generated-video playback.

### Existing media QA retained

Phase 10's render QA remains authoritative:

- video stream exists;
- audio stream exists;
- duration is valid;
- expected resolution is enforced;
- H.264 video is required;
- AAC audio is required;
- minimum video bitrate is enforced;
- silent/near-silent audio is rejected.

### Verification

Added `scripts/verify-video-qa.mjs` and registered `video:qa:check` in `verify:pr` and `verify`.

### Safety/data policy

No video DB row was modified. No thumbnail was fabricated or uploaded. The phase only changed public source-selection and rendering fallback behavior.

### Release gate

Source-level QA contract is deterministic. The existing GitHub Actions observability exception remains documented; production promotion still requires the repository quality gate to execute successfully.
