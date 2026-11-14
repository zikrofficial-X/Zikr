import assert from "node:assert/strict";
import { classifyYouTubeHealthHttpStatus, getYouTubePublishingConnectionHealth } from "../../src/features/social/services/youtube-publishing-health";

assert.equal(classifyYouTubeHealthHttpStatus(401, "token"), "reauthorization_required");
assert.equal(classifyYouTubeHealthHttpStatus(403, "channel"), "permission_missing");
assert.equal(classifyYouTubeHealthHttpStatus(404, "channel"), "channel_not_found");
assert.equal(classifyYouTubeHealthHttpStatus(503, "channel"), "unavailable");

const missing = await getYouTubePublishingConnectionHealth({});
assert.equal(missing.status, "not_configured");

let oauthRequests = 0;
const fakeFetch: typeof fetch = async (input, init) => {
  oauthRequests += 1;
  const url = String(input);
  if (url.includes("oauth2.googleapis.com/token")) {
    assert.equal(new URLSearchParams(String(init?.body)).get("grant_type"), "refresh_token");
    return new Response(JSON.stringify({ access_token: "private-access-token" }), { status: 200 });
  }
  assert.ok(url.includes("youtube/v3/channels"));
  const channelUrl = new URL(url);
  assert.equal(channelUrl.searchParams.get("maxResults"), "50");
  assert.equal(channelUrl.searchParams.get("mine"), "true");
  assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer private-access-token");
  return new Response(JSON.stringify({
    items: [
      { id: "UC-other-channel", snippet: { title: "Other Channel" }, statistics: { subscriberCount: "1" } },
      {
        id: "UC123456789",
        snippet: { title: "ZIKR Channel" },
        statistics: { subscriberCount: "1234", viewCount: "98765", videoCount: "42" },
      },
    ],
  }), { status: 200 });
};
const connected = await getYouTubePublishingConnectionHealth({
  YOUTUBE_CLIENT_ID: "client-id",
  YOUTUBE_CLIENT_SECRET: "client-secret",
  YOUTUBE_REFRESH_TOKEN: "private-refresh-token",
  YOUTUBE_CHANNEL_ID: "UC123456789",
}, fakeFetch, async () => "verified-read-only-refresh-token");
assert.equal(connected.status, "connected");
assert.equal(connected.readSource, "oauth");
assert.equal(connected.channelId, "UC123456789");
assert.equal(connected.channelName, "ZIKR Channel");
assert.equal(connected.subscribers, 1234);
assert.equal(connected.totalViews, 98765);
assert.equal(connected.videoCount, 42);
assert.equal(oauthRequests, 2);

let ambiguousChannelRequests = 0;
const multipleChannelsFetch: typeof fetch = async (input) => {
  if (String(input).includes("oauth2.googleapis.com/token")) {
    return new Response(JSON.stringify({ access_token: "private-access-token" }), { status: 200 });
  }
  ambiguousChannelRequests += 1;
  const url = new URL(String(input));
  assert.equal(url.searchParams.get("maxResults"), "50");
  if (!url.searchParams.has("pageToken")) {
    return new Response(JSON.stringify({
      items: [{ id: "UC-first", snippet: { title: "First Channel" } }],
      nextPageToken: "next-channel-page",
    }), { status: 200 });
  }
  assert.equal(url.searchParams.get("pageToken"), "next-channel-page");
  return new Response(JSON.stringify({
    items: [{ id: "UC-second", snippet: { title: "Second Channel" } }],
  }), { status: 200 });
};
const ambiguousChannel = await getYouTubePublishingConnectionHealth({
  YOUTUBE_CLIENT_ID: "client-id",
  YOUTUBE_CLIENT_SECRET: "client-secret",
}, multipleChannelsFetch, async () => "verified-read-only-refresh-token");
assert.equal(ambiguousChannel.status, "channel_selection_required");
assert.equal(ambiguousChannel.channelId, null);
assert.match(ambiguousChannel.message, /YOUTUBE_CHANNEL_ID/);
assert.equal(ambiguousChannelRequests, 2, "an account with channels on multiple pages must not be reported as connected or trigger a guessed channel");

let configuredChannelPageRequests = 0;
const configuredChannelAcrossPagesFetch: typeof fetch = async (input) => {
  const url = String(input);
  if (url.includes("oauth2.googleapis.com/token")) {
    return new Response(JSON.stringify({ access_token: "private-access-token" }), { status: 200 });
  }
  configuredChannelPageRequests += 1;
  const channelUrl = new URL(url);
  assert.equal(channelUrl.searchParams.get("maxResults"), "50");
  if (!channelUrl.searchParams.has("pageToken")) {
    return new Response(JSON.stringify({
      items: [{ id: "UC-first", snippet: { title: "First Channel" } }],
      nextPageToken: "next-channel-page",
    }), { status: 200 });
  }
  assert.equal(channelUrl.searchParams.get("pageToken"), "next-channel-page");
  return new Response(JSON.stringify({
    items: [{
      id: "UC123456789",
      snippet: { title: "ZIKR Channel on page two" },
      statistics: { subscriberCount: "4321", viewCount: "87654", videoCount: "51" },
    }],
  }), { status: 200 });
};
const configuredChannelAcrossPages = await getYouTubePublishingConnectionHealth({
  YOUTUBE_CLIENT_ID: "client-id",
  YOUTUBE_CLIENT_SECRET: "client-secret",
  YOUTUBE_CHANNEL_ID: "UC123456789",
}, configuredChannelAcrossPagesFetch, async () => "verified-read-only-refresh-token");
assert.equal(configuredChannelAcrossPages.status, "connected");
assert.equal(configuredChannelAcrossPages.channelId, "UC123456789");
assert.equal(configuredChannelAcrossPages.channelName, "ZIKR Channel on page two");
assert.equal(configuredChannelAcrossPages.subscribers, 4321);
assert.equal(configuredChannelPageRequests, 2, "health must follow nextPageToken when the configured channel is not on the first page");

