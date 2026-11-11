import assert from "node:assert/strict";
import { getKidsQuizQuestions, isKidsContentType, KIDS_CONTENT_TYPES, normalizeKidsVideoEmbedUrl, parseKidsQuizData } from "../../src/features/kids/services/kids-content-validation";
import { readFileSync } from "node:fs";
import {
  getFallbackKidsContentBySlug,
  isKidsContentPubliclyVisible,
  mergeKidsContentWithFallback,
} from "../../src/features/kids/services/kids-content-visibility";

const typesMigration = readFileSync(
  "supabase/migrations/20261111003000_expand_kids_content_supported_types.sql",
  "utf8",
);
const typeConstraintStart = typesMigration.toLowerCase().indexOf(
  "add constraint kids_content_type_check",
);
assert.ok(typeConstraintStart >= 0, "the Kids type migration must replace the canonical database check constraint");
const typeConstraintEnd = typesMigration.indexOf(";", typeConstraintStart);
const typeConstraintSql = typesMigration.slice(typeConstraintStart, typeConstraintEnd);
assert.deepEqual(
  [...typeConstraintSql.matchAll(/'([^']+)'/g)].map((match) => match[1]),
  [...KIDS_CONTENT_TYPES],
  "the admin-supported Kids types and the database constraint must remain identical",
);
for (const type of KIDS_CONTENT_TYPES) {
  assert.equal(isKidsContentType(type), true, `supported Kids type ${type} must pass validation`);
}
assert.equal(isKidsContentType("unsupported"), false, "unknown Kids content types must fail validation");
assert.equal(isKidsContentPubliclyVisible({ type: "story", metadata: { age_appropriate: true } }), true, "age-approved Kids stories remain publicly visible");
assert.equal(isKidsContentPubliclyVisible({ type: "story", metadata: { age_appropriate: false } }), false, "unapproved Kids stories must be hidden from public content");
assert.equal(isKidsContentPubliclyVisible({ type: "story", metadata: {} }), false, "missing age approval must fail closed for Kids stories");
assert.equal(isKidsContentPubliclyVisible({ type: "game", metadata: {} }), true, "non-story Kids content keeps its existing publication contract");
assert.equal(normalizeKidsVideoEmbedUrl("https://www.youtube.com/embed/dQw4w9WgXcQ"), "https://www.youtube.com/embed/dQw4w9WgXcQ", "standard HTTPS YouTube embed URLs must remain supported");
assert.equal(normalizeKidsVideoEmbedUrl("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"), "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ", "privacy-enhanced YouTube embeds must remain supported");
for (const unsafeUrl of [
  "javascript:alert(1)",
  "http://www.youtube.com/embed/dQw4w9WgXcQ",
  "https://www.youtube.com/shorts/dQw4w9WgXcQ",
  "https://www.youtube.com.evil.test/embed/dQw4w9WgXcQ",
  "https://evil.test/embed/dQw4w9WgXcQ",
  "https://user@www.youtube.com/embed/dQw4w9WgXcQ",
  "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1",
]) {
  assert.equal(normalizeKidsVideoEmbedUrl(unsafeUrl), null, `unsafe Kids video URL must be rejected: ${unsafeUrl}`);
}

const databaseItems = [
  { slug: "story-live", source: "database" },
];
const fallbackItems = [
  { slug: "story-live", source: "fallback" },
  { slug: "story-unpublished", source: "fallback" },
  { slug: "story-inactive", source: "fallback" },
  { slug: "story-static-only", source: "fallback" },
];
const knownDatabaseSlugs = new Set(["story-live", "story-unpublished", "story-inactive"]);

assert.deepEqual(
  mergeKidsContentWithFallback(databaseItems, fallbackItems, knownDatabaseSlugs),
  [
    { slug: "story-live", source: "database" },
    { slug: "story-static-only", source: "fallback" },
  ],
  "database-backed unpublished or inactive slugs must not be resurrected by static fallback",
);
assert.equal(
  getFallbackKidsContentBySlug("story-unpublished", fallbackItems, knownDatabaseSlugs),
  null,
  "an unpublished database slug must return no static fallback",
);
assert.equal(
  getFallbackKidsContentBySlug("story-inactive", fallbackItems, knownDatabaseSlugs),
  null,
  "an inactive database slug must return no static fallback",
);
assert.equal(
  getFallbackKidsContentBySlug("story-static-only", fallbackItems, knownDatabaseSlugs)?.slug,
  "story-static-only",
  "curated static-only content remains available when no database row owns the slug",
);

