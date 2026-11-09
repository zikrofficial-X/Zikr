import assert from "node:assert/strict";
import { evaluateBackgroundJobOutcome, shouldClearRunNowRequest } from "../../src/features/videos/services/background-job-outcome";

assert.deepEqual(evaluateBackgroundJobOutcome({
  videoSucceeded: 10,
  videoFailed: 0,
  sitePublishingFailed: false,
}), {
  hasPartialVideoFailures: false,
  shouldFailRun: false,
  fatalFailureCount: 0,
});

assert.deepEqual(evaluateBackgroundJobOutcome({
  videoSucceeded: 9,
  videoFailed: 1,
  sitePublishingFailed: false,
}), {
  hasPartialVideoFailures: true,
  shouldFailRun: false,
  fatalFailureCount: 0,
});

assert.deepEqual(evaluateBackgroundJobOutcome({
  videoSucceeded: 0,
  videoFailed: 10,
  sitePublishingFailed: false,
}), {
  hasPartialVideoFailures: false,
  shouldFailRun: true,
  fatalFailureCount: 10,
});

assert.equal(evaluateBackgroundJobOutcome({
  videoSucceeded: 9,
  videoFailed: 1,
  sitePublishingFailed: true,
}).shouldFailRun, true, "an internal site-publishing failure must remain fatal");

console.log("Background job outcome policy passed: partial video failures do not suppress successful internal site publishing.");


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
