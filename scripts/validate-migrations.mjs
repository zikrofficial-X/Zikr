// Validates the full Supabase migration chain against an in-memory Postgres
// (PGlite) with Supabase auth/storage schemas stubbed. Catches ordering bugs,
// duplicate migration versions, and non-idempotent RLS policy definitions before
// they reach Supabase Preview/production.
//
// Usage: node scripts/validate-migrations.mjs
import { PGlite } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIG_DIR = join(ROOT, 'supabase', 'migrations');
const files = readdirSync(MIG_DIR).filter((f) => f.endsWith('.sql')).sort();

// Supabase Preview uploads/replays every migration. Keep individual migration
// files small enough to avoid payload-size failures in the integration.
const MAX_MIGRATION_BYTES = 1024 * 1024;
const oversizedMigrations = files
  .map((file) => ({ file, bytes: statSync(join(MIG_DIR, file)).size }))
  .filter(({ bytes }) => bytes > MAX_MIGRATION_BYTES);
if (oversizedMigrations.length > 0) {
  for (const { file, bytes } of oversizedMigrations) {
    console.error(`Migration exceeds the 1 MiB payload budget: ${file} (${bytes} bytes)`);
  }
  console.error(`MIGRATION_SIZE_GUARD_FAILED: ${oversizedMigrations.length} file(s) exceed 1 MiB.`);
  process.exit(1);
}
console.log(`MIGRATION_SIZE_GUARD_PASSED: ${files.length} SQL files are at or below 1 MiB.`);
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
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_admin') THEN CREATE ROLE supabase_admin; END IF;
END $do$;
GRANT CREATE ON SCHEMA public TO supabase_admin;

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
RETURNS trigger LANGUAGE plpgsql AS $stub$ BEGIN NEW.updated_at = now(); RETURN NEW; END $stub$;
CREATE OR REPLACE FUNCTION public.update_game_graphics_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $stub$ BEGIN NEW.updated_at = now(); RETURN NEW; END $stub$;
CREATE OR REPLACE FUNCTION public.update_video_narrations_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $stub$ BEGIN NEW.updated_at = now(); RETURN NEW; END $stub$;
CREATE OR REPLACE FUNCTION public.update_kids_game_progress_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $stub$ BEGIN NEW.updated_at = now(); RETURN NEW; END $stub$;
CREATE OR REPLACE FUNCTION public.update_kids_character_selection_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $stub$ BEGIN NEW.updated_at = now(); RETURN NEW; END $stub$;
CREATE TABLE IF NOT EXISTS public.video_automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  created_count integer NOT NULL DEFAULT 0,
  processed_count integer NOT NULL DEFAULT 0,
  completed_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  provider_stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_summary text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- pg_cron is a managed Supabase extension and is not present in the PGlite
-- replay environment. Keep only the minimal relation shape needed by the
-- migration chain's defensive existence checks; migrations that require the
-- real extension are already guarded by pg_extension checks.
CREATE SCHEMA IF NOT EXISTS cron;
CREATE TABLE IF NOT EXISTS cron.job (
  jobid bigint PRIMARY KEY,
  jobname text
);

CREATE OR REPLACE FUNCTION cron.schedule(name text, schedule text, command text)
RETURNS bigint
LANGUAGE plpgsql
AS $cron_stub$
DECLARE
  next_id bigint;
BEGIN
  SELECT COALESCE(MAX(jobid), 0) + 1 INTO next_id FROM cron.job;
  INSERT INTO cron.job(jobid, jobname) VALUES (next_id, name)
  ON CONFLICT (jobid) DO NOTHING;
  RETURN next_id;
END;
$cron_stub$;

CREATE OR REPLACE FUNCTION cron.alter_job(
  job_id bigint,
  schedule text DEFAULT NULL,
  command text DEFAULT NULL,
  database text DEFAULT NULL,
  username text DEFAULT NULL,
  active boolean DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
AS $cron_stub$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE cron.job.jobid = $1) THEN
    RETURN job_id;
  END IF;
  RETURN job_id;
END;
$cron_stub$;

CREATE OR REPLACE FUNCTION cron.unschedule(job_id bigint)
RETURNS boolean
LANGUAGE plpgsql
AS $cron_stub$
BEGIN
  DELETE FROM cron.job WHERE cron.job.jobid = $1;
  RETURN FOUND;