assert.deepEqual(
  parseKidsQuizData("{\"questions\":[{\"text\":\"من ربك؟\",\"options\":[\"الله\",\"غير ذلك\"],\"correctAnswer\":0}]}"),
  { questions: [{ text: "من ربك؟", options: ["الله", "غير ذلك"], correctAnswer: 0 }] },
  "valid Kids quiz JSON must normalize into the shape consumed by the detail page",
);
assert.throws(
  () => parseKidsQuizData("{\"questions\":[{\"q\":\"من ربك؟\",\"answers\":[\"الله\"],\"reward\":\"نجمة\"}]}"),
  /بيانات اللعبة/,
  "the former placeholder shape must be rejected instead of saving a quiz that renders empty",
);
assert.throws(
  () => parseKidsQuizData("{\"questions\":[{\"text\":\"من ربك؟\",\"options\":[\"الله\",\"غير ذلك\"],\"correctAnswer\":2}]}"),
  /بيانات اللعبة/,
  "quiz answers must point to an existing option",
);

const localizedQuiz = {
  questions: [{
    text: "من ربك؟",
    options: ["الله", "غير ذلك"],
    correctAnswer: 0,
    textEn: "Who is your Lord?",
    optionsEn: ["Allah", "Something else"],
  }],
};
assert.deepEqual(
  getKidsQuizQuestions(localizedQuiz, true),
  [{ text: "Who is your Lord?", options: ["Allah", "Something else"], correctAnswer: 0 }],
  "the English player must receive a complete translation with the same option indexes as the Arabic question",
);
assert.deepEqual(getKidsQuizQuestions({ questions: [{ ...localizedQuiz.questions[0], textEn: "   " }] }, true), [], "blank English question text must not render as an empty prompt");
assert.deepEqual(getKidsQuizQuestions({ questions: [{ ...localizedQuiz.questions[0], optionsEn: [] }] }, true), [], "an empty English option list must not pass Array.every vacuously");
assert.deepEqual(getKidsQuizQuestions({ questions: [{ ...localizedQuiz.questions[0], optionsEn: ["Allah"] }] }, true), [], "English options must preserve the Arabic option count and answer index");
assert.deepEqual(getKidsQuizQuestions({ questions: [{ ...localizedQuiz.questions[0], optionsEn: ["Allah", "   "] }] }, true), [], "blank translated answer choices must be rejected");
assert.deepEqual(getKidsQuizQuestions({ questions: [{ text: "  ", options: ["A", "B"], correctAnswer: 0 }] }, false), [], "blank legacy Arabic questions must not render");

const adminAction = readFileSync("src/app/admin/kids/actions.ts", "utf8");
const adminManager = readFileSync("src/features/admin/components/kids-content-manager.tsx", "utf8");
const imageField = readFileSync("src/features/admin/components/cloudinary-image-upload-field.tsx", "utf8");
const cloudinaryUploadRoute = readFileSync("src/app/api/admin/cloudinary/image/route.ts", "utf8");

assert.ok(adminAction.includes("isKidsContentType(type)"), "the Kids admin action must use the shared supported-type contract");
const typeLabelsStart = adminManager.indexOf("const typeLabels: Record<KidsContentType, string> = {");
const typeLabelsEnd = adminManager.indexOf("\n};", typeLabelsStart);
const typeLabelsSource = adminManager.slice(typeLabelsStart, typeLabelsEnd);
const managerTypes = typeLabelsSource.split("\n").map((line) => line.trim().match(/^([a-z_]+):/)?.[1]).filter(Boolean);
assert.deepEqual(managerTypes, [...KIDS_CONTENT_TYPES], "the Kids admin selector must expose exactly the shared supported content types");
assert.ok(adminManager.includes("isKidsContentType(type) ? typeLabels[type] : type"), "type-count labels must narrow database strings before indexing the shared type map");
assert.ok(adminManager.includes("isKidsContentType(item.type) ? typeLabels[item.type] : item.type"), "record labels must narrow database strings before indexing the shared type map");

assert.ok(adminManager.includes('fileName="featured_image_file"'), "the Kids form must submit the selected file to its validated server action");
assert.ok(imageField.includes("name={fileName}"), "the image field must include the server-action file input name");
assert.equal(imageField.includes("fetch("), false, "Kids media must not upload before the server validates the slug");

