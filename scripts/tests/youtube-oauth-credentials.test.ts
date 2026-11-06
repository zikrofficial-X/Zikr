import assert from "node:assert/strict";
import { getYouTubeRefreshToken } from "../../src/features/social/services/youtube-oauth-credentials";

const legacyEnv = { YOUTUBE_REFRESH_TOKEN: "legacy-upload-capable-token" };

assert.equal(
  await getYouTubeRefreshToken(legacyEnv, async () => "stored-read-only-token"),
  "stored-read-only-token",
  "only the newly authorized stored read-only credential may be used",
);

assert.equal(
  await getYouTubeRefreshToken(legacyEnv, async () => null),
  null,
  "legacy environment tokens with unknown scopes must never be used for analytics",
);

assert.equal(
  await getYouTubeRefreshToken(legacyEnv, async () => {
    throw new Error("database unavailable");
  }),
  null,
  "a credential-store failure must fail closed rather than falling back to an unknown token",
);

assert.equal(
  await getYouTubeRefreshToken({ YOUTUBE_REFRESH_TOKEN: "  " }, async () => null),
  null,
  "blank credentials must be treated as unconfigured",
);

console.log("YouTube read-only OAuth credential tests passed.");
