import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const migrationsDir = join(root, "supabase", "migrations");
const archiveDir = join(root, "supabase", "migrations_archive");
const files = readdirSync(migrationsDir).filter((file) => file.endsWith(".sql")).sort();
const errors = [];
const versions = new Map();

if (files.length === 0) errors.push("supabase/migrations is empty");

for (const file of files) {
  const match = /^(\d+)_/.exec(file);
  if (!match) errors.push(`${file}: migration filename must start with a numeric version`);
  else if (versions.has(match[1])) errors.push(`duplicate migration version ${match[1]}: ${versions.get(match[1])}, ${file}`);
  else versions.set(match[1], file);

  const path = join(migrationsDir, file);
  if (statSync(path).size === 0) errors.push(`${file}: migration is empty`);
  const sql = readFileSync(path, "utf8");
  if (/^\s*(?:BEGIN|COMMIT|ROLLBACK|START\s+TRANSACTION)\s*;\s*$/im.test(sql)) {
    errors.push(`${file}: do not include top-level transaction control; Supabase wraps each migration in a transaction`);
  }
  if (/SUPABASE_SERVICE_ROLE_KEY|service_role_secret/i.test(sql) && !/CREATE ROLE service_role/i.test(sql)) {
    errors.push(`${file}: service-role secret must not be stored in SQL`);
  }
}

if (files.some((file) => file.includes("20260705070523_initial_schema") || file.includes("20260705070652_rls_triggers_storage"))) {
  errors.push("legacy duplicate initial/RLS migrations must remain in migrations_archive only");
}

if (!statSync(archiveDir).isDirectory()) errors.push("supabase/migrations_archive is missing");

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`Supabase migration check passed: ${files.length} canonical migrations, no duplicate versions.`);
