import assert from "node:assert/strict";
import { classifyYouTubeHealthHttpStatus, getYouTubePublishingConnectionHealth } from "../../src/features/social/services/youtube-publishing-health";

assert.equal(classifyYouTubeHealthHttpStatus(401, "token"), "reauthorization_required");
assert.equal(classifyYouTubeHealthHttpStatus(403, "channel"), "permission_missing");
assert.equal(classifyYouTubeHealthHttpStatus(404, "channel"), "channel_not_found");
assert.equal(classifyYouTubeHealthHttpStatus(503, "channel"), "unavailable");

const missing = await getYouTubePublishingConnectionHealth({});
assert.equal(missing.status, "not_configured");

let requests = 0;
const fakeFetch: typeof fetch = async (input, init) => {
  requests += 1;
  const url = String(input);
  if (url.includes("oauth2.googleapis.com/token")) {
    assert.equal(new URLSearchParams(String(init?.body)).get("grant_type"), "refresh_token");
    return new Response(JSON.stringify({ access_token: "private-access-token" }), { status: 200 });
  }
  assert.ok(url.includes("youtube/v3/channels"));
  assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer private-access-token");
  return new Response(JSON.stringify({ items: [{ id: "UC123456789", snippet: { title: "ZIKR Channel" } }] }), { status: 200 });
};
const connected = await getYouTubePublishingConnectionHealth({
  YOUTUBE_CLIENT_ID: "client-id",
  YOUTUBE_CLIENT_SECRET: "client-secret",
  YOUTUBE_REFRESH_TOKEN: "private-refresh-token",
}, fakeFetch);
assert.equal(connected.status, "connected");
assert.equal(connected.channelId, "UC123456789");
assert.equal(connected.channelName, "ZIKR Channel");
assert.equal(requests, 2);
assert.equal(JSON.stringify(connected).includes("private-access-token"), false);
assert.equal(JSON.stringify(connected).includes("private-refresh-token"), false);

const permissionFailureFetch: typeof fetch = async (input) => {
  if (String(input).includes("oauth2.googleapis.com/token")) {
    return new Response(JSON.stringify({ access_token: "private-access-token" }), { status: 200 });
  }
  return new Response(JSON.stringify({ error: "forbidden" }), { status: 403 });
};
const permissionFailure = await getYouTubePublishingConnectionHealth({
  YOUTUBE_CLIENT_ID: "client-id",
  YOUTUBE_CLIENT_SECRET: "client-secret",
  YOUTUBE_REFRESH_TOKEN: "private-refresh-token",
}, permissionFailureFetch);
assert.equal(permissionFailure.status, "permission_missing");

console.log("YouTube publishing connection health tests passed.");
