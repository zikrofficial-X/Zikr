import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
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

const workflowDirectory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../.github/workflows",
);
const legacyNode20Actions = [
  "actions/checkout@v4",
  "actions/cache@v4",
  "actions/setup-node@v4",
  "actions/upload-artifact@v4",
  "actions/download-artifact@v4",
  "pnpm/action-setup@v4",
];
for (const filename of readdirSync(workflowDirectory).filter((name) => name.endsWith(".yml") || name.endsWith(".yaml"))) {
  const source = readFileSync(resolve(workflowDirectory, filename), "utf8");
  for (const action of legacyNode20Actions) {
    assert.ok(!source.includes(action), filename + " must not use deprecated " + action);
  }
}

console.log("CI architecture and workflow runtime contract tests passed.");
