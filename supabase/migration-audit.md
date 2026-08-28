# Supabase Migration Audit — Updated 2026-07-18

## Update (2026-07-18)

Two new migrations were added as part of a full Supabase ecosystem synchronization:

- `20260718000000_video_automation_tables.sql`: Ensures `video_generation_requests`,
  `video_publish_log`, and `video_publishing_config` tables exist with correct columns,
  indexes, RLS, and policies. Previously these tables were applied directly to the
  database without a corresponding local migration (all prior stubs).

- `20260718001000_add_is_active_columns.sql`: Adds the `is_active` boolean column
  to `article_categories`, `dua_categories`, `video_categories`, `tawasheeh_categories`,
  `tawasheeh`, and `kids_content` — aligning the database with the Drizzle schema.

`lib/types/supabase.ts` was updated to resolve:
- `category` enum drift: added 4 missing values (`prophets`, `sahaba`, `documentaries`,
  `history`) that were applied via Drizzle migration 0012 but never reflected in the
  generated types.
- Missing `is_active` column on 6 tables.
- Missing `description_ar` / `description_en` on `video_categories`.
- 14 tables present in Drizzle schema but absent from the generated types:
  `adhkar_completions`, `adhkar_streaks`, `app_settings`, `bookmarks`,
  `notification_settings`, `prophet_notes`, `quran_favorites`, `quran_reads`,
  `search_history`, `social_shares`, `story_favorites`, `story_ratings`,
  `story_reads`, `users` (legacy).
- 3 actively-used runtime tables added: `video_generation_requests`,
  `video_publish_log`, `video_publishing_config`.

---

# Supabase Migration Audit — Initial Report

Branch: supabase/audit-fixes-20260705
Date: 2026-07-05

Summary (what I inspected locally)
- All files in `supabase/migrations/` were read and reviewed.
- Immediate risks discovered:
  - Unguarded CREATE TYPE statements (plain `CREATE TYPE`) that will fail if a type already exists.
  - Mixed guard styles across migrations (some use `IF NOT EXISTS` or `DO $$ ... EXCEPTION WHEN duplicate_object` while others do not).
  - A migration (`20260530000200_0002_noisy_nocturne.sql`) appears to contain destructive `DROP TABLE ... CASCADE` statements and stray text tokens (`codex/organize-database-migrations-clearly`) that may render the SQL invalid when run as a batch.
  - Multiple migrations attempt to create the same constraints/indexes/foreign keys in different ways; unguarded additions can cause "already exists" errors during apply.
  - Some migrations include `ALTER TYPE ... ADD VALUE` style operations which must be run outside transactions; these must be identified and handled specially.

What I added in this branch
- A safe corrective migration: `supabase/migrations/20260705000019_0019_safe_guards.sql`
  - Guards creation of ENUM types with `DO $$ ... EXCEPTION ... $$` blocks.
  - Adds missing columns with `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` where appropriate.
  - Creates indexes and unique indexes conditionally.
  - Adds foreign key constraints only after checking they are absent.
  - Adds essential RLS policies if missing.
  - Explicitly avoids any destructive DROP operations.

- A test/runbook script: `scripts/run_migration_audit.sh`
  - Backups, enumerates remote migration tables, dumps remote schema, replays local migrations onto a provided TEST_DB_URL, produces schema diffs.

- This audit document: `supabase/migration-audit.md` (this file).

Next steps (runbook)
1. Rotate any credentials you posted publicly immediately. Treat them as compromised.
2. Run `scripts/run_migration_audit.sh` in a secure environment where `DATABASE_URL`, `TEST_DB_URL`, and `PGPASSWORD` are configured. The script will:
   - Create a backup (custom, compressed pg_dump) of `DATABASE_URL`.
   - Enumerate migration tables and show `public.supabase_migrations` if present.
   - Dump remote schema to `remote_schema.sql`.
   - Replay local migrations in order onto `TEST_DB_URL` and stop on the first error.
   - Dump the TEST_DB schema to `local_schema.sql` and diff it with `remote_schema.sql`.
3. Review diff output. If replay fails at a particular migration, inspect that migration and the psql error. Share the output here and I will propose a targeted corrective migration.
4. If replay succeeds cleanly on test DB, consider running the corrective migration(s) in a staging Supabase project (or the same environment after ensuring backups). Use the `supabase` CLI if you prefer:
   - `supabase db remote set <connection>`
   - `supabase db push` or `supabase migrations apply` depending on your workflow.

Safety and rollback
- I will not modify historical migration files. The corrective migration is additive and non-destructive by design.
- If a destructive change is required, I will propose a multi-step, data-preserving sequence and request explicit approval.
- Always keep backups and a rollback plan before applying changes to production.

What I need from you now
- Run the script `scripts/run_migration_audit.sh` and paste its output here (or attach logs). That will allow me to:
  - Map remote applied migrations to local files.
  - Identify any missing migration files (applied remotely but absent locally).
  - Identify migration files present locally but not applied remotely.
  - Detect broken SQL reported by psql when replaying.

If you prefer, instead paste the outputs of the following commands (run on a machine with psql and pg_dump):
- Backup: `pg_dump --format=custom --file=backup.dump "$DATABASE_URL"`
- Migration table discovery: `psql "$DATABASE_URL" -Atc "SELECT table_schema,table_name FROM information_schema.tables WHERE table_name ILIKE '%migr%' OR table_name ILIKE '%schema_migration%';"`
- Show supabase_migrations (if present): `psql "$DATABASE_URL" -c "SELECT * FROM public.supabase_migrations ORDER BY installed_rank NULLS LAST;"`
- Dump remote schema: `pg_dump --schema-only --no-owner --no-privileges --file=remote_schema.sql "$DATABASE_URL"`
- Replay local migrations on TEST_DB_URL (see `scripts/run_migration_audit.sh`)

When you paste the outputs I will analyze and produce the next set of targeted corrective migrations and update the PR.

Remaining concerns found during static review
- Identify any `ALTER TYPE ... ADD VALUE` statements across migrations: these must be executed carefully (outside transactions) and may require migration ordering changes.
- The `20260530000200_0002_noisy_nocturne.sql` contains DROP statements and odd tokens; if this file was applied remotely previously, it may have removed objects that later migrations expect. We must map applied migrations to diagnose.

Contact & next actions
- I committed the changes to branch `supabase/audit-fixes-20260705`.
- Please run the audit script and paste results. I will iterate on corrective migrations and include test logs in the PR.

