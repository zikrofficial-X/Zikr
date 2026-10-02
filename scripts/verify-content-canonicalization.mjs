#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const failures = [];
const read = (path) => {
  if (!existsSync(path)) {
    failures.push(`missing required content-canonicalization file: ${path}`);
    return "";
  }
  return readFileSync(path, "utf8");
};

const utility = read("src/lib/data/content-merge.ts");
if (!utility.includes("export function resolveCanonicalPublished")) {
  failures.push("content merge utility must expose the canonical published-source resolver");
}
if (!utility.includes("return primary.length > 0 ? primary : fallback;")) {
  failures.push("canonical published-source resolver must prefer populated primary content");
}

const canonicalServices = [
  ["src/features/articles/services/articles.ts", "resolveCanonicalPublished"],
  ["src/features/dua/services/dua.ts", "resolveCanonicalPublished"],
  ["src/features/companions/services/companions.ts", "resolveCanonicalPublished"],
  ["src/features/prophets/services/prophets.ts", "resolveCanonicalPublished"],
];

for (const [path, token] of canonicalServices) {
  const content = read(path);
  if (!content.includes(token)) {
    failures.push(`${path} must use the canonical published-source resolver`);
  }
  if (!content.includes("published=eq.true") && path.includes("/articles/")) {
    failures.push(`${path} must query only published canonical articles`);
  }
}

const dbFirstServices = [
  ["src/features/stories/services/stories.ts", "published=eq.true"],
  ["src/features/scholars/services/scholars.ts", "published=eq.true"],
  ["src/features/hadith/services/hadith.ts", "published=eq.true"],
];
for (const [path, token] of dbFirstServices) {
  if (!read(path).includes(token)) {
    failures.push(`${path} must keep published database filtering`);
  }
}

const alias = read("src/app/duas/page.tsx");
if (!alias.includes("permanentRedirect('/dua')") && !alias.includes('permanentRedirect("/dua")')) {
  failures.push("legacy /duas route must remain a redirect to canonical /dua");
}

const publicRoutes = [
  "src/app/articles/page.tsx",
  "src/app/stories/page.tsx",
  "src/app/prophets/page.tsx",
  "src/app/companions/page.tsx",
  "src/app/scholars/page.tsx",
  "src/app/dua/page.tsx",
];
for (const path of publicRoutes) {
  const content = read(path);
  if (!content.includes("features/")) {
    failures.push(`${path} must delegate data access to a feature service`);
  }
  if (content.includes("SUPABASE_SERVICE_ROLE_KEY") || content.includes("createAdminClient(")) {
    failures.push(`${path} must never use service-role database access`);
  }
}

if (failures.length) {
  console.error("CONTENT_CANONICALIZATION_CHECK_FAILED");
  for (const failure of failures) console.error(`❌ ${failure}`);
  process.exit(1);
}

console.log("✅ Phase 7 content-canonicalization checks passed");
