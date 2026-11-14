import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const library = read("src/app/admin/library/page.tsx");
const queues = read("src/app/admin/queues/page.tsx");
const knowledge = read("src/features/admin/services/knowledge.ts");
const videos = read("src/app/videos/page.tsx");
const facebookPosts = read("src/features/social/services/facebook-public-posts.ts");
const migration = read("supabase/migrations/20261110085520_add_hadith_chapter.sql");

assert.ok(
  library.includes("x.review_status === 'editorial_review' || x.review_status === 'scholarly_review'"),
  "Library review metric must exclude approved and published records",
);
assert.ok(queues.includes('"completed", "retry_wait", "failed"'), "Video queue must expose completed jobs");
assert.ok(queues.includes('"generated", "approved", "published", "completed"'), "Translation queue must expose generated and approved jobs");
assert.ok(queues.includes('"published", "partial", "failed"'), "Social queue must expose successful publications");
assert.ok(knowledge.includes("readAdminRows<KnowledgeBook>"), "Knowledge books must use the protected admin read path");
assert.ok(knowledge.includes("chapter,grade_ar"), "Knowledge hadith query must match the migrated schema");
assert.ok(videos.includes("getFacebookPublishedPosts(6)"), "Video hub must read confirmed Facebook posts");
assert.ok(!videos.includes("facebook.com/plugins/page.php"), "Video hub must not depend on the broken Facebook Page Plugin iframe");
assert.ok(facebookPosts.includes('delivery?.ok === true'), "Only successful Facebook delivery ledger rows may be shown");
assert.ok(facebookPosts.includes("remoteId"), "Published Facebook cards must link to a confirmed remote post ID");
assert.ok(facebookPosts.includes("isSocialPlatformDeletionCurrent(deletion, remoteId, row.published_at)"), "The public video hub must hide Facebook posts only when the matching remote delivery is confirmed deleted");
assert.match(migration, /add column if not exists chapter text/i);

console.log("Admin screen and Facebook feed regression contracts passed.");
