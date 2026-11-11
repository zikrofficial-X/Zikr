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
console.log("Offline route same-origin safety tests passed.");
