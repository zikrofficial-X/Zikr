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
  "التشغيل والمراقبة": [
    ["/admin", "لوحة التحكم", "dashboard.view"],
    ["/admin/automation", "التشغيل الآلي", "system.manage"],
    ["/admin/health", "صحة النظام", "system.manage"],
    ["/admin/notifications", "التنبيهات", "notifications.manage"],
    ["/admin/audit", "سجل التدقيق", "audit.read"],
    ["/admin/release", "مركز الإصدار", "release.manage"],
  ],
  "المحتوى والمعرفة": [
    ["/admin/content", "إدارة المحتوى", "content.manage"],
    ["/admin/library", "مكتبة المحتوى", "library.manage"],
    ["/admin/sources", "مصادر المحتوى", "sources.manage"],
    ["/admin/editorial", "التحرير والنشر", "knowledge.manage"],
    ["/admin/knowledge", "المعرفة الإسلامية", "knowledge.manage"],
    ["/admin/prophets", "الأنبياء", "prophets.manage"],
    ["/admin/battles", "الغزوات", "battles.manage"],
    ["/admin/categories", "التصنيفات", "content.manage"],
    ["/admin/sections", "الأقسام وترتيبها", "sections.manage"],
    ["/admin/search", "البحث والفهرسة", "content.manage"],
  ],
  "الفيديو والوسائط": [
    ["/admin/video-factory", "مصنع الفيديو", "video.manage"],
    ["/admin/ai-video", "استوديو إنشاء الفيديو", "video.manage"],
    ["/admin/ai-video/curated", "المحتوى الموثق للفيديو", "video.manage"],
    ["/admin/videos", "طابور توليد الفيديو", "video.manage"],
    ["/admin/video-factory/sources", "مصادر الفيديو", "video.manage"],
    ["/admin/video-factory/scripts", "نصوص السرد", "video.manage"],
    ["/admin/video-factory/voices", "الأصوات", "video.manage"],
    ["/admin/video-factory/visuals", "العناصر المرئية", "video.manage"],
    ["/admin/video-factory/templates", "القوالب", "video.manage"],
    ["/admin/video-factory/qa", "ضبط الجودة", "video.manage"],
    ["/admin/media", "مكتبة الوسائط", "media.manage"],
  ],
  "الصوت": [
    ["/admin/audio", "مركز الصوت", "audio.manage"],
    ["/admin/audio/quran", "تلاوات القرآن", "audio.manage"],
    ["/admin/audio/adhan", "الأذان", "audio.manage"],
    ["/admin/audio/tts", "تحويل النص إلى صوت", "audio.manage"],
    ["/admin/site-audio", "صوت الموقع والتذكيرات", "audio.manage"],
  ],
  "النشر الاجتماعي": [
    ["/admin/social", "مركز النشر الاجتماعي", "social.manage"],
  ],
  "قسم الأطفال": [
    ["/admin/kids", "لوحة الأطفال", "kids.manage"],
    ["/admin/kids/content", "محتوى الأطفال", "kids.manage"],
    ["/admin/kids/games", "الألعاب", "kids.manage"],
    ["/admin/kids/levels", "المستويات", "kids.manage"],
    ["/admin/kids/assets", "الأصول", "kids.manage"],
    ["/admin/kids/analytics", "تحليلات الأطفال", "kids.manage"],
  ],
  "المستخدمون والتحليلات": [
    ["/admin/users", "المستخدمون والأدوار", "users.read"],
    ["/admin/analytics", "تحليلات المنصة", "analytics.read"],
  ],
  "الأمن والإعدادات": [
    ["/admin/security", "أمن لوحة الإدارة", "security.manage"],
    ["/admin/seo", "تحسين الظهور", "settings.manage"],
    ["/admin/android", "إصدار أندرويد", "android.manage"],
    ["/admin/settings", "إعدادات الإدارة", "settings.manage"],
  ],
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


const visibleLabels = [
  ...navigation.matchAll(/label:\s*["']([^"']+)["']/g),
].map((m) => m[1]);
for (const label of visibleLabels) {
  if (/[A-Za-z]{3,}/.test(label)) {
    failures.push("admin navigation label is not Arabic: " + label);
  }
}

const legacyRedirects = {
  "src/app/admin/alerts/page.tsx": "/admin/notifications",
  "src/app/admin/audio/site-audio/page.tsx": "/admin/site-audio",
  "src/app/admin/video-factory/queue/page.tsx": "/admin/videos",
  "src/app/admin/video-factory/publishing/page.tsx": "/admin/social",
  "src/app/admin/video-factory/scheduler/page.tsx": "/admin/automation",
};
for (const [path, target] of Object.entries(legacyRedirects)) {
  const page = read(path);
  if (!page.includes(`redirect("${target}")`)) {
    failures.push(`legacy admin route must redirect to canonical path: ${path} -> ${target}`);
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
  `✅ فحص بنية لوحة الإدارة نجح: ${expectedGroups.length} مجموعات، ${count} مسارًا أساسيًا.`,
);
