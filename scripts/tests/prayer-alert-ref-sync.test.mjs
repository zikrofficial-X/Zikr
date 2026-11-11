import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const hook = readFileSync("src/features/prayer/hooks/use-prayer-alert.ts", "utf8");
const refSync = /useEffect\(\(\) => \{\s*settingsRef\.current = settings;\s*\}, \[settings\]\);/;
assert.match(
  hook,
  refSync,
  "the latest prayer settings ref must be synchronized in an effect, not during render",
);
assert.doesNotMatch(
  hook,
  /^\s*settingsRef\.current\s*=\s*settings\s*;\s*$/m,
  "render must not write settingsRef.current",
);
const refSyncIndex = hook.search(refSync);
const eventHandlerIndex = hook.indexOf("const syncPushContext = () =>");
assert.ok(
  refSyncIndex >= 0 && eventHandlerIndex > refSyncIndex,
  "the ref synchronization effect must be declared before the listener effect that reads it",
);
assert.match(
  hook,
  /syncExistingServerPush\(settingsRef\.current\.enabledPrayers\)/,
  "location/native resume events must use the latest enabled-prayer preferences",
);

console.log("Prayer alert settings-ref synchronization contract passed.");
