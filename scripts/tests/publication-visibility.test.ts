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
assert.match(articleService, /revalidate: 60, tags: \["public-articles"\]/, "article list and detail caches must have a short, invalidatable publication tag");
assert.match(articleService, /if \(rows\.length === 0\)/, "a successful empty published query must not reuse a stale database snapshot");
const contentActions = readFileSync("src/app/admin/content-actions.ts", "utf8");
assert.match(contentActions, /revalidateTag\("public-articles"\)/, "admin publish and delete actions must invalidate public article caches");
assert.match(articleService, /if \(hasOfflineFallback\)/, "article visibility checks must run only when an offline fallback would otherwise render");
const duaService = readFileSync("src/features/dua/services/dua.ts", "utf8");
assert.match(duaService, /databaseLookupFailed \? fallbackBase : FALLBACK_DUAS/, "successful empty dua queries must not reuse an old offline DB snapshot");
assert.match(duaService, /!databaseLookupFailed && localMatch/, "dua visibility checks must not run for arbitrary unknown slugs");
const prophetService = readFileSync("src/features/prophets/services/prophets.ts", "utf8");
assert.match(prophetService, /database !== null/, "successful empty prophet queries must be distinguished from failed queries");
assert.match(prophetService, /!databaseLookupFailed && hasLocalFallback/, "prophet visibility checks must be limited to known fallback slugs");

for (const [path, lookup] of serviceContracts) {
  const source = readFileSync(path, "utf8");
  assert.ok(source.includes(`getDatabasePublicationState(${lookup})`), `${path} must verify explicit database publication state before offline fallback`);
  assert.match(source, /shouldSuppressOfflineFallback\(publicationState\)/, `${path} must suppress fallback for unpublished or unverifiable records`);
}

console.log("Public detail-route publication visibility contracts passed.");
