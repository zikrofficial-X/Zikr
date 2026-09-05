// Validates the full Supabase migration chain against an in-memory Postgres
// (PGlite) with Supabase auth/storage schemas stubbed. Catches ordering bugs
// like "column searchable does not exist" before they hit production.
//
// Usage: node scripts/validate-migrations.mjs
// Requires: npm install @electric-sql/pglite (dev-only, any scratch dir works
// via NODE_PATH; CI installs it ad hoc).
import { PGlite } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIG_DIR = join(ROOT, 'supabase', 'migrations');
const files = readdirSync(MIG_DIR).filter((f) => f.endsWith('.sql')).sort();
const LEGACY_REPLAY_START = '20260705000019_0019_safe_guards.sql';

const db = new PGlite({ extensions: { pg_trgm, uuid_ossp } });

// ---- Supabase environment stubs (auth, storage, roles) ----
const stubs = `
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
  $$ SELECT NULL::uuid $$;
CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS
  $$ SELECT 'authenticated'::text $$;
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS
  $$ SELECT '{}'::jsonb $$;

CREATE SCHEMA IF NOT EXISTS storage;
CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL,
  public boolean DEFAULT false,
  file_size_limit bigint,
  allowed_mime_types text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text REFERENCES storage.buckets(id),
  name text,
  owner uuid,
  metadata jsonb,
  path_tokens text[],
  created_at timestamptz DEFAULT now()
);
CREATE OR REPLACE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql AS
  $$ SELECT string_to_array(name, '/') $$;

DO $do$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role; END IF;
END $do$;
`;

await db.exec(stubs);
console.log('Supabase stubs installed');

const versions = new Map();
const duplicateVersions = new Set();
const migrationScore = (file) => {
  const sql = readFileSync(join(MIG_DIR, file), 'utf8').toLowerCase();
  // Reconciliation markers intentionally contain only `select 1`; when a
  // duplicate version also has the real schema migration, replay the schema
  // migration so the validator tests the same dependency order as production.
  return (sql.includes('create table') ? 4 : 0)
    + (sql.includes('alter table') ? 2 : 0)
    + (sql.includes('create function') ? 1 : 0);
};
for (const file of files) {
  const match = /^(\d+)_/.exec(file);
  if (!match) continue;
  const version = match[1];
  const previous = versions.get(version);
  if (!previous) {
    versions.set(version, file);
    continue;
  }

  const previousScore = migrationScore(previous);
  const currentScore = migrationScore(file);
  if (currentScore > previousScore) {
    duplicateVersions.add(previous);
    versions.set(version, file);
    console.warn(
      `Skipping duplicate migration version ${version}: ${previous} (using ${file})`,
    );
  } else {
    duplicateVersions.add(file);
    console.warn(
      `Skipping duplicate migration version ${version}: ${file} (using ${previous})`,
    );
  }
}
const migrationsToApply = files.filter((file) => !duplicateVersions.has(file));
if (migrationsToApply.length === 0) throw new Error(`No migrations found in ${MIG_DIR}`);
console.log('Applying', migrationsToApply.length, 'migrations in order');

const filesToReplay = migrationsToApply;

function migrationSql(file) {
  // pgcrypto is not shipped with PGlite, but gen_random_uuid() is built in.
  return readFileSync(join(MIG_DIR, file), 'utf8')
    .replace(/create extension if not exists "?pgcrypto"?;?/gi, '');
}

// SIMULATE_LEGACY=1 reproduces the relevant production drift without
// discarding the rest of the canonical schema. The old harness created only
// four tables before replaying the whole chain, which produced dozens of
// unrelated missing-table/column failures and never reached the FTS guards.
// The canonical migrations through 0018 create the legacy content shape; the
// replay then starts at 0019, where the compatibility guards must add the
// generated searchable columns and indexes safely.
let startIndex = 0;
if (process.env.SIMULATE_LEGACY === '1') {
  startIndex = filesToReplay.indexOf(LEGACY_REPLAY_START);
  if (startIndex < 0) {
    throw new Error(`Legacy replay start migration not found: ${LEGACY_REPLAY_START}`);
  }

  for (const file of filesToReplay.slice(0, startIndex)) {
    await db.exec(migrationSql(file));
  }
  console.log(
    `Legacy drift simulated from the pre-0019 schema; replay starts at ${LEGACY_REPLAY_START}`,
  );
}

let failed = 0;
for (const f of filesToReplay.slice(startIndex)) {
  try {
    await db.exec(migrationSql(f));
    console.log('OK  ', f);
  } catch (e) {
    failed++;
    console.log('FAIL', f);
    console.log('     ', e.message.split('\n')[0]);
  }
}

// ---- Verify FTS objects exist ----
const res = await db.query(`
  SELECT c.relname AS index, t.relname AS table
  FROM pg_index i
  JOIN pg_class c ON c.oid = i.indexrelid
  JOIN pg_class t ON t.oid = i.indrelid
  JOIN pg_am am ON am.oid = c.relam
  WHERE am.amname = 'gin' AND t.relname IN ('quran_ayahs','hadiths','duas','articles')
  ORDER BY 2,1
`);
console.log('GIN indexes:', JSON.stringify(res.rows));

const cols = await db.query(`
  SELECT table_name, column_name, is_generated
  FROM information_schema.columns
  WHERE column_name = 'searchable' AND table_schema='public'
  ORDER BY table_name
`);
console.log('searchable columns:', JSON.stringify(cols.rows));

console.log(failed === 0 ? 'ALL_MIGRATIONS_PASSED' : `${failed} MIGRATIONS FAILED`);
process.exit(failed === 0 ? 0 : 1);
