import { getVerifiedWuduContent } from "@/lib/games/verified-content";

const content = getVerifiedWuduContent();

if (content.steps.length !== 9) {
  throw new Error(`Wudu content requires exactly 9 ordered steps; found ${content.steps.length}.`);
}

for (const [index, step] of content.steps.entries()) {
  const expectedOrder = index + 1;
  if (step.order !== expectedOrder) {
    throw new Error(`Wudu step order mismatch: expected ${expectedOrder}, found ${step.order}.`);
  }
  if (!step.text.trim()) {
    throw new Error(`Wudu step ${step.order} is empty.`);
  }
}

if (!content.afterDhikr.trim()) {
  throw new Error("Wudu completion dhikr is missing.");
}

console.log("ZIKR Wudu content check passed: 9 ordered steps + completion dhikr.");
