#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const failures = [];
const read = (path) => {
  if (!existsSync(path)) {
    failures.push(`missing required social-publishing file: ${path}`);
    return "";
  }
  return readFileSync(path, "utf8");
};

const videoAutomation = read("src/features/videos/services/video-automation.ts");
for (const token of [
  "readFacebookApiResponse",
  "Facebook Reel start",
  "Facebook Reel upload",
  "Facebook Reel publish",
  "uploadData.success !== true",
  "finishData.success !== true",
]) {
  if (!videoAutomation.includes(token)) failures.push("Facebook Reels publishing must validate and preserve stage-specific Meta response: " + token);
}
if (!videoAutomation.includes("throw error;")) failures.push("Facebook publishing must propagate provider failures to the social queue instead of silently returning null");

const reelsCooldown = read("src/features/social/services/facebook-reels-rate-limit.ts");
const facebookCredentials = read("src/features/social/services/facebook-credentials.ts");
const reelsCooldownMigration = read("supabase/migrations/20261021094431_social_facebook_reels_rate_limit_cooldown.sql");
for (const token of ["facebook_reels_next_allowed_at", "24 * 60 * 60 * 1000", "12 * 60 * 1000"]) {
  if (!reelsCooldown.includes(token)) failures.push("Facebook Reels cooldown helper missing contract: " + token);
}
if (!facebookCredentials.includes("setFacebookReelsNextAllowedAt")) failures.push("Facebook credentials must persist shared Reels cooldown/pacing timestamps");
if (!videoAutomation.includes("credentials.reelsNextAllowedAt")) failures.push("Facebook Reels publisher must honor the shared next-allowed time before calling Meta");
if (!videoAutomation.includes("facebook_reels_next_allowed_at")) failures.push("Facebook Reels cooldown errors must persist a retry timestamp");

if (!reelsCooldownMigration.includes("ADD COLUMN IF NOT EXISTS facebook_reels_next_allowed_at")) failures.push("Supabase must have a durable global Facebook Reels next-allowed column");



const publisher = read("src/features/social/services/social-publishing.ts");
const videoApproval = read("src/features/videos/services/video-publish-approval.ts");
const socialWorkflowConfig = read(".github/workflows/publish-social.yml");
if (videoApproval.includes("requireApproval === false") || socialWorkflowConfig.includes("AUTO_VIDEO_PUBLISH_REQUIRES_APPROVAL")) {
  failures.push("public video publishing must not allow workflow/environment flags to bypass persisted human approval");
}
const processPublishStart = publisher.indexOf("export async function processSocialPublishItem");
const processPublishBody = processPublishStart >= 0 ? publisher.slice(processPublishStart) : "";
const processApprovalGate = processPublishBody.indexOf("hasVideoApprovalForQueueItem(item)");
const firstPlatformPublish = processPublishBody.indexOf("publishPlatform(item, platform)");
if (processApprovalGate < 0 || firstPlatformPublish < 0 || processApprovalGate > firstPlatformPublish) {
  failures.push("the publisher must re-check persisted video approval after claim and before any platform call");
}
if (!publisher.includes("if (!(await hasVideoApprovalForQueueItem(item)))")) {
  failures.push("the publisher must hold unapproved or changed video snapshots before platform calls");
}


const pendingSelectorStart = publisher.indexOf("export async function getPendingSocialPublishItems");
const pendingSelectorEnd = publisher.indexOf("async function recoverStaleSocialPublishItems", pendingSelectorStart);
const pendingSelector = pendingSelectorStart >= 0 && pendingSelectorEnd > pendingSelectorStart
  ? publisher.slice(pendingSelectorStart, pendingSelectorEnd)
  : "";
