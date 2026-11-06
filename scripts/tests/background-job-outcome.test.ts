import assert from "node:assert/strict";
import { evaluateBackgroundJobOutcome } from "../../src/features/videos/services/background-job-outcome";

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
