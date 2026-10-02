#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const failures = [];

function read(path) {
  const absolute = join(ROOT, path);
  if (!existsSync(absolute)) {
    failures.push("missing file: " + path);
    return "";
  }
  return readFileSync(absolute, "utf8");
}

const navigationPath = "src/features/admin/config/navigation.ts";
const navigation = read(navigationPath);

const CANONICAL_ARCHITECTURE = {
  Operations: [
    ["/admin", "Dashboard", "dashboard.view"],
    ["/admin/health", "Health", "system.manage"],
    ["/admin/alerts", "Alerts", "notifications.manage"],
    ["/admin/audit", "Audit", "audit.read"],
  ],
  Content: [
    ["/admin/library", "Library", "library.manage"],
    ["/admin/sources", "Sources", "sources.manage"],
    ["/admin/editorial", "Editorial", "knowledge.manage"],
    ["/admin/categories", "Categories", "content.manage"],
    ["/admin/search", "Search", "content.manage"],
  ],
  "Video Factory": [
    ["/admin/video-factory", "Dashboard", "video.manage"],
    ["/admin/video-factory/sources", "Sources", "video.manage"],
    ["/admin/video-factory/scripts", "Scripts", "video.manage"],
    ["/admin/video-factory/voices", "Voices", "video.manage"],
    ["/admin/video-factory/visuals", "Visuals", "video.manage"],
    ["/admin/video-factory/templates", "Templates", "video.manage"],
    ["/admin/video-factory/queue", "Queue", "video.manage"],
    ["/admin/video-factory/qa", "QA", "video.manage"],
    ["/admin/video-factory/scheduler", "Scheduler", "video.manage"],
    ["/admin/video-factory/publishing", "Publishing", "video.manage"],
  ],
  Social: [["/admin/social", "Social", "social.manage"]],
  Kids: [
    ["/admin/kids/games", "Games", "kids.manage"],
    ["/admin/kids/levels", "Levels", "kids.manage"],
    ["/admin/kids/content", "Content", "kids.manage"],
    ["/admin/kids/assets", "Assets", "kids.manage"],
    ["/admin/kids/analytics", "Analytics", "kids.manage"],
  ],
  Audio: [
    ["/admin/audio/quran", "Quran", "audio.manage"],
    ["/admin/audio/adhan", "Adhan", "audio.manage"],
    ["/admin/audio/tts", "TTS", "audio.manage"],
    ["/admin/audio/site-audio", "Site Audio", "audio.manage"],
  ],
  Users: [["/admin/users", "Users", "users.read"]],
  Security: [["/admin/security", "Security", "security.manage"]],
  SEO: [["/admin/seo", "SEO", "settings.manage"]],
  Android: [["/admin/android", "Android", "android.manage"]],
  Settings: [["/admin/settings", "Settings", "settings.manage"]],
};

const expectedGroups = Object.keys(CANONICAL_ARCHITECTURE);
const groupMatches = [...navigation.matchAll(/key:\s*"([^"]+)"\s*,\s*label:\s*"([^"]+)"/g)];
const groupLabels = groupMatches.map((match) => match[2]);

if (groupLabels.join("|") !== expectedGroups.join("|")) {
  failures.push(
    "Admin navigation groups do not match the canonical architecture: expected " +
      expectedGroups.join(" > "),
  );
}

function routeExists(href) {
  const page = href === "/admin"
    ? "src/app/admin/page.tsx"
    : join("src/app", href.slice(1), "page.tsx");
  return existsSync(join(ROOT, page));
}

for (const [groupLabel, items] of Object.entries(CANONICAL_ARCHITECTURE)) {
  for (const [href, label, permission] of items) {
    const expected = [
      `href: "${href}"`,
      `label: "${label}"`,
      `permission: "${permission}"`,
    ];
    const blockFound =
      navigation.includes(expected[0]) &&
      navigation.includes(expected[1]) &&
      navigation.includes(expected[2]);

    if (!blockFound) {
      failures.push(
        `missing canonical navigation item: ${groupLabel} > ${label} (${href})`,
      );
    }

    if (!routeExists(href)) {
      failures.push("canonical navigation target has no page: " + href);
    }
  }
}

const hrefs = [...navigation.matchAll(/href:\s*["']([^"']+)["']/g)].map((m) => m[1]);
const duplicateHrefs = hrefs.filter((href, index) => hrefs.indexOf(href) !== index);
for (const href of [...new Set(duplicateHrefs)]) {
  failures.push("duplicate admin navigation href: " + href);
}

const permissionRefs = [
  ...navigation.matchAll(/permission:\s*["']([^"']+)["']/g),
].map((m) => m[1]);
const permissions = read("src/features/admin/services/permissions.ts");
for (const permission of [...new Set(permissionRefs)]) {
  if (
    !permissions.includes("'" + permission + "'") &&
    !permissions.includes('"' + permission + '"')
  ) {
    failures.push(
      "navigation references undefined admin permission: " + permission,
    );
  }
}

const packageJson = JSON.parse(read("package.json"));
if (!packageJson.scripts?.["admin:architecture:check"]) {
  failures.push("admin:architecture:check is not registered");
}
if (!packageJson.scripts?.verify?.includes("pnpm admin:architecture:check")) {
  failures.push("verify must include pnpm admin:architecture:check");
}
if (!packageJson.scripts?.["verify:pr"]?.includes("pnpm admin:architecture:check")) {
  failures.push("verify:pr must include pnpm admin:architecture:check");
}

if (failures.length) {
  console.error("ADMIN_ARCHITECTURE_CHECK_FAILED");
  for (const failure of failures) console.error("❌ " + failure);
  process.exit(1);
}

const count = Object.values(CANONICAL_ARCHITECTURE).reduce(
  (sum, items) => sum + items.length,
  0,
);
console.log(
  `✅ Final Admin Architecture checks passed: ${expectedGroups.length} groups, ${count} canonical routes.`,
);
