import assert from "node:assert/strict";
import { averageRenderDuration } from "../../src/features/admin/services/traffic-revenue-metrics";

assert.equal(averageRenderDuration([{ render_duration_ms: 1000 }, { render_duration_ms: 3000 }], 2), 2000);
assert.equal(averageRenderDuration([{ render_duration_ms: 1000 }, { render_duration_ms: null }], 2), null);
assert.equal(averageRenderDuration([{ render_duration_ms: 1000 }], 2), null);
assert.equal(averageRenderDuration([], 0), null);

console.log("✅ Internal video-render observability tests passed.");
