import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  "supabase/migrations/20261030043335_arabic_full_text_search_v2.sql",
  "utf8",
);
const migration2 = readFileSync("supabase/migrations/20261030044153_arabic_search_surahs_and_content_library.sql", "utf8");
const migration3 = readFileSync("supabase/migrations/20261030090000_article_tags_and_english_search.sql", "utf8");
const search = readFileSync("src/features/search/services/search.ts", "utf8");
const navigation = readFileSync("src/components/layout/mobile-nav.tsx", "utf8");

for (const table of [
  "articles", "hadiths", "duas", "quran_ayahs",
  "prophets", "companions", "scholars", "stories",
]) {
  assert.ok(
    new RegExp(`alter\\s+table\\s+public\\.${table}`, "i").test(migration) &&
      migration.includes(table + "_searchable_normalized_idx"),
    "Arabic normalized search column and GIN index must exist for " + table,
  );
}

assert.ok(migration.includes("private.normalize_arabic_search_text"));
assert.ok(migration3.includes("SECURITY INVOKER"));
assert.ok(migration3.includes("st.user_id IS NULL"));
assert.ok(migration3.includes("st.is_approved IS TRUE"));
assert.match(migration3, /revoke all on function public\.search_public_content/i);
assert.match(migration3, /grant execute on function public\.search_public_content\(text, integer\) to anon, authenticated/i);

assert.ok(search.includes("/rest/v1/rpc/search_public_content"));
assert.ok(search.includes("searchIndexedContent"));
assert.ok(search.includes("if (indexedResults !== null) {"));
assert.ok(search.includes("getBundledLongformArticles"));
assert.ok(migration2.includes("quran_surahs_searchable_normalized_idx"));
assert.ok(migration2.includes("content_library_searchable_normalized_idx"));
assert.ok(migration3.includes("searchable_tags_normalized"));
assert.ok(migration3.includes("articles_tags_searchable_normalized_idx"));
assert.ok(migration3.includes("a.searchable_tags_normalized @@ q.query"));
assert.ok(migration3.includes("content_en"));
assert.ok(navigation.includes("mobile-platform-menu-search"));
assert.ok(navigation.includes('aria-controls="mobile-navigation-dialog"'));
assert.ok(navigation.includes('event.key !== "Tab"'));
assert.ok(navigation.includes('window.matchMedia("(min-width: 1024px)")'));
assert.ok(navigation.includes("h-[100dvh]"));

console.log("Arabic indexed search contract passed: 8 source tables, two additional indexed catalogs, tag/English article search, RPC permissions, longform preservation, and mobile menu accessibility/search.");
