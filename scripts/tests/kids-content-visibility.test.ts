import assert from "node:assert/strict";
import { getKidsQuizQuestions, isKidsContentType, KIDS_CONTENT_TYPES, parseKidsQuizData } from "../../src/features/kids/services/kids-content-validation";
import { readFileSync } from "node:fs";
import {
  getFallbackKidsContentBySlug,
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
assert.ok(adminManager.includes('fileName="featured_image_file"'), "the Kids form must submit the selected file to its validated server action");
assert.ok(imageField.includes("name={fileName}"), "the image field must include the server-action file input name");
assert.equal(imageField.includes("fetch("), false, "Kids media must not upload before the server validates the slug");

const kidsDetailPage = readFileSync("src/app/kids/[slug]/page.tsx", "utf8");
const kidsQuizValidation = readFileSync("src/features/kids/services/kids-content-validation.ts", "utf8");
const kidsDetailLayout = readFileSync("src/app/kids/[slug]/layout.tsx", "utf8");
const kidsDetailApi = readFileSync("src/app/api/kids/content/[slug]/route.ts", "utf8");
const kidsContentData = readFileSync("src/features/kids/data/content.ts", "utf8");

assert.match(adminAction, /age_appropriate: ageAppropriate/);
const imageUploadPosition = adminAction.indexOf("await uploadCloudinaryImage");
assert.ok(imageUploadPosition > 0, "Kids image upload path must remain present");
const duplicateSlugCheckPosition = adminAction.indexOf("/rest/v1/kids_content?select=id&slug=eq.");
assert.ok(
  duplicateSlugCheckPosition > 0 && duplicateSlugCheckPosition < imageUploadPosition,
  "duplicate Kids slugs must be rejected before uploading media",
);
assert.doesNotMatch(adminAction, /on_conflict=slug|resolution=merge-duplicates/, "the add-only Kids form must never silently overwrite an existing published slug");
assert.ok(adminAction.includes("publicId: `${slug}-${randomUUID()}`"), "each Kids upload must use a unique Cloudinary asset id");
assert.ok(adminAction.indexOf('requireAdminPermission("media.manage")') < imageUploadPosition, "image upload must retain the media.manage permission gate");
assert.ok(adminAction.includes("audit event unavailable after content save"), "audit failure must not report a committed Kids insert as failed or skip cache revalidation");
assert.ok(cloudinaryUploadRoute.includes("randomUUID()"), "generic Cloudinary uploads must use collision-resistant default public ids");
assert.ok(cloudinaryUploadRoute.includes("audit event unavailable after upload"), "audit failure must not report a completed media upload as failed");
assert.ok(cloudinaryUploadRoute.includes("4 * 1024 * 1024"), "the generic upload route must stay within the Vercel request-body ceiling");
assert.ok(imageField.includes("3 * 1024 * 1024"), "the Kids server-action upload must stay below the 4 MB action body limit");

assert.ok(
  adminAction.indexOf("const quizData = type === \"quiz\" ? parseKidsQuizData(value(formData, \"quiz_data\")) : null;") < imageUploadPosition,
  "invalid quiz JSON must be rejected before uploading an image",
);
const quizRequiredPosition = adminAction.indexOf("if (type === \"quiz\" && !quizData)");
assert.ok(quizRequiredPosition > 0 && quizRequiredPosition < imageUploadPosition, "a quiz record must require a valid non-empty question set before media upload");
assert.match(adminAction, /const quizData = type === "quiz" \? parseKidsQuizData[\s\S]*?: null;/, "non-quiz Kids records must not persist quiz metadata");
assert.ok(
  adminAction.indexOf("if (type === \"game\" && !isRegisteredGameId(gameId))") < imageUploadPosition,
  "an invalid game registry ID must be rejected before uploading an image",
);
assert.match(adminManager, /name="age_appropriate"/);
assert.match(adminManager, /automationApprovalRequiredCount/);
assert.match(adminManager, /اعتماد التوليد الآلي/);
assert.match(adminManager, /"text":"من ربك؟","options":\["الله","غير ذلك"\],"correctAnswer":0/, "the admin quiz example must match the Kids detail player contract");
assert.doesNotMatch(adminManager, /"q":|"answers":/, "the admin quiz example must not use unsupported question keys");
assert.doesNotMatch(kidsDetailPage, /getKidsItemBySlug/, "the client must not resurrect a static fallback after the visibility-aware API returns 404");
assert.match(kidsDetailPage, /getKidsQuizQuestions/, "the detail page must use the tested localized quiz validator");
assert.match(kidsDetailPage, /setContent\(null\)/, "a hidden or unavailable database slug must remain unavailable in the detail page");
assert.match(kidsQuizValidation, /Number\.isInteger\(correctAnswer\)[\s\S]*?correctAnswer >= options\.length/, "the shared Kids quiz validator must reject out-of-range answers");
assert.match(kidsDetailPage, /getKidsQuizQuestions/, "the detail page must use the tested localized quiz validator");
assert.match(kidsDetailLayout, /getKidsContentBySlug\(slug, "ar"\)/, "SEO metadata must use the same visibility-aware resolver");
assert.match(kidsContentData, /content_ar:\s*row\.content_ar\s*\?\?\s*row\.summary_ar/, "Kids metadata must map the live summary_ar field into the shared content model");
assert.doesNotMatch(kidsDetailLayout, /supabaseServerAnonRequest/, "SEO metadata must not bypass database visibility checks");
assert.match(kidsDetailApi, /private, no-store/, "Kids detail responses must not serve stale content after deactivation or age-review changes");

assert.match(adminManager, /name="published" type="checkbox" defaultChecked=\{false\}/, "Kids content must default to draft until an editor explicitly publishes it");
const service = readFileSync("src/features/kids/services/kids-content.ts", "utf8");
assert.match(service, /published=eq\.true&is_active=eq\.true/, "public Kids queries must include active state");
assert.match(service, /select=\*&published=eq\.true&is_active=eq\.true/, "the Kids page must preserve every active published content type");
assert.doesNotMatch(service, /isKidsContentPublishable/, "age_appropriate is an automation eligibility flag, not a public visibility filter");
assert.doesNotMatch(service, /type=eq\.story/, "the Kids page must not regress to a story-only database feed");
assert.match(service, /supabaseServerAdminRequest[\s\S]*?select=slug/, "fallback visibility must consult database-owned slugs");
assert.match(service, /mergeKidsContentWithFallback\(database\.items, FALLBACK_KIDS_CONTENT, database\.knownSlugs\)/);
assert.match(service, /getFallbackKidsContentBySlug\(cleanSlug, FALLBACK_KIDS_CONTENT, database\.knownSlugs\)/);

const migration = readFileSync(
  "supabase/migrations/20261110212000_kids_content_public_read_respects_active_state.sql",
  "utf8",
);
assert.match(migration, /drop policy if exists "kids_content_public_read"/i);
assert.match(
  migration,
  /using\s*\(\s*published\s+is\s+true\s+and\s+is_active\s+is\s+true\s*\)/i,
  "public Kids RLS must hide unpublished and inactive rows while preserving published active stories regardless of automation eligibility",
);

console.log("Kids content visibility and fallback contracts passed.");
