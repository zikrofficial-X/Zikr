#!/usr/bin/env bash
# scripts/run_migration_audit.sh
# Runbook to audit Supabase migrations and apply corrective migrations on a staging DB
# Usage:
#   1. Export DATABASE_URL to point at the production DB (read-only for this audit) OR a snapshot copy
#   2. Export TEST_DB_URL for an isolated Postgres instance where we can replay migrations
#   3. Run this script: ./scripts/run_migration_audit.sh

set -euo pipefail
IFS=$'\n\t'

if [ -z "${DATABASE_URL-}" ]; then
  echo "ERROR: DATABASE_URL must be set (production/staging DB for inspection)." >&2
  exit 1
fi

if [ -z "${TEST_DB_URL-}" ]; then
  echo "ERROR: TEST_DB_URL must be set (fresh DB to replay migrations)." >&2
  exit 1
fi

echo "1) Creating a full backup of DATABASE_URL (production) -- ensure this runs in a safe environment"
BACKUP_FILE="zikr_backup_$(date +%Y%m%d_%H%M%S).dump"
PGPASSWORD="${PGPASSWORD-}" pg_dump --format=custom --compress=9 --file="$BACKUP_FILE" "$DATABASE_URL"
ls -lh "$BACKUP_FILE"

echo "2) Enumerate migration-like tables in remote DB"
PGPASSWORD="${PGPASSWORD-}" psql "$DATABASE_URL" -Atc "SELECT table_schema, table_name FROM information_schema.tables WHERE table_name ILIKE '%migr%' OR table_name ILIKE '%schema_migration%' ORDER BY table_schema,table_name;" || true

echo "3) If Supabase stores migration history in public.supabase_migrations, show it"
PGPASSWORD="${PGPASSWORD-}" psql "$DATABASE_URL" -c "SELECT * FROM public.supabase_migrations ORDER BY installed_rank NULLS LAST;" || echo "supabase_migrations not found or access denied"

echo "4) Dump remote schema (schema-only) to remote_schema.sql"
PGPASSWORD="${PGPASSWORD-}" pg_dump --schema-only --no-owner --no-privileges --file=remote_schema.sql "$DATABASE_URL"

echo "5) Prepare fresh TEST_DB: ensure extensions & schemas expected by migrations"
PGPASSWORD="${PGPASSWORD-}" psql "$TEST_DB_URL" -c "CREATE EXTENSION IF NOT EXISTS pgcrypto; CREATE SCHEMA IF NOT EXISTS auth; CREATE SCHEMA IF NOT EXISTS storage;" || true

echo "6) Replay local migrations onto TEST_DB"
set +e
for f in $(ls supabase/migrations/*.sql | sort); do
  echo
  echo "=== APPLYING: $f ==="
  PGPASSWORD="${PGPASSWORD-}" psql "$TEST_DB_URL" -v ON_ERROR_STOP=1 -f "$f"
  rc=$?
  if [ $rc -ne 0 ]; then
    echo "FAILED applying $f (exit $rc). See above psql error and stop."
    exit $rc
  fi
done
set -e

echo "7) Dump TEST_DB schema"
PGPASSWORD="${PGPASSWORD-}" pg_dump --schema-only --no-owner --no-privileges --file=local_schema.sql "$TEST_DB_URL"

echo "8) Diff schemas"
diff -u remote_schema.sql local_schema.sql || true

echo "9) Run basic validations (tables, columns, indexes, FK counts)"
PGPASSWORD="${PGPASSWORD-}" psql "$TEST_DB_URL" -Atc "SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema') ORDER BY table_schema, table_name;"
PGPASSWORD="${PGPASSWORD-}" psql "$TEST_DB_URL" -Atc "SELECT table_schema, table_name, count(*) FROM information_schema.columns WHERE table_schema NOT IN ('pg_catalog','information_schema') GROUP BY table_schema, table_name ORDER BY table_schema, table_name;"

cat <<'EOF'

Audit completed locally. If the replay succeeded without errors, prepare a PR with the new migrations and run them against a staging Supabase project via supabase CLI or psql. Before applying to production, ALWAYS ensure you have an up-to-date backup and a rollback plan.
EOF
