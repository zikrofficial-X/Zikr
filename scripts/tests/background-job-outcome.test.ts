import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildRunNowRequestDeleteFilter, buildRunNowRequestValueFilter, evaluateBackgroundJobOutcome, isSameRunNowRequest, shouldClearRunNowRequest, shouldRunScheduledContentPublishing } from "../../src/features/videos/services/background-job-outcome";
import { isVideoAutomationEnabled, isVideoPurgeInProgress } from "../../src/features/videos/services/background-job-settings";

assert.deepEqual(evaluateBackgroundJobOutcome({
  videoSucceeded: 10,
  videoFailed: 0,
  socialFailed: 0,
  sitePublishingFailed: false,
}), {
  hasPartialVideoFailures: false,
  shouldFailRun: false,
  fatalFailureCount: 0,
});

assert.deepEqual(evaluateBackgroundJobOutcome({
  videoSucceeded: 9,
  videoFailed: 1,
  socialFailed: 0,
  sitePublishingFailed: false,
}), {
  hasPartialVideoFailures: true,
  shouldFailRun: false,
  fatalFailureCount: 0,
});

assert.deepEqual(evaluateBackgroundJobOutcome({
  videoSucceeded: 0,
  videoFailed: 10,
  socialFailed: 0,
  sitePublishingFailed: false,
}), {
  hasPartialVideoFailures: false,
  shouldFailRun: true,
  fatalFailureCount: 10,
});

assert.equal(evaluateBackgroundJobOutcome({
  videoSucceeded: 9,
  videoFailed: 1,
  socialFailed: 1,
  sitePublishingFailed: false,
}).shouldFailRun, true, "a social provider failure must remain fatal");

assert.equal(evaluateBackgroundJobOutcome({
  videoSucceeded: 9,
  videoFailed: 1,
  socialFailed: 0,
  sitePublishingFailed: true,
}).shouldFailRun, true, "an internal site-publishing failure must remain fatal");

assert.equal(shouldRunScheduledContentPublishing({ target: "videos", videoDryRun: true }), false,
  "video dry-run must not claim or publish scheduled internal site content");
assert.equal(shouldRunScheduledContentPublishing({ target: "all", videoDryRun: true }), false,
  "an all-target dry-run must not publish scheduled internal site content");
assert.equal(shouldRunScheduledContentPublishing({ target: "videos", videoDryRun: false }), true,
  "the production video worker must still publish eligible internal site content after generation");
assert.equal(shouldRunScheduledContentPublishing({ target: "all", videoDryRun: false }), true,
  "an explicit non-dry-run all-target worker may process scheduled site content");
assert.equal(shouldRunScheduledContentPublishing({ target: "social", videoDryRun: false }), false,
  "the social-only worker must not claim the internal site publishing queue");
assert.equal(shouldRunScheduledContentPublishing({ target: "insights", videoDryRun: false }), false,
  "the analytics-only worker must not claim the internal site publishing queue");

console.log("Background job outcome policy passed: partial video failures do not suppress eligible social publishing.");

assert.equal(isVideoAutomationEnabled(true), true, "an explicit boolean enable flag may start video automation");
assert.equal(isVideoAutomationEnabled("true"), true, "an explicit string enable flag may start video automation");
assert.equal(isVideoAutomationEnabled(" TRUE "), true, "explicit string enable values are normalized without accepting missing values");
assert.equal(isVideoPurgeInProgress(undefined), false, "an absent purge-lock row does not imply an active purge");
assert.equal(isVideoPurgeInProgress(false), false, "an explicitly released purge lock is inactive");
assert.equal(isVideoPurgeInProgress("false"), false, "the legacy string false value remains inactive");
for (const activeOrInvalidLock of [true, "true", null, "", "locked", 0, 1]) {
  assert.equal(isVideoPurgeInProgress(activeOrInvalidLock), true, "active or malformed purge-lock values must fail closed");
}
for (const missingOrInvalid of [undefined, null, false, "false", "", "enabled", "1", 1]) {
  assert.equal(isVideoAutomationEnabled(missingOrInvalid), false, "missing or invalid admin configuration must not start video generation");
}



assert.equal(shouldClearRunNowRequest({
  hasRequest: true,
  target: "videos",
  automationEnabled: true,
  videosProcessed: 10,
}), true, "a partially successful batch must consume its one-shot Run Now request");

