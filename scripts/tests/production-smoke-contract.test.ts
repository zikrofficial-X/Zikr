import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const smoke = readFileSync("scripts/verify-production-smoke.mjs", "utf8");
const articleService = readFileSync("src/features/articles/services/articles.ts", "utf8");
const articlePage = readFileSync("src/app/articles/[slug]/page.tsx", "utf8");
const duaService = readFileSync("src/features/dua/services/dua.ts", "utf8");
const duaPage = readFileSync("src/app/dua/[slug]/page.tsx", "utf8");
const duaLayout = readFileSync("src/app/dua/[slug]/layout.tsx", "utf8");

const requiredContracts = [
  ["Quran main route must validate the surah catalog", 'expectedContent: /الفاتحة.*الناس/'],
  ["Kids games catalogue must validate a real game entry", 'expectedContent: /مختبر الحروف|Arabic Letter Lab|Letter Lab/i'],
  ["Canonical Quran catalog API must be checked", 'path: "/api/quran/surahs"'],
  ["The API must validate all 114 ordered surahs", "payload.length === 114"],
  ["The final Quran surah must be present", "payload[113]?.id === 114"],
  ["The Arabic loading shell must not count as completed content", "جاري تحميل المحتوى القرآني"],
  ["Rendered body content must be validated separately", "check.expectedContent && !check.expectedContent.test(extractText(body))"],
  ["A short published dua gets a detail-page production smoke check", 'path: "/dua/zikr-dua-expansion-14"'],
  ["Published article detail fallback is covered by production smoke", 'path: "/articles/how-to-read-hadith-carefully"'],
];

for (const [description, token] of requiredContracts) {
  assert.ok(smoke.includes(token), description);
}

const contentFallbackContracts = [
  [articleService, "const arabicSource = mapRow(row, \"ar\")", "English article requests fall back to the published Arabic source"],
  [articleService, "contentLocale: locale", "Article adapters preserve the actual returned content language"],
  [articlePage, "article.contentLocale === \"ar\"", "Article detail explains when Arabic fallback is shown"],
  [duaService, "function resolveDuaLocale", "Dua service resolves a complete available language"],
  [duaService, "contentLocale: \"ar\"", "Dua service records the Arabic fallback language"],
  [duaPage, "const MIN_PUBLIC_DUA_CHARS = 10", "A valid short dua is not rejected by the old 80-character threshold"],
  [duaPage, "dua.contentLocale === \"ar\"", "Dua detail explains when Arabic fallback is shown"],
];
for (const [source, token, description] of contentFallbackContracts) {
  assert.ok(source.includes(token), description);
}
assert.ok(!duaLayout.includes("generateMetadata"), "Dua layout must not issue a duplicate metadata database request");

console.log(`Production smoke contract passed: ${requiredContracts.length + contentFallbackContracts.length + 1} assertions.`);
