import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getFacebookProfileSyncFailureCount } from "../../src/features/social/services/social-insights-sync-status";

assert.equal(
  getFacebookProfileSyncFailureCount({ configured: false, stale: true, lookupFailed: false }),
  0,
  "an intentionally unconfigured Facebook Page must not fail the insights job",
);
assert.equal(
  getFacebookProfileSyncFailureCount({ configured: true, stale: false, lookupFailed: false }),
  0,
  "a fresh configured Facebook profile must pass",
);
assert.equal(
  getFacebookProfileSyncFailureCount({ configured: true, stale: true, lookupFailed: false }),
  1,
  "a configured but stale Facebook profile must count as a failed sync",
);
assert.equal(
  getFacebookProfileSyncFailureCount({ configured: false, stale: true, lookupFailed: true }),
  1,
  "a credential/profile lookup exception must count as a failure even when no profile object was returned",
);

const worker = readFileSync("scripts/jobs/social-publishing.ts", "utf8");
assert.match(worker, /facebookProfileLookupFailed\s*=\s*true/, "the worker must preserve the lookup exception outcome");
assert.match(worker, /getFacebookProfileSyncFailureCount\(/, "the worker must include lookup failures in its reported result");

console.log("Facebook profile sync failure accounting contracts passed.");
