import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const smoke = readFileSync("scripts/verify-production-smoke.mjs", "utf8");

const requiredContracts = [
  [
    "the Quran page must contain the surah catalog, not just the loading title",
    'expectedContent: /الفاتحة.*الناس/',
  ],
  [
    "the production smoke test must request the canonical Quran catalog API",
    'path: "/api/quran/surahs"',
  ],
  [
    "the Quran catalog API must return exactly 114 ordered surahs",
    "payload.length === 114",
  ],
  [
    "the Quran catalog API must validate the first and final surah IDs",
    "payload[113]?.id === 114",
  ],
  [
    "Next.js Arabic Quran loading shells must not pass as complete main content",
    "جاري تحميل المحتوى القرآني",
  ],
  [
    "streamed page content must be validated independently of the first main shell",
    "check.expectedContent && !check.expectedContent.test(extractText(body))",
  ],
];

for (const [description, token] of requiredContracts) {
  assert.ok(smoke.includes(token), description);
}

console.log(
  `Production smoke contract passed: ${requiredContracts.length} route/content guards.`,
);
