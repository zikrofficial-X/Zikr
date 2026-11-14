import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const actions = readFileSync("src/app/admin/content-actions.ts", "utf8");
const content = readFileSync("src/features/admin/services/content.ts", "utf8");
const stories = readFileSync("src/features/stories/services/stories.ts", "utf8");

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

console.log("Admin content write-safety and story cache invalidation contracts passed.");
