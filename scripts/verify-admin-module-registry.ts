import { existsSync, readFileSync } from "node:fs";
import { ADMIN_MODULES, ADMIN_ROUTE_ALIASES } from "../src/features/admin/config/modules";
import { ADMIN_NAVIGATION } from "../src/features/admin/config/navigation";
import { ADMIN_ROLE_PERMISSIONS } from "../src/features/admin/services/permissions";
import { join } from "node:path";

const failures: string[] = [];
if (ADMIN_MODULES.length !== ADMIN_NAVIGATION.length) {
  failures.push("Admin module catalog and canonical navigation must have the same number of groups.");
}
for (const group of ADMIN_NAVIGATION) {
  const adminModule = ADMIN_MODULES.find((item) => item.key === group.key);
  if (!adminModule) {
    failures.push(`Missing module owner record for navigation group: ${group.key}`);
    continue;
  }
  const routePaths = group.items.map((item) => item.href);
  if (adminModule.routes.join("|") !== routePaths.join("|")) {
    failures.push(`Module routes drifted from canonical navigation: ${group.key}`);
  }
  if (!adminModule.permissions.includes(adminModule.permission)) {
    failures.push(`Primary permission must be included in module permissions: ${group.key}`);
  }
  for (const item of group.items) {
    if (!adminModule.permissions.includes(item.permission)) {
      failures.push(`Module permission list does not cover ${item.href}: ${item.permission}`);
    }
  }
  const ownerPermissions = ADMIN_ROLE_PERMISSIONS[adminModule.ownerRole as keyof typeof ADMIN_ROLE_PERMISSIONS];
  if (!ownerPermissions) {
    failures.push(`Unknown owner role for module ${group.key}: ${adminModule.ownerRole}`);
  } else {
    for (const permission of adminModule.permissions) {
      if (!ownerPermissions.includes(permission)) {
        failures.push(`Owner role ${adminModule.ownerRole} cannot cover ${permission} in module ${group.key}`);
      }
    }
  }
}
const seoManagerPermissions = ADMIN_ROLE_PERMISSIONS.seo_manager;
if (seoManagerPermissions.includes("settings.manage")) {
  failures.push("seo_manager must not receive settings.manage; global admin settings include security controls.");
}
if (!seoManagerPermissions.includes("site.metadata.manage")) {
  failures.push("seo_manager must retain the dedicated public site metadata permission.");
}

const seen = new Set<string>();
for (const adminModule of ADMIN_MODULES) {
  if (seen.has(adminModule.key)) failures.push(`Duplicate admin module key: ${adminModule.key}`);
  seen.add(adminModule.key);
  if (!adminModule.basePath.startsWith("/admin")) failures.push(`Invalid module path: ${adminModule.basePath}`);
  if (!adminModule.sourceTables.length) failures.push(`Module has no declared source tables: ${adminModule.key}`);
}
for (const alias of ADMIN_ROUTE_ALIASES) {
  if (!alias.from.startsWith("/admin") || !alias.to.startsWith("/admin")) failures.push(`Invalid admin alias: ${alias.from}`);
  if (String(alias.from) === String(alias.to)) failures.push(`Self-referencing admin alias: ${alias.from}`);
  const fromPage = join("src/app", alias.from.slice(1), "page.tsx");
  const toPage = join("src/app", alias.to.slice(1), "page.tsx");
  if (!existsSync(fromPage)) failures.push(`Missing compatibility route page: ${alias.from}`);
  if (!existsSync(toPage)) failures.push(`Alias target is not a canonical page: ${alias.to}`);
  if (existsSync(fromPage) && !readFileSync(fromPage, "utf8").includes(`redirect("${alias.to}")`)) {
    failures.push(`Compatibility route does not redirect to its registered target: ${alias.from} -> ${alias.to}`);
  }
}
for (const required of [
  "src/app/admin/queues/page.tsx",
  "src/app/admin/video/page.tsx",
  "src/app/admin/video/requests/page.tsx",
  "src/app/admin/video/studio/page.tsx",
  "src/app/admin/video/sources/page.tsx",
  "src/app/admin/video/scripts/page.tsx",
  "src/app/admin/video/voices/page.tsx",
  "src/app/admin/video/visuals/page.tsx",
  "src/app/admin/video/templates/page.tsx",
  "src/app/admin/video/qa/page.tsx",
]) {
  if (!existsSync(required)) failures.push(`Missing canonical admin route: ${required}`);
}
for (const legacyPath of [
  "src/app/admin/video-factory/page.tsx",
  "src/app/admin/video-factory/sources/page.tsx",
  "src/app/admin/video-factory/scripts/page.tsx",
  "src/app/admin/video-factory/voices/page.tsx",
  "src/app/admin/video-factory/visuals/page.tsx",
  "src/app/admin/video-factory/templates/page.tsx",
  "src/app/admin/video-factory/qa/page.tsx",
]) {
  if (!existsSync(legacyPath)) failures.push(`Missing compatibility redirect: ${legacyPath}`);
}

if (failures.length) {
  failures.forEach((failure) => console.error(`❌ ${failure}`));
  process.exit(1);
}
console.log(`✅ Admin module registry passed: ${ADMIN_MODULES.length} modules, ${ADMIN_ROUTE_ALIASES.length} verified aliases, exact navigation ownership, and owner-role permission coverage.`);
