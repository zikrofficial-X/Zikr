# Phase 18 — Coordinated Legacy DB Retirement
## Updated production checkpoint — 2026-10-30

### Verified retired groups
The following legacy tables are absent in Supabase Production:
- admin_actions_audit
- admin_audit_log
- video_narrations
- free_tier_usage
- video_publishing_config
- game_graphics
- kids_achievements_legacy_20261002

The canonical `admin_audit_events` table currently contains 121 rows.

### Important schema discrepancy
The original Phase 18 migration intentionally preserved `game_scenarios` because it contained 12 rows on 2026-10-02. The table is now absent in Production, but no matching `DROP TABLE game_scenarios` migration exists in the repository. The current canonical `kids_games` catalog has 13 rows and `kids_content` has 35 game-type records, but these counts do not prove that the original 12 scenario records were preserved.

**Do not recreate, drop, or claim migration of `game_scenarios` until its historical rows and provenance are reconciled.** This is an open data-lineage exception.

### Closure
The coordinated legacy groups above are retired. Phase 18 remains open only for the `game_scenarios` provenance discrepancy and must not be marked fully closed until it is explained and documented.
