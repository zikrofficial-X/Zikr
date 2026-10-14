import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const worker = readFileSync(join(root, "scripts/run-background-jobs.ts"), "utf8");
const queue = readFileSync(join(root, "scripts/jobs/template-video-automation.ts"), "utf8");

function assert(condition, message) {
  if (!condition) {
    console.error(`[video-queue-priority] FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`[video-queue-priority] PASS: ${message}`);
  }
}

const seedCall = worker.indexOf("const seeded = await seedAutomatedVideoRequests(settings.batchSize);");
const drainCall = worker.indexOf("const result = await drainQueue(settings.batchSize);");
assert(seedCall >= 0 && drainCall > seedCall, "seed scheduled requests before draining queue backlog");

assert(
  worker.includes("const priorityDay = Math.floor(Date.now() / 86_400_000);"),
  "worker computes the same UTC day-index format as the seeder",
);
assert(
  worker.includes("processTemplateVideoQueue(waveSize, priorityDay)"),
  "worker passes the current UTC day to the prioritized queue processor",
);
assert(
  worker.includes("const wave = [await processTemplateVideoQueue(waveSize, priorityDay)];"),
  "each bounded batch is selected in one worker invocation, avoiding duplicate concurrent reads",
);

assert(
  queue.includes("export async function processTemplateVideoQueue(limit = BATCH_SIZE, priorityDay?: number)"),
  "queue processor supports an optional daily priority key",
);
const priorityQuery = queue.indexOf("automation_key=like.*:${priorityDay}:*");
const fallbackQuery = queue.indexOf("const backlog =", priorityQuery);
assert(priorityQuery >= 0 && fallbackQuery > priorityQuery, "today's automation keys are selected before legacy backlog");
assert(
  queue.indexOf("rows = [...new Map((prioritized ?? []).map((request) => [request.id, request])).values()]") > priorityQuery,
  "priority candidates are deduplicated before filling the batch",
);
const claimGuard = queue.indexOf("if (!claimed?.[0]) continue;");
const claimedCounter = queue.indexOf("processed += 1;", claimGuard);
assert(claimGuard >= 0 && claimedCounter > claimGuard, "processed count increments only after a successful atomic claim");
assert(
  queue.includes("return { processed, succeeded, failed };"),
  "processed count reflects actual claimed rows rather than fetched candidates",
);

if (process.exitCode) {
  console.error("[video-queue-priority] Regression check failed.");
  process.exit(process.exitCode);
}
console.log("[video-queue-priority] All checks passed.");
