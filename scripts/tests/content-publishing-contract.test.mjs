import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const job = readFileSync("scripts/jobs/content-publishing.ts", "utf8");
const adminContent = readFileSync("src/features/admin/services/content.ts", "utf8");
const contentUpdate = job.indexOf("const updatedContent = await supabaseServerAdminRequest");
const missingRowGuard = job.indexOf("if (!updatedContent?.some(row => row.id === item.content_id))");
const queuePublishedUpdate = job.indexOf('status: "published"', contentUpdate);

assert.ok(contentUpdate >= 0, "scheduled publishing must request the updated content row");
assert.ok(job.includes("Prefer: \"return=representation\""), "the content update must return the row it actually changed");
assert.ok(missingRowGuard > contentUpdate, "a missing content row must be detected after the update");
assert.ok(queuePublishedUpdate > missingRowGuard, "the queue must not be marked published before the content row is confirmed");
assert.ok(job.includes("CONTENT_TABLES.has(item.content_table)"), "dynamic content table names must remain allowlisted");
assert.match(job, /inspectVideoQueueItemApproval/,
  "internal video site publication must revalidate the canonical generation request approval snapshot");
assert.match(job, /metadata\.kidsVideoQaStatus === "passed" && automatedQa\.status === "passed"/,
  "Kids video site publication must require both the dedicated Kids QA gate and the automated QA pass");
assert.match(job, /parsed\.pathname\.includes\("\/video\/upload\/"\)/,
  "internal video publication must reject non-video Cloudinary URLs");

assert.ok(
  job.includes("status=eq.queued&scheduled_at=lte.") && job.includes("encodeURIComponent(now)"),
  "the atomic claim must recheck the due time so a concurrent reschedule cannot publish early",
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

const adminActions = readFileSync("src/app/admin/content-actions.ts", "utf8");
assert.match(adminActions, /table === "stories" \? "id,published,is_approved,user_id"/,
  "story scheduling must load its public-approval fields");
assert.match(adminActions, /target\.is_approved !== true \|\| target\.user_id !== null/,
  "only approved, non-user-owned stories may be scheduled for public publication");
assert.match(adminActions, /target\.published !== false/,
  "already-published content must not receive a duplicate schedule");

assert.match(job, /validateScheduledStoryForPublication/,
  "the worker must revalidate story approval at execution time");
assert.match(job, /status=eq\.processing&select=id&limit=1/,
  "the worker must recheck its queue claim immediately before publishing");
assert.match(job, /status=eq\.processing&select=id/,
  "the worker must commit publication only while it still owns the processing claim");
assert.match(job, /currentQueue\?\.\[0\]\?\.status === "cancelled"/,
  "a concurrent unpublish must win over an in-flight scheduled publication");
assert.match(job, /status=eq\.processing`/,
  "worker failures must not overwrite an administrator's cancelled queue state");
