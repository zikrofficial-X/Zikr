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

// Guard the high-impact controls shown in the production Admin screenshots so
// a visually rendered form cannot silently ship without its server action/data wiring.
const seoPage = readFileSync("src/app/admin/seo/page.tsx", "utf8");
const seoActions = readFileSync("src/app/admin/seo/actions.ts", "utf8");
for (const token of [
  "savePublicSiteSettingAction",
  'name="section" value="homepage"',
  'name="section" value="seo"',
  'name="section" value="social"',
]) {
  if (!seoPage.includes(token)) failures.push(`SEO/Admin editor is missing wired control: ${token}`);
}
for (const token of [
  'requireAdminPermission("settings.manage")',
  'recordAdminAuditEvent({',
  'optionalHttpsUrl(',
  'key: section',
  'value: mergedSetting',
]) {
  if (!seoActions.includes(token)) failures.push(`SEO/Admin save action is missing safety/data wiring: ${token}`);
}

const rootLayout = readFileSync("src/app/layout.tsx", "utf8");
for (const token of ['getSiteSetting("seo")', 'getSiteSetting("social")', "openGraph:", "twitter:"]) {
  if (!rootLayout.includes(token)) failures.push(`Root SEO/social metadata contract missing: ${token}`);
}

const audioLibrary = readFileSync("src/components/audio/audio-library.tsx", "utf8");
if (!audioLibrary.includes('preload="metadata"')) failures.push("audio library must load metadata so duration can be discovered");
if (!audioLibrary.includes("failedAssets[asset.id]")) failures.push("audio library must visibly report failed media sources");

const nextConfig = readFileSync("next.config.ts", "utf8");
if (!nextConfig.includes("media-src") || !nextConfig.includes("https://res.cloudinary.com")) {
  failures.push("Content Security Policy must allow the official Cloudinary host for curated audio/media");
}

const videoPage = readFileSync("src/app/videos/page.tsx", "utf8");
if (!videoPage.includes("ResilientProfileImage")) failures.push("Videos page must provide fallback imagery for remote channel avatars");

const runNowAction = readFileSync("src/app/admin/system-actions.ts", "utf8");
if (!runNowAction.includes("queuedForScheduledWorker")) failures.push("Run Now must save a truthful scheduled-worker fallback when GitHub dispatch is not configured");
if (!runNowAction.includes("أتمتة الفيديو متوقفة")) failures.push("Run Now must reject requests when video automation is disabled");

const pageCount = pages.length;
if (pageCount < hrefs.length) failures.push(`admin route inventory mismatch: ${pageCount} page files for ${hrefs.length} canonical navigation routes`);

if (failures.length) {
  console.error("ADMIN_PAGE_AUDIT_FAILED");
  for (const failure of failures) console.error(`❌ ${failure}`);
  process.exit(1);
}

console.log(`✅ Admin page audit passed: ${pageCount} page files, ${hrefs.length} canonical navigation routes.`);
