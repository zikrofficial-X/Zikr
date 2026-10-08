#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const failures = [];
const appRoot = "src/app/admin";

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

const pages = existsSync(appRoot)
  ? walk(appRoot).filter((path) => path.endsWith("/page.tsx") || path === join(appRoot, "page.tsx"))
  : [];

if (!pages.length) failures.push("no admin page files discovered");

for (const page of pages) {
  const source = readFileSync(page, "utf8");
  const hasPermissionGate =
    /requireAdminPermission\(/.test(source) ||
    /requireAdmin\(/.test(source) ||
    /redirect\(/.test(source);
  if (!hasPermissionGate) failures.push(`${page}: missing server-side admin gate or explicit redirect`);
  if (/SUPABASE_SERVICE_ROLE_KEY/.test(source)) failures.push(`${page}: service-role secret must never appear in an admin page`);
  if (/createAdminClient\(/.test(source) && /'use client'|["']use client["']/.test(source)) {
    failures.push(`${page}: client page must not instantiate the admin Supabase client`);
  }
}

const layout = readFileSync("src/app/admin/layout.tsx", "utf8");
for (const token of ["requireAdmin()", "ADMIN_NAVIGATION", "hasAdminPermission", "robots: { index: false, follow: false }"]) {
  if (!layout.includes(token)) failures.push(`admin layout missing security/navigation contract: ${token}`);
}

const navigation = readFileSync("src/features/admin/config/navigation.ts", "utf8");
const hrefs = [...navigation.matchAll(/href:\s*"([^"]+)"/g)].map((match) => match[1]);
if (new Set(hrefs).size !== hrefs.length) failures.push("admin navigation contains duplicate hrefs");

const pageCount = pages.length;
if (pageCount < hrefs.length) failures.push(`admin route inventory mismatch: ${pageCount} page files for ${hrefs.length} canonical navigation routes`);

if (failures.length) {
  console.error("ADMIN_PAGE_AUDIT_FAILED");
  for (const failure of failures) console.error(`❌ ${failure}`);
  process.exit(1);
}

console.log(`✅ Admin page audit passed: ${pageCount} page files, ${hrefs.length} canonical navigation routes.`);
