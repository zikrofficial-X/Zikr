import assert from "node:assert/strict";
import { resolveSafeOfflineRoute } from "../../src/lib/offline-route-safety";

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
const offlinePackSource = readFileSync(resolve(process.cwd(), "src/lib/offline-pack.ts"), "utf8");
const serviceWorkerSource = readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8");
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
