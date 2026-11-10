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

const groups = [...navigation.matchAll(/key:\s*"([^"]+)",\s*label:\s*"([^"]+)"[\s\S]*?items:\s*\[([\s\S]*?)\]\s*,?/g)]
  .map((group) => ({
    key: group[1],
    label: group[2],
    items: [...group[3].matchAll(/href:\s*"([^"]+)",\s*label:\s*"([^"]+)",\s*permission:\s*"([^"]+)"/g)]
      .map((item) => ({ href: item[1], label: item[2], permission: item[3] })),
  }));
const socialManagerRole = permissions.match(/social_manager:\s*\[([\s\S]*?)\],/);
const videoManagerRole = permissions.match(/video_manager:\s*\[([\s\S]*?)\],/);
if (!socialManagerRole || !socialManagerRole[1].includes("'social.manage'") || !socialManagerRole[1].includes("'social.publish'")) {
  failures.push("social_manager must retain social management and publishing permissions");
}
if (socialManagerRole?.[1].includes("'video.manage'") || socialManagerRole?.[1].includes("'video.delete'")) {
  failures.push("social_manager must not manage or delete video-generation resources");
}
if (!videoManagerRole || !videoManagerRole[1].includes("'video.manage'") || videoManagerRole[1].includes("'social.publish'") || videoManagerRole[1].includes("'social.manage'")) {
  failures.push("video_manager must manage production without social publishing permissions");
}
const moduleCatalog = read("src/features/admin/config/modules.ts");
const moduleKeys = [...moduleCatalog.matchAll(/\{\s*key:\s*"([^"]+)"/g)].map((match) => match[1]);
const catalog = moduleKeys.map((key) => ({ key }));
if (catalog.map((module) => module.key).join("|") !== groups.map((group) => group.key).join("|")) {
  failures.push("ADMIN_MODULES must mirror the ten canonical navigation keys and order");
}
for (const group of groups) {
  const catalogEntry = catalog.find((entry) => entry.key === group.key);
  if (!catalogEntry) {
    failures.push("module catalog is missing navigation group: " + group.key);
    continue;
  }
  if (!moduleCatalog.includes(`routes: routesFor("${group.key}")`)) {
    failures.push("module catalog must derive routes from ADMIN_NAVIGATION for " + group.key);
  }
}
const items = groups.flatMap((group) => group.items);
if (groups.length !== 10) failures.push("expected exactly ten canonical admin navigation zones");
for (const label of ["التشغيل والمراقبة", "إدارة المحتوى", "المصادر والمعرفة", "مصنع الفيديوهات", "الذاكرة والمكتبة", "الوسائط والصوت", "عالم الأطفال", "النمو والتحليلات", "النظام والأمان", "النشر والتواصل الاجتماعي"]) {
  if (!groups.some((group) => group.label === label)) failures.push("missing canonical admin navigation zone: " + label);
}
const routeInventorySection = docs.split("## 1. جرد المسارات والصلاحيات")[1]?.split("## 2. نطاق الأدوار")[0] ?? "";
const documentedGroups = [...routeInventorySection.matchAll(/^### (.+)$/gm)].map((match) => match[1].trim());
const canonicalGroupLabels = ["التشغيل والمراقبة", "إدارة المحتوى", "المصادر والمعرفة", "مصنع الفيديوهات", "الذاكرة والمكتبة", "الوسائط والصوت", "النشر والتواصل الاجتماعي", "عالم الأطفال", "النمو والتحليلات", "النظام والأمان"];
if (documentedGroups.join("|") !== canonicalGroupLabels.join("|")) {
  failures.push("admin governance headings must match the ten canonical navigation zones in the same order");
}
if (!items.length) failures.push("no canonical navigation items were parsed");
if (items.some((item) => !item.label.trim() || !item.permission.trim())) failures.push("navigation item has an empty label or permission");

const hrefs = items.map((item) => item.href);
for (const href of hrefs) {
  if (hrefs.filter((candidate) => candidate === href).length > 1) {
    failures.push("duplicate admin navigation route: " + href);
  }
}
const socialGroup = groups.find((group) => group.key === "social-publishing");
const mediaAudioGroup = groups.find((group) => group.key === "media-audio");
if (!socialGroup || !socialGroup.items.some((item) => item.href === "/admin/social")) {
  failures.push("social publishing must have a dedicated navigation group");
}
if (mediaAudioGroup?.items.some((item) => item.href === "/admin/social")) {
  failures.push("social publishing must not be nested under media/audio navigation");
}
if (!mediaAudioGroup?.items.some((item) => item.href === "/admin/media")) {
  failures.push("media library must be reachable from media/audio navigation");
}
for (const group of groups) {
  const seen = new Set();
  for (const item of group.items) {
    if (seen.has(item.href)) failures.push("duplicate route within navigation group " + group.key + ": " + item.href);
    seen.add(item.href);
  }
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
if (
  !dashboard.includes('hasAdminPermission(role, "audit.read")') ||
  !dashboard.includes('hasAdminPermission(role, "video.manage")') ||
  !dashboard.includes('if (metric.key === "social") return false;')
) {
  failures.push("audit and internal video queue details must respect admin role permissions; retired social metrics must remain hidden");
}
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


const pinnedSiteContent = read("src/features/site-content/services/site-content.ts");
const managedContentService = read("src/features/admin/services/content.ts");
const contentPublisher = read("scripts/jobs/content-publishing.ts");
const supabaseTypes = read("src/lib/types/supabase.ts");
const pinnedTypeStart = supabaseTypes.indexOf("pinned_messages: {");
const pinnedTypeEnd = supabaseTypes.indexOf("prayer_locations: {", pinnedTypeStart);
const pinnedType = pinnedTypeStart >= 0 && pinnedTypeEnd > pinnedTypeStart
  ? supabaseTypes.slice(pinnedTypeStart, pinnedTypeEnd)
  : "";
if (!pinnedType.includes("published: boolean") || pinnedType.includes("is_active") || pinnedType.includes("priority") || pinnedType.includes("type: string")) {
  failures.push("pinned_messages generated type must match the live published/CTA schema");
}
if (!pinnedSiteContent.includes(".select('id, title, body, cta_label, cta_href, published, created_at, updated_at')") ||
    !pinnedSiteContent.includes(".eq('published', true)") ||
    pinnedSiteContent.includes("is_active") ||
    pinnedSiteContent.includes("priority")) {
  failures.push("public pinned-message reader must use the canonical published schema");
}
if (!managedContentService.includes('.select("id, title, published, created_at, updated_at")') ||
    !managedContentService.includes("published: item.published ?? false") ||
    managedContentService.includes('table === "pinned_messages" ? "is_active"')) {
  failures.push("admin content manager must read and mutate pinned_messages through published");
}
if (!contentPublisher.includes("body: JSON.stringify({ published: true, updated_at: now })") ||
    contentPublisher.includes('item.content_table === "pinned_messages" ? "is_active"')) {
  failures.push("scheduled content publisher must publish pinned_messages through published");
}

if (failures.length) {
  console.error("ADMIN_GOVERNANCE_CHECK_FAILED");
  for (const failure of failures) console.error("❌ " + failure);
  process.exit(1);
}

console.log("✅ Admin governance passed: " + groups.length + " groups, " + items.length + " routes, page gates, permission map, mobile search, audit/MFA invariants, and documented route coverage.");
