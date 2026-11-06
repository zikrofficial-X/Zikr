import assert from "node:assert/strict";
import {
  FACEBOOK_REELS_INSIGHT_METRICS,
  parseFacebookReelsInsights,
  shouldRefreshFacebookReelsInsights,
} from "../../src/features/social/services/facebook-reels-insights";

const now = Date.parse("2026-11-06T00:00:00.000Z");
assert.equal(shouldRefreshFacebookReelsInsights(null, now), true);
assert.equal(shouldRefreshFacebookReelsInsights({
  platformInsights: {
    facebookReels: { capturedAt: "2026-11-05T23:00:00.000Z" },
  },
}, now), false);
assert.equal(shouldRefreshFacebookReelsInsights({
  platformInsights: {
    facebookReels: { capturedAt: "2026-11-05T17:59:59.000Z" },
  },
}, now), true);

const parsed = parseFacebookReelsInsights([
  { name: "fb_reels_total_plays", period: "lifetime", values: [{ value: 1250 }] },
  { name: "blue_reels_play_count", period: "lifetime", values: [{ value: 1100 }] },
  { name: "post_video_avg_time_watched", period: "lifetime", values: [{ value: 4200 }] },
  { name: "post_video_social_actions", period: "lifetime", values: [{ value: { reactions: 12, comments: 3, shares: 2 } }] },
  { name: "post_video_likes_by_reaction_type", period: "lifetime", values: [{ value: { like: 9, love: 3 } }] },
  { name: "post_impressions_unique", period: "lifetime", values: [{ value: 900 }] },
  { name: "unknown_metric", period: "lifetime", values: [{ value: 500 }] },
  { name: "fb_reels_replay_count", period: "lifetime", values: [{ value: -1 }] },
]);

assert.equal(parsed.fb_reels_total_plays, 1250);
assert.equal(parsed.blue_reels_play_count, 1100);
assert.equal(parsed.post_video_avg_time_watched, 4200);
assert.deepEqual(parsed.post_video_social_actions, { reactions: 12, comments: 3, shares: 2 });
assert.deepEqual(parsed.post_video_likes_by_reaction_type, { like: 9, love: 3 });
assert.equal("post_impressions_unique" in parsed, false, "deprecated unique-impressions metric must not be requested or stored");
assert.equal("unknown_metric" in parsed, false);
assert.equal("fb_reels_replay_count" in parsed, false);
assert.ok(FACEBOOK_REELS_INSIGHT_METRICS.includes("fb_reels_total_plays"));
assert.ok(FACEBOOK_REELS_INSIGHT_METRICS.includes("post_video_avg_time_watched"));
assert.ok(!FACEBOOK_REELS_INSIGHT_METRICS.includes("post_impressions_unique" as never));

console.log("Facebook Reels insights permission and metric tests passed.");

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function requiredPermissions(source: string): string[] {
  const match = source.match(/const REQUIRED_PERMISSIONS = \[([\s\S]*?)\](?: as const)?;/);
  assert.ok(match, "OAuth route must declare its required Meta permissions");
  return [...match[1].matchAll(/"([^"]+)"/g)].map((entry) => entry[1]);
}

const connectPermissions = requiredPermissions(
  readFileSync(resolve("src/app/api/admin/social/facebook/connect/route.ts"), "utf8"),
);
const callbackPermissions = requiredPermissions(
  readFileSync(resolve("src/app/api/admin/social/facebook/callback/route.ts"), "utf8"),
);
assert.deepEqual(callbackPermissions, connectPermissions, "OAuth callback must validate every permission requested by the connect route");
assert.ok(callbackPermissions.includes("read_insights"), "Facebook insights requires explicit read_insights authorization");
assert.ok(callbackPermissions.includes("pages_manage_engagement"), "Facebook video insights requires Page engagement management authorization");
const facebookCredentialService = readFileSync(resolve("src/features/social/services/facebook-credentials.ts"), "utf8");
assert.ok(facebookCredentialService.includes('"read_insights"'), "stored credential validation must require read_insights");
assert.ok(facebookCredentialService.includes('"pages_manage_engagement"'), "stored credential validation must require pages_manage_engagement");
