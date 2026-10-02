# ZIKR Finalization — Deprecation / Consolidation Matrix

This document records candidates for KEEP / MERGE / DEPRECATE / DELETE. No item marked DELETE is to be removed until its runtime dependency scan, build check, and production smoke check are green.

## Dependency-scan results (2026-10-02)

| Candidate | GitHub application references | Live DB dependencies | Current decision |
|---|---|---|---|
| admin_actions_audit | No active src/ application consumer found; references are migration/type/history related | Table exists with about 1 estimated row; no view/function dependency found | Consolidation candidate; do not delete until data retention decision is recorded |
| admin_audit_log | No active src/ application consumer found; references are migration/type/history related | Table exists; no view/function dependency found | Consolidation candidate; migrate/retain required history, then retire |
| admin_audit_events | Used by src/features/admin/services/audit.ts and admin pages | Append-only trigger exists and functions reference it | KEEP / canonical audit system |
| video_publishing_config | No active src/ runtime consumer found; only migration/type/history references | Table exists but no view/function dependency found | Strong retirement candidate |
| video_narrations | No active src/ runtime consumer found; only legacy job/migration/docs references found | Referenced by free_tier_statistics view and track_free_tier_usage function | Retire as a subsystem or repurpose as a canonical cache; do not drop independently |
| free_tier_usage | No active src/ runtime consumer found; migration/docs references only | Referenced by track_free_tier_usage and has related reporting infrastructure | Retire together with the legacy narration quota subsystem if no operational requirement remains |
| scripts/jobs/free-tier-video-narration.ts | No active source-file caller found in GitHub search; documentation-only references remain | Writes/reads legacy video_narrations path | Deprecate after legacy DB subsystem decision |
| HeyGen fields / execution remnants | Runtime types, admin API, and video service still reference heygen_* fields | Durable queue columns and a partial index still exist | KEEP temporarily as compatibility; remove only after full code-path migration |
| game_graphics | No active src/ runtime consumer found; migration/RLS/trigger/docs references only | Update trigger exists; table currently empty | Strong cleanup candidate or convert into canonical game-asset metadata |
| game_scenarios | No active src/ runtime consumer found in targeted GitHub search; migration/RLS/trigger/docs references exist | Table contains 12 rows and update trigger | KEEP temporarily; determine whether runtime should consume it before changing |

## Strong deletion / consolidation candidates

| Candidate | Action |
|---|---|
| admin_actions_audit | Consolidate into admin_audit_events, preserve historical rows if required, then retire |
| admin_audit_log | Consolidate into admin_audit_events, preserve historical rows if required, then retire |
| video_publishing_config | Verify no hidden integration dependency, migrate any needed settings, then retire |
| scripts/jobs/free-tier-video-narration.ts | Deprecate and remove after legacy narration migration decision |

## Legacy subsystem requiring a coordinated decision

The legacy narration subsystem consists of video_narrations, free_tier_usage, free_tier_statistics, track_free_tier_usage(), the free-tier narration script, and associated migrations/docs. Because these objects reference one another, they must be retired or repurposed as one unit. Partial deletion would leave broken views/functions and migration drift.

## Keep / strengthen

| Area | Reason |
|---|---|
| video_generation_requests | Canonical durable video queue |
| social_publish_queue | Canonical publishing queue until per-platform jobs are introduced |
| video_automation_runs | Operational worker telemetry |
| src/features/videos/providers/* | Current provider abstraction is the right basis for multi-provider video generation |
| scripts/jobs/template-video-automation.ts | Current canonical worker; refactor rather than replace blindly |
| src/features/admin/services/audit.ts + admin_audit_events | Current centralized admin audit implementation |
| quran_audio | Canonical audio catalog/storage metadata |
| quran_reciters | Canonical reciter catalog |
| content_agent_queue / content_agent_runs | Active source-verification automation foundation |
| prayer-notification-worker | Active deployed Edge Function |
| unified kids-game runtime | Current canonical games foundation |

## Merge / refactor candidates

### Audit
admin_actions_audit + admin_audit_log + admin_audit_events → one immutable admin_audit_events contract.

### Settings
Keep site_settings for public/site configuration and admin_settings for internal operational controls. Do not create another configuration table for video/social/provider state.

### Video
request → source lock → voice → visual provider → render → QA → storage → approval → publication

### Audio
Merge direct audio URL, reciter selection, TTS and storage selection behind one audio service contract. Quran recitation is never replaced by generic TTS.

### Scheduling
Separate scheduler state from worker state. The schedule defines intent; the queue records work; the worker executes; the publisher reports platform-level outcomes.

## Deletion rules

Before deletion of any candidate:

1. Search repository references.
2. Search dynamic imports and environment references.
3. Search SQL migrations/functions/views/triggers.
4. Search route/admin actions.
5. Run typecheck/lint/build.
6. Run the relevant feature verification script.
7. Verify Supabase schema after migration.
8. Verify production runtime errors after deployment.

## Important exception

Historical migrations in supabase/migrations_archive/ and supabase/legacy_migrations/ are not deleted merely because they are old. They remain audit material unless a deliberate repository-history policy is approved separately.
