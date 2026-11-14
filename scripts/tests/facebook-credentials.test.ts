import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildFacebookPublicProfileIdentityUpsert,
  buildFacebookPublicProfileSyncUpsert,
} from "../../src/features/social/services/facebook-profile-contract";
import { buildNextRowVersionUpdatedAt } from "../../src/lib/supabase/row-version";
import {
  FACEBOOK_REQUIRED_PUBLISH_PERMISSIONS,
  FACEBOOK_REQUESTED_PERMISSIONS,
  findFacebookPageAcrossPages,
  hasFacebookInsightsPermission,
  hasFacebookPublishingPermissions,
} from "../../src/features/social/services/facebook-oauth-policy";
import {
  buildFacebookCredentialValidationFilter,
  readStoredFacebookCredential,
} from "../../src/features/social/services/facebook-credentials";

const publishOnlyScopes = ["pages_show_list", "pages_read_engagement", "pages_manage_posts"];
assert.deepEqual(FACEBOOK_REQUIRED_PUBLISH_PERMISSIONS, publishOnlyScopes);
assert.ok(FACEBOOK_REQUESTED_PERMISSIONS.includes("read_insights"));
assert.equal(hasFacebookPublishingPermissions(publishOnlyScopes), true);
assert.equal(hasFacebookInsightsPermission(publishOnlyScopes), false);
assert.equal(hasFacebookPublishingPermissions([...publishOnlyScopes, "read_insights"]), true);
assert.equal(hasFacebookInsightsPermission([...publishOnlyScopes, "read_insights"]), true);

const facebookPageAfterRequests: Array<string | undefined> = [];
const configuredFacebookPage = await findFacebookPageAcrossPages(async (after) => {
  facebookPageAfterRequests.push(after);
  if (!after) {
    return {
      data: [{ id: "page-first" }],
      paging: { next: "https://graph.facebook.com/v26.0/me/accounts?after=page-cursor-two" },
    };
  }
  return { data: [{ id: "page-configured" }] };
}, "page-configured");
assert.equal(configuredFacebookPage.page?.id, "page-configured");
assert.equal(configuredFacebookPage.complete, true);
assert.equal(configuredFacebookPage.pagesFetched, 2);
assert.deepEqual(facebookPageAfterRequests, [undefined, "page-cursor-two"]);

const multipleFacebookPages = await findFacebookPageAcrossPages(async (after) => (
  after
    ? { data: [{ id: "page-second" }] }
    : {
        data: [{ id: "page-first" }],
        paging: { cursors: { after: "page-cursor-two" }, next: "https://graph.facebook.com/v26.0/me/accounts?after=page-cursor-two" },
      }
));
assert.equal(multipleFacebookPages.page, null);
assert.equal(multipleFacebookPages.multiplePages, true);
assert.equal(multipleFacebookPages.complete, true, "pages on later cursors must still require explicit selection");

const incompleteFacebookPageLookup = await findFacebookPageAcrossPages(
  async () => ({
    data: [{ id: "page-first" }],
    paging: { next: "https://graph.facebook.com/v26.0/me/accounts?after=page-cursor-two" },
  }),
  "page-not-on-scanned-pages",
  1,
);
assert.equal(incompleteFacebookPageLookup.page, null);
assert.equal(incompleteFacebookPageLookup.complete, false, "a bounded scan must not falsely report a configured Page as missing");

assert.equal(
  hasFacebookPublishingPermissions(["pages_show_list", "pages_read_engagement", "read_insights"]),
  false,
  "missing a required publishing permission must still block Facebook publishing",
);

const validCredential = {
  page_id: "page 123",
  updated_at: "2026-11-12T18:00:00.000Z",
};

assert.equal(
  buildFacebookCredentialValidationFilter(validCredential),
  "platform=eq.facebook&page_id=eq.page%20123&updated_at=eq.2026-11-12T18%3A00%3A00.000Z",
  "validation writes must target the exact Page and row revision",
);
assert.equal(buildFacebookCredentialValidationFilter({ page_id: " ", updated_at: validCredential.updated_at }), null);
assert.equal(buildFacebookCredentialValidationFilter({ page_id: "123", updated_at: null }), null);
assert.equal(buildFacebookCredentialValidationFilter({ page_id: "123", updated_at: "not-a-date" }), null);
assert.equal(
  buildNextRowVersionUpdatedAt("2026-11-13T01:30:00.123Z", new Date("2026-11-13T01:30:00.123Z")),
  "2026-11-13T01:30:00.124Z",
  "a same-millisecond Facebook validation write must advance its CAS row-version token",
);

