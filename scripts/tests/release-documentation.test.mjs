import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const version = String(pkg.version);
const readme = readFileSync("README.md", "utf8");
const status = readFileSync("RELEASE_STATUS.md", "utf8");
const gradle = readFileSync("android/app/build.gradle", "utf8");
const releaseTag = readFileSync(".release-tag", "utf8").trim();

const candidateNotesPath = "docs/releases/" + version + ".md";
assert.ok(
  existsSync(candidateNotesPath),
  "release notes must exist for package.json version " + version,
);

const candidateNotes = readFileSync(candidateNotesPath, "utf8");
const candidateVersionCodeMatch = candidateNotes.match(/Android versionCode:\s*`(\d+)`/);
const candidateVersionMatch = candidateNotes.match(/Android version:\s*`([^ `]+)`/);
const gradleVersionMatch = gradle.match(/versionName\s+"([^"]+)"/);
const gradleVersionCodeMatch = gradle.match(/versionCode\s+(\d+)/);

assert.ok(candidateVersionCodeMatch, "release candidate notes must declare Android versionCode");
assert.ok(candidateVersionMatch, "release candidate notes must declare Android version");
assert.equal(candidateVersionMatch[1], version, "candidate release notes must match package.json");
assert.equal(gradleVersionMatch?.[1], version, "Android versionName must match package.json");
assert.equal(
  gradleVersionCodeMatch?.[1],
  candidateVersionCodeMatch[1],
  "Android versionCode must match candidate release notes",
);
assert.equal(releaseTag, "v" + version, ".release-tag must match the release candidate version");

// README and RELEASE_STATUS describe the latest published stable release, not
// the candidate currently being prepared. A draft tag must never be presented
// as a published/downloadable release before signed assets are verified.
const publishedReleaseMatch = readme.match(
  /Current published Android release:\s*\[`v([^\`]+)`\]\(([^)]+)\)/,
);
assert.ok(
  publishedReleaseMatch,
  "README must identify the latest published immutable Android release",
);
const publishedVersion = publishedReleaseMatch[1];
const publishedReleaseUrl = publishedReleaseMatch[2];
const latestAndroidSection = status.slice(
  status.indexOf("## Latest published stable Android release"),
  status.indexOf("## Git tag signature and immutable release attestation"),
);
assert.ok(latestAndroidSection.length > 0, "RELEASE_STATUS must contain the latest published Android release section");

const statusVersionMatch = latestAndroidSection.match(/\| Android version \|\s*([^|\s]+)\s*\|/);
const statusVersionCodeMatch = latestAndroidSection.match(/\| Android versionCode \|\s*(\d+)\s*\|/);
const statusTagMatch = latestAndroidSection.match(/\| Release tag \|\s*(https?:\/\/[^|\s]+)\s*\|/);

assert.ok(statusVersionMatch, "RELEASE_STATUS must declare the latest published Android version");
assert.ok(statusVersionCodeMatch, "RELEASE_STATUS must declare the latest published Android versionCode");
assert.ok(statusTagMatch, "RELEASE_STATUS must declare the latest published Android tag URL");
assert.equal(publishedVersion, statusVersionMatch[1], "README and RELEASE_STATUS published versions must match");
assert.equal(
  publishedReleaseUrl,
  "https://github.com/zikrofficial-X/Zikr/releases/tag/v" + publishedVersion,
  "README must link to the canonical published release",
);
assert.equal(
  statusTagMatch[1],
  "https://github.com/zikrofficial-X/Zikr/releases/tag/v" + publishedVersion,
  "RELEASE_STATUS tag must match the published release version",
);
assert.ok(
  readme.includes("Android versionCode: `" + statusVersionCodeMatch[1] + "`"),
  "README Android versionCode must match the latest published stable release",
);
assert.ok(
  readme.includes("docs/releases/" + publishedVersion + ".md"),
  "README must link to the latest published release evidence",
);
assert.ok(
  existsSync("docs/releases/" + publishedVersion + ".md"),
  "release evidence must exist for the latest published stable Android release",
);

const publishedNotes = readFileSync("docs/releases/" + publishedVersion + ".md", "utf8");
assert.ok(
  publishedNotes.includes("Android versionCode: `" + statusVersionCodeMatch[1] + "`"),
  "published release notes Android versionCode must match RELEASE_STATUS",
);

console.log(
  "Release documentation contract passed: candidate v" +
    version +
    " (versionCode " +
    candidateVersionCodeMatch[1] +
    "), latest published v" +
    publishedVersion +
    " (versionCode " +
    statusVersionCodeMatch[1] +
    ").",
);
