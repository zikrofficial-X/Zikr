import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildYoutubeSyncAttemptState,
  getCachedPlaylistsForChannel,
  normalizeCachedYoutubePlaylists,
} from "../../src/features/videos/integrations/youtube";

const normalized = normalizeCachedYoutubePlaylists([
  {
    id: "PL-valid",
    title: "  قائمة ZIKR  ",
    description: "وصف القائمة",
    thumbnailUrl: "https://i.ytimg.com/vi/example/default.jpg",
    itemCount: 12,
  },
  {
    id: "PL-valid",
    title: "Duplicate",
    description: "",
    thumbnailUrl: null,
    itemCount: 1,
  },
  { id: "", title: "Missing id" },
  { id: "PL-invalid-title", title: 42 },
  {
    id: "PL-invalid-url",
    title: "Safe title",
    thumbnailUrl: "javascript:alert(1)",
    itemCount: -1,
  },
]);

assert.deepEqual(normalized, [
  {
    id: "PL-valid",
    title: "قائمة ZIKR",
    description: "وصف القائمة",
    thumbnailUrl: "https://i.ytimg.com/vi/example/default.jpg",
    itemCount: 12,
  },
  {
    id: "PL-invalid-url",
    title: "Safe title",
    description: "",
    thumbnailUrl: null,
    itemCount: null,
  },
]);
assert.deepEqual(normalizeCachedYoutubePlaylists(null), []);
assert.deepEqual(normalizeCachedYoutubePlaylists({ items: [] }), []);

const priorChannelState = {
  channel_id: "UC-previous-channel",
  playlists: normalized,
};
assert.deepEqual(
  getCachedPlaylistsForChannel(priorChannelState, "UC-new-channel"),
  [],
  "a changed YouTube channel must not inherit the previous channel's playlist cache",
);
assert.deepEqual(
  getCachedPlaylistsForChannel(priorChannelState, "UC-previous-channel"),
  normalized,
  "the current channel must retain its own successful playlist cache",
);
const switchedChannelLock = buildYoutubeSyncAttemptState({
  channelId: "UC-new-channel",
  attemptedAt: "2026-11-13T12:00:00.000Z",
  nextAllowedSyncAt: "2026-11-13T12:10:00.000Z",
  cachedPlaylists: getCachedPlaylistsForChannel(priorChannelState, "UC-new-channel"),
});
assert.deepEqual(
  switchedChannelLock.playlists,
  [],
  "the sync lock must persist an empty cache before a new channel sync can fail",
);
const sameChannelLock = buildYoutubeSyncAttemptState({
  channelId: "UC-previous-channel",
  attemptedAt: "2026-11-13T12:00:00.000Z",
  nextAllowedSyncAt: "2026-11-13T12:10:00.000Z",
  cachedPlaylists: getCachedPlaylistsForChannel(priorChannelState, "UC-previous-channel"),
});
assert.deepEqual(
  sameChannelLock.playlists,
  normalized,
  "a same-channel sync attempt must preserve its last successful playlist cache",
);


const source = readFileSync("src/features/videos/integrations/youtube.ts", "utf8");
const migration = readFileSync(
  "supabase/migrations/20261113200000_youtube_sync_state_playlist_cache.sql",
  "utf8",
);

assert.match(
  source,
  /select\('id,channel_id,status,last_attempted_at,last_success_at,next_allowed_sync_at,last_error,updated_at,playlists'\)/,
  "the sync-state read must include the persisted playlist snapshot",
);
assert.match(
  source,
  /playlists: health\.cachedPlaylists/,
  "cache hits and throttled/error responses must retain the last successful playlist snapshot",
);
assert.match(
  source,
  /lastAttemptedAt: sameChannel \? row\?\.last_attempted_at \?\? null : null/,
  "a channel change must not inherit the previous channel's sync cooldown",
);
assert.match(
  source,
  /status: 'ok',[\s\S]*?last_error: null, playlists \}/,
  "a successful sync must persist playlists with the cache TTL",
);
assert.match(
  migration,
  /ADD COLUMN IF NOT EXISTS playlists jsonb NOT NULL DEFAULT '\[\]'::jsonb/i,
  "the sync-state table must persist a non-null JSON playlist array",
);
assert.match(
  migration,
  /CHECK \(jsonb_typeof\(playlists\) = 'array'\)/i,
  "the playlist cache must remain a JSON array",
);


assert.ok(
  source.includes("async function readCachedChannel(channelId: string)") &&
    source.includes(".eq('external_id', channelId)"),
  "cached YouTube channel metadata must be scoped to the configured channel ID",
);
assert.ok(
  source.includes("readCachedChannel(YOUTUBE_CHANNEL_ID)"),
  "the feed cache must reject a profile belonging to a previously configured channel",
);
const syncLockStart = source.indexOf("const syncLockState = buildYoutubeSyncAttemptState({");
const syncLockEnd = source.indexOf("if (stateError)", syncLockStart);
const syncLockSource = syncLockStart >= 0 && syncLockEnd > syncLockStart
  ? source.slice(syncLockStart, syncLockEnd)
  : "";
assert.match(syncLockSource, /cachedPlaylists:\s*health\.cachedPlaylists/);
assert.match(syncLockSource, /\.upsert\(syncLockState\)/);

assert.ok(
  source.includes("readCachedChannel(channelId)"),
  "sync fallback paths must only return a profile matching the resolved channel ID",
);

console.log("YouTube playlist cache contracts passed.");
