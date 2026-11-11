import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const job = readFileSync("scripts/jobs/content-publishing.ts", "utf8");
const contentUpdate = job.indexOf("const updatedContent = await supabaseServerAdminRequest");
const missingRowGuard = job.indexOf("if (!updatedContent?.some(row => row.id === item.content_id))");
const queuePublishedUpdate = job.indexOf('status: "published"', contentUpdate);

assert.ok(contentUpdate >= 0, "scheduled publishing must request the updated content row");
assert.ok(job.includes("Prefer: \"return=representation\""), "the content update must return the row it actually changed");
assert.ok(missingRowGuard > contentUpdate, "a missing content row must be detected after the update");
assert.ok(queuePublishedUpdate > missingRowGuard, "the queue must not be marked published before the content row is confirmed");
assert.ok(job.includes("CONTENT_TABLES.has(item.content_table)"), "dynamic content table names must remain allowlisted");

console.log("Scheduled content publication row-integrity contracts passed.");
