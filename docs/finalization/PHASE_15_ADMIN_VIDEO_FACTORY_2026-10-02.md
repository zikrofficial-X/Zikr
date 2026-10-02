# Phase 15 — Admin Video Factory
## ZIKR Finalization — 2026-10-02

### Objective

Make the admin video-production surface narrow, permissioned, source-locked, and safe for operator-driven retries and human narration uploads.

### Audit findings

Admin video production consists of:

- `/admin/ai-video` — production studio.
- `/admin/videos` — generation queue management.
- `/api/admin/videos/create` — verified request creation.
- `/api/admin/video-generation` — queue inspection, retry, and failed-request deletion.
- `/api/admin/video-generation/sources` — published-source retrieval.
- `/api/admin/video-generation/narration-upload` — human narration upload.
- `/admin/social` and `/api/admin/social` — social queue operations.

All inspected video routes use scoped admin permissions:
- `video.manage` for create/read/update/source/upload.
- `video.delete` for deleting failed generation requests.

### Fixes applied

#### 1. Generation queue race

`claimPendingVideoRequests()` previously claimed by `id + status=pending`.

It now also matches the row's `updated_at`, preventing a second worker from claiming a row after another worker has already advanced it.

#### 2. Admin publish retry race

The `retry_publish` admin action now includes the request's current status and `updated_at` in the update predicate. A stale browser tab cannot silently overwrite a newer worker state.

#### 3. Human-audio file validation

The narration upload route previously trusted the HTTP Content-Type header.

It now verifies container/file signatures before storage:

- MP3: ID3 or MPEG frame sync.
- M4A/MP4: `ftyp`.
- WAV: RIFF/WAVE.
- OGG: OggS.
- WebM: EBML signature.

The existing 15 MiB size limit and dedicated `human-narration/` storage prefix remain in force.

#### 4. Source-locking remains enforced

For Quran, hadith, story, dua, and adhkar, the admin create route requires a canonical published source and copies the exact source text into the generation request. Quran narration remains tied to the canonical recitation; arbitrary human audio cannot replace it.

#### 5. Role boundary

The permission map gives `video_manager` the required video permissions without granting unrelated user/security/settings permissions. The admin studio page also checks `video.manage` server-side before rendering.

### Live DB/RLS verification

- `video_generation_requests` has RLS enabled.
- Administrative API calls use the service-role server client only after the scoped application-level permission check.
- Existing database policies for `video_generation_requests` cover authenticated administrative access; this phase does not broaden client privileges.

### Data safety

No production video-generation rows were changed by Phase 15. The fixes are code-path hardening only.

### Verification

Added `scripts/verify-admin-video-factory.mjs` and registered `admin:video:check` in `verify:pr` and `verify`.

### Release gate

Source-level Admin Video Factory checks are deterministic. GitHub Actions PR result remains subject to the existing observability exception.
