import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { shouldSuppressOfflineFallback } from "../../src/lib/data/publication-visibility-contract";

assert.equal(shouldSuppressOfflineFallback("unpublished"), true);
assert.equal(shouldSuppressOfflineFallback("unknown"), true);
assert.equal(shouldSuppressOfflineFallback("published"), false);
assert.equal(shouldSuppressOfflineFallback("missing"), false);

const helper = readFileSync("src/lib/data/publication-visibility.ts", "utf8");
assert.match(helper, /supabaseServerAdminRequest/);
assert.match(helper, /select=published&slug=eq/);
assert.match(helper, /cache: "no-store"/);
assert.match(helper, /return "unknown"/);

const serviceContracts = [
  ["src/features/articles/services/articles.ts", '"articles", safeSlug'],
  ["src/features/dua/services/dua.ts", '"duas", cleanSlug'],
  ["src/features/prophets/services/prophets.ts", '"prophets", cleanSlug'],
] as const;

for (const [path, lookup] of serviceContracts) {
  const source = readFileSync(path, "utf8");
  assert.ok(source.includes(`getDatabasePublicationState(${lookup})`), `${path} must verify explicit database publication state before offline fallback`);
  assert.match(source, /shouldSuppressOfflineFallback\(publicationState\)/, `${path} must suppress fallback for unpublished or unverifiable records`);
}

console.log("Public detail-route publication visibility contracts passed.");
