import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const legacyRoute = read("src/app/api/kids/games/submit-result/route.ts");
const scoreRoute = read("src/app/api/kids/games/score/route.ts");
const boundedReader = read("src/lib/request/bounded-json-body.ts");

const legacyAuthCheck = legacyRoute.indexOf("if (error || !user)");
const legacyBodyRead = legacyRoute.indexOf("readBoundedJsonBody(request, MAX_REQUEST_BODY_BYTES)");
const legacyResultWrite = legacyRoute.indexOf("recordKidsGameResultForUser(user.id, normalized)");
assert.ok(legacyAuthCheck >= 0, "legacy endpoint must authenticate before reading the payload");
assert.ok(legacyBodyRead > legacyAuthCheck, "legacy endpoint must authenticate before bounded body reading");
assert.ok(legacyResultWrite > legacyBodyRead, "legacy endpoint must parse the bounded body before recording a result");
assert.doesNotMatch(legacyRoute, /request\.(?:text|json|arrayBuffer)\s*\(/, "legacy endpoint must not buffer an unbounded request body");

const scoreAuthCheck = scoreRoute.indexOf("if (unavailable) return unavailable");
const scoreBodyRead = scoreRoute.indexOf("readBoundedJsonBody(request, MAX_REQUEST_BODY_BYTES)");
const scoreResultWrite = scoreRoute.indexOf("recordCurrentKidsGameResult(body)");
assert.ok(scoreAuthCheck >= 0, "current endpoint must retain its Supabase auth guard");
assert.ok(scoreBodyRead > scoreAuthCheck, "current endpoint must authenticate before bounded body reading");
assert.ok(scoreResultWrite > scoreBodyRead, "current endpoint must parse the bounded body before recording a result");
assert.doesNotMatch(scoreRoute, /request\.(?:text|json|arrayBuffer)\s*\(/, "current endpoint must not buffer an unbounded request body");

assert.match(boundedReader, /request\.body\.getReader\(\)/, "the parser must consume the request as a stream");
assert.match(boundedReader, /totalBytes \+= value\.byteLength/, "the parser must count actual streamed bytes");
assert.ok(
  boundedReader.indexOf("totalBytes > maxBytes") < boundedReader.indexOf("JSON.parse(decoded)"),
  "the stream byte limit must be enforced before JSON parsing",
);
assert.match(boundedReader, /reader\.cancel\(\)/, "oversized streams must be cancelled immediately");
assert.match(boundedReader, /new TextDecoder\("utf-8", \{ fatal: true \}\)/, "invalid UTF-8 must be rejected");

assert.ok(legacyRoute.includes('Sunset: "2026-12-01"'), "the legacy route must retain its announced sunset");
assert.ok(
  legacyRoute.includes('Link: \'</api/kids/games/score>; rel="successor-version"\''),
  "the legacy route must keep advertising its successor",
);
assert.ok(legacyRoute.includes("status: 413"), "oversized legacy submissions must return HTTP 413");
assert.ok(legacyRoute.includes("status: 400"), "malformed legacy JSON must return HTTP 400");

console.log("Kids game result endpoints enforce streaming body limits.");
