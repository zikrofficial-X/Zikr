import assert from "node:assert/strict";
import { deleteSocialPlatformPost } from "../../src/features/social/services/social-deletion";
import { readFileSync } from "node:fs";

const socialClient = readFileSync("src/app/admin/social/social-client.tsx", "utf8");
assert.match(
  socialClient,
  /const confirmation = `تأكيد الحذف النهائي من \\$\\{targetText\\}؟[\\s\\S]*?سجل النشر والتدقيق محفوظة\\.`;\\s*if \\(!window\\.confirm\\(confirmation\\)\\) return;/,
  "the admin remote-delete confirmation must close before the confirmation action and must state that the internal ZIKR copy is retained",
);

const youtubeEnv = {
  YOUTUBE_CLIENT_ID: "client-id",
  YOUTUBE_CLIENT_SECRET: "client-secret",
  YOUTUBE_REFRESH_TOKEN: "legacy-environment-refresh-token",
};
const resolveStoredYouTubeRefreshToken = async () => "private-refresh-token";

let youtubeDeleteRequests = 0;
const youtubeFetch: typeof fetch = async (input, init) => {
  const url = String(input);
  if (url.includes("oauth2.googleapis.com/token")) {
    assert.equal(init?.method, "POST");
    assert.equal(new URLSearchParams(init?.body as string).get("refresh_token"), "private-refresh-token", "delete flow must prefer the stored OAuth credential over the legacy environment token");
    return new Response(JSON.stringify({
      access_token: "private-access-token",
      scope: "https://www.googleapis.com/auth/youtube.force-ssl",
    }), { status: 200 });
  }
  youtubeDeleteRequests += 1;
  assert.equal(init?.method, "DELETE");
  assert.equal(new URL(url).searchParams.get("id"), "FKQ4tsQOtTs");
  assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer private-access-token");
  return new Response(null, { status: 204 });
};
const youtubeDeleted = await deleteSocialPlatformPost("youtube", "FKQ4tsQOtTs", {
  env: youtubeEnv,
  fetcher: youtubeFetch,
  resolveYouTubeRefreshToken: resolveStoredYouTubeRefreshToken,
});
assert.equal(youtubeDeleted.platform, "youtube");
assert.equal(youtubeDeleted.remoteId, "FKQ4tsQOtTs");
assert.equal(youtubeDeleteRequests, 1);
assert.equal(JSON.stringify(youtubeDeleted).includes("private-access-token"), false);
assert.equal(JSON.stringify(youtubeDeleted).includes("private-refresh-token"), false);

const missingScopeFetch: typeof fetch = async (input) => {
  assert.ok(String(input).includes("oauth2.googleapis.com/token"));
  return new Response(JSON.stringify({
    access_token: "private-access-token",
    scope: "https://www.googleapis.com/auth/youtube.upload",
  }), { status: 200 });
};
await assert.rejects(
  () => deleteSocialPlatformPost("youtube", "FKQ4tsQOtTs", { env: youtubeEnv, fetcher: missingScopeFetch, resolveYouTubeRefreshToken: resolveStoredYouTubeRefreshToken }),
  /youtube.force-ssl/,
);

let missingScopeDeleteRequests = 0;
const absentScopeFetch: typeof fetch = async (input, init) => {
  if (String(input).includes("oauth2.googleapis.com/token")) {
    return new Response(JSON.stringify({ access_token: "private-access-token" }), { status: 200 });
  }
  if (init?.method === "DELETE") missingScopeDeleteRequests += 1;
  return new Response(null, { status: 204 });
};
await assert.rejects(
  () => deleteSocialPlatformPost("youtube", "FKQ4tsQOtTs", { env: youtubeEnv, fetcher: absentScopeFetch, resolveYouTubeRefreshToken: resolveStoredYouTubeRefreshToken }),
  /لم يُثبت رمز YouTube صلاحية الحذف المطلوبة/,
);
assert.equal(missingScopeDeleteRequests, 0, "A token response without explicit scope evidence must never trigger remote deletion.");

const deniedYoutubeFetch: typeof fetch = async (input) => {
  if (String(input).includes("oauth2.googleapis.com/token")) {
    return new Response(JSON.stringify({ access_token: "private-access-token", scope: "https://www.googleapis.com/auth/youtube.force-ssl" }), { status: 200 });
  }
  return new Response(JSON.stringify({ error: { code: 403 } }), { status: 403 });
};
await assert.rejects(
  () => deleteSocialPlatformPost("youtube", "FKQ4tsQOtTs", { env: youtubeEnv, fetcher: deniedYoutubeFetch, resolveYouTubeRefreshToken: resolveStoredYouTubeRefreshToken }),
  /رفض YouTube الحذف/,
);

await assert.rejects(
  () => deleteSocialPlatformPost("youtube", "not-a-video-id", { env: youtubeEnv, fetcher: youtubeFetch }),
  /معرّف فيديو YouTube غير صالح/,
);

let facebookDeleteRequests = 0;
const facebookFetch: typeof fetch = async (input, init) => {
  facebookDeleteRequests += 1;
  assert.ok(String(input).includes("/v26.0/122133266355285939"));
  assert.equal(init?.method, "DELETE");
  assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer private-facebook-token");
  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
const facebookDeleted = await deleteSocialPlatformPost("facebook_reels", "122133266355285939", {
  env: { FACEBOOK_GRAPH_API_VERSION: "v26.0" },
  fetcher: facebookFetch,
  getFacebookCredentials: async () => ({
    pageId: "123456789",
    accessToken: "private-facebook-token",
    isEnabled: true,
  }),
});
assert.equal(facebookDeleted.platform, "facebook_reels");
assert.equal(facebookDeleteRequests, 1);
assert.equal(JSON.stringify(facebookDeleted).includes("private-facebook-token"), false);

await assert.rejects(
  () => deleteSocialPlatformPost("facebook", "1234567890123456", {
    env: { FACEBOOK_GRAPH_API_VERSION: "v26.0" },
    fetcher: facebookFetch,
    getFacebookCredentials: async () => ({
      pageId: "123456789",
      accessToken: "private-facebook-token",
      isEnabled: false,
    }),
  }),
  /اتصال صفحة Facebook غير مفعّل/,
);

const deniedFacebookFetch: typeof fetch = async () =>
  new Response(JSON.stringify({ error: { code: 200, message: "permission denied" } }), { status: 200 });
await assert.rejects(
  () => deleteSocialPlatformPost("facebook_reels", "122133266355285939", {
    env: { FACEBOOK_GRAPH_API_VERSION: "v26.0" },
    fetcher: deniedFacebookFetch,
    getFacebookCredentials: async () => ({
      pageId: "123456789",
      accessToken: "private-facebook-token",
      isEnabled: true,
    }),
  }),
  /pages_manage_posts/,
);

await assert.rejects(
  () => deleteSocialPlatformPost("facebook_reels", "invalid-id", {
    env: { FACEBOOK_GRAPH_API_VERSION: "v26.0" },
    fetcher: facebookFetch,
    getFacebookCredentials: async () => ({
      pageId: "123456789",
      accessToken: "private-facebook-token",
      isEnabled: true,
    }),
  }),
  /معرّف منشور Facebook غير صالح/,
);

console.log("Social remote deletion tests passed.");
