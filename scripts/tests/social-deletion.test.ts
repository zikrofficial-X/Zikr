import assert from "node:assert/strict";
import { deleteSocialPlatformPost } from "../../src/features/social/services/social-deletion";
import { claimSocialQueuePlatformDeletion } from "../../src/features/social/services/social-queue-metadata";
import { LOCAL_SOCIAL_QUEUE_DELETE_BATCH_LIMIT, canDeleteLocalSocialQueueItem } from "../../src/features/social/services/platform-availability";
import { readFileSync } from "node:fs";

const socialClient = readFileSync("src/app/admin/social/social-client.tsx", "utf8");
assert.match(
  socialClient,
  /const confirmation = `تأكيد الحذف النهائي من \$\{targetText\}؟[\s\S]*?سجل النشر والتدقيق محفوظة\.`;\s*if \(!window\.confirm\(confirmation\)\) return;/,
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

const deletionQueueRow: {
  id: string;
  status: string;
  video_url: string | null;
  metadata: Record<string, unknown>;
  updated_at: string;
} = {
  id: "queue-delete-1",
  status: "published",
  video_url: "https://cdn.example.test/published.mp4",
  metadata: { platformDeletions: {} },
  updated_at: "2026-11-12T18:00:00.000Z",
};
const deletionClaimCalls: Array<{ path: string; init?: RequestInit }> = [];
const deletionClaimRequest = async <T>(path: string, init?: RequestInit): Promise<T> => {
  deletionClaimCalls.push({ path, init });
  if (!init) return [{ ...deletionQueueRow, metadata: { ...deletionQueueRow.metadata } }] as T;
  if (init.method !== "PATCH") throw new Error("Unexpected deletion-claim method.");
  const expectedVersion = encodeURIComponent(deletionQueueRow.updated_at);
  if (!path.includes("updated_at=eq." + expectedVersion)) return [] as T;
  const payload = JSON.parse(String(init.body)) as { metadata: Record<string, unknown>; updated_at: string };
  deletionQueueRow.metadata = payload.metadata;
  deletionQueueRow.updated_at = payload.updated_at;
  return [{ id: deletionQueueRow.id }] as T;
};
const deletionClaimInput = {
  id: deletionQueueRow.id,
  expectedStatus: "published",
  expectedVideoUrl: deletionQueueRow.video_url,
  platform: "youtube",
  now: new Date("2026-11-12T18:00:00.000Z"),
};
const deletionClaimRequestTyped = deletionClaimRequest as typeof import("../../src/lib/supabase/admin-rest").supabaseServerAdminRequest;
assert.equal(
  await claimSocialQueuePlatformDeletion(deletionClaimInput, deletionClaimRequestTyped),
  "claimed",
  "the first administrator must atomically reserve the platform deletion before calling the provider",
);
assert.equal(
  await claimSocialQueuePlatformDeletion(deletionClaimInput, deletionClaimRequestTyped),
  "in_progress",
  "a concurrent administrator must observe the reservation and must not send a second provider delete",
);
assert.equal(
  deletionClaimCalls.filter((call) => call.init?.method === "PATCH").length,
  1,
  "only one competing deletion request may acquire the row-version reservation",
);
assert.equal(
  ((deletionQueueRow.metadata.platformDeletions as Record<string, Record<string, unknown>>).youtube).status,
  "deleting",
  "the durable reservation must remain until the provider outcome is persisted",
);

const alreadyDeletedRequest = async <T>(): Promise<T> => [{
  ...deletionQueueRow,
  metadata: { platformDeletions: { youtube: { status: "deleted" } } },
}] as T;
assert.equal(
  await claimSocialQueuePlatformDeletion(deletionClaimInput, alreadyDeletedRequest as typeof import("../../src/lib/supabase/admin-rest").supabaseServerAdminRequest),
  "already_deleted",
  "a confirmed remote deletion must never be claimed again",
);

const staleQueueRow = {
  ...deletionQueueRow,
  metadata: { platformDeletions: {} },
  updated_at: "2026-11-12T18:00:00.000Z",
};
const staleClaimRequest = async <T>(path: string, init?: RequestInit): Promise<T> => {
  if (!init) return [{ ...staleQueueRow, metadata: { ...staleQueueRow.metadata } }] as T;
  staleQueueRow.updated_at = "2026-11-12T18:00:00.010Z";
  return [] as T;
};
assert.equal(
  await claimSocialQueuePlatformDeletion(deletionClaimInput, staleClaimRequest as typeof import("../../src/lib/supabase/admin-rest").supabaseServerAdminRequest),
  "stale",
  "a concurrent queue edit must win the CAS and prevent a remote deletion from starting",
);



assert.equal(LOCAL_SOCIAL_QUEUE_DELETE_BATCH_LIMIT, 50, "local queue cleanup must remain bounded to a small, auditable batch");

const safeFailedQueueItem = {
  status: "failed",
  target_platforms: ["facebook", "youtube"],
  error_message: "The providers rejected the requests.",
  metadata: {
    platformResults: {
      facebook: { ok: false, error: "Facebook rejected the post (HTTP 400)." },
      youtube: { ok: false, error: "YouTube rejected the video (HTTP 422)." },
    },
  },
};
assert.equal(
  canDeleteLocalSocialQueueItem(safeFailedQueueItem),
  true,
  "a wholly failed row with an explicit non-ambiguous failure for every target can be removed from the local queue",
);
assert.equal(
  canDeleteLocalSocialQueueItem({
    status: "failed",
    target_platforms: ["youtube"],
    error_message: null,
    metadata: { unavailablePlatforms: ["youtube"], platformResults: {} },
  }),
  true,
  "a target explicitly marked unavailable was never sent to a provider and may be cleaned up",
);
assert.equal(
  canDeleteLocalSocialQueueItem({
    status: "partial",
    target_platforms: ["facebook", "youtube"],
    error_message: "One provider failed.",
    metadata: {
      platformResults: {
        facebook: { ok: true, remoteId: "1234567890123456" },
        youtube: { ok: false, error: "HTTP 422 rejected." },
      },
    },
  }),
  false,
  "partial rows must retain their queue IDs even when one provider result failed",
);
assert.equal(
  canDeleteLocalSocialQueueItem({
    status: "failed",
    target_platforms: ["youtube"],
    error_message: null,
    metadata: { platformResults: { youtube: { ok: true, remoteId: "FKQ4tsQOtTs" } } },
  }),
  false,
  "a recorded successful remote post must never be orphaned by local queue cleanup",
);
assert.equal(
  canDeleteLocalSocialQueueItem({
    status: "failed",
    target_platforms: ["youtube"],
    error_message: "fetch failed",
    metadata: { platformResults: { youtube: { ok: false, error: "fetch failed", requiresReconciliation: true } } },
  }),
  false,
  "ambiguous provider outcomes must remain available for manual reconciliation",
);
assert.equal(
  canDeleteLocalSocialQueueItem({
    status: "failed",
    target_platforms: ["youtube", "facebook"],
    error_message: null,
    metadata: { platformResults: { youtube: { ok: false, error: "HTTP 422 rejected." } } },
  }),
  false,
  "missing per-platform outcomes must fail closed instead of deleting an incomplete audit record",
);
assert.equal(
  canDeleteLocalSocialQueueItem({
    status: "failed",
    target_platforms: ["youtube"],
    error_message: null,
    metadata: { sourceMediaMissing: true, platformResults: { youtube: { ok: false, error: "HTTP 422 rejected." } } },
  }),
  false,
  "missing source media requires a separate reconciliation path and cannot be erased by queue cleanup",
);

const socialAdminRoute = readFileSync("src/app/api/admin/social/route.ts", "utf8");
assert.match(socialAdminRoute, /getLocalSocialQueueDeletionBlockers/);
assert.match(socialAdminRoute, /confirmedNoRemotePublication/);
const remoteDeleteActionStart = socialAdminRoute.indexOf('if (action === "delete_published") {');
const remoteDeleteConfirmationGuard = socialAdminRoute.indexOf("if (body.confirmed !== true)", remoteDeleteActionStart);
const firstRemoteDeleteCall = socialAdminRoute.indexOf("deleteSocialPlatformPost(", remoteDeleteActionStart);
assert.ok(
  remoteDeleteActionStart >= 0 &&
    remoteDeleteConfirmationGuard > remoteDeleteActionStart &&
    firstRemoteDeleteCall > remoteDeleteConfirmationGuard,
  "the server must reject remote social deletion before any provider call unless the request carries explicit confirmation",
);
assert.match(
  readFileSync("src/app/admin/social/social-client.tsx", "utf8"),
  /JSON\.stringify\(\{ action: "delete_published", ids, platforms, confirmed: true \}\)/,
  "the admin UI must send the server-validated confirmation only after its explicit confirmation dialog",
);
assert.match(socialAdminRoute, /updated_at=eq\.\$\{encodeURIComponent\(expectedUpdatedAt\)\}/);
assert.match(socialAdminRoute, /status=eq\.failed&updated_at=eq/);
assert.match(
  socialAdminRoute,
  /retry_all_failed[\s\S]*?id=in\.\(.*?ids\.map\(encodeURIComponent\)/,
  "bulk retry must be scoped to the IDs shown in the admin queue",
);
assert.doesNotMatch(
  socialAdminRoute,
  /social_publish_queue\?status=in\.\(failed,partial\)&select=id[\s\S]*?method: "DELETE"/,
  "the API must not expose an unbounded failed/partial queue delete",
);
const socialAdminClient = readFileSync("src/app/admin/social/social-client.tsx", "utf8");
assert.match(socialAdminClient, /localDeletable\.slice\(0, LOCAL_SOCIAL_QUEUE_DELETE_BATCH_LIMIT\)\.map\(item => item\.id\)/);
assert.match(socialAdminClient, /retryable\.map\(item => item\.id\)/);
assert.match(socialAdminClient, /حذف الفاشلة الآمنة/);
assert.match(socialAdminClient, /confirmedNoRemotePublication = true/);
assert.equal(
  canDeleteLocalSocialQueueItem({
    status: "failed",
    target_platforms: ["youtube"],
    error_message: null,
  }),
  false,
  "a failed queue row without metadata must be preserved because per-platform outcomes cannot be verified",
);
