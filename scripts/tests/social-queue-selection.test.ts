import assert from "node:assert/strict";
import { selectEligibleSocialPublishItems } from "../../src/features/social/services/social-queue-selection";

const videos = Array.from({ length: 74 }, (_, index) => ({
  id: `video-${index}`,
  content_type: "video",
  target_platforms: ["youtube", "facebook_reels"] as const,
  metadata: {
    platformResults: { facebook_reels: { ok: false, error: "Facebook Reel upload failed (HTTP 422)" } },
    platformAttempts: { facebook_reels: 4 },
  },
}));
const writtenPosts = [
  { id: "post-1", content_type: "written_post", target_platforms: ["facebook"] as const, metadata: null },
  { id: "post-2", content_type: "written_post", target_platforms: ["facebook"] as const, metadata: null },
  { id: "post-3", content_type: "written_post", target_platforms: ["facebook"] as const, metadata: null },
];
const candidates = [...videos, ...writtenPosts];
const enabledPlatforms = ["facebook", "facebook_reels", "youtube"] as const;

const selectedPosts = selectEligibleSocialPublishItems(candidates, {
  enabledPlatforms,
  approvedVideoQueueItemIds: new Set(),
  maxAttemptsFor: () => 5,
  limit: 2,
});
assert.deepEqual(
  selectedPosts.map((item) => item.id),
  ["post-1", "post-2"],
  "unapproved videos must not starve later eligible written posts",
);

const approvedVideo = selectEligibleSocialPublishItems(videos, {
  enabledPlatforms,
  approvedVideoQueueItemIds: new Set(["video-0"]),
  maxAttemptsFor: () => 5,
  limit: 1,
});
assert.equal(approvedVideo[0]?.id, "video-0", "approved videos remain eligible when no written post competes");

const approvedVideoBacklog = videos.slice(0, 10);
const fairBatch = selectEligibleSocialPublishItems(
  [...approvedVideoBacklog, ...writtenPosts],
  {
    enabledPlatforms,
    approvedVideoQueueItemIds: new Set(approvedVideoBacklog.map((item) => item.id)),
    maxAttemptsFor: () => 5,
    limit: 5,
  },
);
assert.equal(
  fairBatch[0]?.id,
  "post-1",
  "one due written post must receive a reserved batch slot ahead of eligible YouTube/Reels retry candidates",
);
assert.equal(
  fairBatch.filter((item) => item.content_type === "written_post").length,
  1,
  "the fairness reserve must not consume the entire video batch",
);
assert.equal(fairBatch.length, 5, "the fairness reserve must preserve the configured batch limit");

const facebookOnly = selectEligibleSocialPublishItems(candidates, {
  enabledPlatforms: ["facebook"],
  approvedVideoQueueItemIds: new Set(),
  maxAttemptsFor: () => 5,
  limit: 10,
});
assert.deepEqual(
  facebookOnly.map((item) => item.id),
  ["post-1", "post-2", "post-3"],
  "disabled YouTube targets must be skipped without blocking Facebook posts",
);

console.log("Social queue starvation regression checks passed.");
