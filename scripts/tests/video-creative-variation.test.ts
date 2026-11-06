import assert from "node:assert/strict";
import {
  resolveDeterministicVideoHook,
  resolveDeterministicVideoMotion,
  resolveDeterministicVideoScene,
} from "../../src/features/videos/services/video-creative-variation";

const ids = Array.from({ length: 30 }, (_, index) => `zikr-video-${index}`);
const categories = ["quran", "hadith", "dua", "adhkar", "story", "other"];

for (const category of categories) {
  const scenes = new Set(ids.map((id) => resolveDeterministicVideoScene({ id, category })));
  const hooks = new Set(ids.map((id) => resolveDeterministicVideoHook({ id, category })));
  assert.ok(scenes.size >= 3, `Expected visual variety for ${category}; got ${scenes.size} scene(s).`);
  assert.ok(hooks.size >= 3, `Expected opening-hook variety for ${category}; got ${hooks.size} hook(s).`);
}

const stableInput = { id: "same-video-id", category: "dua" };
assert.equal(
  resolveDeterministicVideoScene(stableInput),
  resolveDeterministicVideoScene(stableInput),
  "Scene selection must stay stable across retries.",
);
assert.equal(
  resolveDeterministicVideoHook(stableInput),
  resolveDeterministicVideoHook(stableInput),
  "Hook selection must stay stable across retries.",
);
assert.ok(["fade", "slow"].includes(resolveDeterministicVideoMotion(stableInput.id)));
assert.equal(
  ["emerald", "dawn", "gold", "calm"].includes(resolveDeterministicVideoScene({ id: "kids-1", category: "story", audience: "kids" })),
  true,
);
assert.ok(
  new Set(ids.map((id) => resolveDeterministicVideoHook({ id, category: "story", audience: "kids" }))).size >= 3,
  "Kids stories should also have varied opening hooks.",
);

console.log("Video creative variation tests passed.");