const kidsDetailPage = readFileSync("src/app/kids/[slug]/page.tsx", "utf8");
const kidsQuizValidation = readFileSync("src/features/kids/services/kids-content-validation.ts", "utf8");
const kidsDetailLayout = readFileSync("src/app/kids/[slug]/layout.tsx", "utf8");
const kidsSitemap = readFileSync("src/app/sitemap.ts", "utf8");
const kidsDetailApi = readFileSync("src/app/api/kids/content/[slug]/route.ts", "utf8");
const kidsContentApi = readFileSync("src/app/api/kids/content/route.ts", "utf8");
const kidsVideosApi = readFileSync("src/app/api/kids/videos/route.ts", "utf8");
assert.match(kidsVideosApi, /metadata->>audience=eq\\.kids/, "the Kids video feed must never attach a general-audience social queue caption");
assert.match(kidsVideosApi, /row\.content_type\.endsWith\("_video"\)/, "the Kids video feed must ignore non-video queue rows even when they share a source ID");

const kidsSocialPostsApi = readFileSync("src/app/api/kids/social-posts/route.ts", "utf8");
const kidsHomePage = readFileSync("src/app/kids/page.tsx", "utf8");
const kidsGamesAdminPage = readFileSync("src/app/admin/kids/games/page.tsx", "utf8");
const kidsLevelsAdminPage = readFileSync("src/app/admin/kids/levels/page.tsx", "utf8");
const kidsContentData = readFileSync("src/features/kids/data/content.ts", "utf8");

assert.match(adminAction, /age_appropriate: ageAppropriate/);
const imageUploadPosition = adminAction.indexOf("await uploadCloudinaryImage");
assert.ok(imageUploadPosition > 0, "Kids image upload path must remain present");
const storyApprovalPosition = adminAction.indexOf('if (type === "story" && published && !ageAppropriate)');
assert.ok(storyApprovalPosition > 0 && storyApprovalPosition < imageUploadPosition, "unapproved Kids stories must be rejected before publication or media upload");
const videoRequiredPosition = adminAction.indexOf('if (type === "video" && !videoUrl)');
assert.ok(videoRequiredPosition > 0 && videoRequiredPosition < imageUploadPosition, "video content must require a validated YouTube embed before media upload");
const duplicateSlugCheckPosition = adminAction.indexOf("/rest/v1/kids_content?select=id&slug=eq.");
assert.ok(
  duplicateSlugCheckPosition > 0 && duplicateSlugCheckPosition < imageUploadPosition,
  "duplicate Kids slugs must be rejected before uploading media",
);
assert.doesNotMatch(adminAction, /on_conflict=slug|resolution=merge-duplicates/, "the add-only Kids form must never silently overwrite an existing published slug");
assert.ok(adminAction.includes("publicId: `${slug}-${randomUUID()}`"), "each Kids upload must use a unique Cloudinary asset id");
const mediaPermissionPosition = adminAction.indexOf('requireAdminPermission("media.manage")');
assert.ok(mediaPermissionPosition > 0 && mediaPermissionPosition < imageUploadPosition, "image upload must retain the media.manage permission gate");
assert.ok(adminAction.includes("audit event unavailable after content save"), "audit failure must not report a committed Kids insert as failed or skip cache revalidation");
assert.ok(cloudinaryUploadRoute.includes("randomUUID()"), "generic Cloudinary uploads must use collision-resistant default public ids");
assert.ok(cloudinaryUploadRoute.includes("audit event unavailable after upload"), "audit failure must not report a completed media upload as failed");
assert.ok(cloudinaryUploadRoute.includes("4 * 1024 * 1024"), "the generic upload route must stay within the Vercel request-body ceiling");
assert.ok(cloudinaryUploadRoute.includes("حجم الصورة يجب ألا يتجاوز 4 ميجابايت."), "the generic upload validation message must match its enforced 4 MB limit");
assert.equal(cloudinaryUploadRoute.includes("8 ميجابايت"), false, "the upload route must not advertise a size that the server rejects");
assert.ok(adminManager.includes('supabaseServerAdminCount("kids_content")'), "the Kids admin total must come from an exact database count rather than the 300-row sample");
assert.ok(adminManager.includes("totalCount !== null ? totalCount"), "the Kids admin total must distinguish an unavailable count from zero");
assert.ok(adminManager.includes("آخر 300 سجل"), "the Kids admin list must disclose its bounded sample size");
assert.ok(adminManager.includes('{ok ? totalCount === null ? `عرض ${rows.length} سجل؛ الإجمالي غير متاح` : `عرض ${rows.length} من ${totalCount} سجل` : "غير متاح"}'), "the Kids list must distinguish displayed sample size from total rows");
assert.ok(adminManager.includes("{ok && rows.length === 0 && <p"), "the empty state must appear only after a successful empty database read");
assert.ok(adminManager.includes('label="بيانات الاختبار (مطلوبة عند اختيار نوع اختبار)"'), "the quiz field must explain that quiz records require structured questions");
assert.ok(imageField.includes("3 * 1024 * 1024"), "the Kids server-action upload must stay below the 4 MB action body limit");

