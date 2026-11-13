import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isTasbeehTabLoaded } from "../../src/features/tasbeeh/services/tasbeeh-storage";

assert.equal(isTasbeehTabLoaded("default", null), false);
assert.equal(isTasbeehTabLoaded("morning", "default"), false);
assert.equal(isTasbeehTabLoaded("evening", "evening"), true);

const source = readFileSync("src/features/tasbeeh/components/tasbeeh-page.tsx", "utf8");
const loadIndex = source.indexOf("setLoadedTab(tab)");
const guardIndex = source.indexOf("if (!isTasbeehTabLoaded(tab, loadedTab)) return;");
const saveIndex = source.indexOf("localStorage.setItem(`tasbeeh_${tab}`", guardIndex);

assert.ok(
  loadIndex >= 0 && guardIndex > loadIndex && saveIndex > guardIndex,
  "tab persistence must wait until the selected tab has finished loading",
);

console.log("Tasbeeh tab persistence load-before-save contract passed.");