if (!pendingSelector.includes('const statusPriority: SocialQueueStatus[] = ["partial", "queued", "failed"]')) {
  failures.push("eligible partial social retries must be selected before new queued/failed rows so NULL scheduled_at items cannot starve them");
}
if (!pendingSelector.includes("for (const status of statusPriority)")) {
  failures.push("social queue selection must fetch each status in explicit priority order within the worker batch limit");
}
const ytAutomation = read("src/features/videos/services/video-automation.ts");
if (!publisher.includes("extractFacebookReelsNextAllowedAt")) failures.push("social queue must defer rate-limited Reels to the shared next-allowed time");
if (!publisher.includes("facebookReelsNextAllowedAt")) failures.push("social queue must persist the Reels cooldown deadline per item");
if (!publisher.includes("isFacebookReelsCooldownDeferredError")) failures.push("expected local Reels cooldown must be classified as a deferral");
if (!publisher.includes("deferredPlatforms: deferredFailures.map")) failures.push("social queue must persist deferred platform metadata separately from errors");
if (!publisher.includes("const publishMetadata = {")) failures.push("social publish results must be merged into one durable metadata snapshot before cleanup");
if (!publisher.includes("disposePublishedVideo({ ...item, metadata: publishMetadata })")) failures.push("published-video cleanup must preserve YouTube/Facebook remote post IDs written by the publisher");

if (!publisher.includes("operationalFailures")) failures.push("expected Reels pacing must not be written as a publication error");
const socialAdminClient = read("src/app/admin/social/social-client.tsx");
if (!socialAdminClient.includes("youtubeInsightsSummary")) failures.push("Admin social queue must display synchronized YouTube post statistics");
const socialWorker = read("scripts/jobs/social-publishing.ts");
if (!socialWorker.includes("retryPendingPublishedVideoCleanup")) failures.push("scheduled social worker must retry published-media cleanup without a separate manual sweep");
if (!socialWorker.includes("Published media cleanup retry")) failures.push("scheduled social worker must report media cleanup retry outcomes");
if (!socialWorker.includes('outcome === "deferred"') || !socialWorker.includes("succeeded, deferred, authBlocked")) failures.push("social worker must count cooldown deferrals separately from failures");
const socialAdminPage = read("src/app/admin/social/social-client.tsx");
if (!socialAdminPage.includes("facebookReelsDeferredUntil") || !socialAdminPage.includes("مؤجل تلقائيًا حتى")) failures.push("admin social UI must show scheduled Reels deferrals as waiting, not as errors");
const adminSocial = read("src/app/api/admin/social/route.ts");
if (adminSocial.includes("/api/internal/video-processing")) failures.push("admin social retry references a retired noop endpoint");
if (!adminSocial.includes('dispatchGitHubWorkflow("publish-social.yml", {')) failures.push("admin social retry must use the canonical GitHub social workflow with an explicit operation");
if (!publisher.includes("&status=eq.${claimStatus}")) failures.push("social queue claims must atomically filter by the current queue status");
if (publisher.includes("status=eq.${claimStatus}&updated_at=eq.")) failures.push("social queue claims must not strand eligible rows on exact timestamp serialization equality");
if (!publisher.includes("getFacebookPageCredentials")) failures.push("Facebook publisher must consume the canonical OAuth-managed Page credential");
if (!publisher.includes("credentials.isEnabled")) failures.push("Facebook publisher must honor the explicit OAuth connection enable switch");
if (!publisher.includes("isFacebookAuthFailure")) failures.push("Facebook auth failures must be classified separately");
if (!publisher.includes("authBlocked: hasAuthFailure")) failures.push("Facebook auth failures must block repeated automatic retries");
if (!pendingSelector.includes('const statusPriority: SocialQueueStatus[] = ["partial", "queued", "failed"]') || !pendingSelector.includes("status=eq.${status}")) failures.push("failed social queue items must remain eligible in bounded scheduled auto-retry priority");
if (!publisher.includes("permanentFailure === true")) failures.push("permanent social failures must be excluded from automatic retry");
if (!publisher.includes("socialRetryDelayMinutes")) failures.push("social retries must use bounded exponential backoff");
if (!publisher.includes("staleRecovery: true")) failures.push("stale social processing recovery must be recorded");
if (!publisher.includes("platformResults")) failures.push("platform-level results must be persisted");
if (!publisher.includes("pendingPlatforms")) failures.push("already-successful platforms must be excluded from retries");
if (!publisher.includes("remoteId")) failures.push("successful providers must persist their remote platform IDs");
if (publisher.includes("console.log(pageAccessToken") || publisher.includes("console.log(env.FACEBOOK_PAGE_ACCESS_TOKEN")) failures.push("Facebook access tokens must never be logged");

