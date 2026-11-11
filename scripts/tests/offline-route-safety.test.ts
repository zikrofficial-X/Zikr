import assert from "node:assert/strict";
import { filterOfflineSupplementalKidsRoutes, getPublishedKidsOfflineRoutes, resolveSafeOfflineRoute } from "../../src/lib/offline-route-safety";

const origin = "https://zikrmediaofficial.vercel.app";
assert.equal(resolveSafeOfflineRoute("/kids/story-ibrahim", origin)?.origin, origin);
assert.equal(resolveSafeOfflineRoute("/", origin)?.pathname, "/");
for (const route of [
  "//evil.example/path",
  "/\\\\evil.example/path",
  "/%5c%5cevil.example/path",
  "/%2f%2fevil.example/path",
  "/kids/story?token=secret",
  "/kids/story#fragment",
  "https://evil.example/path",
]) {
  assert.equal(resolveSafeOfflineRoute(route, origin), null, `unsafe offline route must be rejected: ${route}`);
}
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const publishedKidsRoutes = getPublishedKidsOfflineRoutes([
  { slug: "approved-story", type: "story", metadata: { age_appropriate: true } },
  { slug: "unapproved-story", type: "story", metadata: { age_appropriate: false } },
  { slug: "legacy-story", content_type: "story", metadata: {} },
  { slug: "public-game", type: "game", metadata: {} },
  { slug: "../unsafe", type: "game", metadata: {} },
  { slug: "unsupported", type: "unknown", metadata: {} },
]);
assert.deepEqual(publishedKidsRoutes, ["/kids/approved-story", "/kids/public-game"],
  "offline route inventory must include all current safe Kids rows and only explicitly approved stories");
assert.deepEqual(
  filterOfflineSupplementalKidsRoutes([
    "/kids/story-old-unpublished",
    "/kids/zikr-kids-old-unpublished",
    "/kids/story-approved",
    "/kids/game-memory",
    "/articles/old-article",
  ], publishedKidsRoutes),
  ["/kids/story-approved", "/kids/game-memory", "/articles/old-article"],
  "supplemental offline routes must not reintroduce stale Kids story pages while preserving static games and other route families",
);

const offlinePackSource = readFileSync(resolve(process.cwd(), "src/lib/offline-pack.ts"), "utf8");
const serviceWorkerSource = readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8");
assert.match(offlinePackSource, /getPublishedKidsOfflineRoutes\(refreshedKidsRows\)/, "route pruning must include current Kids dataset slugs, even when the static manifest is stale");
assert.match(offlinePackSource, /filterOfflineSupplementalKidsRoutes\(manifest\.routes \?\? \[\], currentKidsRoutes\)/, "stale Kids story routes in the manifest must also be removed from the keep set");
assert.match(offlinePackSource, /filterOfflineSupplementalKidsRoutes\(supplementalRouteInventory, refreshedKidsRoutes\)/, "static supplemental routes must not reintroduce revoked Kids stories");
assert.match(offlinePackSource, /requestOfflineRoutePrune\(routeInventory\)/,
  "a successful offline refresh must reconcile cached routes against the current public inventory");
assert.match(serviceWorkerSource, /event\.data\.type === "PRUNE_OFFLINE_ROUTES"/,
  "the service worker must expose the stale-route pruning message");
assert.match(serviceWorkerSource, /request\.headers\.get\("accept"\)\?\.includes\("text\/html"\)/,
  "route pruning must only remove cached HTML, never datasets or static assets");
assert.match(serviceWorkerSource, /url\.origin !== self\.location\.origin/,
  "route pruning must remain restricted to same-origin cache entries");
assert.match(serviceWorkerSource, /cache\.delete\(request\)/,
  "stale HTML route entries must be removed from Cache Storage");

console.log("Offline route same-origin safety tests passed.");
