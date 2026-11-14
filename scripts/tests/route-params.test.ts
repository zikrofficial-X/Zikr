import assert from "node:assert/strict";
import { parsePositiveIntegerRouteSegment } from "../../src/lib/route-params";

assert.equal(parsePositiveIntegerRouteSegment("1"), 1);
assert.equal(parsePositiveIntegerRouteSegment("114"), 114);
assert.equal(parsePositiveIntegerRouteSegment("6236"), 6236);

for (const invalid of [
  "",
  "0",
  "01",
  "+1",
  "-1",
  "1.0",
  "1e2",
  "0x10",
  " 1",
  "1 ",
  "1abc",
  "9007199254740992",
  null,
  1,
]) {
  assert.equal(
    parsePositiveIntegerRouteSegment(invalid),
    null,
    `non-canonical route segment ${String(invalid)} must be rejected`,
  );
}

console.log("Canonical positive-integer route parameter validation passed.");
