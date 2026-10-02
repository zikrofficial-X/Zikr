# ZIKR Finalization — Deprecation / Consolidation Matrix

This document records candidates for KEEP / MERGE / DEPRECATE / DELETE. No item marked DELETE is to be removed until its runtime dependency scan, build check, and production smoke check are green.

## Strong deletion / consolidation candidates

| Candidate | Current evidence | Action |
|---|---|---|
| admin_actions_audit | Legacy audit structure; newer admin_audit_events is used by admin audit services | Consolidate into admin_audit_events, then retire |
| admin_audit_log | Internal/legacy audit structure; newer audit event system exists | Consolidate, then retire |
| video_publishing_config | Legacy configuration table; current video worker is driven by canonical env/config | Verify references, then retire |
| video_narrations | Production row count currently 0; current worker uses Edge TTS/source audio path | Verify all references, then retire or repurpose as canonical audio cache |
| free_tier_usage | Production row count currently 0; no current worker dependency established | Verify references, then retire if unused |
| scripts/jobs/free-tier-video-narration.ts | Legacy TTS job alongside current Edge TTS path | Deprecate after migration of any remaining caller |
| HeyGen fields / execution remnants | Current production docs describe HeyGen as historical compatibility; current provider router does not use it | Remove only after full reference scan and schema migration |
| game_graphics | Production row count currently 0 | Decide whether to become canonical asset metadata or retire |
| game_scenarios | Production has 12 rows and may still be part of future content model | Keep temporarily; prove runtime usage before any change |

## Keep / strengthen

| Area | Reason |
|---|---|
| video_generation_requests | Canonical durable video queue |
| social_publish_queue | Canonical publishing queue until per-platform job model is introduced |
| video_automation_runs | Operational audit/telemetry for worker runs |
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

Merge scattered video orchestration into one domain flow:

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