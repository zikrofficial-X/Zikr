import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  "supabase/migrations/20261110150000_restore_confirmed_purged_video_catalog.sql",
  "utf8",
);

for (const [token, message] of [
  ["q.status = 'published'", "only successful social queue rows may restore a video"],
  ["q.metadata ? 'videoDisposedAt'", "the temporary media must have been disposed by the publishing flow"],
  ["q.metadata->'platformResults'->'youtube'->>'ok' = 'true'", "YouTube success must be confirmed"],
  ["q.metadata->'platformResults'->'youtube'->>'remoteId' ~ '^[A-Za-z0-9_-]{11}$'", "the provider ID must be a valid YouTube video ID"],
  ["cp.status = 'published'", "the video must have been published on the ZIKR site before purge"],
  ["r.status = 'completed'", "the canonical generation request must be completed"],
  ["r.content_hash = v.metadata->>'contentHash'", "the content hash must match the canonical request"],
  ["r.source_hash = v.metadata->>'sourceHash'", "the source hash must match the canonical request"],
  ["r.template_version = v.metadata->>'templateVersion'", "the renderer version must match the canonical request"],
  ["v.metadata->'automatedVideoQa'->>'status' = 'passed'", "automated video QA must have passed"],
  ["v.metadata->>'kidsVideoQaStatus' = 'passed'", "kids content requires its dedicated QA gate"],
  ["'mediaFallbackAvailable', true", "the confirmed fallback must be recorded"],
  ["'mediaPurgedFromPublished', true", "the previous public state must be recorded"],
  ["'mediaState', 'youtube_fallback'", "the catalog must leave the purged-media state"],
]) {
  assert.ok(migration.includes(token), message + ": " + token);
}

assert.ok(migration.includes("set published = true"), "only the verified recovery set is republished");
assert.doesNotMatch(migration, /\b(delete\s+from|truncate\s+|drop\s+table)\b/i, "recovery must not delete user data or schema");
console.log("Confirmed purged-video catalog recovery migration contract passed.");
