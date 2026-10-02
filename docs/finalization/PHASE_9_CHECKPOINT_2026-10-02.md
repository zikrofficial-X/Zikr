# Phase 9 Checkpoint — Voice Factory
## ZIKR Finalization — 2026-10-02

### Status

**IN PROGRESS — implementation applied; final source/data gate pending.**

### Completed

- [x] Audited active Arabic TTS execution path.
- [x] Audited legacy narration script and database subsystem.
- [x] Verified legacy narration/quota tables contain zero rows.
- [x] Verified `track_free_tier_usage()` still depends on the legacy tables.
- [x] Confirmed Edge TTS version is consistently pinned to 7.2.8.
- [x] Removed unused `scripts/jobs/free-tier-video-narration.ts`.
- [x] Added Voice Factory regression guard.
- [x] Registered `voice:factory:check` in project verification.
- [x] Preserved Quran recitation as a distinct audio source.
- [x] Kept legacy DB subsystem intact for coordinated retirement.

### Gate

- [ ] `voice:factory:check` passes against the exact branch sources.
- [ ] Existing `verify:pr` passes.
- [ ] No new DB migration is required.

### Release rule

Do not promote Phase 9 until the Voice Factory source gate is green. Project-wide CI remains subject to the existing GitHub Actions observability exception.
