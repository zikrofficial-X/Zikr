import assert from "node:assert/strict";
import { parseKidsQuizData } from "../../src/features/kids/services/kids-content-validation";
import { readFileSync } from "node:fs";
import {
  getFallbackKidsContentBySlug,
  mergeKidsContentWithFallback,
} from "../../src/features/kids/services/kids-content-visibility";

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

const adminAction = readFileSync("src/app/admin/kids/actions.ts", "utf8");
const adminManager = readFileSync("src/features/admin/components/kids-content-manager.tsx", "utf8");
const kidsDetailPage = readFileSync("src/app/kids/[slug]/page.tsx", "utf8");
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
assert.ok(
  adminAction.indexOf("const quizData = parseKidsQuizData(value(formData, \"quiz_data\"));") < imageUploadPosition,
  "invalid quiz JSON must be rejected before uploading an image",
);
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
assert.match(kidsDetailPage, /setContent\(null\)/, "a hidden or unavailable database slug must remain unavailable in the detail page");
assert.match(kidsDetailPage, /Number\.isInteger\(q\.correctAnswer\)[\s\S]*?q\.correctAnswer < q\.options\.length/, "the Kids player must reject out-of-range quiz answers");
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
