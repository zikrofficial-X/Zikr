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
const serviceWorker = readFileSync("public/sw.js", "utf8");
const offlinePack = readFileSync("src/lib/offline-pack.ts", "utf8");
assert.ok(offlinePack.includes("resolveSafeOfflineRoute(route, origin)"), "client offline route filtering must use the same-origin validator");
assert.ok(serviceWorker.includes('route.includes("\\\\")'), "service worker must reject raw backslashes before URL normalization");
assert.ok(serviceWorker.includes("/%(?:2f|5c)/i.test(route)"), "service worker must reject encoded slash and backslash route separators");

assert.match(
  offlinePack,
  /fetch\(definition\.path,\s*\{\s*cache:\s*"no-store"/,
  "dataset refreshes must bypass the browser HTTP cache when the manifest version changes",
);
const offlineContentStart = serviceWorker.indexOf('if (url.pathname.startsWith(OFFLINE_CONTENT_PREFIX))');
const offlineContentEnd = serviceWorker.indexOf('if (url.pathname === "/api/prayer-times")', offlineContentStart);
assert.ok(offlineContentStart >= 0 && offlineContentEnd > offlineContentStart, "service worker must define an offline-content handler");
const offlineContentHandler = serviceWorker.slice(offlineContentStart, offlineContentEnd);
assert.ok(
  offlineContentHandler.indexOf('fetch(new Request(request, { cache: "no-store" }))') <
    offlineContentHandler.indexOf("caches.match(request)"),
  "offline datasets must refresh from the network before falling back to Cache Storage",
);
assert.match(offlineContentHandler, /cache\.put\(request, copy\)/);
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
