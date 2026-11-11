import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mergeUniqueSocialPublishCandidates, selectEligibleSocialPublishItems } from "../../src/features/social/services/social-queue-selection";

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

const missingSourceMedia = {
  id: "missing-source-media",
  content_type: "video",
  target_platforms: ["youtube", "facebook_reels"] as const,
  metadata: { sourceMediaMissing: true },
};
const missingMediaSelection = selectEligibleSocialPublishItems([missingSourceMedia], {
  enabledPlatforms,
  approvedVideoQueueItemIds: new Set([missingSourceMedia.id]),
  maxAttemptsFor: () => 5,
  limit: 1,
});
assert.deepEqual(missingMediaSelection, [], "source-media-missing videos must stay out of the worker queue even when QA approval exists");

const boundedHeldVideos = Array.from({ length: 125 }, (_, index) => ({
  id: `held-video-${index}`,
  content_type: "video",
  target_platforms: ["youtube", "facebook_reels"] as const,
  metadata: null,
}));
const separatelyFetchedWrittenPost = {
  id: "written-beyond-general-window",
  content_type: "written_post",
  target_platforms: ["facebook"] as const,
  metadata: null,
};
const mergedBeyondWindow = mergeUniqueSocialPublishCandidates(
  boundedHeldVideos,
  [separatelyFetchedWrittenPost],
);
const reservedBeyondWindow = selectEligibleSocialPublishItems(mergedBeyondWindow, {
  enabledPlatforms,
  approvedVideoQueueItemIds: new Set(),
  maxAttemptsFor: () => 5,
  limit: 1,
});
assert.deepEqual(
  reservedBeyondWindow.map((item) => item.id),
  ["written-beyond-general-window"],
  "a dedicated written-post query must prevent a held-video window from hiding later eligible posts",
);

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


const socialPublisher = readFileSync("src/features/social/services/social-publishing.ts", "utf8");
assert.match(socialPublisher, /content_type=eq\.written_post/, "the worker must query written posts independently of the bounded general queue window");
assert.match(socialPublisher, /mergeUniqueSocialPublishCandidates/, "general and written candidates must be merged without duplicate queue IDs");
assert.match(socialPublisher, /Failed to fetch social publish queue candidates; refusing to report an empty successful batch/, "queue read failures must fail the job instead of appearing as an empty successful run");
assert.match(socialPublisher, /Invalid SOCIAL_PUBLISH_AFTER cutoff; refusing to read or claim queue rows/, "invalid queue cutoffs must fail visibly instead of returning an empty batch");

const adminRoute = readFileSync("src/app/api/admin/social/route.ts", "utf8");
assert.ok(adminRoute.includes('id=eq.${encodeURIComponent(item.id)}&status=eq.${encodeURIComponent(item.status)}'));
assert.ok(adminRoute.includes('Prefer: "return=representation"'));
assert.ok(adminRoute.includes("if (Array.isArray(updated) && updated[0]) affected += 1"));

console.log("Social queue starvation regression checks passed.");
