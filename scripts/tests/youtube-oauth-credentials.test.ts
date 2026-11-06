import assert from "node:assert/strict";
import { getYouTubeRefreshToken } from "../../src/features/social/services/youtube-oauth-credentials";

const env = { YOUTUBE_REFRESH_TOKEN: "legacy-environment-refresh-token" };

assert.equal(
  await getYouTubeRefreshToken(env, async () => "stored-read-enabled-token"),
  "stored-read-enabled-token",
  "newly authorized Supabase credential must take precedence over the legacy upload-only token",
);

assert.equal(
  await getYouTubeRefreshToken(env, async () => null),
  "legacy-environment-refresh-token",
  "the environment token must remain a rollback fallback before OAuth reconnection",
);

assert.equal(
  await getYouTubeRefreshToken(env, async () => {
    throw new Error("database unavailable");
  }),
  "legacy-environment-refresh-token",
  "a transient credential-store failure must not break the legacy publishing path",
);

assert.equal(
  await getYouTubeRefreshToken({ YOUTUBE_REFRESH_TOKEN: "  " }, async () => null),
  null,
  "blank credentials must be treated as unconfigured",
);

console.log("YouTube OAuth credential precedence and fallback tests passed.");
