import assert from "node:assert/strict";
import { getKidsQuizQuestions, isKidsContentType, KIDS_CONTENT_TYPES, normalizeKidsVideoEmbedUrl, parseKidsQuizData } from "../../src/features/kids/services/kids-content-validation";
import { readFileSync } from "node:fs";
import { getConfirmedPublicKidsVideoSocialPlatforms, isPublicKidsVideoSocialQueueRow, resolveKidsVideoSocialPublication } from "../../src/features/social/services/kids-video-social-visibility";
import { normalizeOfflineKidsRows } from "../../src/features/kids/services/kids-offline-content";
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
assert.equal(isKidsContentPubliclyVisible({ type: "story", metadata: { age_appropriate: false } }), true, "automation eligibility must not hide an already-published story from public content");
assert.equal(isKidsContentPubliclyVisible({ type: "story", metadata: {} }), true, "legacy published stories without an automation flag remain publicly visible");
assert.equal(isKidsContentPubliclyVisible({ type: "unknown", metadata: {} }), false, "unsupported content types must not be exposed through the public Kids resolver");
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
  { slug: "story-live", type: "story", source: "database" },
];
const fallbackItems = [
  { slug: "story-live", type: "story", source: "fallback" },
  { slug: "story-unpublished", type: "story", source: "fallback" },
  { slug: "story-inactive", type: "story", source: "fallback" },
  { slug: "story-static-only", type: "story", source: "fallback" },
];
const knownDatabaseSlugs = new Set(["story-live", "story-unpublished", "story-inactive"]);

