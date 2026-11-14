import assert from "node:assert/strict";
import { resolveYouTubeVideoDisclosure } from "../../src/features/social/services/youtube-video-disclosure";
import { readFileSync } from "node:fs";
import { findYouTubeChannelAcrossPages, getYouTubeRefreshToken, getYouTubeUploadRefreshToken, hasYouTubeReadScopes, hasYouTubeUploadScopes, matchesConfiguredYouTubeChannel, readStoredYouTubeUploadRefreshToken, selectYouTubeChannel } from "../../src/features/social/services/youtube-oauth-credentials";
import { buildCanonicalOAuthStartRedirect } from "../../src/features/social/services/oauth-canonical-origin";

assert.equal(matchesConfiguredYouTubeChannel("UC123", "UC123"), true, "stored provider ID must match the configured YouTube channel");
assert.equal(matchesConfiguredYouTubeChannel("UC123", "UC999"), false, "a token for a different channel must fail closed");
assert.equal(matchesConfiguredYouTubeChannel("", "UC123"), false, "missing stored provider ID must fail closed");

const channelCandidates = [
  { id: "UC-first", snippet: { title: "First channel" } },
  { id: "UC-configured", snippet: { title: "Configured channel" } },
];
assert.equal(
  selectYouTubeChannel(channelCandidates, "UC-configured")?.id,
  "UC-configured",
  "OAuth must select the configured channel even when Google returns it after another managed channel",
);
assert.equal(
  selectYouTubeChannel(channelCandidates),
  null,
  "OAuth must not silently connect the first of multiple managed channels when no channel ID is configured",
);
assert.equal(
  selectYouTubeChannel([channelCandidates[0]])?.id,
  "UC-first",
  "a single unambiguous managed channel may be selected without an environment override",
);
assert.equal(
  selectYouTubeChannel(channelCandidates, "UC-missing"),
  null,
  "a configured channel that is not in the granted account channel list must fail closed",
);

const requestedPageTokens: Array<string | undefined> = [];
const paginatedConfiguredChannel = await findYouTubeChannelAcrossPages(async (pageToken) => {
  requestedPageTokens.push(pageToken);
  if (!pageToken) {
    return {
      items: [{ id: "UC-first" }],
      nextPageToken: "next-channel-page",
    };
  }
  return { items: [{ id: "UC-configured" }] };
}, "UC-configured");
assert.equal(paginatedConfiguredChannel.channel?.id, "UC-configured");
assert.equal(paginatedConfiguredChannel.complete, true);
assert.equal(paginatedConfiguredChannel.pagesFetched, 2);
assert.deepEqual(requestedPageTokens, [undefined, "next-channel-page"]);

const channelsAcrossPages = await findYouTubeChannelAcrossPages(async (pageToken) => (
  pageToken
    ? { items: [{ id: "UC-second" }] }
    : { items: [{ id: "UC-first" }], nextPageToken: "next-channel-page" }
));
assert.equal(channelsAcrossPages.channel, null);
assert.equal(channelsAcrossPages.multipleChannels, true);
assert.equal(channelsAcrossPages.complete, true, "a second channel on a later page must still require explicit selection");