const queue = read("scripts/jobs/template-video-automation.ts");
if (!queue.includes("videoRetryDelayMinutes")) failures.push("video retries must use bounded exponential backoff");
if (!queue.includes("counted the recovery as an attempt")) failures.push("stale video recovery must count toward the retry limit");
if (!queue.includes("getFacebookPageCredentials()") || !queue.includes("facebookCredentials?.isEnabled")) failures.push("new Facebook targets must use the canonical OAuth connection state");
if (!queue.includes("findSocialQueueByAutomationKey")) failures.push("social queue idempotency lookup is required");
if (!queue.includes("desiredTargets = [...new Set([...existingTargets, ...targets])]")) failures.push("existing social targets must be preserved without duplicates");
if (!queue.includes("uploadGeneratedVideoToCloudinary")) failures.push("generated MP4s must upload directly from the worker to Cloudinary");
if (queue.includes("/storage/v1/object/videos/")) failures.push("generated MP4s must never be staged in Supabase Storage");
if (!queue.includes("mediaStorage: {") || !queue.includes("provider: \"cloudinary\"")) failures.push("generated video records must identify Cloudinary as the media source");
const narrationUpload = read("src/app/api/admin/video-generation/narration-upload/route.ts");
if (narrationUpload.includes("/storage/v1/object/videos/")) failures.push("human narration uploads must not consume the Supabase videos bucket");
if (!narrationUpload.includes("/video/upload") || !narrationUpload.includes("audio-human-")) failures.push("human narration must upload directly to the managed Cloudinary media library");

const env = read("src/lib/env.ts");
if (!env.includes("SOCIAL_PUBLISH_FACEBOOK_ENABLED")) failures.push("server env must expose the Facebook feature gate");
if (!env.includes('SOCIAL_PUBLISH_FACEBOOK_ENABLED: validatedEnv.SOCIAL_PUBLISH_FACEBOOK_ENABLED || "false"')) failures.push("Facebook feature gate must default to false");

const example = read(".env.example");
if (!example.includes("SOCIAL_PUBLISH_FACEBOOK_ENABLED=false")) failures.push(".env.example must keep Facebook publishing disabled by default");

const generationWorkflow = read(".github/workflows/generate-ai-video.yml");
for (const name of ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"]) {
  if (!generationWorkflow.includes(name + ": ${{ secrets." + name + " }}")) failures.push("video worker must receive its protected Cloudinary credential: " + name);
}
const workflow = read(".github/workflows/publish-social.yml");
const phase0AutomationFreeze =
  generationWorkflow.includes('VIDEO_AI_ENABLED: "false"') &&
  generationWorkflow.includes('AUTO_VIDEO_PUBLISH_ENABLED: "false"') &&
  generationWorkflow.includes('AUTO_VIDEO_PUBLISH_REQUIRES_APPROVAL: "true"') &&
  workflow.includes("SOCIAL_PUBLISH_ENABLED: ${{ vars.SOCIAL_PUBLISH_ENABLED || 'false' }}") &&
  workflow.includes("vars.SOCIAL_PUBLISH_ENABLED == 'true'") &&
  workflow.includes('AUTO_VIDEO_PUBLISH_ENABLED: "false"') &&
  workflow.includes('AUTO_VIDEO_PUBLISH_REQUIRES_APPROVAL: "true"');
const socialPublishingDisabled =
  workflow.includes('SOCIAL_PUBLISH_ENABLED: "false"') &&
  workflow.includes('if [[ "$SOCIAL_PUBLISH_ENABLED" != "true" ]]');
