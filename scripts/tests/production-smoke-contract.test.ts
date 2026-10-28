import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const smoke = readFileSync("scripts/verify-production-smoke.mjs", "utf8");

const requiredContracts = [
  ["Quran main route must validate the surah catalog", 'expectedContent: /الفاتحة.*الناس/'],
  ["Kids games catalogue must validate a real game entry", 'expectedContent: /مختبر الحروف|Arabic Letter Lab|Letter Lab/i'],
  ["Canonical Quran catalog API must be checked", 'path: "/api/quran/surahs"'],
  ["The API must validate all 114 ordered surahs", "payload.length === 114"],
  ["The final Quran surah must be present", "payload[113]?.id === 114"],
  ["The Arabic loading shell must not count as completed content", "جاري تحميل المحتوى القرآني"],
  ["Rendered body content must be validated separately", "check.expectedContent && !check.expectedContent.test(extractText(body))"],
];

for (const [description, token] of requiredContracts) {
  assert.ok(smoke.includes(token), description);
}

console.log(`Production smoke contract passed: ${requiredContracts.length} assertions.`);
