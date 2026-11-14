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

// Every canonical admin page must be reachable from the role-filtered navigation.
// Redirect-only aliases and the deliberate security step-up sub-flow are excluded.
const redirectOnly = new Set();
for (const page of pages) {
  const source = readFileSync(page, "utf8");
  if (/\bredirect\(/.test(source)) redirectOnly.add("/" + page.replace(/^src\/app\//, "").replace(/\/page\.tsx$/, ""));
}
redirectOnly.add("/admin/security/step-up");
for (const page of pages) {
  const href = "/" + page.replace(/^src\/app\//, "").replace(/\/page\.tsx$/, "");
  if (!redirectOnly.has(href) && !hrefs.includes(href)) {
    failures.push(`${href}: canonical admin page is missing from ADMIN_NAVIGATION`);
  }
}


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
  'requireAdminPermission("site.metadata.manage")',
  'recordAdminAuditEventSafely({',
  'runPostCommitAudit(',
  'optionalHttpsUrl(',
  'key: section',
  'value: mergedSetting',
]) {
  if (!seoActions.includes(token)) failures.push(`SEO/Admin save action is missing safety/data wiring: ${token}`);
}

const kidsEntryPage = readFileSync("src/app/admin/kids/page.tsx", "utf8");
const kidsContentPage = readFileSync("src/app/admin/kids/content/page.tsx", "utf8");
const kidsContentManager = readFileSync("src/features/admin/components/kids-content-manager.tsx", "utf8");
for (const [label, source] of [["Kids dashboard", kidsEntryPage], ["Kids content route", kidsContentPage]]) {
  if (!source.includes("@/features/admin/components/kids-content-manager")) {
    failures.push(`${label} must render the shared full content manager, not a placeholder route.`);
  }
  if (!source.includes('requireAdminPermission("kids.manage")')) {
    failures.push(`${label} must enforce kids.manage before rendering the shared content manager.`);
  }
}
for (const token of [
  'import { saveKidsContentAction } from "@/app/admin/kids/actions"',
  "CloudinaryImageUploadField",
  'name="title_ar"',
  'name="content_ar"',
  'name="quiz_data"',
  "GAME_REGISTRY",
  'kids_content?select=',
]) {
  if (!kidsContentManager.includes(token)) failures.push(`Shared Kids content manager is missing required data/form wiring: ${token}`);
}
if (kidsContentManager.includes('from "./actions"')) {
  failures.push("Shared Kids content manager must not use the stale page-relative actions import.");
}

const rootLayout = readFileSync("src/app/layout.tsx", "utf8");
for (const token of ['getSiteSetting("seo")', 'getSiteSetting("social")', "openGraph:", "twitter:"]) {
  if (!rootLayout.includes(token)) failures.push(`Root SEO/social metadata contract missing: ${token}`);
}

const homepage = readFileSync("src/app/page.tsx", "utf8");
for (const token of [
  "showQuickStart", "showJourneys", "showGuidedPaths",
  "showEditorialLibrary", "showDailyTools", "showDailyVerse",
]) {
  if (!homepage.includes(token)) failures.push(`Homepage must honor editable section visibility: ${token}`);
}
for (const field of [
  "showQuickStart", "showJourneys", "showGuidedPaths",
  "showEditorialLibrary", "showDailyTools", "showDailyVerse",
]) {
  // The form renders checkboxes from a typed array, so the field name is the
  // array's first item rather than a literal name="..." JSX attribute.
  if (!seoPage.includes(`["${field}",`)) failures.push(`Homepage admin form is missing lower-section toggle: ${field}`);
  if (!seoActions.includes(`readBoolean(formData, "${field}")`)) failures.push(`Homepage admin save action does not persist lower-section toggle: ${field}`);
}

const audioLibrary = readFileSync("src/components/audio/audio-library.tsx", "utf8");
if (!audioLibrary.includes('preload="metadata"')) failures.push("audio library must load metadata so duration can be discovered");
if (!audioLibrary.includes("failedAssets[asset.id]")) failures.push("audio library must visibly report failed media sources");

const nextConfig = readFileSync("next.config.ts", "utf8");
if (!nextConfig.includes("media-src") || !nextConfig.includes("https://res.cloudinary.com")) {
  failures.push("Content Security Policy must allow the official Cloudinary host for curated audio/media");
}

const shell = readFileSync("src/components/layout/site-shell.tsx", "utf8");
if (!shell.includes("getSiteSetting('social')") || !shell.includes("<Footer socialLinks")) {
  failures.push("Site shell must pass saved social settings into the public footer");
}
const footer = readFileSync("src/components/layout/footer.tsx", "utf8");
for (const token of ["safeExternalUrl", "facebookUrl", "youtubeUrl", 'href="/quran"', 'href="/adhkar"']) {
  if (!footer.includes(token)) failures.push(`Footer is missing a real or validated navigation/social link: ${token}`);
}
if (footer.includes("cursor-pointer")) failures.push("Footer must not render decorative, non-functional icon controls");

const videoPage = readFileSync("src/app/videos/page.tsx", "utf8");
if (
  !videoPage.includes("video.thumbnailUrl ?") ||
  !videoPage.includes("text-4xl text-brand-gold/40")
) {
  failures.push("Internal Videos page must render branded fallback imagery when a generated video's thumbnail is unavailable");
}
if (videoPage.includes("ResilientProfileImage")) {
  failures.push("Internal Videos page must not depend on retired external channel avatars");
}

const runNowAction = readFileSync("src/app/admin/system-actions.ts", "utf8");
if (!runNowAction.includes("queuedForScheduledWorker")) failures.push("Run Now must save a truthful scheduled-worker fallback when GitHub dispatch is not configured");
if (!runNowAction.includes("أتمتة الفيديو متوقفة")) failures.push("Run Now must reject requests when video automation is disabled");

const battlesPage = readFileSync("src/app/admin/battles/page.tsx", "utf8");
const prophetsPage = readFileSync("src/app/admin/prophets/page.tsx", "utf8");
const battlesService = readFileSync("src/features/admin/services/battles.ts", "utf8");
const prophetsService = readFileSync("src/features/admin/services/prophets.ts", "utf8");
for (const [label, page, service] of [
  ["battles", battlesPage, battlesService],
  ["prophets", prophetsPage, prophetsService],
]) {
  if (!page.includes("const { rows:") || !page.includes("ok: loaded") || !page.includes("{!loaded &&")) {
    failures.push(`Admin ${label} page must distinguish failed reads from genuinely empty tables.`);
  }
  if (!service.includes("if (error)") || !service.includes("ok: false") || !service.includes("ok: true")) {
    failures.push(`Admin ${label} service must surface Supabase query errors as unavailable, not empty data.`);
  }
  if (!page.includes("rawUrl && !videoId") || !page.includes("recordAdminAuditEvent")) {
    failures.push(`Admin ${label} mutations must reject malformed YouTube URLs and record audit events.`);
  }
  if (!page.includes("requireAdminStepUp")) {
    failures.push(`Admin ${label} video and publication mutations must honor the configured MFA step-up policy.`);
  }
}
for (const [label, page] of [["battles", battlesPage], ["prophets", prophetsPage]]) {
  if (!page.includes(`"${label}.youtube_video.update"`) || !page.includes(`"${label}.publish"`) || !page.includes(`"${label}.unpublish"`)) {
    failures.push(`Admin ${label} video-link and publication mutations must be auditable separately.`);
  }
}

const knowledgePage = readFileSync("src/app/admin/knowledge/page.tsx", "utf8");
const knowledgeService = readFileSync("src/features/admin/services/knowledge.ts", "utf8");
for (const token of [
  "data.availability.companions",
  "data.availability.scholars",
  "data.availability.surahs",
  "data.availability.hadiths",
  "data.availability.books",
  "unavailableSources",
  "غير متاح — فشل تحميل البيانات",
]) {
  if (!knowledgePage.includes(token)) failures.push(`Knowledge dashboard must expose per-source read failures: ${token}`);
}
if (
  !knowledgeService.includes("availability:") ||
  !knowledgeService.includes("companions: !companions.error") ||
  !knowledgeService.includes("hadiths: !hadiths.error") ||
  !knowledgeService.includes("books: !books.error")
) {
  failures.push("Knowledge service must preserve Supabase query errors instead of silently converting them to empty arrays.");
}

const libraryPage = readFileSync("src/app/admin/library/page.tsx", "utf8");
for (const token of [
  "const itemsAvailable = !itemsResult.error",
  "const sourcesAvailable = !sourcesResult.error",
  "const mediaAvailable = !mediaResult.error",
  "const gamesAvailable = !gamesResult.error",
  "unavailableReads",
  "itemsAvailable ? rows.length : 'غير متاح'",
  "{itemsAvailable ? (",
  "disabled={!sourcesAvailable}",
]) {
  if (!libraryPage.includes(token)) failures.push(`Admin library must distinguish unavailable reads from true empty data: ${token}`);
}

const androidReleasePage = readFileSync("src/app/admin/android/page.tsx", "utf8");
const androidReleaseAction = readFileSync("src/app/admin/android/actions.ts", "utf8");
for (const token of [
  "readAdminRows",
  "const settingAvailable = settingResult.ok",
  "const releases = releasesResult.rows",
  "disabled={!settingAvailable}",
  "disabled={!settingAvailable || !releasesResult.ok || releases.length === 0}",
  "إصدار Android",
  "تعذر قراءة إعداد إصدار Android المحفوظ",
  "تعذر الاتصال بواجهة GitHub",
]) {
  if (!androidReleasePage.includes(token)) failures.push(`Android release page must distinguish saved-setting and GitHub read failures: ${token}`);
}
if (!androidReleaseAction.includes("releaseTag))") || !androidReleaseAction.includes("صيغة وسم إصدار Android غير صالحة")) {
  failures.push("Android release action must validate manually submitted release tags before saving.");
}

const contentPage = readFileSync("src/app/admin/content/page.tsx", "utf8");
const contentConsole = readFileSync("src/app/admin/content/content-console.tsx", "utf8");
for (const token of [
  "Promise.allSettled",
  "contentAvailable",
  "scheduledAvailable",
  "scheduledAvailable ? scheduled.length : \"غير متاح\"",
  "scheduledAvailable={scheduledAvailable}",
]) {
  if (!contentPage.includes(token)) failures.push(`Admin content page must isolate content and queue read failures: ${token}`);
}
for (const token of [
  "scheduledAvailable?: boolean",
  "طابور جدولة المحتوى غير متاح",
  "scheduledAvailable && !item.published",
  "scheduledAvailable && activeSchedule",
  "scheduledAvailable && selected",
]) {
  if (!contentConsole.includes(token)) failures.push(`Admin content console must disable schedule operations when the queue is unavailable: ${token}`);
}

const searchPage = readFileSync("src/app/admin/search/page.tsx", "utf8");
const platformService = readFileSync("src/features/admin/services/platform.ts", "utf8");
for (const token of [
  "unavailableSources",
  "نتائج جزئية",
  "بعض المصادر لم تنجح قراءتها",
]) {
  if (!searchPage.includes(token)) failures.push(`Admin central search must identify partial-source failures: ${token}`);
}
if (
  !platformService.includes("unavailableSources: string[]") ||
  !platformService.includes("results.filter((result) => !result.ok)") ||
  !platformService.includes("[admin/search] failed to search source") ||
  !platformService.includes("select=id,text_ar,grade_ar,published,updated_at")
) {
  failures.push("Admin search service must preserve failed source status and select the publication state for hadith matches.");
}

const pageCount = pages.length;
if (pageCount < hrefs.length) failures.push(`admin route inventory mismatch: ${pageCount} page files for ${hrefs.length} canonical navigation routes`);

if (failures.length) {
  console.error("ADMIN_PAGE_AUDIT_FAILED");
  for (const failure of failures) console.error(`❌ ${failure}`);
  process.exit(1);
}

console.log(`✅ Admin page audit passed: ${pageCount} page files, ${hrefs.length} canonical navigation routes.`);
