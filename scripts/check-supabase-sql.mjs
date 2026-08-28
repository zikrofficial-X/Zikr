import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

const db = new PGlite();
await db.exec(`
  CREATE SCHEMA IF NOT EXISTS auth;
  CREATE SCHEMA IF NOT EXISTS storage;
  CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$
    SELECT '00000000-0000-0000-0000-000000000000'::uuid
  $$;
  CREATE TABLE IF NOT EXISTS auth.users(id uuid PRIMARY KEY);
  DO $$ BEGIN CREATE ROLE anon; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE ROLE authenticated; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
`);

for (const file of process.argv.slice(2)) {
  try {
    const sql = readFileSync(file, 'utf8').replace(/^\s*CREATE EXTENSION IF NOT EXISTS .*$/gim, '-- extension skipped in pglite');
    await db.exec(sql);
    console.log(`ok ${file}`);
  } catch (error) {
    console.error(`fail ${file}`);
    console.error(error.message);
    process.exit(1);
  }
}
