import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { canRecoverDuplicateVideoRender } from "../../src/features/videos/services/duplicate-video-recovery";

const owner = {
  status: "completed",
  video_url: null,
  content_hash: "content-hash-1",
  source_hash: "source-hash-1",
  template_version: "renderer-v4",
  category: "hadith",
};
const candidate = {
  category: "hadith",
  contentHash: "content-hash-1",
  sourceHash: "source-hash-1",
  templateVersion: "renderer-v4",
};

assert.equal(
  canRecoverDuplicateVideoRender({ owner, candidate, qaApproved: true, siteRecord: null }),
  true,
  "a completed canonical request with no catalog row can reuse a verified render",
);
assert.equal(
  canRecoverDuplicateVideoRender({
    owner,
    candidate,
    qaApproved: true,
    siteRecord: {
      published: false,
      metadata: { mediaState: "purged", generatedVideoUrl: null, videoUrl: null },
    },
  }),
  true,
  "an explicitly purged unpublished catalog row can be restored",
);

const reject = (overrides: {
  owner?: Partial<typeof owner>;
  candidate?: Partial<typeof candidate>;
  qaApproved?: boolean;
  siteRecord?: { published: boolean | null; metadata: Record<string, unknown> | null } | null;
}, message: string) => {
  assert.equal(
    canRecoverDuplicateVideoRender({
      owner: { ...owner, ...overrides.owner },
      candidate: { ...candidate, ...overrides.candidate },
      qaApproved: overrides.qaApproved ?? true,
      siteRecord: overrides.siteRecord === undefined ? null : overrides.siteRecord,
    }),
    false,
    message,
  );
};

reject({ qaApproved: false }, "failed automated QA must never restore or publish a duplicate render");
reject({ owner: { status: "processing" } }, "an active duplicate owner must not be overwritten");
reject({ owner: { video_url: "https://res.cloudinary.com/example/video/upload/auto-existing.mp4" } }, "an owner with existing media must not be overwritten");
reject({ candidate: { contentHash: "different" } }, "a different final content hash must fail closed");
reject({ candidate: { sourceHash: "different" } }, "a different source hash must fail closed");
reject({ candidate: { templateVersion: "renderer-v5" } }, "a different renderer version must fail closed");
reject({ candidate: { category: "quran" } }, "a different content category must fail closed");
reject({
  siteRecord: { published: true, metadata: { mediaState: "purged" } },
}, "a published catalog record must never be replaced");
reject({
  siteRecord: { published: null, metadata: { mediaState: "purged" } },
}, "an unknown publication state must fail closed");
reject({
  siteRecord: { published: false, metadata: { mediaState: "unpublished" } },
}, "an intentionally unpublished record must not be republished");
reject({
  siteRecord: { published: false, metadata: { mediaState: "purged", videoUrl: "https://example.com/video.mp4" } },
}, "a catalog record retaining a media URL must not be treated as purged");

const worker = readFileSync("scripts/jobs/template-video-automation.ts", "utf8");
assert.ok(worker.includes("canRecoverDuplicateVideoRender"), "the video worker must use the recovery decision contract");
assert.ok(worker.includes("recoverPurgedRecord: true"), "purged canonical records must use the controlled recovery queue path");
assert.ok(
  worker.includes('existingQueue.status === "published"'),
  "a previously published internal queue row must be re-queued only for explicit purged-record recovery",
);

console.log("Duplicate video render recovery contract tests passed.");
