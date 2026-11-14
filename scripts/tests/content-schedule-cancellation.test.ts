import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cancelActiveContentSchedules } from "../../src/features/admin/services/content-schedule-cancellation";

type RequestInitLike = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

const firstVersion = "2026-11-14T00:00:00.000Z";
const secondVersion = "2026-11-14T00:00:00.001Z";
const queueId = "queue-1";
const patches: Array<{ path: string; body: Record<string, unknown> }> = [];
let queueRead = 0;

const request = async <T>(path: string, init?: RequestInitLike): Promise<T> => {
  if (init?.method === "GET" && path.includes("content_table=eq.articles")) {
    return [{
      id: queueId,
      status: "processing",
      updated_at: firstVersion,
    }] as unknown as T;
  }

  if (init?.method === "PATCH") {
    const body = JSON.parse(init.body ?? "{}") as Record<string, unknown>;
    patches.push({ path, body });
    return (patches.length === 1 ? [] : [{ id: queueId }]) as T;
  }

  if (init?.method === "GET" && path.includes(`id=eq.${queueId}`)) {
    queueRead += 1;
    return [{
      id: queueId,
      status: "processing",
      updated_at: secondVersion,
    }] as unknown as T;
  }

  throw new Error(`Unexpected request: ${init?.method ?? "GET"} ${path}`);
};

const cancelled = await cancelActiveContentSchedules(
  request,
  "articles",
  "article-1",
  "Cancelled by regression test.",
);

assert.equal(cancelled, 1);
assert.equal(queueRead, 1, "a lost CAS must re-read the active lease before retrying");
assert.equal(patches.length, 2, "the helper must retry against the refreshed processing lease");
assert.ok(patches[0].path.includes(`updated_at=eq.${encodeURIComponent(firstVersion)}`));
assert.ok(patches[1].path.includes(`updated_at=eq.${encodeURIComponent(secondVersion)}`));
for (const [index, previous] of [firstVersion, secondVersion].entries()) {
  const next = String(patches[index].body.updated_at ?? "");
  assert.ok(Date.parse(next) > Date.parse(previous), "cancellation must advance the exact worker lease version");
  assert.equal(patches[index].body.status, "cancelled");
}
assert.ok(
  patches[0].path.includes("status=in.(queued,processing)"),
  "cancellation must be limited to active queue states",
);

let publishedRead = 0;
const completedDuringRace = async <T>(path: string, init?: RequestInitLike): Promise<T> => {
  if (init?.method === "GET" && path.includes("content_table=eq.articles")) {
    return [{ id: queueId, status: "processing", updated_at: firstVersion }] as unknown as T;
  }
  if (init?.method === "PATCH") return [] as unknown as T;
  if (init?.method === "GET" && path.includes(`id=eq.${queueId}`)) {
    publishedRead += 1;
    return [{ id: queueId, status: "published", updated_at: secondVersion }] as unknown as T;
  }
  throw new Error(`Unexpected request: ${init?.method ?? "GET"} ${path}`);
};
assert.equal(
  await cancelActiveContentSchedules(completedDuringRace, "articles", "article-1", "cancel"),
  0,
  "a worker that completed before cancellation must not be overwritten",
);
assert.equal(publishedRead, 1);

const malformedVersion = async <T>(_path: string, _init?: RequestInitLike): Promise<T> =>
  ([{ id: queueId, status: "queued", updated_at: "not-a-date" }] as unknown as T);
await assert.rejects(
  cancelActiveContentSchedules(malformedVersion, "articles", "article-1", "cancel"),
  /invalid row-version token/,
  "an active queue row without a valid CAS token must fail closed",
);

let unstablePatchCount = 0;
let unstableReadCount = 0;
const unstableWorker = async <T>(path: string, init?: RequestInitLike): Promise<T> => {
  if (init?.method === "GET" && path.includes("content_table=eq.articles")) {
    return [{ id: queueId, status: "processing", updated_at: firstVersion }] as unknown as T;
  }
  if (init?.method === "PATCH") {
    unstablePatchCount += 1;
    return [] as unknown as T;
  }
  if (init?.method === "GET" && path.includes(`id=eq.${queueId}`)) {
    unstableReadCount += 1;
    return [{
      id: queueId,
      status: "processing",
      updated_at: new Date(Date.parse(firstVersion) + unstableReadCount).toISOString(),
    }] as unknown as T;
  }
  throw new Error(`Unexpected request: ${init?.method ?? "GET"} ${path}`);
};
await assert.rejects(
  cancelActiveContentSchedules(unstableWorker, "articles", "article-1", "cancel"),
  /kept changing while cancellation was in progress/,
  "repeated worker lease changes must fail closed rather than unpublish under an active claim",
);
assert.equal(unstablePatchCount, 3);
assert.equal(unstableReadCount, 3);

const contentService = readFileSync("src/features/admin/services/content.ts", "utf8");
assert.match(contentService, /import \{ cancelActiveContentSchedules \} from "\.\/content-schedule-cancellation"/);
assert.equal(
  (contentService.match(/await cancelActiveContentSchedules\(/g) ?? []).length,
  2,
  "both explicit unpublish and draft deletion must use the monotonic queue cancellation helper",
);
assert.doesNotMatch(
  contentService,
  /error_message: "Cancelled because the content was explicitly unpublished\."[\s\S]*?updated_at: new Date\(\)\.toISOString\(\)/,
  "unpublish must not reuse a same-millisecond queue lease version",
);

console.log("Content schedule cancellation CAS contract passed.");
