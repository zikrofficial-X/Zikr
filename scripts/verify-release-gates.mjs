#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { hasCurrentCodeOwnerApproval } from "./lib/release-gate-approval.mjs";

const repository = process.env.GITHUB_REPOSITORY?.trim();
const commitSha = process.env.GITHUB_SHA?.trim();
const token = process.env.GITHUB_TOKEN?.trim();

if (!repository || !commitSha || !token) {
  throw new Error("GITHUB_REPOSITORY, GITHUB_SHA, and GITHUB_TOKEN are required.");
}

const apiHeaders = {
  Accept: "application/vnd.github+json",
  Authorization: "Bearer " + token,
  "X-GitHub-Api-Version": "2022-11-28",
};

async function api(path) {
  const response = await fetch("https://api.github.com" + path, {
    headers: apiHeaders,
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error("GitHub API " + path + " returned HTTP " + response.status + ": " + body.replace(/\s+/g, " ").slice(0, 300));
  }
  return body ? JSON.parse(body) : {};
}

async function allPages(path) {
  const results = [];
  for (let page = 1; page <= 10; page += 1) {
    const separator = path.includes("?") ? "&" : "?";
    const pageItems = await api(path + separator + "per_page=100&page=" + page);
    if (!Array.isArray(pageItems)) throw new Error("Expected an array from " + path);
    results.push(...pageItems);
    if (pageItems.length < 100) return results;
  }
  throw new Error("Pagination limit exceeded while reading " + path);
}

function latestStatusesByContext(statuses) {
  const latest = new Map();
  for (const status of statuses) {
    const previous = latest.get(status.context);
    const currentTime = Date.parse(status.updated_at || status.created_at || "1970-01-01T00:00:00Z");
    const previousTime = previous
      ? Date.parse(previous.updated_at || previous.created_at || "1970-01-01T00:00:00Z")
      : -1;
    if (!previous || currentTime >= previousTime) latest.set(status.context, status);
  }
  return latest;
}

async function requireSuccessfulCheckRuns(sha, requiredNames, label) {
  const payload = await api("/repos/" + repository + "/commits/" + sha + "/check-runs?per_page=100");
  const runs = payload.check_runs || [];
  for (const name of requiredNames) {
    const matches = runs
      .filter((run) => run.name === name)
      .sort((left, right) => Date.parse(left.started_at || 0) - Date.parse(right.started_at || 0));
    const latest = matches.at(-1);
    if (!latest || latest.status !== "completed" || latest.conclusion !== "success") {
      throw new Error(label + ': required check "' + name + '" is missing, pending, or not successful on ' + sha.slice(0, 12) + ".");
    }
  }
}

async function requireCircleCiStatuses(sha, label, requireVercel) {
  const payload = await api("/repos/" + repository + "/commits/" + sha + "/status");
  const statuses = latestStatusesByContext(payload.statuses || []);
  const required = [
    "ci/circleci: config-guard",
    "ci/circleci: application-build-docs",
    "ci/circleci: source-verify",
  ];
  if (requireVercel) required.push("Vercel");

  for (const context of required) {
    const status = statuses.get(context);
    if (!status || status.state !== "success") {
      throw new Error(label + ': required status "' + context + '" is missing, pending, or ' + (status?.state || "absent") + " on " + sha.slice(0, 12) + ".");
    }
  }

  const failures = [...statuses.values()].filter(
    (status) => status.context.startsWith("ci/circleci:") && status.state !== "success",
  );
  if (failures.length) {
    throw new Error(label + ": non-success CircleCI contexts: " + failures.map((status) => status.context + "=" + status.state).join(", "));
  }
}

const pullRequests = await allPages("/repos/" + repository + "/commits/" + commitSha + "/pulls");
const pullRequest = pullRequests.find(
  (candidate) =>
    candidate.base?.ref === "main" &&
    candidate.merged_at &&
    candidate.merge_commit_sha === commitSha,
);
if (!pullRequest) {
  throw new Error("The release commit must be the merge commit of a merged pull request targeting main; direct pushes are not accepted.");
}

const codeownersSource = readFileSync(".github/CODEOWNERS", "utf8");
const globalOwnerLine = codeownersSource
  .split(/\r?\n/)
  .map((line) => line.split("#", 1)[0].trim())
  .filter(Boolean)
  .map((line) => line.split(/\s+/))
  .filter((tokens) => tokens[0] === "*")
  .at(-1);

if (!globalOwnerLine || globalOwnerLine.length < 2) {
  throw new Error("A global CODEOWNERS rule with at least one owner is required for release.");
}
const owners = globalOwnerLine.slice(1).map((owner) => owner.replace(/^@/, ""));
if (owners.some((owner) => owner.includes("/"))) {
  throw new Error("Team CODEOWNERS entries require an owner/admin review check not supported by this preflight.");
}

const reviews = await allPages("/repos/" + repository + "/pulls/" + pullRequest.number + "/reviews");
const approvedOwner = owners.find((owner) =>
  hasCurrentCodeOwnerApproval(reviews, owner, pullRequest.head.sha),
);
if (!approvedOwner) {
  throw new Error(
    "At least one global CODEOWNER must approve the current PR head " +
      pullRequest.head.sha.slice(0, 12) +
      " on PR #" +
      pullRequest.number +
      ".",
  );
}

await requireSuccessfulCheckRuns(
  pullRequest.head.sha,
  ["ZIKR / Quality Gate", "Build Android Debug APK", "Validate CircleCI configuration"],
  "PR #" + pullRequest.number + " head checks",
);
await requireCircleCiStatuses(pullRequest.head.sha, "PR #" + pullRequest.number + " head statuses", false);
await requireSuccessfulCheckRuns(commitSha, ["ZIKR / Quality Gate"], "Merged commit checks");
await requireCircleCiStatuses(commitSha, "Merged commit statuses", true);

console.log(
  "RELEASE_PREFLIGHT_PASSED: commit=" + commitSha + "; PR=#" + pullRequest.number +
  "; head=" + pullRequest.head.sha + "; CODEOWNERS=" + owners.join(",") + "; checks=success.",
);