END;
$cron_stub$;

CREATE OR REPLACE FUNCTION public.track_free_tier_usage()
RETURNS void LANGUAGE plpgsql AS $stub$ BEGIN NULL; END $stub$;
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

// Recreate the production non-DML ACL baseline before replaying migrations.
// The live project currently has these browser-role grants on existing public
// tables and in both owners' public-schema default ACLs. The final hardening
// migration must remove them without relying on an empty PGlite starting state.
await db.exec(`
  ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    GRANT TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLES
    TO PUBLIC, anon, authenticated;
  ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public
    GRANT TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLES
    TO PUBLIC, anon, authenticated;
  ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    GRANT EXECUTE ON FUNCTIONS TO PUBLIC, anon, authenticated;
  ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public
    GRANT EXECUTE ON FUNCTIONS TO PUBLIC, anon, authenticated;

  CREATE TABLE public.__audit_existing_non_dml_privilege_probe (
    id integer PRIMARY KEY
  );
  GRANT TRUNCATE, REFERENCES, TRIGGER, MAINTAIN
    ON TABLE public.__audit_existing_non_dml_privilege_probe
    TO PUBLIC, anon, authenticated;

  SET ROLE supabase_admin;
  CREATE TABLE public.__audit_supabase_admin_non_dml_privilege_probe (
    id integer PRIMARY KEY
  );
  RESET ROLE;
`);

const seededNonDmlPrivileges = await db.query(`
  SELECT count(*) AS grant_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  CROSS JOIN (VALUES ('anon'), ('authenticated')) AS r(role_name)
  CROSS JOIN unnest(ARRAY['TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN']::text[]) AS p(privilege)
  WHERE n.nspname = 'public'
    AND c.relname IN (
      '__audit_existing_non_dml_privilege_probe',
      '__audit_supabase_admin_non_dml_privilege_probe'
    )
    AND has_table_privilege(r.role_name, c.oid, p.privilege)
`);
if (Number(seededNonDmlPrivileges.rows[0]?.grant_count ?? 0) !== 16) {
  throw new Error(
    "CLIENT_NON_DML_BASELINE_SETUP_FAILED: expected 16 browser-role table grants before migration replay.",
  );
}

const seededDefaultAclOwners = await db.query(`
  SELECT count(DISTINCT d.defaclrole) AS owner_count
  FROM pg_default_acl d
  JOIN pg_namespace n ON n.oid = d.defaclnamespace
  WHERE n.nspname = 'public'
    AND d.defaclobjtype = 'r'
`);
if (Number(seededDefaultAclOwners.rows[0]?.owner_count ?? 0) < 2) {
  throw new Error(
    "CLIENT_NON_DML_DEFAULT_ACL_BASELINE_SETUP_FAILED: expected postgres and supabase_admin public defaults.",
  );
}
console.log("CLIENT_NON_DML_BASELINE_SEEDED: existing tables and both owner default ACLs contain browser-role grants.");

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

