#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const failures = [];

function read(path) {
  if (!existsSync(path)) {
    failures.push("missing file: " + path);
    return "";
  }
  return readFileSync(path, "utf8");
}

function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(path));
    else out.push(path);
  }
  return out;
}

const navigationPath = "src/features/admin/config/navigation.ts";
const navigation = read(navigationPath);
const hrefs = [...navigation.matchAll(/href:\s*["']([^"']+)["']/g)].map((m) => m[1]);
const duplicateHrefs = hrefs.filter((href, i) => hrefs.indexOf(href) !== i);
for (const href of [...new Set(duplicateHrefs)]) failures.push("duplicate admin navigation href: " + href);

for (const href of [...new Set(hrefs)]) {
  if (!href.startsWith("/admin")) continue;
  const page = href === "/admin" ? "src/app/admin/page.tsx" : join("src/app", href.slice(1), "page.tsx");
  if (!existsSync(join(ROOT, page))) failures.push("admin navigation target has no page: " + href);
}

const permissionRefs = [...navigation.matchAll(/permission:\s*["']([^"']+)["']/g)].map((m) => m[1]);
const permissions = read("src/features/admin/services/permissions.ts");
for (const permission of [...new Set(permissionRefs)]) {
  if (!permissions.includes("'" + permission + "'") && !permissions.includes('"' + permission + '"')) {
    failures.push("navigation references undefined admin permission: " + permission);
  }
}

const adminPages = walk(join(ROOT, "src/app/admin")).filter((p) => p.endsWith("page.tsx"));
for (const pagePath of adminPages) {
  const rel = relative(ROOT, pagePath).replaceAll("\\", "/");
  const source = read(rel);
  if (!source.includes("requireAdminPermission(") && !source.includes("requireAdmin()")) {
    failures.push("admin page has no server-side admin permission guard: " + rel);
  }
}

const adminApiRoutes = walk(join(ROOT, "src/app/api/admin")).filter((p) => p.endsWith("route.ts"));
for (const routePath of adminApiRoutes) {
  const rel = relative(ROOT, routePath).replaceAll("\\", "/");
  const source = read(rel);
  if (!source.includes("requireAdminApi(")) {
    failures.push("admin API route has no requireAdminApi guard: " + rel);
    continue;
  }
  const matches = [...source.matchAll(/requireAdminApi\(\s*([^)]*)\)/g)].map((m) => (m[1] ?? "").trim());
  if (matches.some((arg) => !arg || arg === "undefined")) {
    failures.push("admin API route uses the unscoped default admin.access guard: " + rel);
  }
}

const packageJson = JSON.parse(read("package.json"));
if (!packageJson.scripts?.["admin:architecture:check"]) failures.push("admin:architecture:check is not registered");
if (!packageJson.scripts?.verify?.includes("pnpm admin:architecture:check")) failures.push("verify must include admin architecture verification");
if (!packageJson.scripts?.["verify:pr"]?.includes("pnpm admin:architecture:check")) failures.push("verify:pr must include admin architecture verification");

if (failures.length) {
  console.error("ADMIN_ARCHITECTURE_CHECK_FAILED");
  for (const failure of failures) console.error("❌ " + failure);
  process.exit(1);
}

console.log(`✅ Phase 16 Admin Architecture checks passed: ${hrefs.length} navigation links, ${adminPages.length} admin pages, ${adminApiRoutes.length} admin API routes, scoped permission checks verified.`);
