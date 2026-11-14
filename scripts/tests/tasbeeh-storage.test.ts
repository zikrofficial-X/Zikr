import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  isTasbeehItemArray,
  isTasbeehTabLoaded,
  shouldPersistTasbeehItems,
} from "../../src/features/tasbeeh/services/tasbeeh-storage";
import { DEFAULT_TASBEEH_ITEMS } from "../../src/features/tasbeeh/services/tasbeeh";

assert.equal(isTasbeehTabLoaded("default", null), false);
assert.equal(isTasbeehTabLoaded("morning", "default"), false);
assert.equal(isTasbeehTabLoaded("evening", "evening"), true);

assert.equal(isTasbeehItemArray(DEFAULT_TASBEEH_ITEMS), true, "default counter data must satisfy the saved-data contract");
assert.equal(isTasbeehItemArray([]), true, "an intentionally empty saved list is still a valid array");
assert.equal(isTasbeehItemArray(null), false, "null must not be treated as a counter list");
assert.equal(isTasbeehItemArray({ items: DEFAULT_TASBEEH_ITEMS }), false, "object-shaped JSON must not reach array consumers");
assert.equal(isTasbeehItemArray([null]), false, "null array entries must not reach item renderers");
assert.equal(isTasbeehItemArray([{ ...DEFAULT_TASBEEH_ITEMS[0], count: -1 }]), false, "negative counters must be rejected");
assert.equal(isTasbeehItemArray([{ ...DEFAULT_TASBEEH_ITEMS[0], count: 1.5 }]), false, "fractional counters must be rejected");
assert.equal(isTasbeehItemArray([{ ...DEFAULT_TASBEEH_ITEMS[0], targetCount: 0 }]), false, "non-positive targets must be rejected");
assert.equal(
  isTasbeehItemArray([DEFAULT_TASBEEH_ITEMS[0], { ...DEFAULT_TASBEEH_ITEMS[0] }]),
  false,
  "duplicate IDs must be rejected to avoid ambiguous React keys",
);

assert.equal(shouldPersistTasbeehItems("morning", "evening", true), false, "a previous tab must never be persisted into the selected tab");
assert.equal(shouldPersistTasbeehItems("morning", "morning", false), false, "invalid saved data must remain untouched until a user action");
assert.equal(shouldPersistTasbeehItems("morning", "morning", true), true, "valid or explicitly edited data may be persisted");

const source = readFileSync("src/features/tasbeeh/components/tasbeeh-page.tsx", "utf8");
const loadIndex = source.indexOf("setLoadedTab(tab)");
const validationIndex = source.indexOf("isTasbeehItemArray(parsed)");
const persistenceGuardIndex = source.indexOf("shouldPersistTasbeehItems(tab, loadedTab, persistenceAllowed)");
const saveIndex = source.indexOf("localStorage.setItem(`tasbeeh_${tab}`", persistenceGuardIndex);

assert.ok(
  validationIndex >= 0 && loadIndex > validationIndex && persistenceGuardIndex > loadIndex && saveIndex > persistenceGuardIndex,
  "tab data must be validated and loaded before persistence is allowed",
);
assert.match(source, /setPersistenceAllowed\(allowPersistence\)/, "invalid saved data must disable automatic overwrite");
assert.match(source, /if \(!tabLoaded\) return;/, "counter actions must be ignored while a newly selected tab is loading");
assert.match(source, /disabled=\{!tabLoaded\}/, "counter controls must remain disabled until the selected tab is loaded");

console.log("Tasbeeh saved-data validation, preservation, and load-before-save contracts passed.");
