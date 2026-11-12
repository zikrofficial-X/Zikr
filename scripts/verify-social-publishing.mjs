#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const failures = [];
const read = (path) => {
  if (!existsSync(path)) {
    failures.push("missing required controlled-publishing file: " + path);
    return "";
  }
  return readFileSync(path, "utf8");
};

const socialApi = read("src/app/api/admin/social/route.ts");
const adminSecurity = read("src/features/admin/services/security.ts");
const writtenApi = read("src/app/api/admin/social/written/route.ts");
const socialPage = read("src/app/admin/social/page.tsx");
const writtenPage = read("src/app/admin/social/written-studio/page.tsx");
const navigation = read("src/features/admin/config/navigation.ts");
const runner = read("scripts/run-background-jobs.ts");
const socialWorker = read("scripts/jobs/social-publishing.ts");
const facebookProfileIntegration = read("src/features/social/integrations/facebook.ts");
const videoGenerator = read("scripts/jobs/template-video-automation.ts");
const socialPublishingService = read("src/features/social/services/social-publishing.ts");
const cleanupPolicy = read("src/features/social/services/published-video-cleanup.ts");
const youtubeCredentials = read("src/features/social/services/youtube-oauth-credentials.ts");
const videoPublishApproval = read("src/features/videos/services/video-publish-approval.ts");
const videoAutomation = read("src/features/videos/services/video-automation.ts");
const socialWorkflow = read(".github/workflows/publish-social.yml");
const videoWorkflow = read(".github/workflows/generate-ai-video.yml");
const youtubeConnect = read("src/app/api/admin/social/youtube/connect/route.ts");
const youtubeCallback = read("src/app/api/admin/social/youtube/callback/route.ts");
const facebookConnect = read("src/app/api/admin/social/facebook/connect/route.ts");
const facebookCallback = read("src/app/api/admin/social/facebook/callback/route.ts");
const adminClient = read("src/app/admin/social/social-client.tsx");
const writtenWorker = read("scripts/jobs/written-content-automation.ts");
const writtenPostService = read("src/features/social/services/written-content.ts");
const videoCatalog = read("src/features/videos/services/videos.ts");
const facebookPublicPosts = read("src/features/social/services/facebook-public-posts.ts");
const sitePublisher = read("scripts/jobs/content-publishing.ts");

