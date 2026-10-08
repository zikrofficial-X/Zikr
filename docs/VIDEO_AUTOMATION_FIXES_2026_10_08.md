# ZIKR Video Automation — Reconciled 2026-10-08

## Canonical implementation

The production video worker is:

`scripts/run-background-jobs.ts`

It orchestrates:

`scripts/jobs/template-video-automation.ts`

for deterministic FFmpeg rendering and queue processing, plus the canonical social publishing queue service.

The previously proposed `scripts/jobs/video-automation-enhanced.ts` implementation was removed because it duplicated the queue worker, was not wired into the production command, and contained invalid relative imports. It must not be restored as a second worker.

## Reliability controls currently enforced

The canonical queue implements:

- bounded queue claims with optimistic `updated_at` concurrency;
- backlog-first processing;
- deterministic seeding keys to prevent duplicate scheduled requests;
- stale processing recovery;
- bounded failure handling;
- per-run automation audit records;
- social queue reconciliation;
- protected production credentials;
- recurring GitHub Actions ownership plus deliberate manual dispatch.

## Current production execution model

```
CircleCI scheduled job
  -> pnpm background:jobs
  -> scripts/run-background-jobs.ts
  -> template-video-automation.ts
  -> FFmpeg / configured free AI providers
  -> video_generation_requests
  -> QA / publishing queue
  -> YouTube / Facebook when enabled
```

GitHub Actions retains deliberate manual video dispatch. It does not own a recurring production schedule.

## Source and voice policy

Quran recitation uses canonical human recitation assets from `quran_audio`.

Narrated non-Quran content uses the current Arabic narration pipeline and validated voice profiles. Religious source text remains source-locked; AI may assist presentation/captioning but must not rewrite canonical Quran/Hadith source text.

## Error handling

The current implementation tracks queue status and failure outcomes in Supabase. Retry/backoff behaviour must be implemented in the canonical worker/services rather than a second disconnected runner.

## Verification

The release gates validate:

- video engine structure;
- video contract status/category constraints;
- voice factory;
- video QA;
- social publishing;
- Admin Video Factory ownership;
- local import integrity;
- production Supabase health.

## Operational rule

Any future retry/backoff enhancement must modify the canonical worker/service path and add/update an automated contract test. Do not introduce a second production video worker.

---

**Reconciled:** 2026-10-08
