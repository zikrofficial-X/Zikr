# Archived Migrations

These files were removed from `supabase/migrations/` because they are legacy,
conflicting, or superseded. They are kept here for historical reference only.
**Do not apply them.**

## Why each file was archived

| File | Reason |
| --- | --- |
| `20240705000001_create_category_type.sql` | Duplicate version key with `20240705000001_missing_tables.sql` (breaks `supabase db push`). Unguarded `CREATE TYPE` fails on re-run. Superseded by the guarded 2026 chain. |
| `20240705000001_missing_tables.sql` | Duplicate version key (see above). Tables now created by `20260530000000_0000_young_rattler.sql` onward. |
| `20240705000002_seed_content.sql` | Legacy seed superseded by later seed migrations. |
| `20240705000003_fix_duplicate_migration.sql` | Duplicate version key with `20240705000003_seed_stories_articles.sql`. Contains a manual `DELETE FROM supabase_migrations.schema_migrations` hot-patch that must never be replayed. |
| `20240705000003_seed_stories_articles.sql` | Duplicate version key (see above). Superseded by `20260530000600_0006_phase4_scholars_stories.sql`. |
| `20250705000001_initial_schema.sql` | Superseded by the guarded 2026 chain; retained in `supabase/migrations/` as a no-op history marker. |
| `20250705000002_rls_triggers_storage.sql` | Superseded by the guarded 2026 chain; retained in `supabase/migrations/` as a no-op history marker. |
| `20260705070523_initial_schema.sql` | Archived original migration; `supabase/migrations/20260705070523_archived_initial_schema.sql` keeps the remote history version present without replaying schema changes. |
| `20260705070652_rls_triggers_storage.sql` | Archived original migration; `supabase/migrations/20260705070652_archived_rls_triggers_storage.sql` keeps the remote history version present without replaying schema changes. |

## Canonical migration chain

The authoritative history is now the single ordered chain in
`supabase/migrations/`, starting at `20260530000000_0000_young_rattler.sql`
and followed by no-op legacy history markers for archived remote versions.

## If `supabase db push` reports history mismatch

If the remote database has any of the archived versions recorded in
`supabase_migrations.schema_migrations`, mark them as reverted locally
(this only edits the history table, it does not change schema):

```bash
supabase migration repair --status reverted 20240705000001 20240705000002 20240705000003 20250705000001 20250705000002 20260705070523 20260705070652
```

Then re-run `supabase db push`. Always take a backup (`pg_dump`) first.