const incompleteChannelLookup = await findYouTubeChannelAcrossPages(
  async () => ({ items: [{ id: "UC-first" }], nextPageToken: "next-channel-page" }),
  "UC-not-on-first-page",
  1,
);
assert.equal(incompleteChannelLookup.channel, null);
assert.equal(incompleteChannelLookup.complete, false, "a bounded scan must not falsely report a configured channel as missing");



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
assert.equal(hasYouTubeReadScopes(requiredUploadScopes.filter((scope) => scope !== "https://www.googleapis.com/auth/youtube.upload")), true, "analytics requires both read-only scopes");
assert.equal(
  hasYouTubeReadScopes([...requiredUploadScopes, "https://www.googleapis.com/auth/youtube"]),
  false,
  "analytics must reject a stored credential with full YouTube management scope",
);
assert.equal(
  hasYouTubeReadScopes([...requiredUploadScopes, "https://www.googleapis.com/auth/youtube.force-ssl"]),
  false,
  "analytics must reject a stored credential with delete-capable force-SSL scope",
);
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
assert.equal(
  hasYouTubeReadScopes([...requiredUploadScopes, "https://www.googleapis.com/auth/youtubepartner"]),
  false,
  "analytics must reject the YouTube partner scope because it carries delete-capable privileges",
);
assert.equal(
  hasYouTubeUploadScopes([...requiredUploadScopes, "https://www.googleapis.com/auth/youtubepartner"]),
  false,
  "upload credentials must reject the YouTube partner scope because it carries delete-capable privileges",
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
    content: {},
    provider: "template",
    queueMetadata: {},
    contentType: "kids_video",
  }),
  { selfDeclaredMadeForKids: true, containsSyntheticMedia: false },
  "the canonical Kids video queue type must protect legacy requests with missing audience metadata",
);
assert.deepEqual(
  resolveYouTubeVideoDisclosure({
    content: { audience: "general" },
    provider: "template",
    queueMetadata: { audience: "general" },
    contentType: "kids_video",
  }),
  { selfDeclaredMadeForKids: true, containsSyntheticMedia: false },
  "the explicit Kids video queue type must win over stale conflicting general-audience metadata",
);
assert.deepEqual(
  resolveYouTubeVideoDisclosure({
    content: {},
    provider: "template",
    queueMetadata: { publicPath: "/kids/series-one" },
    contentType: "other_video",
  }),
  { selfDeclaredMadeForKids: true, containsSyntheticMedia: false },
  "the canonical Kids public path must protect legacy Kids series videos whose audience marker is absent",
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

const uploadCredentialRow = {
  refresh_token: "stored-upload-token",
  granted_scopes: requiredUploadScopes,
  channel_id: "UC123",
};
const readUploadCredential = async <T>(): Promise<T> => [uploadCredentialRow] as T;
assert.equal(
  await readStoredYouTubeUploadRefreshToken(readUploadCredential, "UC123"),
  "stored-upload-token",
);
assert.equal(
  await readStoredYouTubeUploadRefreshToken(async <T>(): Promise<T> => [] as T, "UC123"),
  null,
  "a genuinely absent YouTube credential remains an unconfigured state",
);
await assert.rejects(
  readStoredYouTubeUploadRefreshToken(readUploadCredential, "UC999"),
  /does not match the configured channel/,
);
await assert.rejects(
  readStoredYouTubeUploadRefreshToken(
    async <T>(): Promise<T> => [{ ...uploadCredentialRow, granted_scopes: requiredUploadScopes.filter(scope => scope !== "https://www.googleapis.com/auth/youtube.upload") }] as T,
    "UC123",
  ),
  /missing the required upload\/read scopes/,
);
await assert.rejects(
  readStoredYouTubeUploadRefreshToken(
    async <T>(): Promise<T> => [{ ...uploadCredentialRow, refresh_token: " " }] as T,
    "UC123",
  ),
  /missing its refresh token/,
);
await assert.rejects(
  readStoredYouTubeUploadRefreshToken(async <T>(): Promise<T> => { throw new Error("database unavailable"); }, "UC123"),
  /database unavailable/,
);
await assert.rejects(
  getYouTubeUploadRefreshToken(async () => { throw new Error("database unavailable"); }),
  /database unavailable/,
  "credential-store errors must propagate so publishing can retry instead of treating the channel as absent",
);

const credentialSource = readFileSync(
  new URL("../../src/features/social/services/youtube-oauth-credentials.ts", import.meta.url),
  "utf8",
);
assert.match(
  credentialSource,
  /matchesConfiguredYouTubeChannel\(row\?\.channel_id\)/,
  "analytics credentials must validate the stored channel identity",
);
assert.match(
  credentialSource,
  /matchesConfiguredYouTubeChannel\(row\.channel_id,\s*configuredChannelId\)/,
  "upload credentials must validate the stored channel identity against the configured channel",
);
assert.equal(
  (credentialSource.match(/select=refresh_token,granted_scopes,channel_id/g) ?? []).length,
  2,
  "analytics and publishing credential reads must load the provider channel ID",
);
assert.match(credentialSource, /YOUTUBE_DELETE_CAPABLE_SCOPES/, "analytics and upload credentials must explicitly reject delete-capable YouTube scopes");
assert.match(credentialSource, /if \(!hasYouTubeReadScopes\(scopes\)\) return null/, "the analytics token reader must reject an over-privileged stored credential");
assert.match(credentialSource, /if \(!hasYouTubeUploadScopes\(credential\.grantedScopes\)\)/, "the credential store must reject over-privileged scopes before persistence");
assert.match(credentialSource, /connectedBy: string/, "saving a YouTube OAuth credential must require an authenticated actor");
assert.ok(credentialSource.includes("connected_by: connectedBy"), "the credential row must retain the authenticated actor ID");
const youtubeCallbackSource = readFileSync(
  new URL("../../src/app/api/admin/social/youtube/callback/route.ts", import.meta.url),
  "utf8",
);
assert.match(youtubeCallbackSource, /hasYouTubeUploadScopes\(scopes\)/, "OAuth callback must reject a grant that includes delete-capable scopes");
assert.match(youtubeCallbackSource, /findYouTubeChannelAcrossPages/, "OAuth callback must inspect paginated channel results");
assert.match(youtubeCallbackSource, /maxResults", "50"/, "OAuth callback must request the maximum channel page size");
assert.match(youtubeCallbackSource, /pageToken/, "OAuth callback must follow Google channel pagination");
assert.match(youtubeCallbackSource, /channel_lookup_incomplete/, "OAuth callback must not misreport a bounded incomplete lookup as a missing channel");
assert.match(youtubeCallbackSource, /channel_selection_required/, "OAuth callback must fail closed when multiple channels are returned without a configured channel ID");
const socialClientSource = readFileSync(new URL("../../src/app/admin/social/social-client.tsx", import.meta.url), "utf8");
assert.match(socialClientSource, /channel_selection_required/, "the admin UI must explain how to resolve an ambiguous multi-channel OAuth result");
assert.match(socialClientSource, /channel_lookup_incomplete/, "the admin UI must explain when a bounded channel lookup needs another attempt");

const youtubeConnectSource = readFileSync(
  new URL("../../src/app/api/admin/social/youtube/connect/route.ts", import.meta.url),
  "utf8",
);
assert.ok(
  youtubeConnectSource.includes("const clientSecret = env.YOUTUBE_CLIENT_SECRET?.trim();"),
  "OAuth initiation must preflight the client secret required by the callback token exchange",
);
assert.ok(
  youtubeConnectSource.includes('if (!clientId || !clientSecret) return adminStatusRedirect("configuration_missing");'),
  "OAuth initiation must reject an incomplete client ID/secret pair before consent",
);
const oauthConfigGuard = youtubeConnectSource.indexOf("if (!clientId || !clientSecret)");
const googleConsentRedirect = youtubeConnectSource.indexOf('new URL("https://accounts.google.com/o/oauth2/v2/auth")');
assert.ok(
  oauthConfigGuard >= 0 && googleConsentRedirect > oauthConfigGuard,
  "Google consent must not start until both server-side OAuth credentials are configured",
);
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


const previewOAuthStart = buildCanonicalOAuthStartRedirect(
  "https://zikr-preview.vercel.app/api/admin/social/youtube/connect?next=%2Fadmin%2Fsocial",
  "https://zikrmediaofficial.vercel.app",
);
assert.equal(
  previewOAuthStart,
  "https://zikrmediaofficial.vercel.app/api/admin/social/youtube/connect?next=%2Fadmin%2Fsocial",
  "OAuth state cookies must be created on the same canonical origin used by provider callbacks",
);
assert.equal(
  buildCanonicalOAuthStartRedirect(
    "https://zikrmediaofficial.vercel.app/api/admin/social/facebook/connect",
    "https://zikrmediaofficial.vercel.app",
  ),
  null,
  "canonical-origin OAuth starts should not redirect",
);
assert.equal(
  buildCanonicalOAuthStartRedirect(
    "https://custom.example/api/admin/social/facebook/connect?next=https%3A%2F%2Fevil.example",
    "https://zikrmediaofficial.vercel.app",
  ),
  "https://zikrmediaofficial.vercel.app/api/admin/social/facebook/connect?next=https%3A%2F%2Fevil.example",
  "canonicalization must preserve the route and query without trusting the incoming host",
);
assert.equal(
  buildCanonicalOAuthStartRedirect(
    "https://zikr-preview.vercel.app//evil.example/path",
    "https://zikrmediaofficial.vercel.app",
  ),
  "https://zikrmediaofficial.vercel.app//evil.example/path",
  "a path beginning with double slashes must never turn the canonical redirect into an external redirect",
);

for (const [provider, routePath] of [
  ["YouTube", "../../src/app/api/admin/social/youtube/connect/route.ts"],
  ["Facebook", "../../src/app/api/admin/social/facebook/connect/route.ts"],
] as const) {
  const routeSource = readFileSync(new URL(routePath, import.meta.url), "utf8");
  const canonicalGuard = routeSource.indexOf("buildCanonicalOAuthStartRedirect(request.url, CANONICAL_SITE_ORIGIN)");
  const adminGuard = routeSource.indexOf('requireAdminApi("social.manage")');
  const stateCreation = routeSource.indexOf("randomBytes(32)");
  assert.ok(
    canonicalGuard >= 0 && canonicalGuard < adminGuard && canonicalGuard < stateCreation,
    provider + " OAuth must canonicalize before auth checks and state-cookie creation",
  );
  assert.match(routeSource, /NextResponse\.redirect\(canonicalRedirect, 307\)/);
  assert.match(routeSource, /Cache-Control", "private, no-store, max-age=0/);
}

console.log("YouTube OAuth read-only and upload-scope credential tests passed.");
