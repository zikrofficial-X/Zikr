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
const facebookOAuthPolicy = read("src/features/social/services/facebook-oauth-policy.ts");
const facebookProfileSyncPolicy = read("src/features/social/services/social-insights-sync-status.ts");
const videoGenerator = read("scripts/jobs/template-video-automation.ts");
const socialPublishingService = read("src/features/social/services/social-publishing.ts");
const socialQueueMetadataService = read("src/features/social/services/social-queue-metadata.ts");
const cleanupPolicy = read("src/features/social/services/published-video-cleanup.ts");
const youtubeCredentials = read("src/features/social/services/youtube-oauth-credentials.ts");
const videoPublishApproval = read("src/features/videos/services/video-publish-approval.ts");
const backgroundJobSettings = read("src/features/videos/services/background-job-settings.ts");
const videoAutomation = read("src/features/videos/services/video-automation.ts");
const socialWorkflow = read(".github/workflows/publish-social.yml");
const videoWorkflow = read(".github/workflows/generate-ai-video.yml");
const youtubeConnect = read("src/app/api/admin/social/youtube/connect/route.ts");
const youtubeCallback = read("src/app/api/admin/social/youtube/callback/route.ts");
const facebookConnect = read("src/app/api/admin/social/facebook/connect/route.ts");
const facebookCallback = read("src/app/api/admin/social/facebook/callback/route.ts");
const adminClient = read("src/app/admin/social/social-client.tsx");
const environmentVariablesDoc = read("docs/environment-variables.md");
const socialOperationsDoc = read("docs/admin/SOCIAL_PUBLISHING_OPERATIONS.md");
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
    !insightsWorker.includes("getFacebookProfileSyncFailureCount({") ||
    !facebookProfileSyncPolicy.includes("input.lookupFailed || (input.configured && input.stale)") ||
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
    !videoGenerator.includes("getOptionalFacebookPageCredentials") ||
    videoGenerator.includes("getFacebookPageCredentials().catch(() => null)") ||
    !videoGenerator.includes("FACEBOOK_PUBLISHING_REQUESTED") ||
    !videoGenerator.includes("buildAutomatedVideoQaChecklist") ||
    !videoGenerator.includes("createAutomatedVideoQaApproval")) {
  failures.push("video social queue targets must be gated by verified provider credentials and a complete automated QA snapshot");
}
if (youtubeCredentials.includes("export async function getYouTubeUploadRefreshToken") &&
    youtubeCredentials.slice(youtubeCredentials.indexOf("export async function getYouTubeUploadRefreshToken"))
      .includes("return readStored().catch(() => null)")) {
  failures.push("YouTube upload credential-store errors must propagate to retryable publishing paths instead of appearing unconfigured");
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
const resetStart = socialPublishingService.indexOf("export async function resetQueuedSocialVideoMedia(");
const resetEnd = socialPublishingService.indexOf("export async function retryPendingPublishedVideoCleanup(", resetStart);
const resetSource = resetStart >= 0 && resetEnd > resetStart
  ? socialPublishingService.slice(resetStart, resetEnd)
  : "";
if (
  !resetSource.includes("throw new Error") ||
  resetSource.includes("supabaseServerAdminRequest") ||
  resetSource.includes("deleteManagedVideoUrl") ||
  resetSource.includes("video_url: null") ||
  socialPublishingService.includes("deleteManagedVideoUrl")
) {
  failures.push("queued social media reset must remain disabled until it can prove full reference safety; it must not delete playback masters or staging objects");
}
const publishedDeleteStart = socialApi.indexOf('if (action === "delete_published")');
const publishedDeleteEnd = socialApi.indexOf('return NextResponse.json({ error: "إجراء غير صالح." }, { status: 400 });', publishedDeleteStart);
const publishedDeleteBody = publishedDeleteStart >= 0 && publishedDeleteEnd > publishedDeleteStart
  ? socialApi.slice(publishedDeleteStart, publishedDeleteEnd)
  : "";
if (!socialPublishingService.includes("patchSocialQueueMetadataWithCas") ||
    !mediaDisposal.includes('expectedStatus: "published"') ||
    !mediaDisposal.includes("expectedVideoUrl: item.video_url") ||
    !mediaDisposal.includes("status=eq.completed") ||
    !mediaDisposal.includes("updated_at=eq.")) {
  failures.push("published-video retention markers must use completed-request and published-queue compare-and-set updates");
}
if (!publishedDeleteBody.includes("patchSocialQueueMetadataWithCas") ||
    publishedDeleteBody.includes('method: "PATCH"')) {
  failures.push("published-post deletion metadata must use the shared CAS merge helper rather than replacing a stale queue snapshot");
}
if (!socialQueueMetadataService.includes("updated_at=eq.") ||
    !socialQueueMetadataService.includes("mergeSocialQueueMetadata") ||
    !socialQueueMetadataService.includes("for (let attempt = 0; attempt < maxAttempts; attempt += 1)") ||
    !socialQueueMetadataService.includes("updated_at: buildNextSocialQueueMetadataUpdatedAt(row.updated_at)")) {
  failures.push("social queue metadata updates must retry exact-row-version conflicts, merge nested state and advance the row revision monotonically");
}
if (!socialPublishingService.includes("requireSocialQueueRows") ||
    socialPublishingService.includes("Array.isArray(batch) ? batch : []") ||
    socialPublishingService.includes("Array.isArray(writtenCandidates) ? writtenCandidates : []")) {
  failures.push("social queue reads must reject malformed PostgREST row sets instead of silently returning an empty batch");
}
const kidsCatalogSyncStart = socialPublishingService.indexOf("async function syncKidsSocialPublicationToCatalog");
const kidsCatalogSyncEnd = socialPublishingService.indexOf("async function syncYouTubeVideoReferenceToCatalog", kidsCatalogSyncStart);
const kidsCatalogSync = kidsCatalogSyncStart >= 0 && kidsCatalogSyncEnd > kidsCatalogSyncStart
  ? socialPublishingService.slice(kidsCatalogSyncStart, kidsCatalogSyncEnd)
  : "";
const youtubeCatalogSyncStart = socialPublishingService.indexOf("async function syncYouTubeVideoReferenceToCatalog");
const youtubeCatalogSyncEnd = socialPublishingService.indexOf("async function disposePublishedVideo", youtubeCatalogSyncStart);
const youtubeCatalogSync = youtubeCatalogSyncStart >= 0 && youtubeCatalogSyncEnd > youtubeCatalogSyncStart
  ? socialPublishingService.slice(youtubeCatalogSyncStart, youtubeCatalogSyncEnd)
  : "";
if (!kidsCatalogSync.includes('typeof row.updated_at !== "string"') ||
    !kidsCatalogSync.includes('"&updated_at=eq." + encodeURIComponent(row.updated_at)') ||
    kidsCatalogSync.includes('(row.updated_at ? "&updated_at=eq."')) {
  failures.push("Kids catalog social metadata writes must require an exact valid updated_at revision");
}
if (!youtubeCatalogSync.includes('typeof row.updated_at !== "string"') ||
    !youtubeCatalogSync.includes('"&updated_at=eq." + encodeURIComponent(row.updated_at)') ||
    youtubeCatalogSync.includes('(expectedUpdatedAt ? "&updated_at=eq."')) {
  failures.push("YouTube catalog reference writes must require an exact valid updated_at revision");
}
if (!socialWorker.includes("isVideoPurgeLockResponseActive(rows)") ||
    socialWorker.includes("rows?.[0]?.value") ||
    !backgroundJobSettings.includes("export function isVideoPurgeLockResponseActive(")) {
  failures.push("the social publisher must fail closed when the video-purge lock response is malformed");
}
if (!socialPublishingService.includes("created_at=gte.${createdSince}") ||
    (socialPublishingService.match(/resolveSocialPublishCutoff\(process\.env\.SOCIAL_PUBLISH_AFTER\)/g) ?? []).length < 2) {
  failures.push("social queue reads and stale recovery must share the validated explicit post-launch cutoff");
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
  'echo "### Social publishing readiness"',
  'echo "- YouTube client ID configured: $youtube_client_id_present"',
  'echo "- YouTube client secret configured: $youtube_client_secret_present"',
  'echo "::warning::No social provider has a verified publishing credential.',
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
for (const requiredCredentialFilter of [
  "page_access_token=not.is.null",
  "page_access_token=neq.",
  "refresh_token=not.is.null",
  "refresh_token=neq.",
  "channel_id=not.is.null",
  "channel_id=neq.",
]) {
  if (!socialWorkflow.includes(requiredCredentialFilter)) {
    failures.push("social workflow readiness must require non-empty stored provider tokens and the YouTube channel ID without selecting token values: " + requiredCredentialFilter);
  }
}
for (const deleteCapableScope of [
  "https://www.googleapis.com/auth/youtube",
  "https://www.googleapis.com/auth/youtube.force-ssl",
  "https://www.googleapis.com/auth/youtubepartner",
]) {
  if (!youtubeCredentials.includes(deleteCapableScope) || !socialWorkflow.includes(deleteCapableScope)) {
    failures.push("YouTube credential validation and workflow readiness must reject every delete-capable OAuth scope");
  }
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
    !facebookConnect.includes('requireAdminStepUpApi("social.publish"') ||
    !facebookConnect.includes("dialog/oauth") ||
    !facebookConnect.includes("FACEBOOK_REQUESTED_PERMISSIONS.join") ||
    !facebookOAuthPolicy.includes("pages_manage_posts") ||
    facebookConnect.includes("FACEBOOK_INTEGRATION_RETIRED")) {
  failures.push("Facebook OAuth connect must start a scoped Meta Page authorization flow");
}
if (!facebookCallback.includes('requireAdminApi("social.manage")') ||
    !facebookCallback.includes("timingSafeEqual") ||
    !facebookCallback.includes("saveFacebookPageCredential") ||
    !facebookCallback.includes("hasFacebookPublishingPermissions(grantedPermissions)") ||
    !facebookCallback.includes("hasFacebookInsightsPermission(grantedPermissions)") ||
    !facebookCallback.includes('insights: "missing"') ||
    !facebookCallback.includes("page_selection_required") ||
    facebookCallback.includes("FACEBOOK_INTEGRATION_RETIRED")) {
  failures.push("Facebook OAuth callback must require publishing scopes, report missing optional insights separately, and validate the selected managed Page");
}
const facebookRequiredScopes = /const required = \[([\s\S]*?)\];/.exec(socialWorkflow)?.[1] ?? "";
if (!facebookRequiredScopes.includes("pages_show_list") ||
    !facebookRequiredScopes.includes("pages_read_engagement") ||
    !facebookRequiredScopes.includes("pages_manage_posts") ||
    facebookRequiredScopes.includes("read_insights") ||
    !socialWorkflow.includes('const insightsReady = scopes.includes("read_insights")')) {
  failures.push("Facebook workflow readiness must require publishing scopes only and report read_insights as optional");
}
if (!facebookOAuthPolicy.includes("FACEBOOK_REQUIRED_PUBLISH_PERMISSIONS") ||
    !facebookOAuthPolicy.includes("FACEBOOK_REQUESTED_PERMISSIONS") ||
    !facebookOAuthPolicy.includes("hasFacebookPublishingPermissions") ||
    !facebookOAuthPolicy.includes("hasFacebookInsightsPermission")) {
  failures.push("Facebook OAuth must share one explicit publishing/optional-insights permission contract");
}
if (facebookProfileIntegration.includes("env.FACEBOOK_PAGE_ACCESS_TOKEN") ||
    !facebookProfileIntegration.includes("storedCredential?.page_access_token?.trim() || ''")) {
  failures.push("Facebook profile sync must never activate an unvalidated environment token");
}
if (!facebookCallback.includes("await saveFacebookPageCredential(") ||
    facebookCallback.includes("unblockFacebookAuthBlockedQueue") ||
    facebookCallback.includes('dispatchGitHubWorkflow("publish-social.yml"')) {
  failures.push("Facebook OAuth callback must persist the verified Page credential only; queue recovery remains a separate confirmed social.publish action");
}
if (!youtubeCallback.includes('requireAdminApi("social.manage")') ||
    !youtubeCallback.includes("hasYouTubeUploadScopes(scopes)") ||
    !youtubeCallback.includes("canUpload") ||
    !youtubeCallback.includes("flags.canUpload") ||
    !youtubeCallback.includes('permission: "social.manage"') ||
    youtubeCallback.includes("youtube.force-ssl") ||
    youtubeCallback.includes("youtubepartner")) {
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
if (!adminClient.includes('const REMOTE_DELETE_PLATFORMS = new Set<string>(["facebook", "facebook_reels"])') ||
    !adminClient.includes("REMOTE_DELETE_PLATFORMS.has(platform)") ||
    !adminClient.includes('deletePublished(selectedPublished, [...REMOTE_DELETE_PLATFORMS])') ||
    !adminClient.includes("لم يتم إرسال طلب حذف إلى YouTube") ||
    !environmentVariablesDoc.includes("YouTube remote deletion is not supported by the current integration") ||
    !socialOperationsDoc.includes("YouTube remote deletion: **disabled in the current integration**")) {
  failures.push("YouTube remote deletion must remain disabled in the UI while the least-privilege OAuth policy excludes delete scopes");
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