if (!generationWorkflow.includes('AUTO_VIDEO_PUBLISH_ENABLED: "true"') && !phase0AutomationFreeze) failures.push("video generation must keep social queueing enabled unless Phase 0 freeze is explicitly active");
if (!generationWorkflow.includes('SOCIAL_PUBLISH_ENABLED: "false"')) failures.push("video generation must not execute social publishing directly");
if (!generationWorkflow.includes('SOCIAL_PUBLISH_FACEBOOK_ENABLED: "false"')) failures.push("video generation must not enable Facebook from legacy GitHub Page-token secrets");
if (generationWorkflow.includes("secrets.FACEBOOK_PAGE_ACCESS_TOKEN") || generationWorkflow.includes("FACEBOOK_PAGE_ACCESS_TOKEN:")) failures.push("video generation must not duplicate the Facebook Page token in GitHub Actions");

if (!workflow.includes('SOCIAL_PUBLISH_ENABLED: "true"') && !phase0AutomationFreeze && !socialPublishingDisabled) failures.push("dedicated GitHub social workflow must be explicitly active or fail-closed");
if (!workflow.includes('AUTO_VIDEO_PUBLISH_ENABLED: "true"')) failures.push("social worker must allow automatically generated videos into the publisher");
// Public video publishing now requires persisted human approval, regardless of unattended worker mode.
if (!workflow.includes("YOUTUBE_API_KEY: ${{ secrets.YOUTUBE_API_KEY }}")) failures.push("social worker must receive the YouTube Data API key for public per-post statistics");
if (!workflow.includes('SOCIAL_PUBLISH_BATCH_SIZE: "2"')) failures.push("scheduled publishing must process up to two queue items per run to drain an aged backlog");
if (!generationWorkflow.includes('VIDEO_FREE_ONLY: "true"') || !generationWorkflow.includes('VIDEO_AI_ENABLED: "true"')) failures.push("video generation must use enabled free-only visual AI with deterministic fallback");
if (!generationWorkflow.includes('HF_LTX_FAST_VIDEO_ENABLED: "true"') || !generationWorkflow.includes('HF_WAN_VIDEO_ENABLED: "true"')) failures.push("both free Hugging Face video providers must be enabled ahead of the FFmpeg fallback");
if (!generationWorkflow.includes('HF_VIDEO_PROVIDER_TIMEOUT_MS: "150000"') || !generationWorkflow.includes('VIDEO_AI_ATTEMPTS_PER_RUN: "2"') || !generationWorkflow.includes('VIDEO_WORKER_BATCH_SIZE: "2"')) failures.push("free video provider attempts and worker batches must remain bounded for the scheduled job timeout");
if (!workflow.includes('BACKGROUND_JOB_TARGET: "social"')) failures.push("GitHub social workflow must only process the social queue");
if (!publisher.includes('.audience === "kids"')) failures.push("YouTube publishing must read the source audience for child-directed videos");
if (!ytAutomation.includes("selfDeclaredMadeForKids: options.selfDeclaredMadeForKids === true")) failures.push("YouTube uploads must set Made for Kids from the source audience metadata");
if (!workflow.includes("social_platform_credentials?platform=eq.facebook&select=page_id,page_access_token,is_enabled,connection_status,expires_at&limit=1")) failures.push("GitHub social workflow must derive Facebook readiness from the OAuth-managed Supabase credential");
if (!workflow.includes('typeof row?.page_access_token === "string"')) failures.push("Facebook readiness must verify that the OAuth-managed Page token is present without printing it");
if (!workflow.includes('if [[ "$youtube_configured" != "true" ]]') || !workflow.includes('if [[ "$facebook_enabled" != "true" ]]')) failures.push("the automatic publisher must fail closed unless both configured providers are ready");
if (!workflow.includes('echo "SOCIAL_PUBLISH_FACEBOOK_ENABLED=$facebook_enabled" >> "$GITHUB_ENV"')) failures.push("GitHub social workflow must set the Facebook feature gate from validated OAuth-managed connection state");
if (workflow.includes("secrets.FACEBOOK_PAGE_ACCESS_TOKEN") || workflow.includes("FACEBOOK_PAGE_ACCESS_TOKEN:")) failures.push("GitHub social workflow must not duplicate the Facebook Page token outside Supabase");
if (!publisher.includes("async function publishFacebookVideoItem")) failures.push("Facebook feed videos and Reels must use the same OAuth-managed Page credential");
if (publisher.includes('if (!env.FACEBOOK_PAGE_ACCESS_TOKEN) throw new Error("FACEBOOK_PAGE_ACCESS_TOKEN is not configured")')) failures.push("Facebook video publishing must not require a legacy environment token");

