import assert from "node:assert/strict";
import { resolveYouTubeVideoDisclosure } from "../../src/features/social/services/youtube-video-disclosure";
import { readFileSync } from "node:fs";
import { getYouTubeRefreshToken, getYouTubeUploadRefreshToken, hasYouTubeUploadScopes, matchesConfiguredYouTubeChannel } from "../../src/features/social/services/youtube-oauth-credentials";

assert.equal(matchesConfiguredYouTubeChannel("UC123", "UC123"), true, "stored provider ID must match the configured YouTube channel");
assert.equal(matchesConfiguredYouTubeChannel("UC123", "UC999"), false, "a token for a different channel must fail closed");
assert.equal(matchesConfiguredYouTubeChannel("", "UC123"), false, "missing stored provider ID must fail closed");

const originalConfiguredChannelId = process.env.YOUTUBE_CHANNEL_ID;
try {
  // The default parameter intentionally reads the process environment. Keep
  // this contract deterministic even when CI injects a real channel ID.
  delete process.env.YOUTUBE_CHANNEL_ID;
  assert.equal(matchesConfiguredYouTubeChannel("UC123"), true, "a verified stored channel remains usable when no channel override is configured");
  process.env.YOUTUBE_CHANNEL_ID = "UC999";
  assert.equal(matchesConfiguredYouTubeChannel("UC123"), false, "the default channel override must reject a credential for a different channel");
} finally {
  if (originalConfiguredChannelId === undefined) {
    delete process.env.YOUTUBE_CHANNEL_ID;
  } else {
    process.env.YOUTUBE_CHANNEL_ID = originalConfiguredChannelId;
  }
}

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

const requiredUploadScopes = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
];
assert.equal(hasYouTubeUploadScopes(requiredUploadScopes), true, "publishing requires upload plus read and analytics scopes");
assert.equal(
  hasYouTubeUploadScopes([...requiredUploadScopes, "https://www.googleapis.com/auth/youtube"]),
  false,
  "a full YouTube management scope must not be accepted for upload-only publishing",
);
assert.equal(
  hasYouTubeUploadScopes([...requiredUploadScopes, "https://www.googleapis.com/auth/youtube.force-ssl"]),
  false,
  "the delete-capable YouTube force-SSL scope must never be accepted for publishing",
);
assert.deepEqual(
  resolveYouTubeVideoDisclosure({
    content: { audience: "kids", aiProvider: "template" },
    provider: "template",
    queueMetadata: { audience: "general" },
  }),
  { selfDeclaredMadeForKids: true, containsSyntheticMedia: false },
  "the canonical Kids marker must win over a conflicting queue marker",
);
assert.deepEqual(
  resolveYouTubeVideoDisclosure({
    content: {},
    provider: "hf_wan",
    queueMetadata: { audience: "kids" },
  }),
  { selfDeclaredMadeForKids: true, containsSyntheticMedia: true },
  "legacy Kids content must retain its queue audience and AI-provider disclosure",
);
assert.deepEqual(
  resolveYouTubeVideoDisclosure({
    content: { audience: "general", aiProvider: "template" },
    provider: "template",
    queueMetadata: { audience: "general" },
  }),
  { selfDeclaredMadeForKids: false, containsSyntheticMedia: false },
  "verified general template content must not be mislabeled as synthetic",
);
assert.deepEqual(
  resolveYouTubeVideoDisclosure({
    content: { audience: "general" },
    provider: null,
    queueMetadata: {},
  }),
  { selfDeclaredMadeForKids: false, containsSyntheticMedia: true },
  "unknown provider provenance must be disclosed conservatively",
);

assert.equal(hasYouTubeUploadScopes(requiredUploadScopes.filter((scope) => scope !== "https://www.googleapis.com/auth/youtube.upload")), false, "read-only credentials must not be accepted for publishing");
assert.equal(hasYouTubeUploadScopes(requiredUploadScopes.filter((scope) => scope !== "https://www.googleapis.com/auth/yt-analytics.readonly")), false, "publishing credential must retain the full verified scope contract");

assert.equal(
  await getYouTubeUploadRefreshToken(async () => "stored-upload-token"),
  "stored-upload-token",
  "publisher may use only the upload-scoped stored credential",
);
assert.equal(
  await getYouTubeUploadRefreshToken(async () => null),
  null,
  "missing upload-scoped credentials must fail closed",
);
assert.equal(
  await getYouTubeUploadRefreshToken(async () => { throw new Error("database unavailable"); }),
  null,
  "credential-store errors must fail closed",
);

