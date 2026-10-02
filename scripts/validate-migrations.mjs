// Validates the full Supabase migration chain against an in-memory Postgres
// (PGlite) with Supabase auth/storage schemas stubbed. Catches ordering bugs,
// duplicate migration versions, and non-idempotent RLS policy definitions before
// they reach Supabase Preview/production.
//
// Usage: node scripts/validate-migrations.mjs
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

-- Production still contains these runtime tables from the archived 20260929
-- kids/video migration family. They are intentionally kept outside the active
-- migration directory, so the validator seeds a minimal schema baseline here.
CREATE TABLE IF NOT EXISTS public.game_scenarios (
  game_id text primary key,
  title_ar text,
  title_en text,
  difficulty text,
  sound_theme text
);
CREATE TABLE IF NOT EXISTS public.game_graphics (
  game_id text primary key,
  updated_at timestamptz default now()
);
CREATE TABLE IF NOT EXISTS public.video_narrations (
  id uuid primary key default gen_random_uuid(),
  video_id text unique,
  title text,
  narration_ar text,
  narration_en text,
  status text,
  cached boolean default false,
  free_tier boolean default true,
  duration_seconds integer,
  cost_usd numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
CREATE TABLE IF NOT EXISTS public.free_tier_usage (
  id uuid primary key default gen_random_uuid(),
  month_year text not null,
  service_type text not null,
  requests_count integer default 0,
  videos_generated integer default 0,
  cache_hits integer default 0,
  quota_limit integer,
  quota_used integer,
  quota_remaining integer,
  updated_at timestamptz default now(),
  unique(month_year, service_type)
);
CREATE OR REPLACE FUNCTION public.update_game_scenarios_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $ BEGIN NEW.updated_at = now(); RETURN NEW; END $;
CREATE OR REPLACE FUNCTION public.update_game_graphics_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $ BEGIN NEW.updated_at = now(); RETURN NEW; END $;
CREATE OR REPLACE FUNCTION public.update_video_narrations_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $ BEGIN NEW.updated_at = now(); RETURN NEW; END $;
CREATE OR REPLACE FUNCTION public.update_kids_game_progress_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $ BEGIN NEW.updated_at = now(); RETURN NEW; END $;
CREATE OR REPLACE FUNCTION public.update_kids_character_selection_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $ BEGIN NEW.updated_at = now(); RETURN NEW; END $;
CREATE OR REPLACE FUNCTION public.track_free_tier_usage()
RETURNS void LANGUAGE plpgsql AS $ BEGIN NULL; END $;
CREATE OR REPLACE VIEW public.free_tier_statistics AS
SELECT
  to_char(now(), 'YYYY-MM') AS current_month,
  count(DISTINCT video_id) AS total_videos_narrated,
  count(CASE WHEN cached = true THEN 1 END) AS cached_narrations,
  count(CASE WHEN free_tier = true THEN 1 END) AS free_tier_usage,
  sum(coalesce(duration_seconds, 0)) AS total_duration_seconds,
  sum(coalesce(cost_usd, 0)) AS estimated_cost,
  'Zero Cost - Free Tier'::text AS current_plan
FROM public.video_narrations
WHERE date_trunc('month', created_at) = date_trunc('month', now())
GROUP BY to_char(now(), 'YYYY-MM');
`;

await db.exec(stubs);
console.log('Supabase stubs installed');

const versions = new Map();
const duplicateVersions = new Set();
const activePolicies = new Map();
const duplicatePolicies = [];

const migrationScore = (file) => {
  const sql = readFileSync(join(MIG_DIR, file), 'utf8').toLowerCase();
  return (sql.includes('create table') ? 4 : 0)
    + (sql.includes('alter table') ? 2 : 0)
    + (sql.includes('create function') ? 1 : 0);
};

function normalizeIdent(value) {
  return value.replace(/^['\"]|['\"]$/g, '').trim().toLowerCase();
}

function scanPolicyChanges(sql, file) {
  // Track explicit DROP POLICY statements first. This allows later migrations to
  // intentionally redefine the same policy name after removing the old definition.
  const dropRe = /drop\s+policy\s+(?:if\s+exists\s+)?["']([^"']+)["']\s+on\s+(?:public\.)?["']?([a-zA-Z0-9_]+)["']?/gi;
  let drop;
  while ((drop = dropRe.exec(sql)) !== null) {
    const key = `${normalizeIdent(drop[2])}:${normalizeIdent(drop[1])}`;
    activePolicies.delete(key);
  }

  const createRe = /create\s+policy\s+["']([^"']+)["']\s+on\s+(?:public\.)?["']?([a-zA-Z0-9_]+)["']?/gi;
  let create;
  while ((create = createRe.exec(sql)) !== null) {
    const name = normalizeIdent(create[1]);
    const table = normalizeIdent(create[2]);
    const key = `${table}:${name}`;

    // A migration may intentionally use a pg_policies existence guard. Those are
    // idempotent even when an earlier migration already installed the policy.
    const context = sql.slice(Math.max(0, create.index - 500), create.index).toLowerCase();
    const guardedByPgPolicies =
      /if\s+not\s+exists\s*\([^)]*from\s+pg_policies[^)]*policyname\s*=\s*['"]/.test(context)
      || /if\s+not\s+exists\s*\([^)]*pg_policies/.test(context);

    const previous = activePolicies.get(key);
    if (previous && !guardedByPgPolicies) {
      duplicatePolicies.push({ name, table, first: previous, duplicate: file });
    }

    // Keep the newest definition as the active definition. If the create is
    // guarded, it is semantically a no-op when the policy already exists.
    activePolicies.set(key, file);
  }
}

for (const file of files) {
  const sql = readFileSync(join(MIG_DIR, file), 'utf8');
  const match = /^(\d+)_/.exec(file);
  if (match) {
    const version = match[1];
    const previous = versions.get(version);
    if (!previous) {
      versions.set(version, file);
    } else {
      const previousScore = migrationScore(previous);
      const currentScore = migrationScore(file);
      if (currentScore > previousScore) {
        duplicateVersions.add(previous);
        versions.set(version, file);
        console.warn(`Skipping duplicate migration version ${version}: ${previous} (using ${file})`);
      } else {
        duplicateVersions.add(file);
        console.warn(`Skipping duplicate migration version ${version}: ${file} (using ${previous})`);
      }
    }
  }

  scanPolicyChanges(sql, file);
}

if (duplicatePolicies.length > 0) {
  console.error('DUPLICATE_RLS_POLICIES_WITHOUT_DROP:');
  for (const issue of duplicatePolicies) {
    console.error(`  ${issue.table}.${issue.name}: ${issue.first} -> ${issue.duplicate}`);
  }
  process.exit(1);
}

const migrationsToApply = files.filter((file) => !duplicateVersions.has(file));
if (migrationsToApply.length === 0) throw new Error(`No migrations found in ${MIG_DIR}`);
console.log('Applying', migrationsToApply.length, 'migrations in order');

function migrationSql(file) {
  // pgcrypto is not shipped with PGlite, but gen_random_uuid() is built in.
  return readFileSync(join(MIG_DIR, file), 'utf8')
    .replace(/create extension if not exists "?pgcrypto"?;?/gi, '');
}

let startIndex = 0;
if (process.env.SIMULATE_LEGACY === '1') {
  startIndex = migrationsToApply.indexOf(LEGACY_REPLAY_START);
  if (startIndex < 0) {
    throw new Error(`Legacy replay start migration not found: ${LEGACY_REPLAY_START}`);
  }

  for (const file of migrationsToApply.slice(0, startIndex)) {
    await db.exec(migrationSql(file));
  }
  console.log(`Legacy drift simulated; replay starts at ${LEGACY_REPLAY_START}`);
}

let failed = 0;
for (const f of migrationsToApply.slice(startIndex)) {
  try {
    await db.exec(migrationSql(f));
    console.log('OK  ', f);
  } catch (e) {
    failed++;
    console.log('FAIL', f);
    console.log('     ', e.message.split('\n')[0]);
  }
}

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
