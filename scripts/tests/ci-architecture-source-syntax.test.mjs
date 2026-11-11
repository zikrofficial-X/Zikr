import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../verify-ci-architecture.mjs",
);
const result = spawnSync(process.execPath, ["--check", scriptPath], {
  encoding: "utf8",
});

assert.equal(
  result.status,
  0,
  [result.stdout, result.stderr].filter(Boolean).join("\n") ||
    "CI architecture verifier must parse successfully",
);
console.log("CI architecture verifier syntax regression test passed.");