if (failed === 0) {
  const safeRetentionContract = await db.query(
    "SELECT public.video_storage_retention_contract_ready() AS ready",
  );
  if (safeRetentionContract.rows[0]?.ready !== true) {
    failed++;
    console.error("VIDEO_STORAGE_RETENTION_CONTRACT_FAILED: the current RPC did not satisfy the playback-preservation preflight.");
  } else {
    console.log("VIDEO_STORAGE_RETENTION_CONTRACT_SAFE_PASSED");
  }

  // Prove that the live preflight rejects a function that clears playback URLs.
  // This replacement is isolated to the in-memory PGlite transaction and is
  // rolled back before any later migration checks or process exit.
  await db.exec("BEGIN");
  let unsafeRetentionRejected = false;
  try {
    await db.exec(`
      CREATE OR REPLACE FUNCTION public.update_video_storage_retention(
        p_queue_id uuid,
        p_request_id uuid,
        p_expected_url text,
        p_retention jsonb,
        p_finalize boolean DEFAULT false
      )
      RETURNS void
      LANGUAGE plpgsql
      SECURITY INVOKER
      SET search_path = ''
      AS $unsafe$
      BEGIN
        UPDATE public.social_publish_queue
        SET video_url = NULL
        WHERE id = p_queue_id;

        UPDATE public.video_generation_requests
        SET video_url = NULL
        WHERE id = p_request_id;
      END;
      $unsafe$;
    `);
    const unsafeRetentionContract = await db.query(
      "SELECT public.video_storage_retention_contract_ready() AS ready",
    );
    unsafeRetentionRejected = unsafeRetentionContract.rows[0]?.ready === false;
  } finally {
    await db.exec("ROLLBACK");
  }

  if (!unsafeRetentionRejected) {
    failed++;
    console.error("VIDEO_STORAGE_RETENTION_CONTRACT_REGRESSION: the preflight accepted an RPC that clears Cloudinary playback URLs.");
  } else {
    console.log("VIDEO_STORAGE_RETENTION_CONTRACT_REJECTS_URL_CLEARING");
  }
}


 
if (failed === 0) {
// Keep the two required playback-preserving UPDATEs but inject an additional
// INSERT. The contract must reject the unreviewed side effect without executing it.
await db.exec("BEGIN");
let extraWriteRejected = false;
try {
  await db.exec(`
    CREATE OR REPLACE FUNCTION public.update_video_storage_retention(
      p_queue_id uuid,
      p_request_id uuid,
      p_expected_url text,
      p_retention jsonb,
      p_finalize boolean DEFAULT false
    )
    RETURNS void
    LANGUAGE plpgsql
    SECURITY INVOKER
    SET search_path = ''
    AS $unsafe$
    BEGIN
      IF p_finalize IS DISTINCT FROM (p_retention->>'state' = 'purged') THEN
        RAISE EXCEPTION 'Invalid retention finalization state';
      END IF;
      IF p_retention->>'bucket' IS DISTINCT FROM 'videos' THEN
        RAISE EXCEPTION 'Invalid retention bucket';
      END IF;

      UPDATE public.social_publish_queue
      SET metadata = coalesce(metadata, '{}'::jsonb)
        || jsonb_build_object('storageRetention', p_retention)
      WHERE id = p_queue_id
        AND content_id = p_request_id::text
        AND status = 'published'
        AND video_url = p_expected_url
        AND metadata->'storageRetention'->>'path' = p_retention->>'path';

      UPDATE public.video_generation_requests
      SET content = coalesce(content, '{}'::jsonb)
        || jsonb_build_object('storageRetention', p_retention)
      WHERE id = p_request_id
        AND status = 'completed'
        AND video_url = p_expected_url
        AND content->'storageRetention'->>'path' = p_retention->>'path';

      INSERT INTO public.admin_settings (key, value)
      VALUES ('retention-contract-probe', 'true');
    END;
    $unsafe$;
  `);
  const extraWriteContract = await db.query(
    "SELECT public.video_storage_retention_contract_ready() AS ready",
  );
  extraWriteRejected = extraWriteContract.rows[0]?.ready === false;
} finally {
  await db.exec("ROLLBACK");
}

if (!extraWriteRejected) {
  failed++;
  console.error("VIDEO_STORAGE_RETENTION_CONTRACT_REGRESSION: the preflight accepted an extra INSERT side effect.");
} else {
  console.log("VIDEO_STORAGE_RETENTION_CONTRACT_REJECTS_EXTRA_INSERT");
}
}


