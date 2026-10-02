import { readFile } from "node:fs/promises";
import path from "node:path";

const contentPath = path.join(process.cwd(), "src/features/kids/data/content.ts");
const source = await readFile(contentPath, "utf8");

const required = [
  'export type KidsQuizQuestion',
  'quiz_data?: { questions: KidsQuizQuestion[] }',
  'correctAnswer: number',
];

for (const marker of required) {
  if (!source.includes(marker)) throw new Error(`Kids Quiz content contract is missing: ${marker}`);
}

const verifiedPath = path.join(process.cwd(), "src/lib/games/verified-content.ts");
const verified = await readFile(verifiedPath, "utf8");
if (!verified.includes("getVerifiedKidsQuizQuestions")) {
  throw new Error("Verified Kids Quiz adapter is missing.");
}
if (!verified.includes("isQuestion")) {
  throw new Error("Kids Quiz question validation is missing.");
}

const componentPath = path.join(process.cwd(), "src/features/kids/components/games/kids-learning-games.tsx");
const component = await readFile(componentPath, "utf8");
for (const marker of ["feedback", "onResult", "getVerifiedKidsQuizQuestions", "question.correctAnswer"]) {
  if (!component.includes(marker)) throw new Error(`ZIKR Quiz runtime contract is missing: ${marker}`);
}

console.log("ZIKR Quiz check passed: verified content adapter + dedicated feedback runtime are present.");