assert.ok(
  adminAction.indexOf("const quizData = type === \"quiz\" ? parseKidsQuizData(value(formData, \"quiz_data\")) : null;") < imageUploadPosition,
  "invalid quiz JSON must be rejected before uploading an image",
);
const quizRequiredPosition = adminAction.indexOf("if (type === \"quiz\" && !quizData)");
assert.ok(quizRequiredPosition > 0 && quizRequiredPosition < imageUploadPosition, "a quiz record must require a valid non-empty question set before media upload");
assert.match(adminAction, /formData\.get\("age_appropriate"\) === "on"/, "age approval must be true only for a checked checkbox");
assert.match(adminAction, /formData\.get\("published"\) === "on"/, "publication must be true only for a checked checkbox");
assert.match(adminAction, /if \(published\) await requireAdminPermission\("content\.publish"\)/, "creating a published Kids item must require the dedicated content.publish permission");
assert.doesNotMatch(adminAction, /formData\.has\("(?:age_appropriate|published)"\)/, "false checkbox values must never be interpreted as approval or publication");
assert.match(adminAction, /const quizData = type === "quiz" \? parseKidsQuizData[\s\S]*?: null;/, "non-quiz Kids records must not persist quiz metadata");
assert.ok(
  adminAction.indexOf("if (type === \"game\" && !isRegisteredGameId(gameId))") < imageUploadPosition,
  "an invalid game registry ID must be rejected before uploading an image",
);
assert.match(adminManager, /name="age_appropriate"/);
assert.match(adminManager, /automationApprovalRequiredCount/);
assert.match(adminManager, /اعتماد ملاءمة القصة للعمر قبل النشر/);
assert.ok(adminManager.includes('label="رابط فيديو تعليمي (مطلوب عند اختيار نوع فيديو)"'), "the admin UI must identify the required video URL for video content");
assert.match(adminManager, /"text":"من ربك؟","options":\["الله","غير ذلك"\],"correctAnswer":0/, "the admin quiz example must match the Kids detail player contract");
assert.doesNotMatch(adminManager, /"q":|"answers":/, "the admin quiz example must not use unsupported question keys");
assert.doesNotMatch(kidsDetailPage, /getKidsItemBySlug/, "the client must not resurrect a static fallback after the visibility-aware API returns 404");
assert.match(kidsDetailPage, /getKidsQuizQuestions/, "the detail page must use the tested localized quiz validator");
assert.match(kidsDetailPage, /setContent\(null\)/, "a hidden or unavailable database slug must remain unavailable in the detail page");
assert.match(kidsQuizValidation, /Number\.isInteger\(correctAnswer\)[\s\S]*?correctAnswer >= options\.length/, "the shared Kids quiz validator must reject out-of-range answers");
assert.match(kidsDetailPage, /getKidsQuizQuestions/, "the detail page must use the tested localized quiz validator");
assert.match(kidsDetailLayout, /getKidsContentBySlug\(slug, "ar"\)/, "SEO metadata must use the same visibility-aware resolver");
assert.match(kidsDetailLayout, /title:\s*item\.title_ar\s*\|\|\s*item\.title_en/, "Kids SEO metadata must use the localized KidsItem title fields");
assert.doesNotMatch(kidsDetailLayout, /item\.title(?!_)/, "Kids SEO metadata must not reference a non-existent generic title field");
assert.ok(kidsDetailLayout.includes("robots: { index: false, follow: false }"), "hidden or unavailable Kids slugs must not be indexed as generic 200 pages");
assert.ok(kidsDetailLayout.includes("if (!item) notFound()"), "hidden or unavailable Kids slugs must resolve as 404s before rendering the client page");
assert.ok(kidsSitemap.includes('getKidsContent("ar")'), "the sitemap must source Kids URLs through the visibility-aware resolver with a stable canonical locale");
assert.equal(kidsSitemap.includes("getKidsContent()"), false, "the sitemap must not vary its Kids URL inventory by the requesting visitor locale");
assert.ok(kidsSitemap.includes("`/kids/${item.slug}`"), "active published Kids content must have discoverable sitemap entries");
assert.match(kidsContentData, /content_ar:\s*row\.content_ar\s*\?\?\s*row\.summary_ar/, "Kids metadata must map the live summary_ar field into the shared content model");
assert.doesNotMatch(kidsDetailLayout, /supabaseServerAnonRequest/, "SEO metadata must not bypass database visibility checks");
assert.match(kidsDetailApi, /private, no-store/, "Kids detail responses must not serve stale content after deactivation or age-review changes");
for (const [name, route] of [["Kids list", kidsContentApi], ["Kids videos", kidsVideosApi], ["Kids social posts", kidsSocialPostsApi]]) {
  assert.ok(route.includes("private, no-store"), `${name} responses must not keep deactivated or age-rejected content in a shared CDN cache`);
  assert.equal(route.includes("stale-while-revalidate"), false, `${name} responses must not serve stale visibility decisions`);
}
assert.ok(kidsHomePage.includes("useState<KidsItem[]>([])"), "the public Kids home page must not render static fallback records before database visibility is checked");
assert.equal(kidsHomePage.includes("useState(kidsContent)"), false, "static fallback data must come through the visibility-aware server resolver");
assert.ok(kidsHomePage.includes('setContentStatus("error")'), "the Kids home page must fail closed when its visibility-aware list request fails");
assert.ok(kidsHomePage.includes("contentStatus === \"ready\" && featuredContent.length > 0"), "the Kids home page must wait for the verified list before rendering content cards");
const homeTypeLabelsStart = kidsHomePage.indexOf("const contentTypeLabels = {");
const homeTypeLabelsEnd = kidsHomePage.indexOf("} as const;", homeTypeLabelsStart);
const homeTypeLabelsSource = kidsHomePage.slice(homeTypeLabelsStart, homeTypeLabelsEnd);
const homeIconStart = kidsHomePage.indexOf("const contentTypeIcons:");
const homeIconEnd = kidsHomePage.indexOf("\n};", homeIconStart);
const homeIconSource = kidsHomePage.slice(homeIconStart, homeIconEnd);
for (const type of KIDS_CONTENT_TYPES) {
  assert.ok(homeTypeLabelsSource.includes(type + ":"), "the Kids home page must label every supported content type");
  assert.ok(homeIconSource.includes(type + ":"), "the Kids home page must provide an icon for every supported content type");
}
assert.match(kidsHomePage, /contentItems\.filter\(\(item\) => isKidsContentType\(item\.type\)\)/, "the Kids home page must include every supported published content type");
assert.match(kidsHomePage, /const visibleContent = featuredContent\.slice\(0, visibleContentCount\)/, "the Kids home page must page through the full published content list");
assert.match(kidsHomePage, /visibleContent\.map\(/, "the Kids home page must render the currently visible database-backed content");
assert.match(kidsHomePage, /visibleContent\.length < featuredContent\.length/, "the Kids home page must expose a continuation while content remains");
assert.match(kidsHomePage, /setVisibleContentCount\(\(count\) => Math\.min\(count \+ 12, featuredContent\.length\)\)/, "the Kids home page must reveal the next bounded content batch");
assert.doesNotMatch(kidsHomePage, /featuredContent\.map\(/, "the Kids home page must not bypass its bounded visible-content slice");
assert.doesNotMatch(kidsHomePage, /\.slice\(0,\s*6\)/, "the Kids home page must not silently hide all but six database records");
assert.ok(kidsGamesAdminPage.includes('supabaseServerAdminCount("kids_games")'), "the Kids games total must use an exact count rather than the 100-row sample");
assert.ok(kidsGamesAdminPage.includes("ضمن آخر 100"), "published/featured game counts must disclose their sample scope");
assert.ok(kidsGamesAdminPage.includes("آخر 100 سجل"), "the game comparison table must disclose its bounded sample size");
assert.ok(kidsGamesAdminPage.includes('gamesResult.status === "fulfilled" && missingRuntime.length > 0'), "runtime mismatch warnings must not be inferred from a failed games query");
assert.ok(kidsGamesAdminPage.includes('gamesResult.status === "fulfilled" && missingDatabase.length > 0'), "missing database game warnings must only appear after a successful read");
assert.ok(kidsLevelsAdminPage.includes('gamesResult.status === "fulfilled" ? gameNames.get(level.game_id) ?? "لعبة غير معروفة" : "غير متاح"'), "level rows must distinguish unavailable game metadata from a real missing game");

assert.match(adminManager, /name="published" type="checkbox" defaultChecked=\{false\}/, "Kids content must default to draft until an editor explicitly publishes it");
const service = readFileSync("src/features/kids/services/kids-content.ts", "utf8");
const spiritualRetriever = readFileSync("src/features/spiritual-ai/services/retriever.ts", "utf8");
const offlineExporter = readFileSync("scripts/export-offline-content.mjs", "utf8");
type OfflineKidsRow = {
  type?: string;
  slug?: string;
  metadata?: { age_appropriate?: unknown };
};
type OfflineManifest = {
  datasets?: { kids?: { count?: number } };
  routes?: unknown[];
};
const offlineKidsSnapshot = JSON.parse(readFileSync("public/offline-content/v1/kids.json", "utf8")) as OfflineKidsRow[];
const offlineManifest = JSON.parse(readFileSync("public/offline-content/v1/manifest.json", "utf8")) as OfflineManifest;
assert.match(service, /published=eq\.true&is_active=eq\.true/, "public Kids queries must include active state");
assert.match(service, /select=\*&published=eq\.true&is_active=eq\.true/, "the Kids page must preserve every active published content type");
assert.match(service, /metadata->>age_appropriate\.eq\.true/, "public Kids database reads must exclude stories without explicit age approval");
assert.match(service, /isKidsContentPubliclyVisible/, "public Kids services must enforce age approval for stories even when the database RLS policy is unavailable");
assert.doesNotMatch(service, /type=eq\.story/, "the Kids page must not regress to a story-only database feed");
assert.match(service, /supabaseServerAdminRequest[\s\S]*?select=slug/, "fallback visibility must consult database-owned slugs");
assert.match(service, /mergeKidsContentWithFallback\(database\.items, FALLBACK_KIDS_CONTENT, database\.knownSlugs\)/);
assert.match(service, /getFallbackKidsContentBySlug\(cleanSlug, FALLBACK_KIDS_CONTENT, database\.knownSlugs\)/);
assert.equal(offlineKidsSnapshot.some((item: OfflineKidsRow) => item.type === "story" && item.metadata?.age_appropriate !== true), false, "the committed offline Kids corpus must not contain unapproved stories");
assert.equal(offlineManifest.datasets?.kids?.count, offlineKidsSnapshot.length, "the offline manifest must match the filtered Kids corpus count");
assert.ok(offlineManifest.routes?.every((route: unknown) => {
  const match = typeof route === "string" ? route.match(/^\/kids\/([^/]+)$/) : null;
  const item = match ? offlineKidsSnapshot.find((row: OfflineKidsRow) => row.slug === match[1]) : null;
  return !item || item.type !== "story" || item.metadata?.age_appropriate === true;
}), "offline route inventory must not include a path to an unapproved story still present in the corpus");
assert.match(offlineExporter, /previousKidsRows[\s\S]*blockedKidsRoutes/, "offline refresh must remember previously exported unapproved story routes");
assert.match(offlineExporter, /rows = rows\.filter\(\(row\) => row && \(row\.type !== 'story' \|\| row\.metadata\?\.age_appropriate === true\)\)/, "offline refresh must filter unapproved stories even when a service-role key bypasses RLS");
assert.match(offlineExporter, /routes: Array\.isArray\(previous\.routes\)[\s\S]*blockedKidsRoutes\.has\(route\)/, "offline refresh must remove routes for unapproved stories");
assert.match(spiritualRetriever, /published=eq\.true&is_active=eq\.true&type=neq\.story/, "AI retrieval must only use active, published non-story Kids content");
assert.match(spiritualRetriever, /type=eq\.story&metadata->>age_appropriate=eq\.true/, "AI retrieval must only use age-approved Kids stories");

const migration = readFileSync(
  "supabase/migrations/20261110212000_kids_content_public_read_respects_active_state.sql",
  "utf8",
);
assert.match(migration, /drop policy if exists "kids_content_public_read"/i);
assert.match(migration, /published\s+is\s+true[\s\S]*is_active\s+is\s+true[\s\S]*type\s*<>\s*'story'[\s\S]*metadata->'age_appropriate'\s*=\s*'true'::jsonb/i, "public Kids RLS must hide unpublished, inactive, and stories without a JSON boolean age approval");
assert.match(migration, /kids_content\.type\s*<>\s*'story'[\s\S]*kids_content\.metadata->'age_appropriate'\s*=\s*'true'::jsonb/i, "the share counter must use the same age-approved story visibility contract");

console.log("Kids content visibility and fallback contracts passed.");