const credentialSource = readFileSync(
  new URL("../../src/features/social/services/youtube-oauth-credentials.ts", import.meta.url),
  "utf8",
);
assert.equal(
  (credentialSource.match(/matchesConfiguredYouTubeChannel\(row\?\.channel_id\)/g) ?? []).length,
  2,
  "analytics and publishing credentials must both validate the stored channel identity",
);
assert.equal(
  (credentialSource.match(/select=refresh_token,granted_scopes,channel_id/g) ?? []).length,
  2,
  "analytics and publishing credential reads must load the provider channel ID",
);
assert.match(credentialSource, /YOUTUBE_DELETE_CAPABLE_SCOPES/, "upload credentials must explicitly reject delete-capable YouTube scopes");
assert.match(credentialSource, /if \(!hasYouTubeUploadScopes\(credential\.grantedScopes\)\)/, "the credential store must reject over-privileged scopes before persistence");
assert.match(credentialSource, /connectedBy: string/, "saving a YouTube OAuth credential must require an authenticated actor");
assert.ok(credentialSource.includes("connected_by: connectedBy"), "the credential row must retain the authenticated actor ID");
const youtubeCallbackSource = readFileSync(
  new URL("../../src/app/api/admin/social/youtube/callback/route.ts", import.meta.url),
  "utf8",
);
assert.match(youtubeCallbackSource, /hasYouTubeUploadScopes\(scopes\)/, "OAuth callback must reject a grant that includes delete-capable scopes");
const credentialSaveStart = youtubeCallbackSource.indexOf("await saveYouTubeOAuthCredential(");
const credentialSaveEnd = youtubeCallbackSource.indexOf(");", credentialSaveStart);
assert.ok(credentialSaveStart >= 0 && credentialSaveEnd > credentialSaveStart, "YouTube OAuth callback must persist its verified credential");
assert.ok(
  youtubeCallbackSource.slice(credentialSaveStart, credentialSaveEnd).includes("auth.profile.id"),
  "YouTube OAuth callback must persist the admin who completed the connection",
);

const socialPublisherSource = readFileSync(
  new URL("../../src/features/social/services/social-publishing.ts", import.meta.url),
  "utf8",
);
assert.match(socialPublisherSource, /getYouTubeUploadRefreshToken/);
assert.match(socialPublisherSource, /select=content,provider/);
assert.match(socialPublisherSource, /queueMetadata: item\.metadata/);

assert.doesNotMatch(socialPublisherSource, /getYouTubeRefreshToken/, "publishing must not use the read-only analytics credential getter");

const environmentExample = readFileSync(
  new URL("../../.env.example", import.meta.url),
  "utf8",
);
assert.match(
  environmentExample,
  /# Visibility for automatic YouTube uploads: public, unlisted, or private/,
  ".env.example must describe the active YOUTUBE_UPLOAD_PRIVACY setting accurately",
);
assert.doesNotMatch(
  environmentExample,
  /YOUTUBE_UPLOAD_PRIVACY[\s\S]{0,100}ignored/i,
  "the active upload privacy setting must not be labelled as ignored",
);

const trafficRevenuePanel = readFileSync(
  new URL("../../src/features/admin/components/traffic-revenue-panel.tsx", import.meta.url),
  "utf8",
);
assert.doesNotMatch(
  trafficRevenuePanel,
  /YOUTUBE_REFRESH_TOKEN/,
  "the Analytics UI must not tell owners to configure an ignored environment refresh token",
);
assert.match(trafficRevenuePanel, /youtube\.readonly/);
assert.match(trafficRevenuePanel, /yt-analytics\.readonly/);

const deploymentValidator = readFileSync(
  new URL("../../scripts/validate-deployment-env.mjs", import.meta.url),
  "utf8",
);
assert.doesNotMatch(
  deploymentValidator,
  /^\s*"YOUTUBE_REFRESH_TOKEN",?$/m,
  "the deployment validator must not warn that an intentionally ignored token is an optional integration",
);

console.log("YouTube OAuth read-only and upload-scope credential tests passed.");