if (failed === 0) {
  // A playback-preserving RPC can still be unsafe if it changes queue/request
  // state while recording retention metadata. The preflight must allow only
  // metadata/content plus updated_at in the two UPDATE SET clauses.
  await db.exec("BEGIN");
  let extraColumnRejected = false;
  try {
    await db.exec(`
      CREATE OR REPLACE FUNCTION public.update_video_storage_retention(
        p_queue_id uuid,
        p_request_id uuid,
        p_expected_url text,
        p_retention jsonb,
        p_finalize boolean DEFAULT false
      )
      RETURNS void
      LANGUAGE plpgsql
      SECURITY INVOKER
      SET search_path = ''
      AS $unsafe$
      BEGIN
        IF p_finalize IS DISTINCT FROM (p_retention->>'state' = 'purged') THEN
          RAISE EXCEPTION 'Invalid retention finalization state';
        END IF;
        IF p_retention->>'bucket' IS DISTINCT FROM 'videos' THEN
          RAISE EXCEPTION 'Invalid retention bucket';
        END IF;

        UPDATE public.social_publish_queue
        SET metadata = coalesce(metadata, '{}'::jsonb)
              || jsonb_build_object('storageRetention', p_retention),
            status = 'failed',
            updated_at = now()
        WHERE id = p_queue_id
          AND content_id = p_request_id::text
          AND status = 'published'
          AND video_url = p_expected_url
          AND metadata->'storageRetention'->>'path' = p_retention->>'path';

        UPDATE public.video_generation_requests
        SET content = coalesce(content, '{}'::jsonb)
              || jsonb_build_object('storageRetention', p_retention),
            status = 'failed',
            updated_at = now()
        WHERE id = p_request_id
          AND status = 'completed'
          AND video_url = p_expected_url
          AND content->'storageRetention'->>'path' = p_retention->>'path';
      END;
      $unsafe$;
    `);
    const extraColumnContract = await db.query(
      "SELECT public.video_storage_retention_contract_ready() AS ready",
    );
    extraColumnRejected = extraColumnContract.rows[0]?.ready === false;
  } finally {
    await db.exec("ROLLBACK");
  }

  if (!extraColumnRejected) {
    failed++;
    console.error("VIDEO_STORAGE_RETENTION_CONTRACT_REGRESSION: the preflight accepted an unexpected status assignment.");
  } else {
    console.log("VIDEO_STORAGE_RETENTION_CONTRACT_REJECTS_EXTRA_COLUMN_ASSIGNMENT");
  }
}


