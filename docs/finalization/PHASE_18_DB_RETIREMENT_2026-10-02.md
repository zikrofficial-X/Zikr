# Phase 18 — Coordinated Legacy DB Retirement
## ZIKR Finalization — 2026-10-02

### Live production audit before DDL
Confirmed directly in Supabase:
- admin_actions_audit: 1 row
- admin_audit_log: 0 rows
- video_narrations: 0 rows
- free_tier_usage: 0 rows
- video_publishing_config: 0 rows
- game_graphics: 0 rows
- kids_achievements_legacy_20261002: 0 rows
- game_scenarios: 12 rows and therefore retained

Dependency audit:
- free_tier_statistics depends on video_narrations.
- track_free_tier_usage() depends on video_narrations and free_tier_usage.
- update_video_narrations_timestamp() and update_game_graphics_timestamp() are legacy trigger functions.
- game_graphics depends on game_scenarios by foreign key.
- no active src runtime consumer was found for the retirement candidates.

### Data preservation
The one live admin_actions_audit record is migrated into canonical admin_audit_events before retirement.
Any rows in admin_audit_log are also migrated by deterministic request_id before drop.

### Migration
`20261002130000_retire_coordinated_legacy_subsystems_20261002.sql`

The migration intentionally does not drop `game_scenarios`.

### Production rule
No production DDL is applied until the repository gate passes on this migration and the deployment path is verified.
