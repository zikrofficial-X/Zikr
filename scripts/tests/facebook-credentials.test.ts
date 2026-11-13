import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildFacebookPublicProfileIdentityUpsert } from "../../src/features/social/services/facebook-profile-contract";
import { buildNextRowVersionUpdatedAt } from "../../src/lib/supabase/row-version";
import {
  buildFacebookCredentialValidationFilter,
  readStoredFacebookCredential,
} from "../../src/features/social/services/facebook-credentials";

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
const channelProfileEnd = youtubeSource.indexOf("const cacheRows", channelProfileStart);
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