const paths: string[] = [];
const emptyRequest = async <T,>(path: string): Promise<T> => {
  paths.push(path);
  return [] as unknown as T;
};
assert.equal(await readStoredFacebookCredential(emptyRequest), null);
assert.match(paths[0] ?? "", /facebook_reels_next_allowed_at/);

let fallbackCalls = 0;
const fallbackPaths: string[] = [];
const missingColumnRequest = async <T,>(path: string): Promise<T> => {
  fallbackCalls += 1;
  fallbackPaths.push(path);
  if (fallbackCalls === 1) {
    throw new Error('42703 column "facebook_reels_next_allowed_at" does not exist');
  }
  return [] as unknown as T;
};
assert.equal(await readStoredFacebookCredential(missingColumnRequest), null);
assert.equal(fallbackCalls, 2);
assert.doesNotMatch(fallbackPaths[1] ?? "", /facebook_reels_next_allowed_at/);

const malformedRequest = async <T,>(): Promise<T> => ({ unexpected: true }) as T;
await assert.rejects(
  readStoredFacebookCredential(malformedRequest),
  /Facebook credential query returned an invalid row set/,
);
let legacyCall = 0;
const malformedLegacyRequest = async <T,>(): Promise<T> => {
  legacyCall += 1;
  if (legacyCall === 1) {
    throw new Error('42703 column "facebook_reels_next_allowed_at" does not exist');
  }
  return { unexpected: true } as T;
};
await assert.rejects(
  readStoredFacebookCredential(malformedLegacyRequest),
  /Legacy Facebook credential query returned an invalid row set/,
);

const networkErrorRequest = async <T,>(): Promise<T> => {
  throw new Error("facebook credential network failure");
};
await assert.rejects(readStoredFacebookCredential(networkErrorRequest), /facebook credential network failure/);

const source = readFileSync("src/features/social/services/facebook-credentials.ts", "utf8");
const persistStart = source.indexOf("async function persistValidation");
const persistEnd = source.indexOf("export async function getFacebookPageConnectionHealth", persistStart);
assert.ok(persistStart >= 0 && persistEnd > persistStart, "persistValidation must remain a bounded helper");
const persistSource = source.slice(persistStart, persistEnd);
assert.match(persistSource, /buildFacebookCredentialValidationFilter\(credential\)/);
assert.match(persistSource, /if \(!filter \|\| !updatedAt\) return;/);
assert.doesNotMatch(persistSource, /social_platform_credentials\?platform=eq\.facebook/);
assert.match(persistSource, /updated_at: buildNextRowVersionUpdatedAt\(updatedAt\)/);
assert.doesNotMatch(persistSource, /updated_at: new Date\(\)\.toISOString\(\)/);


const identityPayload = buildFacebookPublicProfileIdentityUpsert({
  pageId: "123456789012345",
  pageName: "ZIKR Official",
  updatedAt: "2026-11-13T14:08:00.000Z",
});
assert.deepEqual(identityPayload, {
  platform: "facebook",
  external_id: "123456789012345",
  name: "ZIKR Official",
  page_url: "https://www.facebook.com/123456789012345",
  status: "ok",
  last_error: null,
  updated_at: "2026-11-13T14:08:00.000Z",
});
const changedPageIdentity = buildFacebookPublicProfileIdentityUpsert({
  pageId: "987654321098765",
  pageName: "New ZIKR Page",
  updatedAt: "2026-11-13T14:09:00.000Z",
  previousPageId: "123456789012345",
});
assert.equal(changedPageIdentity.external_id, "987654321098765");
assert.equal(changedPageIdentity.followers_count, null);
assert.equal(changedPageIdentity.likes_count, null);
assert.equal(changedPageIdentity.avatar_url, null);
assert.equal(changedPageIdentity.cover_url, null);
assert.equal(changedPageIdentity.synced_at, null);
const unknownPreviousIdentity = buildFacebookPublicProfileIdentityUpsert({
  pageId: "987654321098765",
  pageName: "New ZIKR Page",
  updatedAt: "2026-11-13T14:09:00.000Z",
  previousPageId: null,
});
assert.equal(unknownPreviousIdentity.followers_count, null, "an existing row without a Page ID must not leak its previous metrics");

