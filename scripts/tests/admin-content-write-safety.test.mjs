import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const actions = readFileSync("src/app/admin/content-actions.ts", "utf8");
const content = readFileSync("src/features/admin/services/content.ts", "utf8");
const stories = readFileSync("src/features/stories/services/stories.ts", "utf8");
const hardening = readFileSync("supabase/migrations/20261113190000_harden_admin_managed_content_write_permissions.sql", "utf8");
const kidsActions = readFileSync("src/app/admin/kids/actions.ts", "utf8");
const kidsManager = readFileSync("src/features/admin/components/kids-content-manager.tsx", "utf8");

assert.match(actions, /if \(!updatedAt\).*Refresh before publishing/s, "publish must require the client row version");
assert.match(actions, /if \(!updatedAt\).*Refresh before deleting/s, "delete must require the client row version");
assert.match(actions, /nextValue !== "true" && nextValue !== "false"/, "publish state must be parsed strictly");
assert.match(actions, /invalidateStoriesCache\(\)/, "story mutations must clear the process-local story cache");
assert.match(actions, /updateTag\("public-stories"\)/, "story mutations must invalidate the Next data cache");
assert.match(actions, /revalidatePath\("\/sitemap-content\/\[id\]", "page"\)/, "public content changes must invalidate sitemap shards");
assert.match(actions, /if \(!recorded\)[\s\S]*audit event could not be recorded/, "post-commit audit failure must be surfaced instead of silently reported as success");

assert.match(content, /optimisticUpdatedAt && String\(target\.updated_at\) !== optimisticUpdatedAt/, "publish must reject a stale client row version");
assert.match(content, /updated_at=eq\.\$\{encodeURIComponent\(String\(target\.updated_at\)\)\}/, "publish update must compare-and-set the exact database row version");
assert.match(content, /updated_at=eq\.\$\{encodeURIComponent\(String\(current\[0\]\.updated_at\)\)\}/, "delete must compare-and-set the exact database row version");

assert.match(stories, /const CACHE_TTL = 60_000/, "scheduled story publication must become visible without a 30-minute cache delay");
assert.match(stories, /revalidate: 60, tags: \["public-stories"\]/, "story fetches must have a short invalidatable data-cache tag");
assert.match(stories, /export function invalidateStoriesCache\(\)/, "admin actions must be able to clear the process-local story cache");

assert.match(hardening, /DROP POLICY IF EXISTS admin_all_kids_content_insert ON public[.]kids_content/, "Kids content direct insert policy must be removed");
assert.match(hardening, /DROP POLICY IF EXISTS admin_all_kids_content_update ON public[.]kids_content/, "Kids content direct update policy must be removed");
assert.match(hardening, /DROP POLICY IF EXISTS admin_all_kids_content_delete ON public[.]kids_content/, "Kids content direct delete policy must be removed");
assert.match(hardening, /REVOKE ALL PRIVILEGES ON TABLE public[.]kids_content FROM PUBLIC, anon, authenticated/, "Kids content writes must be server-role-only");
assert.match(hardening, /GRANT SELECT ON TABLE public[.]kids_content TO anon, authenticated/, "public Kids content reads must remain available through RLS");
assert.match(hardening, /GRANT ALL PRIVILEGES ON TABLE public[.]kids_content TO service_role/, "server-side Kids content actions must retain their write capability");
assert.match(kidsActions, /if \(published \|\| ageAppropriate\) await requireAdminStepUp\("content[.]publish", "\/admin\/kids"\)/,
  "setting the story age-approval flag must require the content.publish permission and step-up, even for drafts");
assert.match(kidsActions, /let auditError: unknown = null/);
assert.match(kidsActions, /Kids content was saved, but its audit event could not be recorded/);
assert.ok(kidsActions.indexOf('revalidatePath("/kids")') < kidsActions.indexOf("if (auditError)"), "Kids routes must revalidate before reporting a post-commit audit failure");

const ageReviewStart = kidsActions.indexOf("export async function reviewKidsStoryAgeSuitabilityAction");
const ageReviewAction = kidsActions.slice(ageReviewStart);
assert.ok(ageReviewStart >= 0, "existing Kids stories must have a controlled age-review action");
assert.match(ageReviewAction, /requireAdminPermission\("kids.manage"\)/);
assert.match(ageReviewAction, /requireAdminStepUp\("content[.]publish", "\/admin\/kids\/content"\)/);
assert.match(ageReviewAction, /confirm_review/);
assert.match(ageReviewAction, /decision === "rejected" && reviewNote[.]length < 10/);
assert.match(ageReviewAction, /updated_at=eq[.]\$\{encodeURIComponent\(current[.]updated_at\)\}/,
  "age-review writes must compare-and-set the exact story version");
assert.match(ageReviewAction, /body: JSON[.]stringify\(\{ metadata: nextMetadata, updated_at: nextUpdatedAt \}\)/,
  "age review may change only the metadata approval flag and row version");
assert.match(ageReviewAction, /recordAdminAuditEvent/);
assert.doesNotMatch(ageReviewAction, /published:|is_active:|content_ar:/,
  "age review must not silently publish, hide, or rewrite story content");

const ageApprovalInput = kidsManager.indexOf('name="age_appropriate"');
const ageApprovalGate = kidsManager.lastIndexOf("{canPublish ?", ageApprovalInput);
assert.ok(ageApprovalGate >= 0 && ageApprovalGate < ageApprovalInput,
  "users without content.publish must not see the age-approval control");
assert.match(kidsManager, /reviewKidsStoryAgeSuitabilityAction/);
assert.match(kidsManager, /name="confirm_review"/);
assert.match(kidsManager, /content_ar,content_en,updated_at/);

const libraryAdmin = readFileSync("src/app/admin/library/page.tsx", "utf8");
const publicLibrary = readFileSync("src/features/content-library/services/content-library.ts", "utf8");
const contentDetailPage = readFileSync("src/app/content/[slug]/page.tsx", "utf8");
assert.match(publicLibrary, /cache: "force-cache"[\s\S]*revalidate: 1800/, "public library detail reads are cached and require explicit invalidation");
assert.match(contentDetailPage, /getPublicContentBySlug/, "content detail route must use the cached public content contract");
assert.match(libraryAdmin, /revalidatePath\(['"]\/content\/\[slug\]['"],\s*['"]page['"]\)/, "library moderation and publication changes must invalidate cached public detail pages");

console.log("Admin content write-safety, Kids write hardening, audit integrity, story cache invalidation, and public content detail invalidation contracts passed.");
