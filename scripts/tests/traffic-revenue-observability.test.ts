import assert from "node:assert/strict";
import { averageRenderDuration, isCompleteBoundedRead, summarizePlatformResults } from "../../src/features/admin/services/traffic-revenue-metrics";

assert.equal(isCompleteBoundedRead(0, 0, 1000), true);
assert.equal(isCompleteBoundedRead(14, 14, 1000), true);
assert.equal(isCompleteBoundedRead(1000, 1000, 1000), true);
assert.equal(isCompleteBoundedRead(1001, 1000, 1000), false);
assert.equal(isCompleteBoundedRead(1000, 999, 1000), false);
assert.equal(isCompleteBoundedRead(null, 0, 1000), false);

const stats = summarizePlatformResults([
  { metadata: { platformResults: { facebook: { platform: "facebook", ok: true, remoteId: "fb-1" }, youtube: { platform: "youtube", ok: false, error: "quota" } } } },
  { metadata: { platformResults: { facebook: { platform: "facebook", ok: true, remoteId: "fb-2" } } } },
  { metadata: null },
  { metadata: ["not-an-object"] },
  { metadata: { platformResults: "invalid" } },
]);
assert.deepEqual(stats, [
  { platform: "facebook", deliveries: 2, successful: 2, failed: 0, remoteIds: 2 },
  { platform: "youtube", deliveries: 1, successful: 0, failed: 1, remoteIds: 0 },
]);
assert.deepEqual(Object.keys(stats[0]).sort(), ["deliveries", "failed", "platform", "remoteIds", "successful"]);

assert.equal(averageRenderDuration([{ render_duration_ms: 1000 }, { render_duration_ms: 3000 }], 2), 2000);
assert.equal(averageRenderDuration([{ render_duration_ms: 1000 }, { render_duration_ms: null }], 2), null);
assert.equal(averageRenderDuration([{ render_duration_ms: 1000 }], 2), null);
assert.equal(averageRenderDuration([], 0), null);

console.log("✅ Traffic revenue observability unit tests passed.");
