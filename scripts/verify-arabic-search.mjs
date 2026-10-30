import { readFile } from "node:fs/promises";

const files = {
  normalizer: "src/lib/search/arabic-normalization.ts",
  quran: "src/features/quran/services/quran-server.ts",
  hadith: "src/features/hadith/services/hadith.ts",
  articles: "src/features/articles/services/articles.ts",
  duas: "src/features/dua/services/dua.ts",
  stories: "src/features/stories/services/stories.ts",
  prophets: "src/features/prophets/services/prophets.ts",
  companions: "src/features/companions/services/companions.ts",
  scholars: "src/features/scholars/services/scholars.ts",
  migrationOne: "supabase/migrations/20261030043335_arabic_full_text_search_v2.sql",
  migrationTwo: "supabase/migrations/20261030044153_arabic_search_surahs_and_content_library.sql",
};
const contents = Object.fromEntries(
  await Promise.all(Object.entries(files).map(async ([key, path]) => [key, await readFile(path, "utf8")])),
);

const failures = [];
const normalizedFields = ["hadith", "articles", "duas", "stories", "prophets", "companions", "scholars"];
if (!contents.normalizer.includes("normalizeArabicSearchText")) failures.push("shared Arabic normalizer missing");
if (!contents.quran.includes("normalizeArabicSearchText(value).includes(cleanQuery)")) failures.push("local Quran search is not normalized");
for (const key of normalizedFields) {
  if (!contents[key].includes("searchable_normalized=plfts(simple).")) failures.push(`${key} service does not query the normalized FTS index`);
  if (!contents[key].includes('import { normalizeArabicSearchText } from "@/lib/search/arabic-normalization";')) failures.push(`${key} service does not import the shared Arabic normalizer`);
}
for (const key of ["migrationOne", "migrationTwo"]) {
  if (!contents[key].includes("searchable_normalized")) failures.push(`${key} does not define normalized search schema`);
}
if (!contents.migrationOne.includes("private.normalize_arabic_search_text")) failures.push("canonical database normalizer is missing from migration history");

if (failures.length) {
  console.error("Arabic search contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Arabic search contract passed.");
