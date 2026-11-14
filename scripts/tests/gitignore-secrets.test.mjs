import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const privateEnvironmentFiles = [
  ".env",
  ".env.local",
  ".env.development",
  ".env.production",
  ".env.test",
  ".env.development.local",
  ".env.production.local",
  ".env.test.local",
  ".envrc",
  "android/.env.production",
];

for (const file of privateEnvironmentFiles) {
  const result = spawnSync("git", ["check-ignore", "--no-index", "--quiet", file], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, `${file} must be ignored to prevent accidental secret commits`);
}

const template = spawnSync("git", ["check-ignore", "--no-index", "--quiet", ".env.example"], {
  encoding: "utf8",
});
assert.equal(template.status, 1, ".env.example must remain available as the committed template");

console.log("Environment secret ignore contracts passed.");
