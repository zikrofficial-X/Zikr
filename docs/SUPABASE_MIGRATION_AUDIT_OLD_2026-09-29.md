# ZIKR Supabase Migration Audit — 2026-09-29

## Scope
This audit records the evidence available through the connected Supabase integration and repository inspection. It does not claim a completed migration.

## Projects observed

| Role | Project ref | Organization | Region | Status | Database |
|---|---|---|---|---|---|
| Old production source | `eydxvcamhjhajxjrsgym` | `Alone` | `eu-west-1` | `INACTIVE` | PostgreSQL 17.6.1.104 |
| Connected target | `kdotmrjfecgafiommzwz` | `zikr` / `Zikrmediaofficial` | `us-east-1` | `ACTIVE_HEALTHY` | PostgreSQL 17.6.1.166 |

The target organization and target project already exist. No organization or project creation was performed during this run.

## Integration status

Supabase integration: connected.

The automatic live schema snapshot failed with `Failed to execute code`. A direct target schema inspection then failed with `Connection terminated due to connection timeout`. The old project table inventory returned an empty result because the old project is inactive; this is not evidence that the old database is empty.

## Repository evidence

- Canonical Supabase migrations exist under `supabase/migrations/`.
- The repository migration ledger documents the old project ref and the `quran-audio` storage migration marker.
- The application still contains historical documentation references to the old OAuth callback/project URL.
- Supabase runtime code uses environment variables rather than a hardcoded project URL in the inspected Edge Functions.
- The package includes Supabase SSR/client dependencies and existing migration/integrity verification scripts.

## Quran requirements

The requested source-of-truth counts are not independently re-measured in this run because the old project is inactive and the target connection timed out:

- 114 surahs
- 6,236 ayahs
- 7 reciters
- 798 audio rows

No Quran rows or URLs were changed. No storage objects were copied or deleted.

## Storage safety

The `quran-audio` bucket was not migrated, deleted, or modified. No SQL storage deletion was attempted. The requested old storage size/object measurements remain unverified because the old project is inactive and Storage inventory tools were not available in the connected tool set.

## Security and rollback

- Old project remains untouched.
- No service-role credential was exposed or written to the repository.
- No production environment switch was performed.
- No destructive SQL, auth-user insertion, storage deletion, or deployment mutation was performed.

## Blocking conditions

1. The old Supabase project is currently `INACTIVE`, preventing a reliable source audit and data export.
2. The connected target schema connection timed out, preventing safe schema/data validation or migration execution.
3. The available connected tools do not expose a complete old-project export/auth/storage backup workflow in this run.

A migration cannot be honestly marked successful until the old source is active and readable and the target database connection succeeds.

## Next safe action

Restore/read-enable the old project and retry the target connection. Then perform read-only counts and schema/RLS/function/storage inventory before any target writes. Keep the old project as rollback until all gates pass.
