import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  "supabase/migrations/20261110150000_restore_confirmed_purged_video_catalog.sql",
  "utf8",
);

for (const [token, message] of [
  ["v.metadata->>'mediaPurgedFromPublished' = 'true'", "the catalog must explicitly record that it was public at purge time"],
  ["q.status = 'published'", "only successful social queue rows may restore a video"],
  ["q.metadata ? 'videoDisposedAt'", "the temporary media must have been disposed by the publishing flow"],
  ["q.metadata->'platformResults'->'youtube'->>'ok' = 'true'", "YouTube success must be confirmed"],
  ["q.metadata->'platformResults'->'youtube'->>'remoteId' ~ '^[A-Za-z0-9_-]{11}$'", "the provider ID must be a valid YouTube video ID"],
  ["v.youtube_id is null or v.youtube_id = q.metadata->'platformResults'->'youtube'->>'remoteId'", "a confirmed provider ID must not overwrite a conflicting catalog ID"],
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
const auditMigration = readFileSync(
  "supabase/migrations/20261110170000_restore_purge_audit_proven_video_catalog.sql",
  "utf8",
);

for (const [token, message] of [
  ["b97b0756-3e4c-4a43-aec8-a42686ab1682", "recovery must bind to the exact recorded purge audit event"],
  ["metadata->>'scope' = 'files'", "the recorded purge must have deleted files"],
  ["(metadata->>'catalogRecordsHidden')::integer = 105", "the exact hidden-catalog count must match the audit event"],
  ["(metadata->>'cloudinaryAssetsDeleted')::integer = 44", "the exact Cloudinary deletion count must match the audit event"],
  ["v.updated_at between purge_event.created_at - interval '15 seconds'", "video rows must have been changed inside the purge transaction window"],
  ["mediaPurgedAt", "the media-purge timestamp must independently match the audit window"],
  ["cp.published_at <= purge_event.created_at", "site publication must predate the purge"],
  ["q.published_at <= purge_event.created_at", "social publication must predate the purge"],
  ["videoDisposedAt", "Cloudinary disposal must predate the purge"],
  ["r.content_hash = v.metadata->>'contentHash'", "the restored row must match its canonical content hash"],
  ["r.source_hash = v.metadata->>'sourceHash'", "the restored row must match its source hash"],
  ["r.template_version = v.metadata->>'templateVersion'", "the restored row must match its renderer version"],
  ["v.metadata->'automatedVideoQa'->>'status' = 'passed'", "automated video QA must have passed"],
  ["v.metadata->>'kidsVideoQaStatus' = 'passed'", "Kids rows require the dedicated QA gate"],
  ["purge_event_count = 0", "local/preview migration replay without the production audit event must safely no-op"],
  ["Exact production purge audit event is absent", "non-production databases must not attempt production-specific recovery"],
  ["candidate_count = 58 and general_count = 50 and kids_count = 8", "the migration must fail closed unless the exact 50 general and 8 Kids rows are present"],
  ["candidate_count = 58 and general_count = 50 and kids_count = 8 and candidate_youtube_id_count = 58", "the recovery set must contain 58 distinct YouTube IDs"],
  ["existing_video.id <> v.id", "a candidate YouTube ID must not already belong to another catalog row"],
  ["existing_video.youtube_id = q.metadata->'platformResults'->'youtube'->>'remoteId'", "the collision guard must compare the exact recovered remote ID"],
  ["count(distinct youtube_id)", "candidate and idempotent paths must verify unique YouTube IDs"],
  ["already_restored_unique_youtube_ids = 58", "the already-restored path must verify 58 unique YouTube IDs"],
  ["already_restored_youtube_collisions = 0", "the already-restored path must verify no duplicate catalog YouTube IDs"],
  ["updated_count <> 58", "the migration must verify all 58 catalog rows were restored"],
  ["already_restored_count = 58", "a repeated migration execution must be a verified no-op"],
  ["'auditEventId', confirmed.audit_event_id", "restored rows must retain the exact audit-event provenance"],
  ["'mediaPurgedFromPublished', true", "restored rows must record the reconstructed prior-publication provenance"],
]) {
  assert.ok(auditMigration.includes(token), message + ": " + token);
}
assert.ok(auditMigration.includes("set published = true"), "only the fully proven recovery set is made public");
assert.doesNotMatch(auditMigration, /\b(delete\s+from|truncate\s+|drop\s+table)\b/i, "audit-proven recovery must not delete user data or schema");
assert.doesNotMatch(auditMigration, /update public\.(social_publish_queue|content_publish_queue)/i, "recovery must not mutate historical social or site publication queues");

console.log("Confirmed purged-video catalog recovery migration contract passed.");