assert.equal(shouldClearRunNowRequest({
  hasRequest: true,
  target: "videos",
  automationEnabled: true,
  videosProcessed: 0,
}), false, "a worker that processed nothing must not consume Run Now");

assert.equal(shouldClearRunNowRequest({
  hasRequest: true,
  target: "social",
  automationEnabled: true,
  videosProcessed: 10,
}), false, "a social-only run must not consume a video Run Now request");

assert.equal(shouldClearRunNowRequest({
  hasRequest: true,
  target: "videos",
  automationEnabled: false,
  videosProcessed: 10,
}), false, "disabled video automation must not consume Run Now");

const originalRunNow = {
  requestId: "run-request-a",
  requestedAt: "2026-11-11T19:00:00.000Z",
};
assert.equal(isSameRunNowRequest(originalRunNow, originalRunNow), true);
const originalUpdateFilter = buildRunNowRequestValueFilter(originalRunNow);
assert.equal(
  originalUpdateFilter,
  `key=eq.video_automation_run_now&value=eq.${encodeURIComponent(JSON.stringify(originalRunNow))}`,
  "dispatch result updates must compare the complete JSONB request before mutating the row",
);
assert.notEqual(
  originalUpdateFilter,
  buildRunNowRequestValueFilter({ ...originalRunNow, requestId: "run-request-b" }),
  "a stale dispatch result must not match a newer request, even when requestedAt is identical",
);
const originalDeleteFilter = buildRunNowRequestDeleteFilter(originalRunNow.requestedAt, originalRunNow);
assert.equal(
  originalDeleteFilter,
  `key=eq.video_automation_run_now&updated_at=eq.${encodeURIComponent(originalRunNow.requestedAt)}&value=eq.${encodeURIComponent(JSON.stringify(originalRunNow))}`,
  "the DELETE must compare the complete JSONB request value as well as updated_at",
);
assert.notEqual(
  originalDeleteFilter,
  buildRunNowRequestDeleteFilter(originalRunNow.requestedAt, {
    ...originalRunNow,
    requestId: "run-request-b",
  }),
  "a concurrent request with the same millisecond timestamp must have a different atomic DELETE predicate",
);
assert.equal(
  buildRunNowRequestDeleteFilter(null, originalRunNow),
  null,
  "a missing row version must never produce a destructive filter",
);
assert.equal(
  isSameRunNowRequest(
    { requestId: "run-request-b", requestedAt: originalRunNow.requestedAt },
    originalRunNow,
  ),
  false,
  "a newer Run Now request created in the same millisecond must not be consumed by the previous worker",
);
assert.equal(
  isSameRunNowRequest({ requestedAt: "legacy-request" }, { requestedAt: "legacy-request" }),
  true,
  "legacy requests without a request ID remain consumable when their timestamp matches",
);