assert.deepEqual(
  mergeKidsContentWithFallback(databaseItems, fallbackItems, knownDatabaseSlugs),
  [
    { slug: "story-live", type: "story", source: "database" },
    { slug: "story-static-only", type: "story", source: "fallback" },
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

const publicFallbackItems = [
  { slug: "approved-story", type: "story", metadata: { age_appropriate: true } },
  { slug: "unapproved-story", type: "story", metadata: { age_appropriate: false } },
  { slug: "legacy-story", type: "story", metadata: {} },
  { slug: "public-game", type: "game", metadata: {} },
];
assert.deepEqual(
  mergeKidsContentWithFallback([], publicFallbackItems, new Set()),
  publicFallbackItems,
  "curated static fallback stories remain public regardless of their separate automation eligibility flag",
);
assert.equal(
  getFallbackKidsContentBySlug("unapproved-story", publicFallbackItems, new Set())?.slug,
  "unapproved-story",
  "public fallback detail lookup must not confuse automation eligibility with publication visibility",
);
assert.equal(
  getFallbackKidsContentBySlug("legacy-story", publicFallbackItems, new Set())?.slug,
  "legacy-story",
  "legacy static stories without an automation flag remain publicly visible",
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
const kidsVideoListPage = readFileSync("src/app/kids/videos/page.tsx", "utf8");
const kidsVideoDetailPage = readFileSync("src/app/kids/videos/[slug]/page.tsx", "utf8");
assert.ok(kidsVideoListPage.includes("getKidsGeneratedVideos(60)") && kidsVideoListPage.includes(".catch((error) => {"), "the public Kids video list must recover from Supabase read failures instead of returning HTTP 500");
assert.ok(kidsVideoListPage.includes("videosUnavailable") && kidsVideoListPage.includes("مكتبة الفيديوهات غير متاحة مؤقتًا"), "the Kids video list must distinguish an unavailable backend from a genuinely empty library");
assert.ok(kidsVideoDetailPage.includes("type KidsVideoLookup =") && kidsVideoDetailPage.includes("status: \"loaded\"") && kidsVideoDetailPage.includes("status: \"error\""), "the Kids detail loader must distinguish a database miss from a backend failure");
assert.ok(kidsVideoDetailPage.includes("return { status: \"loaded\", video: await getKidsGeneratedVideoBySlug(slug) }") && kidsVideoDetailPage.includes("return { status: \"error\" }"), "the detail loader must preserve successful null results and report thrown service failures separately");
assert.ok(kidsVideoDetailPage.includes("if (result.status === \"error\")") && kidsVideoDetailPage.includes("تعذر تحميل الفيديو مؤقتًا") && kidsVideoDetailPage.includes("الفيديو غير موجود"), "the public detail page must not disguise backend outages as missing content");
assert.ok(kidsVideoDetailPage.includes("result.status === \"error\" ? \"الفيديو غير متاح مؤقتًا\""), "metadata must distinguish transient lookup errors from genuine missing videos");

assert.match(kidsVideoDetailPage, /sandbox="allow-scripts allow-same-origin allow-presentation"/, "the public Kids video detail iframe must be sandboxed to the trusted player capabilities");
assert.match(kidsVideoDetailPage, /referrerPolicy="strict-origin-when-cross-origin"/, "the public Kids video detail iframe must not leak full referrer paths");
assert.match(kidsVideoDetailPage, /loading="lazy"/, "the public Kids video detail iframe must load lazily");

assert.ok(kidsVideosApi.includes("metadata->>audience=eq.kids"), "the Kids video feed must never attach a general-audience social queue caption");
assert.ok(kidsVideosApi.includes("resolveKidsVideoSocialPublication"), "the Kids video feed must aggregate all original and supplemental social queue rows");
assert.ok(kidsVideosApi.includes("socialQueueReadSucceeded = true"), "stored social badges must be used only after a successful live queue read");
assert.ok(kidsVideosApi.includes("Promise.allSettled"), "a social queue read failure must be distinguishable from a legitimate empty result");
assert.doesNotMatch(kidsVideosApi, /status=in\.\(published,partial\)/, "queued, processing and failed supplemental rows must participate in live publication reconciliation");

// All queue states are read so live failed/pending rows can override stale catalog metadata.


assert.equal(isPublicKidsVideoSocialQueueRow({ content_type: "kids_video", status: "published", target_platforms: ["youtube"], published_at: "2026-11-11T12:00:00.000Z", metadata: { audience: "kids" } }), true);
assert.equal(isPublicKidsVideoSocialQueueRow({
  content_type: "kids_video",
  status: "partial",
  published_at: "2026-11-11T12:00:00.000Z",
  metadata: { audience: "kids", platformResults: { youtube: { ok: true, remoteId: "yt-video-123" } } },
}), true, "partial rows are public only when at least one platform has a confirmed remote ID");
assert.equal(isPublicKidsVideoSocialQueueRow({
  content_type: "kids_video",
  status: "partial",
  published_at: "2026-11-11T12:00:00.000Z",
  metadata: { audience: "kids", platformResults: {} },
}), false, "retryable partial rows with no confirmed platform publication must remain private");
assert.equal(isPublicKidsVideoSocialQueueRow({
  content_type: "kids_video",
  status: "partial",
  published_at: null,
  metadata: { audience: "kids", platformResults: { youtube: { ok: true, remoteId: "yt-video-123" } } },
}), false, "a partial row without a publication timestamp must remain private");
for (const status of ["queued", "processing", "failed"]) {
  assert.equal(isPublicKidsVideoSocialQueueRow({ content_type: "kids_video", status, metadata: { audience: "kids" } }), false, `${status} social drafts must not be exposed through the public Kids feed`);
}
assert.equal(isPublicKidsVideoSocialQueueRow({ content_type: "written_post", status: "published", metadata: { audience: "kids" } }), false);
assert.equal(isPublicKidsVideoSocialQueueRow({ content_type: "kids_video", status: "published", metadata: { audience: "general" } }), false);

const deletedYoutubeRow = {
  status: "published",
  target_platforms: ["youtube", "facebook"],
  metadata: {
    audience: "kids",
    platformResults: {
      youtube: { ok: true, remoteId: "yt-video-123" },
      facebook: { ok: true, remoteId: "fb-video-123" },
    },
    platformDeletions: {
      youtube: { status: "deleted", remoteId: "yt-video-123" },
    },
  },
};
assert.deepEqual(
  getConfirmedPublicKidsVideoSocialPlatforms(deletedYoutubeRow),
  ["facebook"],
  "a confirmed remote deletion must remove only that platform from the public Kids publication badge",
);
assert.deepEqual(
  getConfirmedPublicKidsVideoSocialPlatforms({
    ...deletedYoutubeRow,
    metadata: {
      ...deletedYoutubeRow.metadata,
      platformDeletions: {
        youtube: { status: "deleted" },
        facebook: { status: "deleted" },
      },
    },
  }),
  [],
  "when every remote post is deleted, the Kids feed must not report any platform as published",
);
assert.deepEqual(
  getConfirmedPublicKidsVideoSocialPlatforms({
    status: "published",
    target_platforms: ["youtube", "facebook"],
    metadata: { audience: "kids", platformDeletions: { youtube: { status: "deleted", deletedAt: "2026-11-11T12:06:00.000Z" } } },
  }),
  ["facebook"],
  "legacy published rows without a result ledger must still exclude platforms with confirmed deletion records",
);
assert.deepEqual(
  getConfirmedPublicKidsVideoSocialPlatforms({
    status: "published",
    target_platforms: ["youtube"],
    metadata: { audience: "kids", platformResults: { youtube: { ok: false, remoteId: null } } },
  }),
  [],
  "an explicit failed result ledger must not fall back to optimistic target_platforms",
);
const legacyArraySuccessRow = {
  status: "published",
  target_platforms: ["youtube", "facebook"],
  published_at: "2026-11-11T12:00:00.000Z",
  metadata: {
    audience: "kids",
    platformResults: [
      { platform: "youtube", ok: true, remoteId: "yt-array-123" },
      { platform: "facebook", ok: false, remoteId: null, error: "temporary provider failure" },
    ],
  },
};
assert.deepEqual(
  getConfirmedPublicKidsVideoSocialPlatforms(legacyArraySuccessRow),
  ["youtube"],
  "legacy array-shaped result ledgers must expose only platforms with confirmed remote IDs",
);
assert.equal(
  isPublicKidsVideoSocialQueueRow({ ...legacyArraySuccessRow, content_type: "kids_video" }),
  true,
  "a confirmed legacy array-shaped publication must remain visible in the Kids feed",
);
assert.deepEqual(
  resolveKidsVideoSocialPublication([{ ...legacyArraySuccessRow, content_type: "kids_video" }], null, true),
  { status: "partial", platforms: ["youtube"], publishedAt: "2026-11-11T12:00:00.000Z" },
  "array-shaped partial results must not be promoted to all requested platforms",
);
assert.deepEqual(
  getConfirmedPublicKidsVideoSocialPlatforms({
    ...legacyArraySuccessRow,
    metadata: {
      audience: "kids",
      platformResults: [{ platform: "youtube", ok: false, remoteId: null, error: "provider failure" }],
    },
  }),
  [],
  "a non-empty array result ledger with no confirmed delivery must not fall back to target_platforms",
);

const socialPublisherSource = readFileSync("src/features/social/services/social-publishing.ts", "utf8");
const kidsSocialSyncStart = socialPublisherSource.indexOf("async function syncKidsSocialPublicationToCatalog");
const kidsSocialSyncEnd = socialPublisherSource.indexOf("async function syncYouTubeVideoReferenceToCatalog", kidsSocialSyncStart);
const kidsSocialSyncSource = kidsSocialSyncStart >= 0 && kidsSocialSyncEnd > kidsSocialSyncStart
  ? socialPublisherSource.slice(kidsSocialSyncStart, kidsSocialSyncEnd)
  : "";
assert.match(
  kidsSocialSyncSource,
  /normalizeSocialPlatformResults\(rawResults\)/,
  "Kids catalog synchronization must normalize legacy array-shaped platform results before deriving publication badges",
);

const originalYoutubeQueueRow = {
  content_type: "kids_video",
  status: "published",
  target_platforms: ["youtube"],
  published_at: "2026-11-11T12:00:00.000Z",
  metadata: { audience: "kids", platformResults: { youtube: { ok: true, remoteId: "yt-video-123" } } },
};
const supplementalFacebookQueueRow = {
  content_type: "kids_video",
  status: "published",
  target_platforms: ["facebook"],
  published_at: "2026-11-11T12:05:00.000Z",
  metadata: { audience: "kids", platformResults: { facebook: { ok: true, remoteId: "fb-video-456" } } },
};
assert.deepEqual(
  resolveKidsVideoSocialPublication([supplementalFacebookQueueRow, originalYoutubeQueueRow], null, true),
  { status: "published", platforms: ["youtube", "facebook"], publishedAt: "2026-11-11T12:05:00.000Z" },
  "a newer supplemental row must not hide a confirmed platform from the original Kids video queue row",
);
const pendingSupplementalRow = {
  ...supplementalFacebookQueueRow,
  status: "queued",
  published_at: null,
  metadata: { audience: "kids", platformResults: {} },
};
const partialWithoutPublishedAt = {
  content_type: "kids_video",
  status: "partial",
  target_platforms: ["youtube"],
  published_at: null,
  metadata: { audience: "kids", platformResults: { youtube: { ok: true, remoteId: "yt-video-unversioned" } } },
};
assert.equal(isPublicKidsVideoSocialQueueRow(partialWithoutPublishedAt), false, "a partial row without a publication timestamp must remain private");
assert.equal(resolveKidsVideoSocialPublication([partialWithoutPublishedAt], null, true), null, "an unversioned remote success must not create a public platform badge");
assert.deepEqual(
  resolveKidsVideoSocialPublication([pendingSupplementalRow, originalYoutubeQueueRow], null, true),
  { status: "partial", platforms: ["youtube"], publishedAt: "2026-11-11T12:00:00.000Z" },
  "a pending supplemental target must not erase the original confirmed publication",
);
const deletedYoutubeSupplementalRow = {
  content_type: "kids_video",
  status: "partial",
  target_platforms: ["youtube"],
  published_at: null,
  metadata: { audience: "kids", platformDeletions: { youtube: { status: "deleted", deletedAt: "2026-11-11T12:06:00.000Z" } } },
};
assert.equal(
  resolveKidsVideoSocialPublication([originalYoutubeQueueRow, deletedYoutubeSupplementalRow], null, true),
  null,
  "a confirmed deletion in any supplemental row must override an older success for that platform",
);
const republishedYoutubeQueueRow = {
  ...originalYoutubeQueueRow,
  published_at: "2026-11-11T12:10:00.000Z",
  metadata: { audience: "kids", platformResults: { youtube: { ok: true, remoteId: "yt-video-789" } } },
};
assert.deepEqual(
  resolveKidsVideoSocialPublication([
    republishedYoutubeQueueRow,
    originalYoutubeQueueRow,
    deletedYoutubeSupplementalRow,
  ], null, true),
  { status: "published", platforms: ["youtube"], publishedAt: "2026-11-11T12:10:00.000Z" },
  "a later confirmed republish must supersede an older confirmed deletion for the same platform",
);
const republishedAfterDeletionSameRow = {
  ...originalYoutubeQueueRow,
  published_at: "2026-11-11T12:10:00.000Z",
  metadata: {
    audience: "kids",
    platformResults: { youtube: { ok: true, remoteId: "yt-video-789" } },
    platformDeletions: { youtube: { status: "deleted", deletedAt: "2026-11-11T12:06:00.000Z" } },
  },
};
assert.deepEqual(
  getConfirmedPublicKidsVideoSocialPlatforms(republishedAfterDeletionSameRow),
  ["youtube"],
  "a later publication on a reused queue row must supersede an older deletion record",
);
assert.deepEqual(
  resolveKidsVideoSocialPublication([republishedAfterDeletionSameRow], null, true),
  { status: "published", platforms: ["youtube"], publishedAt: "2026-11-11T12:10:00.000Z" },
  "same-row republishing must preserve the latest confirmed remote publication",
);
const sameTimestampPublication = {
  ...originalYoutubeQueueRow,
  published_at: "2026-11-11T12:06:00.000Z",
};
const sameTimestampDeletedRow = {
  ...deletedYoutubeSupplementalRow,
  metadata: {
    audience: "kids",
    platformDeletions: {
      youtube: { status: "deleted", deletedAt: "2026-11-11T12:06:00.000Z" },
    },
  },
};
assert.equal(
  resolveKidsVideoSocialPublication([sameTimestampDeletedRow, sameTimestampPublication], null, true),
  null,
  "a publication at the exact deletion timestamp must not resurrect a deleted Kids social post",
);
assert.equal(
  resolveKidsVideoSocialPublication([sameTimestampPublication, sameTimestampDeletedRow], null, true),
  null,
  "equal-timestamp publication/deletion resolution must be independent of queue row order",
);
const storedLegacyPublication = { status: "published", platforms: ["youtube"], publishedAt: "2026-11-10T12:00:00.000Z" };
assert.equal(
  resolveKidsVideoSocialPublication([], storedLegacyPublication, false),
  null,
  "a failed live queue read must not resurrect a stale catalog publication badge",
);
assert.deepEqual(
  resolveKidsVideoSocialPublication([], storedLegacyPublication, true),
  storedLegacyPublication,
  "a successful empty live query may retain the legacy catalog fallback",
);
assert.equal(
  resolveKidsVideoSocialPublication([{
    content_type: "kids_video",
    status: "failed",
    target_platforms: ["youtube"],
    published_at: null,
    metadata: { audience: "kids", platformResults: {} },
  }], storedLegacyPublication, true),
  null,
  "a live failed queue row must override stale catalog publication metadata",
);

const kidsSocialPostsApi = readFileSync("src/app/api/kids/social-posts/route.ts", "utf8");
assert.match(kidsSocialPostsApi, /process\.env\.VERCEL_ENV === "production"/, "a missing service-role key must be visible in production");
assert.match(kidsSocialPostsApi, /status: 503/, "a missing production service-role key must not silently produce an empty Kids posts feed");
assert.match(kidsSocialPostsApi, /return NextResponse\.json\(\[\]/, "preview and development may retain their intentional empty-feed fallback");
const kidsHomePage = readFileSync("src/app/kids/page.tsx", "utf8");
const kidsVideoService = readFileSync("src/features/videos/services/videos.ts", "utf8");
assert.match(kidsVideoService, /resolveKidsVideoSocialPublicationForDetail/);
assert.match(kidsVideoService, /social_publish_queue\?content_id=eq\./, "the Kids video detail route must reconcile live social queue rows");
assert.match(kidsVideoService, /metadata->>audience=eq\.kids/, "the Kids video detail route must never use general-audience social rows");
assert.match(kidsVideoService, /metadata:\s*\{\s*\.\.\.metadata,\s*socialPublication\s*\}/, "the Kids video detail response must replace stale catalog social badges with the live result");
assert.ok(kidsVideoService.includes("order=created_at.desc&limit=600"), "the Kids video detail must inspect the same bounded queue history as the public feed");
assert.match(kidsVideoDetailPage, /نص منشور مُجهّز/, "unpublished generated copy must be labelled as prepared copy, not a published post");
assert.match(kidsVideoDetailPage, /لم يتم نشره بعد/, "the Kids video detail page must state when a generated caption has no confirmed platform delivery");
const kidsGamesAdminPage = readFileSync("src/app/admin/kids/games/page.tsx", "utf8");
const kidsLevelsAdminPage = readFileSync("src/app/admin/kids/levels/page.tsx", "utf8");
const kidsContentData = readFileSync("src/features/kids/data/content.ts", "utf8");

assert.match(adminAction, /age_appropriate: ageAppropriate/);
assert.match(adminAction, /if \(!Array\.isArray\(existingSlug\)/, "Kids slug preflight must reject malformed PostgREST responses before media upload");
assert.match(adminAction, /!Array\.isArray\(saved\)\s*\|\|\s*saved\.length !== 1/, "Kids inserts must verify exactly one returned row before reporting success");
assert.match(adminManager, /if \(!Array\.isArray\(rowsResult\.value\)\)/, "Kids admin list must not treat malformed row data as a successful empty list");
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
assert.ok(adminAction.includes('requestedPublicId = slug + "-" + randomUUID()') && adminAction.includes("publicId: requestedPublicId"), "each Kids upload must use a unique Cloudinary asset id");
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
const mediaAssetLimits = readFileSync("src/features/media/services/media-asset-limits.ts", "utf8");
assert.ok(imageField.includes("MAX_MEDIA_IMAGE_BYTES") && mediaAssetLimits.includes("3 * 1024 * 1024"), "the Kids server-action upload must use the shared 3 MB limit below the 4 MB action body limit");

assert.ok(
  adminAction.indexOf("const quizData = type === \"quiz\" ? parseKidsQuizData(value(formData, \"quiz_data\")) : null;") < imageUploadPosition,
  "invalid quiz JSON must be rejected before uploading an image",
);
const quizRequiredPosition = adminAction.indexOf("if (type === \"quiz\" && !quizData)");
assert.ok(quizRequiredPosition > 0 && quizRequiredPosition < imageUploadPosition, "a quiz record must require a valid non-empty question set before media upload");
assert.match(adminAction, /formData\.get\("age_appropriate"\) === "on"/, "age approval must be true only for a checked checkbox");
assert.match(adminAction, /formData\.get\("published"\) === "on"/, "publication must be true only for a checked checkbox");
assert.match(adminAction, /if \(published\) await requireAdminStepUp\("content\.publish"/, "creating a published Kids item must require the dedicated content.publish permission and MFA step-up");
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
assert.match(kidsDetailPage, /if \(!contentSlug\)/, "the detail loader must use its normalized slug consistently");
assert.match(kidsDetailPage, /encodeURIComponent\(contentSlug\)/, "the detail request must use the normalized slug");
assert.match(kidsDetailPage, /\}, \[contentSlug, isEnglish\]\);/, "the detail loader dependencies must include every captured slug and locale value");
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
assert.match(kidsHomePage, /generatedKidsStatus/);
assert.match(kidsHomePage, /kidsWrittenPostsStatus/);
assert.match(kidsHomePage, /setGeneratedKidsStatus\("error"\)/);
assert.match(kidsHomePage, /setKidsWrittenPostsStatus\("error"\)/);
assert.match(kidsHomePage, /role="alert"/);
assert.match(kidsHomePage, /if \(!response\.ok\) throw new Error/);
const kidsVideoListStart = kidsVideoService.indexOf("export async function getKidsGeneratedVideos");
const kidsVideoDetailStart = kidsVideoService.indexOf("export async function getKidsGeneratedVideoBySlug", kidsVideoListStart);
const kidsVideoListSource = kidsVideoListStart >= 0 && kidsVideoDetailStart > kidsVideoListStart
  ? kidsVideoService.slice(kidsVideoListStart, kidsVideoDetailStart)
  : "";
const kidsVideoDetailEnd = kidsVideoService.indexOf("export async function getInternalGeneratedVideos", kidsVideoDetailStart);
const kidsVideoDetailSource = kidsVideoDetailStart >= 0 && kidsVideoDetailEnd > kidsVideoDetailStart
  ? kidsVideoService.slice(kidsVideoDetailStart, kidsVideoDetailEnd)
  : "";
assert.match(kidsVideoListSource, /Supabase is not configured; Kids generated videos are unavailable/);
assert.match(kidsVideoListSource, /Kids generated video query returned an invalid row set/);
assert.doesNotMatch(kidsVideoListSource, /\.catch\(\(\) => \[\]\)/);
assert.match(kidsVideoDetailSource, /Supabase is not configured; Kids generated video details are unavailable/);
assert.match(kidsVideoDetailSource, /Kids generated video detail query returned an invalid row set/);
assert.doesNotMatch(kidsVideoDetailSource, /\.catch\(\(\) => \[\]\)/);
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
assert.doesNotMatch(service, /metadata->>age_appropriate\.eq\.true/, "public Kids database reads must not use the automation eligibility flag as a visibility gate");
assert.match(service, /isKidsContentPubliclyVisible/, "public Kids services must reject unsupported types even when the database RLS policy is unavailable");
assert.match(service, /FALLBACK_KIDS_CONTENT\.filter\(isKidsContentPubliclyVisible\)/, "static fallback lists must apply the same supported-type visibility gate");
assert.match(service, /if \(!fallback \|\| !isKidsContentPubliclyVisible\(fallback\)\) return null/, "static fallback detail routes must not bypass supported-type visibility");
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
assert.match(offlineExporter, /const blockedRoutes = new Set\(\[\.\.\.blockedKidsRoutes, \.\.\.blockedPublishedContentRoutes\]\)/, "offline refresh must merge Kids and published-content route revocations");
assert.match(offlineExporter, /previous\.routes\.filter\(\(route\) => !blockedRoutes\.has\(route\)\)/, "offline refresh must remove routes for unapproved stories");
assert.match(spiritualRetriever, /published=eq\.true&is_active=eq\.true&type=neq\.story/, "AI retrieval must only use active, published non-story Kids content");
assert.match(spiritualRetriever, /type=eq\.story&metadata->>age_appropriate=eq\.true/, "AI retrieval must only use age-approved Kids stories");

const migration = readFileSync(
  "supabase/migrations/20261110212000_kids_content_public_read_respects_active_state.sql",
  "utf8",
);
assert.match(migration, /drop policy if exists "kids_content_public_read"/i);
assert.match(migration, /published\s+is\s+true[\s\S]*is_active\s+is\s+true/i, "public Kids RLS must require published and active content");
assert.match(migration, /kids_content\.published\s+is\s+true[\s\S]*kids_content\.is_active\s+is\s+true/i, "the share counter must use the same published and active visibility contract");
assert.doesNotMatch(migration, /age_appropriate/i, "the automation eligibility flag must not restrict public Kids visibility or sharing");

assert.match(migration, /security invoker\s+set search_path = ''/i, "the service-role share counter must use invoker privileges and an empty search path");
assert.doesNotMatch(migration, /security definer/i, "public share-count code must not introduce a definer entry point");

console.log("Kids content visibility and fallback contracts passed.");

const offlineKidsRows = normalizeOfflineKidsRows([
  { id: "approved-story", slug: "approved-story", title_ar: "قصة معتمدة", title_en: "Approved story", type: "story", age_group: "6-8", content_ar: "نص", content_en: "Text", published: true, is_active: true, metadata: { age_appropriate: true } },
  { id: "unapproved-story", slug: "unapproved-story", title_ar: "قصة غير معتمدة", type: "story", age_group: "6-8", content_ar: "نص", published: true, is_active: true, metadata: { age_appropriate: false } },
  { id: "legacy-story", slug: "legacy-story", title_ar: "قصة قديمة", type: "story", age_group: "6-8", content_ar: "نص", published: true, is_active: true, metadata: {} },
  { id: "inactive-game", slug: "inactive-game", title_ar: "لعبة غير نشطة", type: "game", age_group: "6-8", content_ar: "نص", published: true, is_active: false, metadata: {} },
  { id: "public-game", slug: "public-game", title_ar: "لعبة", title_en: "Game", type: "game", age_group: "6-8", content_ar: "نص", content_en: "Text", published: true, is_active: true, metadata: {} },
], "ar");
assert.deepEqual(
  offlineKidsRows.map((item) => item.slug),
  ["approved-story", "public-game"],
  "offline Kids fallback must expose only published active supported content and explicitly age-approved stories",
);
assert.deepEqual(
  normalizeOfflineKidsRows([
    { id: "arabic-only", slug: "arabic-only", title_ar: "عربي فقط", type: "story", age_group: "6-8", content_ar: "نص", published: true, is_active: true, metadata: { age_appropriate: true } },
  ], "en"),
  [],
  "English offline Kids content must require both an English title and body",
);
const kidsHomeOfflineSource = readFileSync("src/app/kids/page.tsx", "utf8");
const kidsDetailOfflineSource = readFileSync("src/app/kids/[slug]/page.tsx", "utf8");
assert.match(kidsHomeOfflineSource, /if \(!response\.ok\) \{[\s\S]*?setContentStatus\("error"\)[\s\S]*?return;/,
  "an explicit HTTP error must not fall back to a potentially stale offline Kids snapshot");
assert.match(kidsHomeOfflineSource, /getOfflineKidsContent\(isEnglish \? "en" : "ar"\)/,
  "the Kids home page must use the validated offline snapshot after a network failure");
assert.match(kidsDetailOfflineSource, /getOfflineKidsContentBySlug\(contentSlug, isEnglish \? "en" : "ar"\)/,
  "the Kids detail page must resolve its slug from the validated offline snapshot after a network failure");