if (failed === 0) {
  const clientTablePrivileges = await db.query(`
    SELECT n.nspname AS schema_name, c.relname AS table_name,
           r.role_name, p.privilege
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    CROSS JOIN (VALUES ('anon'), ('authenticated')) AS r(role_name)
    CROSS JOIN unnest(ARRAY['TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN']::text[]) AS p(privilege)
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
      AND has_table_privilege(r.role_name, c.oid, p.privilege)
    ORDER BY c.relname, r.role_name, p.privilege
  `);
  const clientDefaultPrivilegesSql = `
    SELECT owner.rolname AS owner,
           COALESCE(n.nspname, '<global>') AS schema_name,
           COALESCE(grantee.rolname, 'PUBLIC') AS grantee,
           acl.privilege_type
    FROM pg_default_acl d
    JOIN pg_roles owner ON owner.oid = d.defaclrole
    LEFT JOIN pg_namespace n ON n.oid = d.defaclnamespace
    CROSS JOIN LATERAL aclexplode(d.defaclacl) acl
    LEFT JOIN pg_roles grantee ON grantee.oid = acl.grantee
    WHERE d.defaclobjtype = 'r'
      AND (d.defaclnamespace = 0 OR n.nspname = 'public')
      AND (acl.grantee = 0 OR grantee.rolname IN ('anon', 'authenticated'))
      AND acl.privilege_type IN ('TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN')
    ORDER BY owner.rolname, schema_name, grantee, acl.privilege_type
  `;
  const clientDefaultPrivileges = await db.query(clientDefaultPrivilegesSql);

  const clientDefaultFunctionPrivilegesSql = `
    SELECT owner.rolname AS owner,
           COALESCE(n.nspname, '<global>') AS schema_name,
           COALESCE(grantee.rolname, 'PUBLIC') AS grantee,
           acl.privilege_type
    FROM pg_default_acl d
    JOIN pg_roles owner ON owner.oid = d.defaclrole
    LEFT JOIN pg_namespace n ON n.oid = d.defaclnamespace
    CROSS JOIN LATERAL aclexplode(d.defaclacl) acl
    LEFT JOIN pg_roles grantee ON grantee.oid = acl.grantee
    WHERE d.defaclobjtype = 'f'
      AND (d.defaclnamespace = 0 OR n.nspname = 'public')
      AND (acl.grantee = 0 OR grantee.rolname IN ('anon', 'authenticated'))
      AND acl.privilege_type = 'EXECUTE'
    ORDER BY owner.rolname, schema_name, grantee
  `;
  const clientDefaultFunctionPrivileges = await db.query(clientDefaultFunctionPrivilegesSql);

  // Prove the effective privileges of functions created after the migration.
  // Inspecting pg_default_acl alone misses PostgreSQL's implicit global PUBLIC
  // EXECUTE default, which a schema-only REVOKE cannot override.
  async function verifyNewPublicFunctionIsNotBrowserCallable(ownerRole, suffix) {
    const functionName = `default_function_execute_probe_${suffix}`;
    await db.exec(`SET ROLE ${ownerRole}`);
    try {
      await db.exec(`CREATE FUNCTION public.${functionName}() RETURNS integer LANGUAGE sql SECURITY DEFINER AS 'SELECT 1'`);
    } finally {
      await db.exec("RESET ROLE");
    }
    const probe = await db.query(`SELECT
      has_function_privilege('anon', 'public.${functionName}()', 'EXECUTE') AS anon_execute,
      has_function_privilege('authenticated', 'public.${functionName}()', 'EXECUTE') AS authenticated_execute
    `);
    await db.exec(`DROP FUNCTION public.${functionName}()`);
    const row = probe.rows[0] ?? {};
    if (row.anon_execute || row.authenticated_execute) {
      failed++;
      console.error(`CLIENT_DEFAULT_FUNCTION_EXECUTE_REGRESSION: ${ownerRole} created ${functionName} with browser EXECUTE privileges.`);
    } else {
      console.log(`CLIENT_DEFAULT_FUNCTION_EXECUTE_PROBE_PASSED: ${ownerRole}`);
    }
  }
  await verifyNewPublicFunctionIsNotBrowserCallable("postgres", "postgres");
  await verifyNewPublicFunctionIsNotBrowserCallable("supabase_admin", "supabase_admin");

  await db.exec("BEGIN");
  let globalDefaultFunctionPrivilegeDetected = false;
  try {
    await db.exec("ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT EXECUTE ON FUNCTIONS TO anon");
    const globalProbe = await db.query(clientDefaultFunctionPrivilegesSql);
    globalDefaultFunctionPrivilegeDetected = globalProbe.rows.some((row) =>
      row.owner === "postgres" &&
      row.schema_name === "<global>" &&
      row.grantee === "anon" &&
      row.privilege_type === "EXECUTE"
    );
  } finally {
    await db.exec("ROLLBACK");
  }
  if (!globalDefaultFunctionPrivilegeDetected) {
    failed++;
    console.error("CLIENT_DEFAULT_FUNCTION_EXECUTE_AUDIT_FAILED: the audit query did not detect a global browser-role EXECUTE grant.");
  } else {
    console.log("CLIENT_DEFAULT_FUNCTION_EXECUTE_AUDIT_PASSED");
  }

  // Global default privileges are additive to per-schema defaults. Prove that
  // the audit query detects a global grant as well as the public-schema grants
  // removed by the migration chain; the probe is rolled back in this PGlite DB.
  await db.exec("BEGIN");
  let globalDefaultPrivilegeDetected = false;
  try {
    await db.exec("ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT TRUNCATE ON TABLES TO anon");
    const globalProbe = await db.query(clientDefaultPrivilegesSql);
    globalDefaultPrivilegeDetected = globalProbe.rows.some((row) =>
      row.owner === "postgres" &&
      row.schema_name === "<global>" &&
      row.grantee === "anon" &&
      row.privilege_type === "TRUNCATE"
    );
  } finally {
    await db.exec("ROLLBACK");
  }
  if (!globalDefaultPrivilegeDetected) {
    failed++;
    console.error("CLIENT_NON_DML_GLOBAL_DEFAULT_PRIVILEGE_AUDIT_FAILED: the audit query did not detect a global browser-role grant.");
  } else {
    console.log("CLIENT_NON_DML_GLOBAL_DEFAULT_PRIVILEGE_AUDIT_PASSED");
  }

  if (
    clientTablePrivileges.rows.length > 0 ||
    clientDefaultPrivileges.rows.length > 0 ||
    clientDefaultFunctionPrivileges.rows.length > 0
  ) {
    failed++;
    console.error(
      "CLIENT_NON_DML_OR_DEFAULT_FUNCTION_PRIVILEGES_REGRESSION: browser roles retain non-RLS table privileges or default function EXECUTE.",
      JSON.stringify({
        existing: clientTablePrivileges.rows,
        defaults: clientDefaultPrivileges.rows,
        functionDefaults: clientDefaultFunctionPrivileges.rows,
      }),
    );
  } else {
    console.log("CLIENT_NON_DML_TABLE_AND_DEFAULT_FUNCTION_PRIVILEGES_REVOKED");
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
