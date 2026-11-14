import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runPostCommitAudit } from "../../src/features/admin/services/post-commit-audit";

let successfulWrites = 0;
let failureLogs = 0;
assert.equal(
  await runPostCommitAudit(async () => { successfulWrites += 1; }, () => { failureLogs += 1; }),
  true,
);
assert.equal(successfulWrites, 1);
assert.equal(failureLogs, 0);

const auditFailure = new Error("admin audit table unavailable");
let loggedFailure: unknown;
assert.equal(
  await runPostCommitAudit(async () => { throw auditFailure; }, (error) => {
    failureLogs += 1;
    loggedFailure = error;
  }),
  false,
  "a failed post-commit audit write must be reported as incomplete without rejecting the committed action",
);
assert.equal(failureLogs, 1);
assert.equal(loggedFailure, auditFailure);

assert.equal(
  await runPostCommitAudit(async () => { throw auditFailure; }, () => { throw new Error("logger unavailable"); }),
  false,
  "a logging failure must not rethrow after the business mutation has committed",
);

const actions = readFileSync("src/app/admin/content-actions.ts", "utf8");
assert.match(actions, /runPostCommitAudit/);
assert.equal(
  (actions.match(/await recordContentAuditEvent\(/g) ?? []).length,
  4,
  "publish, delete, schedule, and cancellation actions must all protect their committed result from audit-log failures",
);
const operationChecks = [
  ["safeTogglePublishAction", "await toggleManagedContent("],
  ["safeDeleteContentAction", "await deleteManagedContent("],
  ["scheduleContentPublishAction", 'await supabaseServerAdminRequest("/rest/v1/content_publish_queue"'],
  ["cancelContentPublishAction", 'method: "PATCH"'],
] as const;
for (const [name, operation] of operationChecks) {
  const start = actions.indexOf(`export async function ${name}`);
  const next = actions.indexOf("export async function ", start + 1);
  const body = actions.slice(start, next < 0 ? actions.length : next);
  assert.ok(start >= 0, `${name} must remain present`);
  assert.ok(body.indexOf(operation) >= 0, `${name} must perform its business mutation`);
  assert.ok(
    body.indexOf(operation) < body.indexOf("await recordContentAuditEvent("),
    `${name} must record the audit event only after its business mutation commits`,
  );
}

console.log("Post-commit admin audit failure contract passed.");


const postCommitRoutes = [
  ["src/app/api/admin/video-generation/route.ts", 2],
  ["src/app/api/admin/video-purge/route.ts", 1],
  ["src/app/api/admin/videos/[id]/route.ts", 2],
  ["src/app/api/admin/videos/[id]/retry/route.ts", 1],
  ["src/app/api/admin/videos/create/route.ts", 1],
  ["src/app/api/admin/videos/upload/route.ts", 1],
  ["src/app/api/admin/video/templates/route.ts", 4],
  ["src/app/api/admin/sections/route.ts", 1],
] as const;
for (const [path, expectedCalls] of postCommitRoutes) {
  const source = readFileSync(path, "utf8");
  const auditCalls = (source.match(/recordAdminAuditEvent\\(/g) ?? []).length;
  const wrappedCalls = (source.match(/runPostCommitAudit\\(\\s*\\(\\) => recordAdminAuditEvent\\(/g) ?? []).length;
  assert.equal(auditCalls, expectedCalls, `${path} must keep every post-mutation audit call accounted for`);
  assert.equal(wrappedCalls, expectedCalls, `${path} must not turn a committed mutation into a generic failure when audit persistence fails`);
  assert.match(source, /auditRecorded/, `${path} must surface whether its audit event was persisted`);
}
