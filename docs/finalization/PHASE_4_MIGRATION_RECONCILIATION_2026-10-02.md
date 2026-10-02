# Phase 4 — Migration Reconciliation
## ZIKR Finalization — 2026-10-02

### Scope
This phase reconciles the repository migration set against the live Supabase migration history for project `kdotmrjfecgafiommzwz`.

This phase intentionally does **not** change production schema, migration history, data, policies, functions, triggers, or settings. The objective is to establish an exact, auditable migration ledger before any later schema cleanup.

### Sources checked

- Repository: `zikr-org/Zikr`
- Branch under audit: `audit/phase-0-1-finalization`
- Local migration directory: `supabase/migrations`
- Live Supabase migration history: `supabase_migrations.schema_migrations` as exposed by Supabase migration listing
- Repository reconciliation record: `supabase/REMOTE_MIGRATION_LEDGER.md`
- Migration validator: `scripts/validate-migrations.mjs`
- Supabase migration documentation, specifically the current migration-history and repair guidance

### Exact reconciliation result

| Check | Result |
|---|---:|
| Local migration files | 291 |
| Remote migration history rows | 291 |
| Local-only versions | 0 |
| Remote-only versions | 0 |
| Local malformed migration filenames | 0 |
| Duplicate version IDs in local files | 0 |
| Version IDs present on both sides | 291 |
| Exact local/remote descriptive-name matches | 288 |
| Descriptive-name mismatches for shared versions | 3 |

The migration **version/timestamp** is the synchronization key. The descriptive name is metadata attached to that version. Therefore, a descriptive-name mismatch by itself does not mean the migration is missing or duplicated.

### The three shared-version name mismatches

#### 1. 20261001221622

Repository file:
`20261001221622_kids_games_history_repair.sql`

Remote history name:
`kids_games_enhanced_content`

The repository migration body is explicitly a schema-neutral history reconciliation marker (`select 1;`). The repository ledger records that this remote version was used to replace the legacy 8-digit `20260929` history entry and prevent ordering collision with later 14-digit versions. The original enhanced-content SQL is retained under:

`supabase/legacy_migrations/20260929_080000_kids_games_enhanced_content.sql`

**Assessment:** historical naming divergence only; no missing migration version and no evidence that the current migration body needs to be replayed.

#### 2. 20261002054010

Repository file:
`20261002054010_finish_rls_overlap_cleanup_20261002.sql`

Remote history name:
`20261002120000_finish_rls_overlap_cleanup_20261002`

The Git commit that introduced the repository file is:

`fd238ca859d13d7a623ccdbf36f9da235a85c08b`

with message:

`fix(supabase): align RLS migration timestamp history`

**Assessment:** timestamp/name alignment reconciliation. The remote version is present; the local file exists under the canonical 14-digit version used for migration matching.

#### 3. 20261002054042

Repository file:
`20261002054042_finish_admin_public_policy_merge_20261002.sql`

Remote history name:
`20261002130000_finish_admin_public_policy_merge_20261002`

The Git commit that introduced the repository file is:

`930717cfdc7c236f6d11966e134e8321198905ba`

with message:

`fix(supabase): align admin public migration timestamp history`

**Assessment:** timestamp/name alignment reconciliation. The remote version is present; there is no remote-only migration to recreate.

### Repeated descriptive names

The remote history contains repeated descriptive names, but these are **not duplicate migration versions**.

The largest repeated groups include:

- `seed_open_hadith_library`: 10 distinct versions
- `seed_zikr_content_library`: 4 distinct versions
- `0047_hadith_metadata_columns`: 2 distinct versions
- `seed_open_hadith_library_01` through `_10`: each appears twice under different versions
- `archived_legacy`: 4 distinct versions

The repository's timestamp/version scan independently found zero duplicate version IDs. Repeated names are therefore historical naming reuse, not migration-history corruption.

### Highest and lowest observed versions

- Earliest version: `20240705000001`
- Latest version: `20261002110000`

The complete local version set is identical to the complete remote version set.

### Existing validator behavior

`scripts/validate-migrations.mjs`:

- reads all SQL migrations in sorted order;
- checks duplicate numeric version IDs;
- has explicit handling for historical legacy replay;
- seeds minimal stubs for archived runtime tables needed to replay the chain;
- detects duplicate RLS policy definitions;
- replays the migration chain in PGlite;
- reports searchable/GIN index state.

The validator contains historical compatibility logic for `game_scenarios`, `game_graphics`, `video_narrations`, and `free_tier_usage`. Those tables are therefore deliberately treated as replay dependencies during validation even though Phase 3 classified parts of that subsystem as legacy/transition.

### Required reconciliation policy

1. Do **not** rename historical migration files merely to make descriptive names equal to remote names.
2. Do **not** delete historical migrations to reduce file count.
3. Do **not** run `migration repair` because the version sets already match exactly.
4. Do **not** replay any migration in production as part of this phase.
5. Keep future migrations strictly forward-only with a unique 14-digit timestamp.
6. When a production schema change is already present but a history record is missing, use an explicit reconciliation marker rather than replaying historical destructive SQL.
7. Keep legacy SQL under `supabase/legacy_migrations` when it is retained for audit/history rather than making it part of the active replay chain.
8. Treat `version` as the synchronization identity and the descriptive suffix as human-readable metadata.

### Phase 4 conclusion

The live Supabase migration history is currently **version-synchronized with the repository**:

- no missing local migrations;
- no unexpected remote migrations;
- no duplicate version IDs;
- no malformed active migration filenames.

The three name mismatches are documented historical reconciliation cases and do not justify `migration repair`, migration replay, or production DDL changes.

### Production mutation performed in this phase

**None.**

No production migration was applied, reverted, renamed, deleted, or repaired.