const preservedProfile = buildFacebookPublicProfileSyncUpsert({
  pageId: "123456789012345",
  name: null,
  description: null,
  category: null,
  website: null,
  avatarUrl: null,
  coverUrl: null,
  pageUrl: null,
  followersCount: null,
  likesCount: undefined,
  fallbackAvatar: "https://graph.facebook.com/123456789012345/picture?type=large",
  syncedAt: "2026-11-13T14:10:00.000Z",
  cached: {
    name: "ZIKR Official",
    description: "Existing page description",
    category: "Community",
    website: "https://zikrmediaofficial.vercel.app",
    avatarUrl: "https://graph.facebook.com/123456789012345/picture?type=large",
    coverUrl: "https://scontent.xx.fbcdn.net/v/t39.30808-6/987654321_987654321098765_9876543210987654321_n.jpg",
    pageUrl: "https://www.facebook.com/123456789012345",
    followersCount: 1234,
    likesCount: 567,
  },
});
assert.equal(preservedProfile.name, "ZIKR Official");
assert.equal(preservedProfile.description, "Existing page description");
assert.equal(preservedProfile.category, "Community");
assert.equal(preservedProfile.website, "https://zikrmediaofficial.vercel.app");
assert.equal(preservedProfile.avatar_url, "https://graph.facebook.com/123456789012345/picture?type=large");
assert.equal(preservedProfile.cover_url, "https://scontent.xx.fbcdn.net/v/t39.30808-6/987654321_987654321098765_9876543210987654321_n.jpg");
assert.equal(preservedProfile.followers_count, 1234);
assert.equal(preservedProfile.likes_count, 567);

const refreshedProfile = buildFacebookPublicProfileSyncUpsert({
  pageId: "123456789012345",
  name: "ZIKR Official Updated",
  followersCount: 1300,
  likesCount: 600,
  fallbackAvatar: "https://graph.facebook.com/123456789012345/picture?type=large",
  syncedAt: "2026-11-13T14:11:00.000Z",
  cached: { name: "ZIKR Official", followersCount: 1234, likesCount: 567 },
});
assert.equal(refreshedProfile.name, "ZIKR Official Updated");
assert.equal(refreshedProfile.followers_count, 1300);
assert.equal(refreshedProfile.likes_count, 600);

const facebookIntegration = readFileSync(
  resolve("src/features/social/integrations/facebook.ts"),
  "utf8",
);
assert.match(facebookIntegration, /String\(row\.external_id \?\? ''\) !== pageId/);
assert.match(facebookIntegration, /buildFacebookPublicProfileSyncUpsert/);
assert.match(facebookIntegration, /cached\?\.followingCount/);

const profileSaveStart = source.indexOf("export async function saveFacebookPublicProfile(");
const profileSaveEnd = source.indexOf("export async function getFacebookPublicProfile(", profileSaveStart);
const profileSaveSource = profileSaveStart >= 0 && profileSaveEnd > profileSaveStart
  ? source.slice(profileSaveStart, profileSaveEnd)
  : "";
assert.ok(profileSaveSource.includes("buildFacebookPublicProfileIdentityUpsert"));
assert.doesNotMatch(
  profileSaveSource,
  /(?:followers_count|likes_count|avatar_url|cover_url|description|website|handle|synced_at):\s*(?:null|""|'')/,
  "Facebook OAuth identity refresh must not erase existing profile metrics, artwork, or descriptive data",
);

const youtubeSource = readFileSync("src/features/videos/integrations/youtube.ts", "utf8");
const channelProfileStart = youtubeSource.indexOf("const channelProfile =");
const channelProfileEnd = youtubeSource.indexOf("const videos = await readCachedVideos", channelProfileStart);
const channelProfileSource = channelProfileStart >= 0 && channelProfileEnd > channelProfileStart
  ? youtubeSource.slice(channelProfileStart, channelProfileEnd)
  : "";
assert.ok(channelProfileSource.length > 0, "YouTube channel profile upsert must remain discoverable");
assert.doesNotMatch(
  channelProfileSource,
  /(?:website|cover_url|followers_count|likes_count|following_count):\s*null/,
  "YouTube sync must omit profile fields it does not fetch so existing values survive upserts",
);

console.log("Facebook credential row-shape and validation CAS checks passed.");
