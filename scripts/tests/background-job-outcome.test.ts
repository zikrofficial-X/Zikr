import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { evaluateBackgroundJobOutcome, isSameRunNowRequest, shouldClearRunNowRequest } from "../../src/features/videos/services/background-job-outcome";

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

console.log("Background job outcome policy passed: partial video failures do not suppress eligible social publishing.");


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
assert.match(backgroundRunnerSource, /select=key,value,updated_at/, "Run Now consumption must read the row version");
assert.match(backgroundRunnerSource, /updated_at=eq\.\$\{encodeURIComponent\(row\.updated_at\)\}/, "Run Now deletion must compare-and-set the exact row version");
assert.match(backgroundRunnerSource, /isSameRunNowRequest\(parsed, request\)/, "Run Now deletion must match the exact request identity");
assert.match(backgroundRunnerSource, /import \{[^}]*isSameRunNowRequest[^}]*\} from "\.\.\/src\/features\/videos\/services\/background-job-outcome"/, "the Run Now identity guard must be imported from the shared policy");
const adminSystemActionsSource = readFileSync(resolve(process.cwd(), "src/app/admin/system-actions.ts"), "utf8");
assert.match(adminSystemActionsSource, /requestId: randomUUID\(\)/, "each Run Now request must have a unique identity");
