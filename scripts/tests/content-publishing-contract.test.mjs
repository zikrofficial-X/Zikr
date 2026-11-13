import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const job = readFileSync("scripts/jobs/content-publishing.ts", "utf8");
const adminContent = readFileSync("src/features/admin/services/content.ts", "utf8");
const contentUpdate = job.indexOf("const updatedContent = await supabaseServerAdminRequest");
const missingRowGuard = job.indexOf("if (!updatedRow || typeof updatedRow.updated_at !== \"string\" || !updatedRow.updated_at)");
const queuePublishedUpdate = job.indexOf('status: "published"', contentUpdate);

assert.ok(contentUpdate >= 0, "scheduled publishing must request the updated content row");
assert.ok(job.includes("Prefer: \"return=representation\""), "the content update must return the row it actually changed");
assert.ok(missingRowGuard > contentUpdate, "a missing content row must be detected after the update");
assert.ok(queuePublishedUpdate > missingRowGuard, "the queue must not be marked published before the content row is confirmed");
assert.ok(job.includes("CONTENT_TABLES.has(item.content_table)"), "dynamic content table names must remain allowlisted");
const publisherTableBlock = job.match(/const CONTENT_TABLES = new Set\(\[([\s\S]*?)\]\);/)?.[1] ?? "";
assert.ok(publisherTableBlock.includes('"pinned_messages"'), "pinned messages must remain an approved scheduled content table");
assert.ok(job.includes("`/rest/v1/${item.content_table}?"), "scheduled publication must update the allowlisted content table selected by the queue item");
assert.match(
  job,
  /body:\s*JSON\.stringify\(\{\s*published:\s*true,\s*updated_at:\s*requestedContentUpdatedAt\s*\}\)/,
  "scheduled publication must set the canonical published column and update timestamp for every allowlisted content table",
);
assert.doesNotMatch(
  job,
  /item\.content_table === ["']pinned_messages["']\s*\?\s*["']is_active["']/,
  "pinned messages must not use the retired is_active publication column",
);
assert.match(job, /inspectVideoQueueItemApproval/,
  "internal video site publication must revalidate the canonical generation request approval snapshot");
assert.match(job, /metadata\.kidsVideoQaStatus === "passed" && automatedQa\.status === "passed"/,
  "Kids video site publication must require both the dedicated Kids QA gate and the automated QA pass");
assert.match(job, /parsed\.pathname\.includes\("\/video\/upload\/"\)/,
  "internal video publication must reject non-video Cloudinary URLs");
assert.match(job, /resolveVideoMediaUrl\(/,
  "scheduled video publication must use the same canonical playable-media resolver as public video routes");
assert.match(job, /select=id,updated_at,published,youtube_id,metadata/,
  "scheduled video publication must load the YouTube fallback identifier used by the canonical media resolver");
assert.match(job, /!hasPlayableMedia/,
  "a video with a known missing Cloudinary master and no confirmed YouTube fallback must not be published");

assert.match(
  job,
  /content_publish_queue\?id=eq\.\$\{encodeURIComponent\(item\.id\)\}&status=eq\.queued&scheduled_at=lte\.\$\{encodeURIComponent\(nowIso\)\}&updated_at=eq\.\$\{encodeURIComponent\(item\.updated_at\)\}/,
  "the atomic claim must recheck the due time and exact queue row version so a concurrent reschedule cannot publish early",
);
assert.match(job, /async function isVideoPurgeInProgress/);
assert.match(
  job,
  /if \(item\.content_table === "videos" && await isVideoPurgeInProgress\(\)\)/,
  "scheduled video publication must recheck the purge lock before claiming and before touching the catalog",
);
assert.match(job, /async function deferVideoPublication/);
assert.match(
  job,
  /status: "queued",[\s\S]*?Video purge is in progress; publication was safely deferred/,
  "video queue claims must be released safely when a purge lock is active",
);
assert.match(
  job,
  /Could not verify the video purge lock; holding video publication/,
  "a lock lookup failure must fail closed instead of publishing a video during cleanup",
);

assert.match(
  adminContent,
  /table === "stories"[\s\S]*?"id,updated_at,is_approved,user_id"/,
  "direct story publication must load approval and ownership state from the database",
);
assert.match(
  adminContent,
  /published && table === "stories" && \(target\.is_approved !== true \|\| target\.user_id !== null\)/,
  "direct publishing must reject unapproved or user-owned stories even if a server action is invoked directly",
);
assert.match(
  adminContent,
  /updated_at=eq\.\$\{encodeURIComponent\(String\(target\.updated_at\)\)\}/,
  "content publication must use the version read before the approval check to prevent stale concurrent updates",
);

const consoleSource = readFileSync("src/app/admin/content/content-console.tsx", "utf8");
assert.match(consoleSource, /activeSchedule\.status === "processing" \? "قيد النشر"/,
  "the Admin content console must distinguish in-flight publication from a future schedule");
assert.match(consoleSource, /activeSchedule \? <form action=\{cancelContentPublishAction\}/,
  "the Admin content console must expose cancellation for queued and processing schedules");

console.log("Scheduled content publication row-integrity contracts passed.");

const contentService = readFileSync("src/features/admin/services/content.ts", "utf8");
const unpublishStart = contentService.indexOf("if (!published)");
const cancelSchedule = contentService.indexOf("status=in.(queued,processing)", unpublishStart);
const updateContent = contentService.indexOf("const updated = await supabaseServerAdminRequest", unpublishStart);
assert.ok(unpublishStart >= 0 && cancelSchedule > unpublishStart && cancelSchedule < updateContent,
  "unpublishing must cancel queued and in-flight scheduled publications before changing content");
assert.match(adminContent, /automationPublicationHold = true/, "an explicit article unpublish must persist a hold that automation cannot silently reverse");
assert.match(adminContent, /delete articleMetadata\.automationPublicationHold/, "an explicit admin republish must clear the automation publication hold");
assert.match(adminContent, /table === "articles"[\s\S]*?id,updated_at,metadata/, "article publication updates must read metadata before preserving and updating the hold marker");

const deleteStart = contentService.indexOf("export async function deleteManagedContent");
const deleteQueueCancel = contentService.indexOf("status=in.(queued,processing)", deleteStart);
const deleteOperation = contentService.indexOf('method: "DELETE"', deleteStart);
assert.ok(deleteStart >= 0 && deleteQueueCancel > deleteStart && deleteQueueCancel < deleteOperation,
  "deleting a draft must cancel queued and in-flight publication before removing the source row");

assert.match(job, /async function rollbackScheduledContentPublication/,
  "worker rollback must be isolated behind a version-checked helper");
assert.ok(job.includes("updated_at=eq.${encodeURIComponent(publishedUpdatedAt)}"),
  "worker rollback must match the exact updated_at written by that worker so a later admin republish is preserved");
assert.ok(job.includes("&select=id,updated_at"),
  "the worker must read back the committed row version after publication");
assert.ok(job.includes("contentPublishedUpdatedAt = updatedRow.updated_at"),
  "the worker must use the database-returned updated_at value because the Stories trigger replaces the requested timestamp");
assert.equal(
  (job.split("rollbackScheduledContentPublication(item, contentPublishedUpdatedAt)").length - 1),
  2,
  "both cancellation and error rollback paths must use the version-checked helper",
);
assert.match(
  job,
  /Could not verify queue state; skipping automatic rollback/,
  "a queue-state lookup failure must not trigger an unverified content rollback",
);
assert.match(
  job,
  /if \(queueStatus && queueStatus !== "published"\)/,
  "automatic rollback must require a positively verified non-published queue state",
);
assert.match(
  job,
  /else if \(!queueStatus\)/,
  "missing queue state must leave content unchanged for manual reconciliation",
);

const adminActions = readFileSync("src/app/admin/content-actions.ts", "utf8");
const activeQueueMigration = readFileSync("supabase/migrations/20261113230000_content_publish_queue_one_active_item.sql", "utf8");
assert.match(activeQueueMigration, /CREATE UNIQUE INDEX IF NOT EXISTS content_publish_queue_one_active_item[\s\S]*?WHERE status IN \('queued', 'processing'\)/,
  "the database must allow at most one queued or processing schedule per content item");
assert.match(adminContent, /status=in\.\(queued,processing\)/,
  "the Admin content read model must surface queued and in-flight schedule rows");
assert.match(adminContent, /updated_at&order=scheduled_at\.asc/,
  "the active schedule read must include row-version data for safe lifecycle handling");
assert.match(adminActions, /const select = table === "stories"[\s\S]*?"id,published,is_approved,user_id"/,
  "story scheduling must load its public-approval fields");
assert.match(adminActions, /target\.is_approved !== true \|\| target\.user_id !== null/,
  "only approved, non-user-owned stories may be scheduled for public publication");
assert.match(adminActions, /target\.published !== false/,
  "already-published content must not receive a duplicate schedule");
assert.match(adminActions, /safeTogglePublishAction[\s\S]*?requireAdminStepUp\("content\.publish", "\/admin\/content"\)/,
  "immediate article/story publishing must require destructive-action step-up MFA");
assert.match(adminActions, /scheduleContentPublishAction[\s\S]*?requireAdminStepUp\("content\.publish", "\/admin\/content"\)/,
  "scheduled article/story publishing must require destructive-action step-up MFA");
assert.match(adminActions, /status=in\.\(queued,processing\)[\s\S]*?activeSchedules\?\.length/,
  "a schedule request must reject an existing queued or processing row before insert");
assert.match(adminActions, /cancelContentPublishAction[\s\S]*?requireAdminStepUp\("content\.publish", "\/admin\/content"\)/,
  "cancelling a scheduled or in-flight publication must require step-up MFA");
assert.match(adminActions, /Prefer: "return=representation"/,
  "schedule cancellation must confirm that a row was actually changed");
assert.match(adminActions, /if \(!cancelled\?\.some\(\(row\) => row\.id === queueId\)\)/,
  "a stale or completed queue item must not produce a false successful cancellation");

assert.match(
  adminActions,
  /table === "articles"[\s\S]*?automationPublicationHold === true/,
  "the admin scheduling action must reject articles that still carry an explicit unpublish hold",
);
const kidsActions = readFileSync("src/app/admin/kids/actions.ts", "utf8");
assert.match(kidsActions, /if \(published\) await requireAdminStepUp\("content\.publish", "\/admin\/kids"\)/,
  "publishing Kids content must require destructive-action step-up MFA");

assert.match(job, /validateScheduledStoryForPublication/,
  "the worker must revalidate story approval at execution time");
assert.match(
  job,
  /validateScheduledArticleForPublication[\s\S]*?automationPublicationHold === true/,
  "scheduled article publication must honor an explicit unpublish hold",
);
assert.match(
  job,
  /validateScheduledContentForPublication\(item\)/,
  "every scheduled content table must pass through current-state validation",
);
assert.match(
  job,
  /published=eq\.false&updated_at=eq\.\$\{encodeURIComponent\(validatedContentUpdatedAt\)\}/,
  "the content write must compare-and-set against the exact version validated by the worker",
);
const exactProcessingClaimPredicate = "/rest/v1/content_publish_queue?id=eq.${encodeURIComponent(item.id)}&status=eq.processing&updated_at=eq.${encodeURIComponent(claimUpdatedAt)}";
const exactProcessingClaimCount = job.split(exactProcessingClaimPredicate).length - 1;
assert.ok(
  exactProcessingClaimCount >= 3,
  "the pre-publish recheck, queue completion, and failure cleanup must all require the exact processing claim version",
);
assert.ok(
  job.includes(`${exactProcessingClaimPredicate}&select=id&limit=1`),
  "the worker must recheck its exact queue claim immediately before publishing",
);
const completionStart = job.indexOf("const completed = await supabaseServerAdminRequest");
const completionEnd = job.indexOf("if (!completed", completionStart);
assert.ok(completionStart >= 0 && completionEnd > completionStart);
assert.ok(
  job.slice(completionStart, completionEnd).includes(`${exactProcessingClaimPredicate}&select=id`),
  "the worker must commit publication only while it still owns the exact processing claim",
);
assert.match(job, /currentQueue\?\.\[0\]\?\.status === "cancelled"/,
  "a concurrent unpublish must win over an in-flight scheduled publication");


assert.match(job, /import \{ buildNextRowVersionUpdatedAt \} from "\.\.\/\.\.\/src\/lib\/supabase\/row-version"/,
  "scheduled content publication must use a strictly monotonic row-version helper for compare-and-set transitions");
assert.match(job, /const requestedClaimUpdatedAt = buildNextRowVersionUpdatedAt\(item\.updated_at, now\)/,
  "the queue claim must advance its row version before the worker lease is used");
assert.match(job, /const requestedContentUpdatedAt = buildNextRowVersionUpdatedAt\(validatedContentUpdatedAt\)/,
  "the validated content row must receive a strictly newer CAS version even when publication and a concurrent edit share one millisecond");
assert.match(job, /updated_at: buildNextRowVersionUpdatedAt\(publishedUpdatedAt\)/,
  "a stale rollback must advance the exact worker-written row version so it cannot undo a same-millisecond admin republish");
assert.match(job, /const recoveredAt = buildNextRowVersionUpdatedAt\(row\.updated_at, now\)/,
  "stale queue recovery must not reuse the expired worker's row-version token");
assert.match(job, /const completedUpdatedAt = buildNextRowVersionUpdatedAt\(claimUpdatedAt, new Date\(completedAt\)\)/,
  "queue completion must advance the exact processing lease version");
