#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];
const read = (path) => {
  const absolute = join(root, path);
  if (!existsSync(absolute)) {
    failures.push("missing file: " + path);
    return "";
  }
  return readFileSync(absolute, "utf8");
};

const navigationPath = "src/features/admin/config/navigation.ts";
const navigation = read(navigationPath);
const permissions = read("src/features/admin/services/permissions.ts");
const layout = read("src/app/admin/layout.tsx");
const sidebar = read("src/features/admin/components/admin-sidebar.tsx");
const adminService = read("src/features/admin/services/admin.ts");
const dashboard = read("src/features/admin/components/admin-platform-command-center.tsx");
const moduleDirectory = read("src/features/admin/components/admin-module-directory.tsx");
const analytics = read("src/app/admin/analytics/page.tsx");
const analyticsDashboard = read("src/app/admin/analytics/analytics-dashboard.tsx");
const securityService = read("src/features/admin/services/security.ts");
const auditService = read("src/features/admin/services/audit.ts");
const editorialActions = read("src/app/admin/editorial-actions.ts");
const docs = read("docs/admin/ADMIN_CONSOLE_GOVERNANCE.md");
const packageJson = JSON.parse(read("package.json"));

const groups = [...navigation.matchAll(/key:\s*"([^"]+)",\s*label:\s*"([^"]+)",\s*items:\s*\[([\s\S]*?)\]\s*,?/g)]
  .map((group) => ({
    key: group[1],
    label: group[2],
    items: [...group[3].matchAll(/href:\s*"([^"]+)",\s*label:\s*"([^"]+)",\s*permission:\s*"([^"]+)"/g)]
      .map((item) => ({ href: item[1], label: item[2], permission: item[3] })),
  }));
const items = groups.flatMap((group) => group.items);
if (groups.length < 6) failures.push("expected at least six canonical admin navigation groups");
if (!items.length) failures.push("no canonical navigation items were parsed");
if (items.some((item) => !item.label.trim() || !item.permission.trim())) failures.push("navigation item has an empty label or permission");

const hrefs = items.map((item) => item.href);
for (const href of new Set(hrefs.filter((value, index) => hrefs.indexOf(value) !== index))) {
  failures.push("duplicate admin navigation route: " + href);
}

function routeFile(href) {
  return href === "/admin" ? "src/app/admin/page.tsx" : join("src/app", href.slice(1), "page.tsx");
}
for (const item of items) {
  if (!existsSync(join(root, routeFile(item.href)))) failures.push("missing page for navigation target: " + item.href);
  if (!permissions.includes("'" + item.permission + "'") && !permissions.includes('"' + item.permission + '"')) {
    failures.push("navigation uses undeclared permission: " + item.permission);
  }
  if (!docs.includes("\`" + item.href + "\`") || !docs.includes("\`" + item.permission + "\`")) {
    failures.push("governance doc is missing route/permission coverage for: " + item.href);
  }
}

const adminRoot = join(root, "src/app/admin");
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(path));
    else if (entry.isFile() && (path.endsWith("/page.tsx") || path.endsWith("/page.ts"))) out.push(path);
  }
  return out;
}
for (const page of walk(adminRoot)) {
  const source = readFileSync(page, "utf8");
  if (!/requireAdminPermission\(|requireAdmin\(|redirect\(/.test(source)) {
    failures.push("admin page has no server-side gate or explicit redirect: " + page.replace(root + "/", ""));
  }
  if (/SUPABASE_SERVICE_ROLE_KEY/.test(source)) failures.push("admin page references a service-role secret variable: " + page.replace(root + "/", ""));
}

for (const token of [
  'robots: { index: false, follow: false }',
  "ADMIN_NAVIGATION",
  "hasAdminPermission",
]) {
  if (!layout.includes(token)) failures.push("admin layout is missing token: " + token);
}
if (!sidebar.includes('placeholder="ابحث في الأقسام..."')) failures.push("desktop admin navigation search is missing");
if (!sidebar.includes('aria-label="اختيار مجموعة الإدارة"') || !sidebar.includes('value={open ?? ""}')) failures.push("mobile admin navigation must use a compact accessible group selector");
if (!dashboard.includes("hasAdminPermission") || !dashboard.includes("availableHrefs")) failures.push("dashboard quick links and section cards must be filtered by the signed-in role");
if (!dashboard.includes("AdminModuleDirectory groups={availableGroups}")) failures.push("dashboard must use the permission-filtered interactive module directory");
if (!moduleDirectory.includes("FAVORITES_KEY") || !moduleDirectory.includes("RECENTS_KEY") || !moduleDirectory.includes("visibleGroups")) failures.push("admin directory must provide favorites, recent pages, and searchable group filtering");
if (!dashboard.includes('hasAdminPermission(role, "audit.read")') || !dashboard.includes('hasAdminPermission(role, "social.manage")') || !dashboard.includes('hasAdminPermission(role, "video.manage")')) failures.push("audit and queue operational details must respect admin role permissions");
if (!dashboard.includes("attentionItems.length > 0")) failures.push("dashboard must display actionable attention items based on operational counts");
if (!editorialActions.includes("enforceEditorialRateLimit") || !editorialActions.includes("EDITORIAL_RATE_LIMIT_MESSAGE") || !editorialActions.includes("editorialError(EDITORIAL_RATE_LIMIT_MESSAGE)")) failures.push("expected editorial rate-limit denials must redirect to a visible message instead of surfacing as runtime exceptions");
if (editorialActions.includes('await enforceAdminRateLimit(admin, "editorial.')) failures.push("editorial actions must not expose expected rate-limit denials as unhandled exceptions");
if (!analytics.includes("topArticles.filter((article) => article.views > 0)")) failures.push("analytics must not rank articles whose view counts are all zero");
if (!analyticsDashboard.includes("grid-cols-2") || !analyticsDashboard.includes("overflow-x-auto")) failures.push("analytics content and rankings must remain usable on mobile screens");
if (analytics.includes('href="/admin/videos"')) failures.push("analytics page must not link to the retired non-canonical video route");
if (!sidebar.includes('placeholder="ابحث في صفحات الإدارة..."')) failures.push("mobile admin navigation search is missing");
if (!sidebar.includes("filteredMobileGroups") || !sidebar.includes("لا توجد صفحة مطابقة للبحث.")) {
  failures.push("mobile search must filter results and show a no-results state");
}
if (!adminService.includes("admin_role_assignments") || !adminService.includes("requireAdminPermissionApi")) {
  failures.push("admin RBAC/API guard contract missing");
}
if (!/catch \(error\) \{[\s\S]*return true;[\s\S]*\}/.test(securityService)) {
  failures.push("destructive-action MFA policy must fail closed when settings cannot be read");
}
if (!auditService.includes("safeMetadata") || !/token\|secret\|password\|cookie\|authorization\|key/i.test(auditService)) {
  failures.push("audit metadata must remove credential-like keys");
}
if (packageJson.scripts?.["admin:governance:check"] !== "node scripts/verify-admin-governance.mjs") {
  failures.push("admin:governance:check must be registered");
}
for (const command of ["verify", "verify:pr"]) {
  if (!packageJson.scripts?.[command]?.includes("pnpm admin:governance:check")) {
    failures.push(command + " must include pnpm admin:governance:check");
  }
}

if (failures.length) {
  console.error("ADMIN_GOVERNANCE_CHECK_FAILED");
  for (const failure of failures) console.error("❌ " + failure);
  process.exit(1);
}

console.log("✅ Admin governance passed: " + groups.length + " groups, " + items.length + " routes, page gates, permission map, mobile search, audit/MFA invariants, and documented route coverage.");
