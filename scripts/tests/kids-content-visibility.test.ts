import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  getFallbackKidsContentBySlug,
  mergeKidsContentWithFallback,
} from "../../src/features/kids/services/kids-content-visibility";

const databaseItems = [
  { slug: "story-live", source: "database" },
];
const fallbackItems = [
  { slug: "story-live", source: "fallback" },
  { slug: "story-unpublished", source: "fallback" },
  { slug: "story-inactive", source: "fallback" },
  { slug: "story-static-only", source: "fallback" },
];
const knownDatabaseSlugs = new Set(["story-live", "story-unpublished", "story-inactive"]);

assert.deepEqual(
  mergeKidsContentWithFallback(databaseItems, fallbackItems, knownDatabaseSlugs),
  [
    { slug: "story-live", source: "database" },
    { slug: "story-static-only", source: "fallback" },
  ],
  "database-backed unpublished or inactive slugs must not be resurrected by static fallback",
);
assert.equal(
  getFallbackKidsContentBySlug("story-unpublished", fallbackItems, knownDatabaseSlugs),
  null,
  "an unpublished database slug must return no static fallback",
);
assert.equal(
  getFallbackKidsContentBySlug("story-inactive", fallbackItems, knownDatabaseSlugs),
  null,
  "an inactive database slug must return no static fallback",
);
assert.equal(
  getFallbackKidsContentBySlug("story-static-only", fallbackItems, knownDatabaseSlugs)?.slug,
  "story-static-only",
  "curated static-only content remains available when no database row owns the slug",
);

const service = readFileSync("src/features/kids/services/kids-content.ts", "utf8");
assert.match(service, /published=eq\.true&is_active=eq\.true/, "public Kids queries must include active state");
assert.match(service, /supabaseServerAdminRequest[\s\S]*?select=slug/, "fallback visibility must consult database-owned slugs");
assert.match(service, /mergeKidsContentWithFallback\(database\.items, FALLBACK_KIDS_CONTENT, database\.knownSlugs\)/);
assert.match(service, /getFallbackKidsContentBySlug\(cleanSlug, FALLBACK_KIDS_CONTENT, database\.knownSlugs\)/);

const migration = readFileSync(
  "supabase/migrations/20261110212000_kids_content_public_read_respects_active_state.sql",
  "utf8",
);
assert.match(migration, /drop policy if exists "kids_content_public_read"/i);
assert.match(
  migration,
  /using\s*\(\s*published\s+is\s+true\s+and\s+is_active\s+is\s+true\s*\)/i,
  "public Kids RLS must hide unpublished and inactive rows",
);

console.log("Kids content visibility and fallback contracts passed.");
