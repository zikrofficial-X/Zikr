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
assert.match(helper, /CACHE_TTL_MS/);
assert.match(helper, /UNKNOWN_CACHE_TTL_MS/);
assert.match(helper, /inFlightLookups/);

const serviceContracts = [
  ["src/features/articles/services/articles.ts", '"articles", safeSlug'],
  ["src/features/dua/services/dua.ts", '"duas", cleanSlug'],
  ["src/features/prophets/services/prophets.ts", '"prophets", cleanSlug'],
] as const;

const articleService = readFileSync("src/features/articles/services/articles.ts", "utf8");
assert.match(articleService, /if \(hasOfflineFallback\)/, "article visibility checks must run only when an offline fallback would otherwise render");
const duaService = readFileSync("src/features/dua/services/dua.ts", "utf8");
assert.match(duaService, /!databaseLookupFailed && localMatch/, "dua visibility checks must not run for arbitrary unknown slugs");
const prophetService = readFileSync("src/features/prophets/services/prophets.ts", "utf8");
assert.match(prophetService, /!databaseLookupFailed && hasLocalFallback/, "prophet visibility checks must be limited to known fallback slugs");

for (const [path, lookup] of serviceContracts) {
  const source = readFileSync(path, "utf8");
  assert.ok(source.includes(`getDatabasePublicationState(${lookup})`), `${path} must verify explicit database publication state before offline fallback`);
  assert.match(source, /shouldSuppressOfflineFallback\(publicationState\)/, `${path} must suppress fallback for unpublished or unverifiable records`);
}

console.log("Public detail-route publication visibility contracts passed.");
