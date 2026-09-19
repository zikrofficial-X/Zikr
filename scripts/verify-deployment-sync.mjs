#!/usr/bin/env node

/**
 * Canonical pre-deployment integrity check.
 * Database changes belong exclusively to Supabase migrations.
 * The application runtime does not use Drizzle or a direct Postgres URL.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const warnings = [];

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}
function read(relativePath) {
  const file = path.join(root, relativePath);
  return exists(relativePath) ? fs.readFileSync(file, "utf8") : "";
}
function requirePath(relativePath) {
  if (!exists(relativePath)) failures.push(`Missing required path: ${relativePath}`);
}
function warn(message) {
  warnings.push(message);
}

for (const file of [
  "package.json",
  "pnpm-lock.yaml",
  "tsconfig.json",
  "next.config.ts",
  "supabase/config.toml",
  ".env.example",
  "src/lib/types/supabase.ts",
]) requirePath(file);

for (const stalePath of [
  "drizzle.config.ts",
  "drizzle/schema.ts",
  "drizzle/migrations",
]) {
  if (exists(stalePath)) failures.push(`Obsolete runtime schema path still exists: ${stalePath}`);
}

const pkg = JSON.parse(read("package.json"));
if (!pkg.dependencies?.["@supabase/supabase-js"]) {
  failures.push("Supabase client dependency is missing");
}
if (!pkg.scripts?.build) failures.push("package.json: build script is missing");
if (!pkg.scripts?.verify) failures.push("package.json: verify script is missing");
if (pkg.dependencies?.["drizzle-orm"] || pkg.devDependencies?.["drizzle-kit"]) {
  failures.push("Drizzle dependency remains in package.json");
}

const lock = read("pnpm-lock.yaml");
if (lock.includes("drizzle-orm") || lock.includes("drizzle-kit")) {
  failures.push("Drizzle dependency remains in pnpm-lock.yaml");
}

const envExample = read(".env.example");
for (const obsolete of [
  "DATABASE_URL=",
  "POSTGRES_URL=",
  "POSTGRES_PRISMA_URL=",
  "POSTGRES_URL_NON_POOLING=",
  "NEXT_PUBLIC_GOOGLE_CLIENT_ID=",
  "GOOGLE_CLIENT_ID=",
  "GOOGLE_CLIENT_SECRET=",
]) {
  if (envExample.includes(obsolete)) failures.push(`.env.example contains retired variable: ${obsolete}`);
}

const authConfig = read("supabase/config.toml");
if (!authConfig.includes('site_url = "https://zikrmediaofficial.vercel.app"')) {
  failures.push("Supabase auth site_url is not canonical");
}
for (const redirect of [
  "https://zikrmediaofficial.vercel.app/auth/callback",
  "http://localhost:3000/auth/callback",
  "com.zikr.app://auth/callback",
]) {
  if (!authConfig.includes(redirect)) failures.push(`Supabase Auth redirect missing: ${redirect}`);
}

const migrationsDir = path.join(root, "supabase", "migrations");
if (fs.existsSync(migrationsDir)) {
  const migrations = fs.readdirSync(migrationsDir).filter((file) => file.endsWith(".sql")).sort();
  if (!migrations.length) failures.push("Supabase migration directory is empty");

  const versions = new Set();
  for (const file of migrations) {
    const match = file.match(/^(\d+)_/);
    if (!match) failures.push(`Migration file has no numeric version prefix: ${file}`);
    else if (versions.has(match[1])) failures.push(`Duplicate Supabase migration version: ${match[1]}`);
    else versions.add(match[1]);
  }
}

if (!exists("src/app")) failures.push("src/app is missing");
if (!exists("src/features")) failures.push("src/features is missing");

for (const historicalDoc of [
  "AUDIT_REPORT.md",
  "PROJECT_STATUS.md",
]) {
  if (exists(historicalDoc)) warn(`${historicalDoc} is a historical status document; runtime does not depend on it.`);
}

console.log("ZIKR DEPLOYMENT INTEGRITY");
for (const failure of failures) console.log("❌ " + failure);
for (const warning of warnings) console.log("⚠️ " + warning);

console.log(`\\nResult: ${failures.length} failure(s), ${warnings.length} warning(s)`);
if (failures.length) process.exit(1);
