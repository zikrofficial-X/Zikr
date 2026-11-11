import assert from "node:assert/strict";
import { getSafeInternalPath } from "../../src/lib/safe-relative-path";

const origin = "https://zikrmediaofficial.vercel.app";
assert.equal(getSafeInternalPath("/profile?tab=security#password", origin), "/profile?tab=security#password");
assert.equal(getSafeInternalPath("/admin/social", origin), "/admin/social");
assert.equal(getSafeInternalPath("//evil.example/path", origin), "/profile");
assert.equal(getSafeInternalPath("https://evil.example/path", origin), "/profile");
assert.equal(getSafeInternalPath("/\\\\evil.example/path", origin), "/profile", "backslash-prefixed protocol-relative URLs must not escape the app origin");
assert.equal(getSafeInternalPath("/\\evil.example/path", origin), "/profile", "a single backslash after the leading slash must not bypass the same-origin check");
assert.equal(getSafeInternalPath("javascript:alert(1)", origin), "/profile");
assert.equal(getSafeInternalPath(null, origin), "/profile");
console.log("Auth safe-next-path contract passed.");
