import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import postgres from 'postgres';
import { getScriptEnv } from '../lib/env';

const { DATABASE_URL } = getScriptEnv();

// Guard: ensure DATABASE_URL is set before proceeding
if (!DATABASE_URL) {
  console.error('[audit-db] ERROR: DATABASE_URL environment variable is not set.');
  console.error('[audit-db] This script requires a valid Postgres connection URL.');
  console.error('[audit-db] Ensure .env.local or deployment env vars include DATABASE_URL.');
  process.exitCode = 1;
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { prepare: false });

type Row = Record<string, unknown>;

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = join('reports', 'db-audit', stamp);
mkdirSync(outDir, { recursive: true });

async function run<T extends Row>(label: string, query: Promise<T[]>) {
  const rows = await query;
  writeFileSync(join(outDir, `${label.replace(/\s+/g, '_')}.json`), JSON.stringify(rows, null, 2));
  console.log(`✔ ${label}: ${rows.length}`);
  return rows;
}

async function main() {
  const summary: Record<string, number> = {};
  const save = async <T extends Row>(label: string, q: Promise<T[]>) => {
    const rows = await run(label, q);
    summary[label] = rows.length;
  };

  await save('tables', sql`select table_schema, table_name from information_schema.tables where table_schema in ('public', 'auth', 'storage') and table_type='BASE TABLE' order by table_schema, table_name`);
  await save('columns', sql`select table_schema, table_name, column_name, data_type, is_nullable, column_default from information_schema.columns where table_schema in ('public', 'auth', 'storage') order by table_schema, table_name, ordinal_position`);
  await save('indexes', sql`select schemaname, tablename, indexname, indexdef from pg_indexes where schemaname in ('public','auth','storage') order by schemaname, tablename, indexname`);
  await save('constraints', sql`select n.nspname as schema_name, c.relname as table_name, con.conname as constraint_name, con.contype as constraint_type, pg_get_constraintdef(con.oid) as definition from pg_constraint con join pg_class c on c.oid = con.conrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname in ('public','auth','storage') order by n.nspname, c.relname, con.conname`);
  await save('rls_tables', sql`select schemaname, tablename, rowsecurity, forcerowsecurity from pg_tables where schemaname='public' order by tablename`);
  await save('policies', sql`select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check from pg_policies where schemaname in ('public', 'storage') order by schemaname, tablename, policyname`);
  await save('triggers', sql`select event_object_schema as schema_name, event_object_table as table_name, trigger_name, event_manipulation as event, action_timing as timing from information_schema.triggers where event_object_schema in ('public','auth','storage') order by event_object_schema, event_object_table, trigger_name`);
  await save('functions', sql`select routine_schema, routine_name, data_type from information_schema.routines where routine_schema='public' order by routine_name`);
  await save('extensions', sql`select extname, extversion from pg_extension order by extname`);
  await save('orphan_favorites', sql`select count(*)::int as orphan_count from favorites f left join profiles p on p.id = f.user_id where p.id is null`);
  await save('orphan_reading_progress', sql`select count(*)::int as orphan_count from reading_progress rp left join profiles p on p.id = rp.user_id where p.id is null`);
  await save('orphan_reminders', sql`select count(*)::int as orphan_count from reminders r left join profiles p on p.id = r.user_id where p.id is null`);
  await save('content_duplicate_slugs', sql`select 'scholars' as table_name, slug, count(*)::int as dup_count from scholars group by slug having count(*) > 1 union all select 'stories' as table_name, slug, count(*)::int as dup_count from stories group by slug having count(*) > 1`);
  await save('hadith_uniqueness', sql`select book_id, hadith_number, count(*)::int as dup_count from hadiths group by book_id, hadith_number having count(*) > 1`);
  await save('quran_uniqueness', sql`select surah_id, ayah_number, count(*)::int as dup_count from quran_ayahs group by surah_id, ayah_number having count(*) > 1`);

  writeFileSync(join(outDir, 'summary.json'), JSON.stringify({ generatedAt: new Date().toISOString(), summary }, null, 2));
  writeFileSync(join('reports', 'db-audit', 'latest.txt'), `${outDir}\n`);
  console.log(`\nAudit reports written to: ${outDir}`);
  await sql.end();
}

main().catch(async (error) => {
  console.error('[audit-db] failed:', error);
  await sql.end();
  process.exitCode = 1;
});
