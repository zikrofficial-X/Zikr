import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const version = String(pkg.version);
const readme = readFileSync("README.md", "utf8");
const status = readFileSync("RELEASE_STATUS.md", "utf8");
const notesPath = "docs/releases/" + version + ".md";

assert.ok(existsSync(notesPath), "release notes must exist for package.json version " + version);
const notes = readFileSync(notesPath, "utf8");
const versionCodeMatch = notes.match(/Android versionCode:\s*`(\d+)`/);
assert.ok(versionCodeMatch, "release notes must declare Android versionCode");
const versionCode = versionCodeMatch[1];

assert.ok(readme.includes("Current published Android release: [`v" + version + "`]"), "README must point to the current immutable Android release");
assert.ok(readme.includes("Android versionCode: `" + versionCode + "`"), "README Android versionCode must match release notes");
assert.ok(readme.includes("docs/releases/" + version + ".md"), "README must link to the current release evidence");

const latestAndroidSection = status.slice(
  status.indexOf("## Latest published stable Android release"),
  status.indexOf("## Git tag signature and immutable release attestation"),
);
assert.ok(latestAndroidSection.includes("| Android version | " + version + " |"), "RELEASE_STATUS Android version must match package.json");
assert.ok(latestAndroidSection.includes("| Android versionCode | " + versionCode + " |"), "RELEASE_STATUS versionCode must match release notes");
assert.ok(latestAndroidSection.includes("/releases/tag/v" + version), "RELEASE_STATUS tag must match package.json");

console.log("Release documentation contract passed for v" + version + " (versionCode " + versionCode + ").");
