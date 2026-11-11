import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getBlockedKidsRoutes } from "../lib/offline-kids-route-safety.mjs";

const previousRows = [
  { type: "story", slug: "removed-approved-story", metadata: { age_appropriate: true } },
  { type: "story", slug: "approval-withdrawn", metadata: { age_appropriate: true } },
  { type: "game", slug: "removed-game", metadata: {} },
  { type: "quiz", slug: "removed-quiz", metadata: {} },
];
const currentRows = [
  { type: "story", slug: "current-approved-story", metadata: { age_appropriate: true } },
  { type: "story", slug: "approval-withdrawn", metadata: { age_appropriate: false } },
  { type: "game", slug: "current-game", metadata: {} },
];

const blocked = getBlockedKidsRoutes(previousRows, currentRows, [
  "/kids/removed-approved-story",
  "/kids/approval-withdrawn",
  "/kids/removed-game",
  "/kids/removed-quiz",
  "/kids/kids-truth",
  "/kids/kids-amanah",
  "/kids/kids-prayer",
  "/kids/current-approved-story",
  "/kids/current-game",
]);
assert.deepEqual(
  [...blocked].sort(),
  [
    "/kids/approval-withdrawn",
    "/kids/kids-amanah",
    "/kids/kids-prayer",
    "/kids/kids-truth",
    "/kids/removed-approved-story",
    "/kids/removed-game",
    "/kids/removed-quiz",
  ],
);
assert.equal(blocked.has("/kids/current-approved-story"), false);
assert.equal(blocked.has("/kids/current-game"), false);
const exporter = readFileSync("scripts/export-offline-content.mjs", "utf8");
assert.match(exporter, /getBlockedKidsRoutes\(previousKidsRows, rows, previous\.routes\)/);
assert.match(exporter, /blockedKidsRoutes\.has\(route\)/);
assert.match(exporter, /const stamp = generatedAt\.replace/);
assert.match(exporter, /version: `\$\{stamp\.slice\(0, 8\)\}-\$\{stamp\}`/);

const exportOrders = [...exporter.matchAll(/'order=([^']+)'/g)].map(match => match[1]);
assert.ok(exportOrders.length >= 20, "offline exporter must retain the complete dataset inventory");
for (const order of exportOrders) {
  assert.match(order, /(?:^|,)id\.asc$/, `offline pagination order must have a unique ID tie-breaker: ${order}`);
}



console.log("Offline Kids route revocation contracts passed.");
