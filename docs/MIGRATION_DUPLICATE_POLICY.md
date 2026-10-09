# Supabase migration duplicate policy

The production migration ledger currently has the same 336 versions as the `supabase/migrations/` directory. Keep applied migration filenames and contents immutable so the local repository continues to match that ledger.

Two pairs of legacy SQL migration files have byte-identical contents:

- `20261001212603_video_pipeline_hardening_20261002.sql` and `20261002000001_video_pipeline_hardening.sql`
- `20261002125440_remote_history_marker_video_automation.sql` and `20261002125451_remote_history_marker_video_automation.sql`

They remain in place because each filename maps to a separate version already recorded in production. Do not delete or edit either file as a cleanup shortcut. Any schema correction must use a new forward-only migration.

The `pnpm supabase:migrations:duplicates:check` command is an allowlist-based guard: it permits only these known historical pairs and fails when another set of migration files has identical SQL content. It runs as part of both `pnpm verify:pr` and `pnpm verify`.
