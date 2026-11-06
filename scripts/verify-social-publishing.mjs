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
const writtenApi = read("src/app/api/admin/social/written/route.ts");
const socialPage = read("src/app/admin/social/page.tsx");
const writtenPage = read("src/app/admin/social/written-studio/page.tsx");
const navigation = read("src/features/admin/config/navigation.ts");
const runner = read("scripts/run-background-jobs.ts");
const videoGenerator = read("scripts/jobs/template-video-automation.ts");
const socialWorker = read("scripts/jobs/social-publishing.ts");
const socialPublishingService = read("src/features/social/services/social-publishing.ts");
const youtubeCredentials = read("src/features/social/services/youtube-oauth-credentials.ts");
const videoAutomation = read("src/features/videos/services/video-automation.ts");
const socialWorkflow = read(".github/workflows/publish-social.yml");
const videoWorkflow = read(".github/workflows/generate-ai-video.yml");
const youtubeConnect = read("src/app/api/admin/social/youtube/connect/route.ts");
const youtubeCallback = read("src/app/api/admin/social/youtube/callback/route.ts");
const facebookConnect = read("src/app/api/admin/social/facebook/connect/route.ts");
const facebookCallback = read("src/app/api/admin/social/facebook/callback/route.ts");
const adminClient = read("src/app/admin/social/social-client.tsx");
const writtenWorker = read("scripts/jobs/written-content-automation.ts");
const videoCatalog = read("src/features/videos/services/videos.ts");
const sitePublisher = read("scripts/jobs/content-publishing.ts");

if (!socialApi.includes('requireAdminApi("social.manage")') ||
    !socialApi.includes('requireAdminApi("social.publish")') ||
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
if (!writtenApi.includes('code: "EXTERNAL_WRITTEN_PUBLISHING_RETIRED"') || !writtenApi.includes("status: 410")) {
  failures.push("external written-post publishing must remain retired; internal articles use their own generator");
}
if (!socialPage.includes('requireAdminPermission("social.manage")') ||
    !socialPage.includes("AdminSocialClient")) {
  failures.push("social admin page must be permission-gated and render the social control center");
}
if (!writtenPage.includes('redirect("/admin/memory")')) {
  failures.push("external written studio must remain retired and redirect to internal memory");
}
if (!navigation.includes('key: "media-audio"') || !navigation.includes('href: "/admin/social"')) {
  failures.push("permission-gated social publishing center must be present in admin navigation");
}
if (!runner.includes("processSocialPublishQueue") ||
    !runner.includes('process.env.SOCIAL_PUBLISH_ENABLED !== "true"') ||
    !runner.includes('process.env.SOCIAL_SYNC_INSIGHTS === "true"')) {
  failures.push("background runner must process social only when enabled and must make insights sync opt-in");
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
    !videoGenerator.includes("await queueSocialItems(request, rendered.videoUrl)") ||
    videoGenerator.includes("reconcileCompletedVideoSocialQueue")) {
  failures.push("only newly generated videos may create social queue items; historical generation requests must not be reconciled");
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
if (!socialPublishingService.includes("created_at=gte.${createdSince}") ||
    !socialPublishingService.includes("Invalid SOCIAL_PUBLISH_AFTER cutoff") ||
    !socialPublishingService.includes("stale recovery is disabled")) {
  failures.push("social queue reads, stale recovery, and cleanup must be restricted to the explicit post-launch cutoff");
}
if (!socialWorkflow.includes("workflow_run:") ||
    !socialWorkflow.includes('workflows: ["ZIKR Autonomous AI Video Worker"]') ||
    !socialWorkflow.includes("github.event.workflow_run.conclusion == 'success'") ||
    !socialWorkflow.includes("workflow_dispatch:")) {
  failures.push("social publisher must be event-driven after successful generation and support explicit manual dispatch");
}
if (socialWorkflow.includes("\n  schedule:") || socialWorkflow.includes("\n  push:") ||
    socialWorkflow.includes("if: false")) {
  failures.push("social publisher must not use polling, push triggers, or the retired kill switch");
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
if (!youtubeCallback.includes('requireAdminApi("social.manage")') ||
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
if (!adminClient.includes("إعادة تفويض YouTube للرفع والتحليلات") ||
    !adminClient.includes("لا نطلب صلاحية الحذف") ||
    adminClient.includes("scheduleMinutes")) {
  failures.push("social center must describe YouTube analytics connection and the event-driven publisher accurately");
}
if (!writtenWorker.includes('"articles"') ||
    writtenWorker.includes("social_publish_queue") ||
    !writtenWorker.includes("content_publish_queue")) {
  failures.push("internal written-content factory must continue publishing only to the ZIKR website");
}
if (!videoCatalog.includes("metadata.generatedVideoUrl") ||
    !videoCatalog.includes("isPubliclyRenderableVideo") ||
    !sitePublisher.includes('"videos"')) {
  failures.push("generated media must remain visible in the internal video catalog and site publication queue");
}

if (failures.length) {
  console.error("CONTROLLED_SOCIAL_PUBLISHING_CHECK_FAILED");
  for (const failure of failures) console.error("❌ " + failure);
  process.exit(1);
}
console.log("✅ Approval-gated event-driven social publishing and internal video generation contracts passed.");
