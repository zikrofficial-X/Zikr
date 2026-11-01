# Phase 18 — Coordinated Legacy DB Retirement

## Verified production checkpoint — 2026-11-01

Live Supabase project: `ymxdswkaxafakugktsim`  
Read-only verification time: 2026-11-01 (UTC)

### Verified retired groups

The following legacy tables are absent from Supabase Production:

- `admin_actions_audit`
- `admin_audit_log`
- `video_narrations`
- `free_tier_usage`
- `free_tier_statistics`
- `video_publishing_config`
- `game_graphics`
- `game_scenarios`
- `kids_achievements_legacy_20261002`

The canonical `public.admin_audit_events` table contains **356 rows** in the current exact-count query. The older 121-row figure in the 2026-10-30 checkpoint is stale.

### Current Kids canonical data

Read-only production queries confirmed:

| Resource | Exact rows | Status |
|---|---:|---|
| `kids_games` | 13 | All 13 are published; catalog order 1–13 |
| `kids_content` | 65 | All 65 are active and published |
| `kids_content(type='game')` | 35 | Active and published |
| `kids_content(type='quiz')` | 3 | Active and published |
| `kids_content(type='story')` | 26 | Active and published |
| `kids_content(type='wudu')` | 1 | Active and published |

The 13 production catalog entries match the 13 IDs in the current application registry, including the later `letter-lab` entry.

### `game_scenarios` lineage exception

The archived source `supabase/legacy_migrations/20260929_080000_kids_games_enhanced_content.sql` contains a 12-row seed for the old `game_scenarios` table. The later applied migration `20261002130000_retire_coordinated_legacy_subsystems_20261002.sql` explicitly states that those rows were to be preserved and does **not** drop `game_scenarios`.

Current production verification establishes:

- `public.game_scenarios` is absent.
- No production view or materialized view definition references `game_scenarios`.
- No production function definition references `game_scenarios`.
- The current `kids_games` table and application `GAME_REGISTRY` have 13 canonical game records.
- The old 12-row seed is not a one-to-one data snapshot of the current registry; age ranges and difficulty values have since changed, and the current catalogue contains `letter-lab`.

The exact historical operation that removed `game_scenarios` is **not explained by the applied migration files currently in the repository**. It may have been a manual or external schema operation, but that cannot be asserted without an audit log or backup. Therefore:

- Do not recreate the old `game_scenarios` table.
- Do not add a `DROP TABLE game_scenarios` migration; it is already absent.
- Do not claim that all old scenario columns/narrative fields were migrated exactly.
- Treat `kids_games` + `src/lib/games/registry.ts` + `kids_content` as the current runtime sources of truth.
- Keep the historical 12-row seed in the legacy archive for provenance only.

This is a **historical data-lineage exception**, not a current runtime dependency or a reason to recreate a retired schema.

### Generated TypeScript schema reconciliation

Supabase-generated types were regenerated directly from the live production project and compared with the live `pg_tables` inventory:

| Check | Result |
|---|---:|
| Public tables in PostgreSQL | 86 |
| Public tables in generated TypeScript types | 86 |
| Production tables missing from generated types | 0 |
| Extra generated tables not present in PostgreSQL | 0 |
| Stale `game_scenarios` type | Removed |

The regenerated file is `src/lib/types/supabase.ts`. The generated PostgREST type version is `14.18`.

### Closure

The coordinated legacy subsystems listed above are retired in production. The Kids runtime is aligned to the current 13-game canonical catalogue and 65 active/published content rows.

The historical `game_scenarios` provenance discrepancy remains documented as an exception because the original database rows cannot be recovered from the current production database. It does not block the current Kids runtime, and the old table must not be reintroduced simply to satisfy stale generated types or archive documentation.
