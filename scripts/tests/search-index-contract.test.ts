import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  "supabase/migrations/20261030043335_arabic_full_text_search_v2.sql",
  "utf8",
);
const search = readFileSync("src/features/search/services/search.ts", "utf8");
const navigation = readFileSync("src/components/layout/mobile-nav.tsx", "utf8");

for (const table of [
  "articles", "hadiths", "duas", "quran_ayahs",
  "prophets", "companions", "scholars", "stories",
]) {
  assert.ok(
    migration.includes("ALTER TABLE public." + table) &&
      migration.includes(table + "_searchable_normalized_idx"),
    "Arabic normalized search column and GIN index must exist for " + table,
  );
}

assert.ok(migration.includes("private.normalize_arabic_search_text"));
assert.ok(migration.includes("SECURITY INVOKER"));
assert.ok(migration.includes("st.user_id IS NULL"));
assert.ok(migration.includes("st.is_approved IS TRUE"));
assert.ok(migration.includes("REVOKE ALL ON FUNCTION public.search_public_content"));
assert.ok(migration.includes("GRANT EXECUTE ON FUNCTION public.search_public_content(text, integer) TO anon, authenticated"));

assert.ok(search.includes("/rest/v1/rpc/search_public_content"));
assert.ok(search.includes("searchIndexedContent"));
assert.ok(search.includes("if (indexedResults !== null) return indexedResults"));
assert.ok(navigation.includes("mobile-platform-menu-search"));
assert.ok(navigation.includes('aria-controls="mobile-navigation-dialog"'));
assert.ok(navigation.includes('event.key !== "Tab"'));

console.log("Arabic indexed search contract passed: 8 tables, RPC permissions, official-story privacy, and mobile menu accessibility/search.");
