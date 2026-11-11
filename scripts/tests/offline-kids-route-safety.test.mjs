import assert from "node:assert/strict";
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

const blocked = getBlockedKidsRoutes(previousRows, currentRows);
assert.deepEqual(
  [...blocked].sort(),
  [
    "/kids/approval-withdrawn",
    "/kids/removed-approved-story",
    "/kids/removed-game",
    "/kids/removed-quiz",
  ],
);
assert.equal(blocked.has("/kids/current-approved-story"), false);
assert.equal(blocked.has("/kids/current-game"), false);

console.log("Offline Kids route revocation contracts passed.");