const backgroundRunnerSource = readFileSync(resolve(process.cwd(), "scripts/run-background-jobs.ts"), "utf8");
assert.match(backgroundRunnerSource, /shouldRunScheduledContentPublishing\(\{[\s\S]*?target,[\s\S]*?videoDryRun: VIDEO_DRY_RUN/,
  "the background runner must gate scheduled site publication with the video dry-run policy");
assert.match(backgroundRunnerSource, /select=key,value,updated_at/, "Run Now consumption must read the row version");
assert.match(backgroundRunnerSource, /enabled: isVideoAutomationEnabled\(values\.video_automation_enabled\)/, "video generation must require an explicit Admin enable flag");
assert.match(backgroundRunnerSource, /Could not read Admin video settings; video automation will remain disabled/, "Admin settings read failures must be logged and fail closed");
assert.match(backgroundRunnerSource, /buildRunNowRequestDeleteFilter\(row\.updated_at, row\.value\)/, "Run Now deletion must atomically compare the exact row version and JSONB request value");
assert.match(backgroundRunnerSource, /isSameRunNowRequest\(parsed, request\)/, "Run Now deletion must match the exact request identity");
assert.match(backgroundRunnerSource, /import \{[^}]*isSameRunNowRequest[^}]*\} from "\.\.\/src\/features\/videos\/services\/background-job-outcome"/, "the Run Now identity guard must be imported from the shared policy");
const adminSystemActionsSource = readFileSync(resolve(process.cwd(), "src/app/admin/system-actions.ts"), "utf8");
const templateVideoWorkerSource = readFileSync(resolve(process.cwd(), "scripts/jobs/template-video-automation.ts"), "utf8");
const videoPurgeRouteSource = readFileSync(resolve(process.cwd(), "src/app/api/admin/video-purge/route.ts"), "utf8");
assert.match(backgroundRunnerSource, /isVideoPurgeInProgress\(values\.video_purge_in_progress\) \|\| !isVideoAutomationEnabled\(values\.video_automation_enabled\)/, "a missing or malformed live enable flag must stop an in-flight background video worker");
assert.match(templateVideoWorkerSource, /isVideoPurgeInProgress\(settings\.video_purge_in_progress\) \|\| !isVideoAutomationEnabled\(settings\.video_automation_enabled\)/, "the direct video worker must use the same fail-closed live lock policy");
assert.match(adminSystemActionsSource, /if \(isVideoPurgeLockResponseActive\(purgeRows\)\)/, "video settings must not change while a purge lock is active or malformed");
assert.match(adminSystemActionsSource, /if \(!isVideoAutomationEnabled\(configuredEnabled\)\)/, "Run Now must not dispatch when the Admin enable flag is missing or invalid");
assert.match(videoPurgeRouteSource, /return isVideoAutomationEnabled\(rows\?\.\[0\]\?\.value\)/, "purge restoration must preserve a missing or legacy-false automation setting as disabled");
assert.match(adminSystemActionsSource, /requestId: randomUUID\(\)/, "each Run Now request must have a unique identity");
assert.match(adminSystemActionsSource, /buildRunNowRequestValueFilter\(request\)/, "Run Now dispatch must build a compare-and-set predicate from the request it created");
assert.equal(
  adminSystemActionsSource.split('"/rest/v1/admin_settings?" + requestFilter').length - 1,
  3,
  "success, scheduled-worker fallback, and failure updates must all compare-and-set the original request",
);
const contentPublishingSource = readFileSync(resolve(process.cwd(), "scripts/jobs/content-publishing.ts"), "utf8");
const socialPublishingSource = readFileSync(resolve(process.cwd(), "scripts/jobs/social-publishing.ts"), "utf8");
for (const [workerName, workerSource] of [
  ["social publishing", socialPublishingSource],
  ["scheduled content publishing", contentPublishingSource],
] as const) {
  assert.match(
    workerSource,
    /import \{ isVideoPurgeLockResponseActive \} from ["']\.\.\/\.\.\/src\/features\/videos\/services\/background-job-settings["']/,
    `${workerName} must import the shared fail-closed purge-lock policy`,
  );
  assert.match(
    workerSource,
    /return isVideoPurgeLockResponseActive\(rows\)/,
    `${workerName} must fail closed for null or malformed purge-lock values`,
  );
  assert.doesNotMatch(
    workerSource,
    /rows\?\.\[0\]\?\.value\s*===\s*true/,
    `${workerName} must not treat unknown purge-lock values as inactive`,
  );
}
assert.match(contentPublishingSource, /async function recoverStaleContentPublishingClaims/);
assert.match(contentPublishingSource, /status=eq\.processing&updated_at=lt\./, "stale content claims must be bounded by the last row update");
assert.match(contentPublishingSource, /updated_at=eq\.\$\{encodeURIComponent\(row\.updated_at\)\}/, "stale recovery must compare the exact candidate version");
assert.match(contentPublishingSource, /updated_at=eq\.\$\{encodeURIComponent\(item\.updated_at\)\}/, "the content queue claim must compare the exact candidate snapshot");
assert.match(contentPublishingSource, /updated_at=eq\.\$\{encodeURIComponent\(claimUpdatedAt\)\}/, "defer, completion, and failure transitions must retain the exact processing lease");
assert.match(contentPublishingSource, /const stillProcessing = await supabaseServerAdminRequest[\s\S]*?updated_at=eq\.\$\{encodeURIComponent\(claimUpdatedAt\)\}/, "content must not be published after a newer queue edit or cancellation");
assert.ok(
  contentPublishingSource.indexOf("recoverStaleContentPublishingClaims(now)") <
    contentPublishingSource.indexOf("status=eq.queued&scheduled_at=lte."),
  "stale content queue claims must be reconciled before new work is selected",
);