assert.equal(JSON.stringify(connected).includes("private-access-token"), false);
assert.equal(JSON.stringify(connected).includes("private-refresh-token"), false);

let publicReadRequests = 0;
const publicFallbackFetch: typeof fetch = async (input, init) => {
  const url = String(input);
  if (url.includes("oauth2.googleapis.com/token")) {
    return new Response(JSON.stringify({ access_token: "private-access-token" }), { status: 200 });
  }
  if (url.includes("youtube/v3/channels") && new Headers(init?.headers).has("Authorization")) {
    return new Response(JSON.stringify({ error: { message: "insufficientPermissions" } }), { status: 403 });
  }
  const publicUrl = new URL(url);
  assert.equal(publicUrl.searchParams.get("id"), "UC123456789");
  assert.equal(publicUrl.searchParams.get("key"), "private-api-key");
  assert.equal(publicUrl.searchParams.get("part"), "id,snippet,statistics");
  assert.equal(new Headers(init?.headers).has("Authorization"), false);
  publicReadRequests += 1;
  return new Response(JSON.stringify({
    items: [{
      id: "UC123456789",
      snippet: { title: "ZIKR Public Channel" },
      statistics: { subscriberCount: "3210", viewCount: "456789", videoCount: "87" },
    }],
  }), { status: 200 });
};
const publicOnly = await getYouTubePublishingConnectionHealth({
  YOUTUBE_CLIENT_ID: "client-id",
  YOUTUBE_CLIENT_SECRET: "client-secret",
  YOUTUBE_REFRESH_TOKEN: "private-refresh-token",
  YOUTUBE_API_KEY: "private-api-key",
  YOUTUBE_CHANNEL_ID: "UC123456789",
}, publicFallbackFetch, async () => "verified-read-only-refresh-token");
assert.equal(publicOnly.status, "public_data_only");
assert.equal(publicOnly.readSource, "api_key");
assert.equal(publicOnly.channelName, "ZIKR Public Channel");
assert.equal(publicOnly.subscribers, 3210);
assert.equal(publicOnly.totalViews, 456789);
assert.equal(publicOnly.videoCount, 87);
assert.equal(publicReadRequests, 1);
assert.match(publicOnly.message, /القراءة العامة/);
assert.equal(JSON.stringify(publicOnly).includes("private-api-key"), false);
assert.equal(JSON.stringify(publicOnly).includes("private-access-token"), false);
assert.equal(JSON.stringify(publicOnly).includes("private-refresh-token"), false);

const oauthMissingPublicFetch: typeof fetch = async (input) => {
  const url = new URL(String(input));
  assert.equal(url.searchParams.get("id"), "UC123456789");
  return new Response(JSON.stringify({
    items: [{ id: "UC123456789", snippet: { title: "Public Only" }, statistics: { viewCount: "77" } }],
  }), { status: 200 });
};
const oauthMissingPublic = await getYouTubePublishingConnectionHealth({
  YOUTUBE_API_KEY: "private-api-key",
  YOUTUBE_CHANNEL_ID: "UC123456789",
}, oauthMissingPublicFetch, async () => null);
assert.equal(oauthMissingPublic.status, "public_data_only");
assert.equal(oauthMissingPublic.readSource, "api_key");
assert.equal(oauthMissingPublic.totalViews, 77);
assert.equal(oauthMissingPublic.subscribers, null);

const storedCredentialReadFailure = await getYouTubePublishingConnectionHealth({
  YOUTUBE_CLIENT_ID: "client-id",
  YOUTUBE_CLIENT_SECRET: "client-secret",
  YOUTUBE_API_KEY: "private-api-key",
  YOUTUBE_CHANNEL_ID: "UC123456789",
}, oauthMissingPublicFetch, async () => {
  throw new Error("database unavailable");
});
assert.equal(storedCredentialReadFailure.status, "public_data_only");
assert.equal(storedCredentialReadFailure.readSource, "api_key");

const storedCredentialReadFailureWithoutFallback = await getYouTubePublishingConnectionHealth({
  YOUTUBE_CLIENT_ID: "client-id",
  YOUTUBE_CLIENT_SECRET: "client-secret",
}, async () => {
  throw new Error("fetch must not be reached");
}, async () => {
  throw new Error("database unavailable");
});
assert.equal(storedCredentialReadFailureWithoutFallback.status, "unavailable");

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
}, permissionFailureFetch, async () => "verified-read-only-refresh-token");
assert.equal(permissionFailure.status, "permission_missing");

console.log("YouTube publishing connection health tests passed.");
