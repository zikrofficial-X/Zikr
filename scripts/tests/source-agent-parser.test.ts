import assert from "node:assert/strict";
import { parseSourceItems } from "../../supabase/functions/source-verified-content-agent/parse-items.ts";

const catalogResult = parseSourceItems(
  { parser_key: "alquran_cloud" },
  { data: { surahs: [{ number: 1, name: "Al-Fatiha" }] } },
  "2026-11-14T00:00:00.000Z",
);
assert.deepEqual(
  catalogResult,
  { kind: "skipped", reason: "catalog_only_source" },
  "the Quran chapter catalog must be reported as intentionally skipped rather than a successful zero-item ingest",
);

const unsupportedResult = parseSourceItems(
  { parser_key: "quran_foundation_v4" },
  { data: [{ id: "chapter-1" }] },
  "2026-11-14T00:00:00.000Z",
);
assert.deepEqual(
  unsupportedResult,
  { kind: "skipped", reason: "parser_not_implemented" },
  "an unimplemented provider parser must be visible as a skipped source",
);

console.log("Source-agent parser outcome contract passed.");
