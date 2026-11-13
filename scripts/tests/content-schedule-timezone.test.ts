import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  formatLocalDateTimeInputValue,
  getLocalDateTimeOffsetMinutes,
  localDateTimeToUtcIso,
  parseExplicitScheduledAt,
} from "../../src/features/admin/services/content-schedule";

assert.equal(
  localDateTimeToUtcIso("2026-11-13T14:00", -120),
  "2026-11-13T12:00:00.000Z",
  "a Cairo local time must be converted to its UTC instant, not treated as UTC",
);
const originalTimezone = process.env.TZ;
process.env.TZ = "America/New_York";
assert.equal(
  getLocalDateTimeOffsetMinutes("2026-03-08T02:30"),
  null,
  "a wall-clock time skipped by the DST spring-forward transition must be rejected",
);
const validAfterDstGapOffset = getLocalDateTimeOffsetMinutes("2026-03-08T03:30");
assert.equal(validAfterDstGapOffset, 240);
assert.equal(
  localDateTimeToUtcIso("2026-03-08T03:30", validAfterDstGapOffset ?? 0),
  "2026-03-08T07:30:00.000Z",
  "a valid local time after the DST gap must retain its intended wall-clock value",
);
if (originalTimezone === undefined) delete process.env.TZ;
else process.env.TZ = originalTimezone;

assert.equal(
  localDateTimeToUtcIso("2026-07-13T14:00", -180),
  "2026-07-13T11:00:00.000Z",
  "the offset supplied for the selected date must preserve daylight-saving time",
);
assert.equal(
  formatLocalDateTimeInputValue(new Date("2026-11-13T12:00:00.000Z"), -120),
  "2026-11-13T14:00",
  "datetime-local min values must be rendered in the browser's local wall clock",
);
assert.equal(localDateTimeToUtcIso("2026-02-30T14:00", -120), null);
assert.equal(localDateTimeToUtcIso("2026-11-13T14:00", Number.NaN), null);
assert.equal(localDateTimeToUtcIso("2026-11-13T14:00", 900), null);
assert.equal(parseExplicitScheduledAt("2026-11-13T14:00"), null,
  "the server must reject timezone-less datetime-local strings");
assert.equal(parseExplicitScheduledAt("2026-11-13T12:00:00.000Z")?.toISOString(), "2026-11-13T12:00:00.000Z");
assert.equal(parseExplicitScheduledAt("2026-11-13T14:00:00+02:00")?.toISOString(), "2026-11-13T12:00:00.000Z");
assert.equal(parseExplicitScheduledAt("2026-11-13T14:00:00+15:00"), null);
assert.equal(parseExplicitScheduledAt("2026-02-30T14:00:00Z"), null);

const consoleSource = readFileSync("src/app/admin/content/content-console.tsx", "utf8");
const actionSource = readFileSync("src/app/admin/content-actions.ts", "utf8");
assert.match(consoleSource, /localDateTimeToUtcIso/);
assert.match(consoleSource, /getLocalDateTimeOffsetMinutes\(value\)/);
assert.match(consoleSource, /disabled=\{!scheduledAtUtc\}/);
assert.match(consoleSource, /formatLocalDateTimeInputValue/);
assert.match(consoleSource, /name="scheduledAt" value=\{scheduledAtUtc\}/);
assert.doesNotMatch(consoleSource, /new Date\(value\)\.getTimezoneOffset\(\)/);
assert.doesNotMatch(consoleSource, /new Date\(Date\.now\(\) \+ 60_000\)\.toISOString\(\)\.slice\(0, 16\)/);
assert.match(actionSource, /parseExplicitScheduledAt/);

console.log("Content schedule timezone contracts passed.");
