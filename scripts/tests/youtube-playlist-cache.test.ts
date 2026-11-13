import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeCachedYoutubePlaylists } from "../../src/features/videos/integrations/youtube";

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


assert.match(
  source,
  /async function readCachedChannel\\(channelId: string\\)[\\s\\S]*?\\.eq\\('external_id', channelId\\)/,
  "cached YouTube channel metadata must be scoped to the configured channel ID",
);
assert.match(
  source,
  /readCachedChannel\\(YOUTUBE_CHANNEL_ID\\)/,
  "the feed cache must reject a profile belonging to a previously configured channel",
);
assert.match(
  source,
  /readCachedChannel\\(channelId\\)/,
  "sync fallback paths must only return a profile matching the resolved channel ID",
);

console.log("YouTube playlist cache contracts passed.");
