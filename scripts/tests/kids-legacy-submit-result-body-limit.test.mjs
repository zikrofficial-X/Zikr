import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route = readFileSync("src/app/api/kids/games/submit-result/route.ts", "utf8");
const authCheck = route.indexOf("if (error || !user)");
const declaredLengthCheck = route.indexOf('request.headers.get("content-length")');
const bodyRead = route.indexOf("await request.text()");
const byteLengthCheck = route.indexOf("new TextEncoder().encode(rawBody).byteLength > 16_384");
const parse = route.indexOf("JSON.parse(rawBody)");

assert.ok(authCheck >= 0, "legacy endpoint must authenticate before reading the payload");
assert.ok(declaredLengthCheck > authCheck, "declared body size must be checked only after bearer-token validation");
assert.ok(bodyRead > declaredLengthCheck, "declared Content-Length must be checked before reading the body");
assert.ok(byteLengthCheck > bodyRead, "actual UTF-8 byte length must be checked after reading");
assert.ok(parse > byteLengthCheck, "JSON parsing must happen only after the actual body-size check");
assert.ok(route.includes("status: 413"), "oversized legacy submissions must return HTTP 413");
assert.ok(route.includes("status: 400"), "malformed legacy JSON must return HTTP 400 rather than HTTP 500");
assert.ok(route.includes('Sunset: "2026-12-01"'), "the legacy route must retain its announced sunset");
assert.ok(route.includes('Link: \'</api/kids/games/score>; rel="successor-version"\''), "the legacy route must keep advertising its successor");

console.log("Deprecated Kids result endpoint body-limit contract passed.");
