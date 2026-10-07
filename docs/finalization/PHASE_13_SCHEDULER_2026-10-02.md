# Phase 13 — Scheduler
## ZIKR Finalization — 2026-10-02

### Objective

Make production scheduling single-owner, canonical, observable, and free of dead cron entries.

### Live scheduler audit

Production `pg_cron` initially contained three active jobs:

| Job | Cadence | Finding |
|---|---|---|
| `zikr-prayer-push-dispatch` | every minute | Active, initially pointed at retired Supabase hostname |
| `zikr-source-verified-content-agent` | daily 03:00 UTC | Active, initially pointed at retired Supabase hostname |
| `zikr-youtube-facebook-media-cleanup-edge` | every 10 minutes | Broken: the referenced Edge Function was not deployed and Vault URL secret set was absent |

### Fixes executed

1. Repointed prayer scheduler and source-verified agent to:
   `https://nmdeazfmtncelykzxkhs.supabase.co`.
2. Verified job 1 execution history continues to succeed.
3. Verified the daily source-verified agent job succeeded at 03:00 UTC on 2026-10-02 and on the preceding three days.
4. Retired the dead media-cleanup cron job rather than keeping a permanently failing scheduler.
5. Added two synchronized migrations:
   - `20261002113000_scheduler_hardening_20261002`
   - `20261002114000_retire_dead_media_cleanup_cron_20261002`
6. Production migration history is now 294 versions.
7. Confirmed no Vercel cron configuration exists.
8. Confirmed the GitHub video worker has a two-hour cadence, manual dispatch, and concurrency protection.
9. Confirmed the video queue performs stale-processing recovery and bounded retry handling.

### Current live queue state

- `video_generation_requests`: 50 completed, 5 pending, 1 retry_wait, 1 failed.
- No processing request is currently stale beyond the 30-minute configured threshold.
- Social queue: 4 published, 38 partial. The partial social rows remain an authentication/publishing concern for Phase 14.

### Repository correction

`docs/production-scheduling.md` contained contradictory legacy wording about GitHub Actions not being the active scheduler. That documentation is corrected in this phase so scheduler ownership matches the deployed workflow.

### Verification

Added `scripts/verify-scheduler.mjs` and registered `scheduler:check` in `verify:pr` and `verify`.

### Release gate

The scheduler code/configuration contract is deterministic. GitHub Actions PR workflow results remain subject to the tracked connector observability exception.
