import assert from "node:assert/strict";
import { getVideoEngineConfig, parseCustomVideoSpaces } from "../../src/features/videos/providers/types";

const entries = parseCustomVideoSpaces(JSON.stringify([
  { space: "example/wan-free", variant: "wan2_2_fast", enabled: true },
  { space: "example/ltx-free", variant: "ltx_fast", enabled: true },
  { space: "not valid", variant: "wan2_2_fast", enabled: true },
  { space: "example/disabled", variant: "ltx_fast", enabled: false },
  { space: "example/unknown", variant: "other", enabled: true },
]));
assert.equal(entries.length, 2);
assert.equal(entries[0].name, "hf_custom_1");
assert.equal(entries[1].variant, "ltx_fast");
assert.equal(parseCustomVideoSpaces("not-json").length, 0);
assert.equal(parseCustomVideoSpaces(JSON.stringify(Array.from({ length: 8 }, (_, index) => ({
  space: "owner/space-" + index,
  variant: "wan2_2_fast",
  enabled: true,
})))).length, 5);

const config = getVideoEngineConfig({ ...process.env,
  VIDEO_FREE_ONLY: "true",
  HF_VIDEO_CUSTOM_SPACES: JSON.stringify([{ space: "example/wan-free", variant: "wan2_2_fast", enabled: true }]),
});
assert.ok(config.order.includes("hf_custom_1"));
assert.deepEqual(config.customSpaces.map((entry) => entry.name), ["hf_custom_1"]);
const missingConfig = getVideoEngineConfig({ ...process.env, ...process.env, VIDEO_FREE_ONLY: "true", VIDEO_PROVIDER_ORDER: "hf_custom_2,hf_wan" });
assert.ok(!missingConfig.order.includes("hf_custom_2"));
console.log("Custom Hugging Face provider registry tests passed.");