if (!socialApi.includes('requireAdminApi("social.manage")') ||
    !socialApi.includes('requireAdminStepUpApi("social.publish"') ||
    !adminSecurity.includes("export async function requireAdminStepUpApi(") ||
    !adminSecurity.includes('data.currentLevel !== "aal2"') ||
    !socialApi.includes('dispatchGitHubWorkflow("publish-social.yml"')) {
  failures.push("social API must retain separate management/publish permissions and dispatch only the controlled workflow");
}
if (socialApi.includes("SOCIAL_PUBLISHING_RETIRED") || socialApi.includes("status: 410")) {
  failures.push("social API must be restored from its retired HTTP 410 state");
}
if (!socialApi.includes("created_at=gte.") || !socialApi.includes("limit=200") ||
    !socialApi.includes("limit=500") || !socialApi.includes("private, max-age=30")) {
  failures.push("social admin reads must be bounded, cached and isolated to the post-launch queue window");
}
if (!adminClient.includes('href="/admin/social/written-studio"') ||
    !adminClient.includes('item.content_type === "written_post"')) {
  failures.push("social dashboard must expose the written-post studio and its pending queue count");
}
if (!writtenApi.includes('requireAdminApi("social.manage")') ||
    !writtenApi.includes('requireAdminStepUpApi("social.publish"') ||
    !writtenApi.includes('dispatchGitHubWorkflow("generate-written-content.yml"') ||
    !writtenApi.includes("content_type=eq.written_post")) {
  failures.push("written Facebook posts API must expose queue rows and dispatch the authenticated written-content generator");
}
if (!socialPage.includes('requireAdminPermission("social.manage")') ||
    !socialPage.includes("AdminSocialClient")) {
  failures.push("social admin page must be permission-gated and render the social control center");
}
if (!writtenPage.includes('requireAdminPermission("social.manage")') ||
    !writtenPage.includes("WrittenStudioClient")) {
  failures.push("written Facebook posts studio must render directly and require social.manage");
}
if (!navigation.includes('key: "media-audio"') || !navigation.includes('href: "/admin/social"')) {
  failures.push("permission-gated social publishing center must be present in admin navigation");
}
if (!runner.includes("processSocialPublishQueue") ||
    !runner.includes('process.env.SOCIAL_PUBLISH_ENABLED !== "true"') ||
    !runner.includes('process.env.SOCIAL_SYNC_INSIGHTS === "true"')) {
  failures.push("background runner must process social only when enabled and must make insights sync opt-in");
}
const insightsStart = socialWorker.indexOf("export async function syncSocialInsights()");
const insightsEnd = socialWorker.indexOf("export async function processSocialPublishQueue", insightsStart);
const insightsWorker = socialWorker.slice(insightsStart, insightsEnd);
if (!insightsWorker.includes("getFacebookPageProfile()") ||
    !insightsWorker.includes("facebookProfileSync") ||
    !insightsWorker.includes("facebookProfileSync.configured && facebookProfileSync.stale") ||
    !facebookProfileIntegration.includes("supabaseServerAdminRequest") ||
    facebookProfileIntegration.includes("createAdminClient")) {
  failures.push("analytics-only worker must refresh Facebook Page profile metrics through the Node-safe admin REST client and report stale profile data");
}
if (!runner.includes('const insightsFailed = target === "insights"') ||
    !runner.includes("Number(insights.failed ?? 0)") ||
    !runner.includes("if (insightsFailed > 0)") ||
    !socialWorker.includes("Number(facebookInsights.failed ?? 0) + Number(insights.failed ?? 0)")) {
  failures.push("analytics-only worker must expose provider failures and fail CI instead of reporting false success");
}
if (!runner.includes('"social"') || runner.includes("reconcileCompletedVideoSocialQueue")) {
  failures.push("social execution must remain a separate target and never reconcile historical completed videos");
}
if (!videoWorkflow.includes('AUTO_VIDEO_PUBLISH_ENABLED: "true"') ||
    !videoWorkflow.includes('AUTO_VIDEO_PUBLISH_REQUIRES_APPROVAL: "false"') ||
    !videoWorkflow.includes('BACKGROUND_JOB_TARGET: "videos"')) {
  failures.push("video generation must enqueue only automated-QA-approved social candidates without a manual review gate");
}
if (!videoGenerator.includes("async function queueSocialItems") ||
    !videoGenerator.includes("socialQueueResult = await withLeaseHeartbeat(") ||
    !videoGenerator.includes("queueSocialItems(request, rendered.videoUrl, signal)") ||
    !videoGenerator.includes('socialQueueEnqueueStatus: "processing"') ||
    !videoGenerator.includes('socialQueueEnqueueStatus: "pending"') ||
    !videoGenerator.includes("recoverPendingVideoSocialQueueEnqueues(") ||
    videoGenerator.includes("reconcileCompletedVideoSocialQueue")) {
  failures.push("only new renders and their explicit pending handoff marker may create social queue items; historical completed requests must not be reconciled");
}
if (!videoPublishApproval.includes("export function hasCompleteKidsVideoSeriesMetadata") ||
    !videoPublishApproval.includes('content.contentFormat === "series_episode"') ||
    !videoGenerator.includes("hasCompleteKidsVideoSeriesMetadata(request.content)") ||
    !videoGenerator.includes("hasCompleteKidsVideoSeriesMetadata(content)") ||
    !videoPublishApproval.includes("content?.audience === \"kids\"")) {
  failures.push("Kids video catalog visibility and social publishing must share one complete series-episode contract");
}
if (!videoGenerator.includes("getYouTubeUploadRefreshToken") ||
    !videoGenerator.includes("getFacebookPageCredentials") ||
    !videoGenerator.includes("FACEBOOK_PUBLISHING_REQUESTED") ||
    !videoGenerator.includes("buildAutomatedVideoQaChecklist") ||
    !videoGenerator.includes("createAutomatedVideoQaApproval")) {
  failures.push("video social queue targets must be gated by verified provider credentials and a complete automated QA snapshot");
}
if (!socialPublishingService.includes("hasVideoApprovalForQueueItem") ||
    !socialPublishingService.includes("Video held because automated QA is missing") ||
    !socialPublishingService.includes("Automated QA lookup failed; holding video item")) {
  failures.push("the social worker must fail closed and revalidate the automated QA snapshot before provider calls");
}
if (!socialPublishingService.includes("syncYouTubeVideoReferenceToCatalog") ||
    !socialPublishingService.includes("mergedResults.youtube") ||
    !socialPublishingService.includes("youtubePublishedVideoId")) {
  failures.push("a confirmed YouTube remote ID must be synchronized to the public video catalog for playback fallback");
}
const mediaDisposalStart = socialPublishingService.indexOf("async function disposePublishedVideo");
const mediaDisposalEnd = socialPublishingService.indexOf("export async function resetQueuedSocialVideoMedia", mediaDisposalStart);
const mediaDisposal = socialPublishingService.slice(mediaDisposalStart, mediaDisposalEnd);
if (!mediaDisposal.includes("stagingCleanupEligibleAt") ||
    !mediaDisposal.includes("stagingCleanupDeferred: true") ||
    mediaDisposal.includes("deleteManagedVideoUrl") ||
    mediaDisposal.includes("video_url: null")) {
  failures.push("social publishing must preserve both media pointers and defer staging-copy deletion to the 48-hour retention worker");
}
if (!socialPublishingService.includes("created_at=gte.${createdSince}") ||
    !socialPublishingService.includes("Invalid SOCIAL_PUBLISH_AFTER cutoff") ||
    !socialPublishingService.includes("stale recovery is disabled")) {
  failures.push("social queue reads, stale recovery, and cleanup must be restricted to the explicit post-launch cutoff");
}
const claimStart = socialPublishingService.indexOf("export async function claimPendingSocialPublishItems");
const claimEnd = socialPublishingService.indexOf("export async function processSocialPublishItem", claimStart);
const claimBody = socialPublishingService.slice(claimStart, claimEnd);
if (claimBody.includes("await retryPendingPublishedVideoCleanup(")) {
  failures.push("published-video cleanup must not be invoked a second time from the queue-claim path");
}
if ((socialWorker.match(/retryPendingPublishedVideoCleanup\(/g) ?? []).length !== 1) {
  failures.push("the social worker must run published-video cleanup exactly once per queue poll");
}
if (!socialPublishingService.includes("shouldRetryPublishedVideoCleanup(item.metadata)") ||
    !cleanupPolicy.includes("metadata?.stagingCleanupDeferred !== true") ||
    !cleanupPolicy.includes("metadata.videoCleanupPending === true")) {
  failures.push("published-video cleanup must skip rows already deferred and retry only missing or explicitly pending cleanup metadata");
}
if (!socialWorkflow.includes("workflow_run:") ||
    !socialWorkflow.includes('"ZIKR Autonomous AI Video Worker"') ||
    !socialWorkflow.includes('"ZIKR Internal Site Content Generator"') ||
    !socialWorkflow.includes("github.event.workflow_run.conclusion == 'success'") ||
    !socialWorkflow.includes("workflow_dispatch:")) {
  failures.push("social publisher must run after successful video or written-content generation and support explicit manual dispatch");
}
if (!socialWorkflow.includes("\n  schedule:") ||
    !socialWorkflow.includes('cron: "7,22,37,52 * * * *"') ||
    !socialWorkflow.includes("github.event_name == 'schedule'") ||
    socialWorkflow.includes("\n  push:") ||
    socialWorkflow.includes("if: false")) {
  failures.push("social publisher must retry its bounded post-launch queue every 15 minutes on main, without push triggers or a kill switch");
}
for (const expected of [
  'SOCIAL_PUBLISH_ENABLED: "true"',
  'SOCIAL_SYNC_INSIGHTS: "false"',
  'BACKGROUND_JOB_TARGET: "social"',
  'SOCIAL_PUBLISH_AFTER: "2026-11-06T20:00:00Z"',
  "SOCIAL_PUBLISH_FACEBOOK_ENABLED",
  "pages_manage_posts",
  "pages_show_list",
  "pages_read_engagement",
  "read_insights",
  "SOCIAL_PUBLISH_YOUTUBE_ENABLED",
  "youtube.upload",
]) {
  if (!socialWorkflow.includes(expected)) failures.push("social workflow is missing safety contract: " + expected);
}
if (socialWorkflow.includes("pages_manage_engagement")) {
  failures.push("Facebook publish workflow must not block publishing on comment-moderation scope");
}
if (!socialWorkflow.includes('SOCIAL_PUBLISH_BATCH_SIZE: "5"')) {
  failures.push("social publisher must drain five verified items per generation run within the bounded worker cap");
}
if (socialWorkflow.includes("YOUTUBE_REFRESH_TOKEN") ||
    socialWorkflow.includes("SOCIAL_PUBLISH_BATCH_SIZE: \"10\"")) {
  failures.push("GitHub workflow must not inject a refresh token or run unbounded social batches");
}
if (!youtubeCredentials.includes("getYouTubeUploadRefreshToken") ||
    !youtubeCredentials.includes("https://www.googleapis.com/auth/youtube.upload") ||
    !youtubeCredentials.includes("https://www.googleapis.com/auth/youtube.readonly") ||
    !youtubeCredentials.includes("https://www.googleapis.com/auth/yt-analytics.readonly")) {
  failures.push("YouTube upload credential must require explicit upload, channel-read and analytics scopes");
}
const expectedYouTubeOrigin = 'const CANONICAL_SITE_ORIGIN = "https://zikrmediaofficial.vercel.app";';
const expectedYouTubeRedirect = 'const YOUTUBE_REDIRECT_URI = CANONICAL_SITE_ORIGIN + "/api/admin/social/youtube/callback";';
if (
  !youtubeConnect.includes(expectedYouTubeOrigin) ||
  !youtubeCallback.includes(expectedYouTubeOrigin) ||
  !youtubeConnect.includes(expectedYouTubeRedirect) ||
  !youtubeCallback.includes(expectedYouTubeRedirect)
) {
  failures.push("YouTube OAuth authorize and token exchange must use the same canonical Google redirect URI");
}
if (!youtubeConnect.includes('requireAdminApi("social.manage")') ||
    !youtubeConnect.includes("https://www.googleapis.com/auth/youtube.upload") ||
    !youtubeConnect.includes('include_granted_scopes", "false"')) {
  failures.push("YouTube OAuth connect must request isolated upload consent without inheriting unknown legacy scopes");
}
if (facebookConnect.includes("pages_manage_engagement") || facebookCallback.includes("pages_manage_engagement")) {
  failures.push("Facebook OAuth must not request comment-moderation scope for video publishing");
}
if (!facebookConnect.includes('requireAdminApi("social.manage")') ||
    !facebookConnect.includes("dialog/oauth") ||
    !facebookConnect.includes("pages_manage_posts") ||
    facebookConnect.includes("FACEBOOK_INTEGRATION_RETIRED")) {
  failures.push("Facebook OAuth connect must start a scoped Meta Page authorization flow");
}
if (!facebookCallback.includes('requireAdminApi("social.manage")') ||
    !facebookCallback.includes("timingSafeEqual") ||
    !facebookCallback.includes("saveFacebookPageCredential") ||
    !facebookCallback.includes("pages_show_list") ||
    !facebookCallback.includes("page_selection_required") ||
    facebookCallback.includes("FACEBOOK_INTEGRATION_RETIRED")) {
  failures.push("Facebook OAuth callback must validate state, required Page permissions, and the selected managed Page before storing credentials");
}
if (!facebookCallback.includes("unblockFacebookAuthBlockedQueue") ||
    facebookCallback.indexOf("await saveFacebookPageCredential(") < 0 ||
    facebookCallback.indexOf("await unblockFacebookAuthBlockedQueue(") <= facebookCallback.indexOf("await saveFacebookPageCredential(") ||
    facebookCallback.includes('dispatchGitHubWorkflow("publish-social.yml"')) {
  failures.push("a successful Facebook OAuth reconnect must release only auth-blocked queue rows after storing the verified Page credential and leave dispatch to the scheduled publisher");
}
if (!youtubeCallback.includes('requireAdminApi("social.manage")') ||
    !youtubeCallback.includes("hasYouTubeUploadScopes(scopes)") ||
    !youtubeCallback.includes("canUpload") ||
    !youtubeCallback.includes("flags.canUpload") ||
    !youtubeCallback.includes('permission: "social.manage"') ||
    youtubeCallback.includes("youtube.force-ssl")) {
  failures.push("YouTube callback must verify upload scope and never request channel-delete capability");
}
if (!videoAutomation.includes("https://www.googleapis.com/upload/youtube/v3/videos") ||
    !videoAutomation.includes("/video_reels") ||
    videoAutomation.includes("EXTERNAL_SOCIAL_PUBLISHING_RETIRED")) {
  failures.push("YouTube and Facebook/Reels upload adapters must be restored and must preserve provider error handling");
}
if (!(adminClient.includes("إعادة تفويض YouTube للرفع والتحليلات") ||
      adminClient.includes("ربط YouTube لقراءة القناة والإحصاءات")) ||
    !adminClient.includes("لا نطلب صلاحية الحذف") ||
    adminClient.includes("scheduleMinutes")) {
  failures.push("social center must describe YouTube authorization and the event-driven automated-QA publisher accurately");
}
if (adminClient.includes("اعتمد الفيديو أولًا") ||
    adminClient.includes("موقوف لمراجعة الجودة") ||
    !adminClient.includes("فحوص الجودة الآلية غير مكتملة") ||
    !adminClient.includes("تنتقل للنشر تلقائيًا")) {
  failures.push("social center must show automated QA diagnostics and must not prompt for manual video approval");
}
if (!writtenWorker.includes('"articles"') ||
    !writtenWorker.includes("content_publish_queue") ||
    !writtenWorker.includes("social_publish_queue") ||
    !writtenWorker.includes("buildWrittenSocialQueuePayload") ||
    !writtenWorker.includes("createWrittenSocialAutomationKey") ||
    !writtenWorker.includes("enqueueExistingWrittenArticlesForFacebook") ||
    !writtenPostService.includes('content_type: "written_post"') ||
    !writtenPostService.includes('target_platforms: ["facebook"]')) {
  failures.push("written-content factory must preserve the internal article queue and idempotently enqueue a Facebook-only text post");
}
if (!videoCatalog.includes("metadata.generatedVideoUrl") ||
    !videoCatalog.includes("isPubliclyRenderableVideo") ||
    !sitePublisher.includes('"videos"')) {
  failures.push("generated media must remain visible in the internal video catalog and site publication queue");
}

const facebookPublicPostsGuard = facebookPublicPosts.indexOf("if (!getServerEnv().SUPABASE_SERVICE_ROLE_KEY) return [];");
const facebookPublicPostsQuery = facebookPublicPosts.indexOf("supabaseServerAdminRequest<SocialQueueRow[]>");
if (!facebookPublicPosts.includes('import { getServerEnv } from "@/lib/env";') ||
    facebookPublicPostsGuard < 0 || facebookPublicPostsQuery < 0 ||
    facebookPublicPostsGuard > facebookPublicPostsQuery) {
  failures.push("optional public Facebook feed must skip private queue reads when the Preview/Development service-role credential is intentionally absent");
}

if (failures.length) {
  console.error("CONTROLLED_SOCIAL_PUBLISHING_CHECK_FAILED");
  for (const failure of failures) console.error("❌ " + failure);
  process.exit(1);
}
console.log("✅ Scheduled, event-driven automated-QA social publishing and internal video generation contracts passed.");