const postInsights = read("src/features/social/services/youtube-post-insights.ts");
for (const token of ["syncYoutubePublishedPostInsights", "youtube-data-api-v3", "views:", "likes:", "comments:", "INSIGHTS_REFRESH_MS"]) {
  if (!postInsights.includes(token)) failures.push("YouTube public post insights sync missing: " + token);
}

if (!socialWorker.includes("syncYoutubePublishedPostInsights")) failures.push("social worker must periodically sync YouTube post statistics");
if (!/import\s*\{\s*syncYoutubePublishedPostInsights\s*\}\s*from\s*["\']\.\.\/\.\.\/src\/features\/social\/services\/youtube-post-insights["\']/.test(socialWorker)) failures.push("social worker must import the YouTube insights sync implementation");
if (!postInsights.includes("scope: \"public-statistics\"")) failures.push("YouTube metrics must be labelled as public statistics, not retention analytics");

const facebookInsights = read("src/features/social/services/facebook-reels-insights.ts");
for (const token of ["syncFacebookReelsInsights", "video_insights", "fb_reels_total_plays", "post_video_avg_time_watched", "read_insights", "pages_read_engagement", "page-video-insights"]) {
  if (!facebookInsights.includes(token)) failures.push("Facebook Reels insights sync missing contract: " + token);
}
if (facebookInsights.includes("post_impressions_unique")) failures.push("Facebook Reels insights must not request deprecated post_impressions_unique");
if (!socialWorker.includes("syncFacebookReelsInsights")) failures.push("social worker must periodically sync Facebook Reels insights");
const facebookConnect = read("src/app/api/admin/social/facebook/connect/route.ts");
if (!facebookConnect.includes('"read_insights"')) failures.push("Facebook OAuth must request read_insights for Reels analytics");
const facebookCredentialHealth = read("src/features/social/services/facebook-credentials.ts");
if (!facebookCredentialHealth.includes("facebookInsightsPermissionGranted")) failures.push("Facebook health must expose read_insights grant state");
const socialAdminUi = read("src/app/admin/social/social-client.tsx");
if (!socialAdminUi.includes("facebookReelsInsightsSummary") || !socialAdminUi.includes("إحصاءات Facebook Reels")) failures.push("Admin social queue must display Facebook Reels insights and permission state");
const facebookInsightsTest = read("scripts/tests/facebook-reels-insights.test.ts");
if (!facebookInsightsTest.includes("Facebook Reels insights permission and metric tests passed")) failures.push("Facebook Reels insights regression tests are missing");
const socialPackageJson = JSON.parse(read("package.json"));
if (!socialPackageJson.scripts.test.includes("facebook-reels-insights.test.ts")) failures.push("Facebook Reels insights tests must be registered in the main test suite");
const adminApi = read("src/app/api/admin/social/route.ts");
if (!adminApi.includes("const allTargetsSucceeded") || !adminApi.includes("targets.every(platform => succeeded.has(platform))")) failures.push("Admin retry must not label mixed-success/auth-blocked queue items as published");
if (!adminApi.includes("authBlockedPlatforms")) failures.push("Admin retry path must understand Facebook auth-blocked platforms");
if (!adminApi.includes("youtubeConfigured")) failures.push("Admin social health must expose YouTube configuration");
if (!adminApi.includes("facebookAuthBlocked")) failures.push("Admin social health must expose Facebook auth-block count");
if (!adminApi.includes("target_platforms: platforms")) failures.push("Admin retry must narrow targets to actually retryable platforms");
if (!adminApi.includes("platformStats")) failures.push("Admin social API must expose platform-level queue statistics");
if (!adminApi.includes("oldestQueuedAt")) failures.push("Admin social API must expose the oldest queued timestamp");
if (!adminApi.includes('action === "run_worker"')) failures.push("Admin social API must support manual worker dispatch");
if (!adminApi.includes('operation: "publish_queue"')) failures.push("Admin manual worker dispatch must explicitly pass the publish_queue operation instead of GitHub's default no-op");
if (!adminApi.includes("const socialPublishingEnabled = true;")) failures.push("Admin publishing health must mirror the active GitHub workflow");

const facebookCallback = read("src/app/api/admin/social/facebook/callback/route.ts");
if (!facebookCallback.includes('operation: "publish_queue"')) failures.push("Facebook OAuth callback worker dispatch must pass the explicit publish_queue operation");

const adminUi = read("src/app/admin/social/social-client.tsx");
if (!adminUi.includes("Facebook Auth Blocks")) failures.push("Admin social UI must show Facebook auth-block count");
if (!adminUi.includes("سجلات فشل اعتماد Facebook السابقة")) failures.push("Admin social UI must label Facebook auth-blocks as historical queue records");
if (adminUi.includes("Facebook متوقف حاليًا بسبب اعتماد منتهي")) failures.push("Admin social UI must not claim current Facebook credentials are expired based only on historical queue failures");
if (!adminUi.includes("هذا عدّاد للطابور وليس تشخيصًا للتوكن الحالي")) failures.push("Admin social UI must explicitly distinguish historical auth-blocks from current Facebook health");
if (!adminUi.includes("تشغيل العامل الآن")) failures.push("Admin social UI must expose the manual worker control");
if (!adminUi.includes("النشر التلقائي مفعّل كل 15 دقيقة") || !adminUi.includes("سيعالج العامل العناصر الجاهزة للنشر الآن")) failures.push("Admin social UI must show the active publishing state and worker response");
if (!adminUi.includes("successRate")) failures.push("Admin social UI must show platform success rates");

const migration = read("supabase/migrations/20260929045633_create_social_publish_queue_20260929.sql");
if (!migration.includes("idx_social_publish_queue_automation_key")) failures.push("social queue must retain unique automation-key idempotency");

const packageJson = JSON.parse(read("package.json"));
if (!packageJson.scripts["social:publish:check"]) failures.push("social:publish:check must be registered");
if (!packageJson.scripts["verify:pr"]?.includes("pnpm social:publish:check")) failures.push("verify:pr must include social publishing verification");
if (!packageJson.scripts["verify"]?.includes("pnpm social:publish:check")) failures.push("verify must include social publishing verification");

for (const token of [
  "social_platform_credentials",
  "getFacebookPageCredentials",
  "getFacebookPageConnectionHealth",
  "saveFacebookPageCredential",
  "unblockFacebookAuthBlockedQueue",
  "reauthorization_required",
]) {
  if (!facebookCredentials.includes(token)) failures.push("Facebook credential manager missing: " + token);
}
if (!facebookCredentials.includes("stored.is_enabled === true")) failures.push("the OAuth connection must explicitly enable publishing");
const credentialGetter = facebookCredentials.slice(
  facebookCredentials.indexOf("export async function getFacebookPageCredentials"),
  facebookCredentials.indexOf("function classifyGraphFailure"),
);
if (credentialGetter.includes("FACEBOOK_PAGE_ACCESS_TOKEN") || credentialGetter.includes('source: "environment"')) {
  failures.push("legacy environment tokens must not be used for outbound Facebook publishing");
}
if (!credentialGetter.includes("OAuth-managed publishing center")) {
  failures.push("Facebook publishing must fail closed until a verified OAuth credential is stored in Supabase");
}
if (!facebookCredentials.includes('facebookConnectionStatus: "not_connected"')) {
  failures.push("legacy environment tokens must not make the Admin UI report Facebook as OAuth-connected");
}
if (!publisher.includes('normalized.includes("oauth-managed publishing center")')) {
  failures.push("missing Facebook OAuth-managed connection errors must enter the auth-blocked queue state");
}

if (!facebookCredentials.includes("last_error_message")) failures.push("Facebook health must preserve a safe, token-free diagnostic");

const connectRoute = read("src/app/api/admin/social/facebook/connect/route.ts");
const callbackRoute = read("src/app/api/admin/social/facebook/callback/route.ts");
for (const token of ["pages_show_list", "pages_read_engagement", "pages_manage_posts", "response_type", "state"]) {
  if (!connectRoute.includes(token)) failures.push("Facebook OAuth connect route missing: " + token);
}
for (const token of ["pages_show_list", "pages_read_engagement", "pages_manage_posts", "state"]) {
  if (!callbackRoute.includes(token)) failures.push("Facebook OAuth callback missing: " + token);
}
for (const token of [
  "fb_exchange_token",
  "me/accounts",
  "me/permissions",
  "timingSafeEqual",
  "saveFacebookPageCredential",
  "unblockFacebookAuthBlockedQueue",
  'dispatchGitHubWorkflow("publish-social.yml", {',
]) {
  if (!callbackRoute.includes(token)) failures.push("Facebook reconnect flow missing: " + token);
}
if (callbackRoute.includes("console.log(pageAccessToken") || callbackRoute.includes("console.log(longToken")) failures.push("Facebook OAuth must never log access tokens");

const credentialsMigration = read("supabase/migrations/20261020234239_social_facebook_oauth_credentials.sql");
for (const token of ["enable row level security", "revoke all", "authenticated", "service_role", "page_access_token"]) {
  if (!credentialsMigration.toLowerCase().includes(token.toLowerCase())) failures.push("Facebook credential table missing security control: " + token);
}
const credentialHealth = facebookCredentials.slice(
  facebookCredentials.indexOf("export async function getFacebookPageConnectionHealth"),
  facebookCredentials.indexOf("export async function saveFacebookPageCredential"),
);
if (!credentialHealth.includes("facebookEnvironmentTokenConfigured")) failures.push("health API must distinguish a server-configured token from the active DB credential");
if (!credentialHealth.includes("Do not probe it here and misreport a stale legacy token")) failures.push("health checks must not misreport a legacy environment token as the active publish credential");
if (!facebookCredentials.includes("adoptServerConfiguredFacebookPageToken")) failures.push("Facebook manager must support secure explicit adoption of the server-configured token");
for (const token of ["debug_token", "is_valid", "pages_show_list", "pages_read_engagement", "pages_manage_posts", "saveFacebookPageCredential"]) {
  if (!facebookCredentials.includes(token)) failures.push("server token adoption must validate: " + token);
}
if (!adminApi.includes('action === "adopt_server_facebook_token"')) failures.push("admin API must provide a protected action to adopt the current server token");
if (!adminApi.includes("unblockFacebookAuthBlockedQueue()")) failures.push("adopting a valid token must release historical Facebook-auth-blocked items");
if (!adminUi.includes("facebookEnvironmentTokenConfigured")) failures.push("admin UI must expose adoption only when a server token is configured");
if (!adminUi.includes('role="tablist"') || !adminUi.includes('activeView === "queue"') || !adminUi.includes("sm:hidden")) failures.push("publishing center must have separate mobile-friendly overview and queue views");

if (credentialsMigration.includes("to anon") && /grant\s+select[^;]+to\s+anon/i.test(credentialsMigration)) failures.push("Facebook credentials must not be readable by anonymous clients");

const facebookProfile = read("src/features/social/integrations/facebook.ts");
if (!facebookProfile.includes("readStoredFacebookCredential")) failures.push("the official Facebook page profile must use the renewed OAuth-managed token");
if (!facebookProfile.includes("safeFacebookProfileError")) failures.push("public Facebook page must not expose raw Meta OAuth/token errors");
if (facebookProfile.includes("error: error instanceof Error ? error.message")) failures.push("public Facebook card must not expose raw Meta provider error text");
if (!adminApi.includes("getFacebookPageConnectionHealth")) failures.push("publishing center must report live Facebook connection health");
if (!adminApi.includes('action === "test_facebook"')) failures.push("publishing center must expose a real Facebook token health test");
if (!adminUi.includes("facebookConnectionStatus")) failures.push("publishing center must distinguish expired tokens from a disabled feature flag");
if (!adminUi.includes("/api/admin/social/facebook/connect")) failures.push("publishing center must provide a one-step Facebook reconnect action");
if (!adminUi.includes("automation.scheduleMinutes") || !adminUi.includes("النشر متوقف")) failures.push("publishing center must show the configured schedule only when automatic publishing is enabled");
if (!adminUi.includes("اختبار الاتصال")) failures.push("publishing center must show a live connection test");

const socialWorkflow = workflow;
if (!socialWorkflow.includes('cron: "7,22,37,52 * * * *"')) failures.push("automatic social publisher must remain scheduled every 15 minutes off peak");
if (!generationWorkflow.includes('AUTO_VIDEO_PUBLISH_ENABLED: "true"') && !phase0AutomationFreeze) failures.push("video generation must automatically enqueue publishable assets unless Phase 0 freeze is active");
if (!queue.includes("facebookCredentials.accessToken")) failures.push("Facebook queue target selection must verify a usable Page credential");

const smartLinkConfig = read("src/lib/smartlink.ts");
const smartLinkPromo = read("src/components/smartlink-promo.tsx");
const siteShell = read("src/components/layout/site-shell.tsx");
const footer = read("src/components/layout/footer.tsx");
const homepage = read("src/app/page.tsx");
const videosHub = read("src/app/videos/page.tsx");
if (!smartLinkConfig.includes('https://uplcm.com/4/12171895')) failures.push("Monetag SmartLink must use the configured publisher URL");
if (!smartLinkPromo.includes("rel=\"nofollow sponsored noopener noreferrer\"")) failures.push("SmartLink UI must disclose sponsored external navigation safely");
if (!footer.includes("showSmartLink ?") || !footer.includes("MONETAG_SMARTLINK_URL")) failures.push("public footer must render the disclosed SmartLink when route-eligible");
if (!siteShell.includes('"/kids"') || !siteShell.includes('"/quran"') || !siteShell.includes('"/hadith"') || !siteShell.includes('pathname !== "/videos"')) failures.push("SmartLink footer must exclude child-directed and sacred-content routes and avoid duplicating hub placements");
if (!homepage.includes("<SmartLinkPromo") || !videosHub.includes("<SmartLinkPromo")) failures.push("SmartLink promo must appear on the homepage and video hub");
if (!publisher.includes("appendSmartLinkDisclosure") || !publisher.includes("MONETAG_SMARTLINK_YOUTUBE_TAGS")) failures.push("social publisher must add the disclosed SmartLink to eligible video descriptions and YouTube tags");
if (!publisher.includes("kidsAudience = true") || !publisher.includes("!kidsAudience") || !publisher.includes("!madeForKids")) failures.push("social SmartLink must be omitted for child-directed videos or an unverified audience");
if (!ytAutomation.includes("appendSmartLinkDisclosure") || !ytAutomation.includes("content.audience !== 'kids'")) failures.push("video metadata generation must include the disclosed SmartLink only for non-kids content");
if (!ytAutomation.includes("MONETAG_SMARTLINK_YOUTUBE_TAGS")) failures.push("generated YouTube metadata must include SmartLink discovery tags for eligible videos");

if (failures.length) {
  console.error("SOCIAL_PUBLISHING_CHECK_FAILED");
  for (const failure of failures) console.error(`❌ ${failure}`);
  process.exit(1);
}
console.log("✅ Phase 14 Social Publishing checks passed");
