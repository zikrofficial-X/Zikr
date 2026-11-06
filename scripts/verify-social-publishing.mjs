#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const failures = [];
const read = (path) => {
  if (!existsSync(path)) {
    failures.push("missing required retired-social contract file: " + path);
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
const memoryPage = read("src/app/admin/memory/page.tsx");
const socialWorkflow = read(".github/workflows/publish-social.yml");
const writtenWorkflow = read(".github/workflows/generate-written-content.yml");
const videoWorkflow = read(".github/workflows/generate-ai-video.yml");
const youtubeConnect = read("src/app/api/admin/social/youtube/connect/route.ts");
const youtubeCallback = read("src/app/api/admin/social/youtube/callback/route.ts");
const analyticsPanel = read("src/features/admin/components/traffic-revenue-panel.tsx");

if (!socialApi.includes('code: "SOCIAL_PUBLISHING_RETIRED"') || !socialApi.includes("{ status: 410")) {
  failures.push("social API mutations must fail closed with HTTP 410");
}
if (!writtenApi.includes('code:"EXTERNAL_WRITTEN_PUBLISHING_RETIRED"') || !writtenApi.includes("status:410")) {
  failures.push("Facebook-only written-content generation must fail closed with HTTP 410");
}
if (!socialWorkflow.includes("if: false")) failures.push("legacy external social publisher workflow must be disabled");
if (writtenWorkflow.includes("if: false") || !writtenWorkflow.includes('WRITTEN_CONTENT_ENABLED: "true"')) failures.push("internal written-content generator workflow must be enabled for ZIKR website articles");
const writtenWorker = read("scripts/jobs/written-content-automation.ts");
if (writtenWorker.includes("social_publish_queue") || !writtenWorker.includes('"/rest/v1/articles"') || !writtenWorker.includes('"/rest/v1/content_publish_queue"')) {
  failures.push("written-content generator must write only to internal article and content publishing tables");
}
if (/processSocialPublishQueue|syncSocialInsights|reconcileCompletedVideoSocialQueue/.test(runner)) {
  failures.push("internal video worker must not import or execute external social publishers");
}
if (!runner.includes('processScheduledContent(20)')) {
  failures.push("background worker must publish only content already scheduled for the ZIKR website");
}
if (!videoWorkflow.includes("BACKGROUND_JOB_TARGET: \"videos\"")) failures.push("video worker must target internal video generation only");
for (const token of ["YOUTUBE_CLIENT_ID", "YOUTUBE_REFRESH_TOKEN", "FACEBOOK_GRAPH_API_VERSION", "SOCIAL_PUBLISH_ENABLED"]) {
  if (videoWorkflow.includes(token)) failures.push("internal video workflow must not depend on external social credential/config: " + token);
}
if (!socialPage.includes('redirect("/admin/memory")')) failures.push("retired social center must redirect to internal project memory");
if (!writtenPage.includes('redirect("/admin/memory")')) failures.push("retired written-social studio must redirect to internal project memory");
if (!memoryPage.includes("requireAdminPermission(\"media.manage\")")) failures.push("internal memory route must have a server-side permission gate");
if (videoGenerator.includes("social_publish_queue") || videoGenerator.includes("getFacebookPageCredentials") || videoGenerator.includes("queueSocialItems")) {
  failures.push("video generator must not enqueue or query any external social provider");
}
if (navigation.includes('key: "publishing"') || navigation.includes('href: "/admin/social"')) {
  failures.push("external social publishing must not be part of admin navigation");
}

const requiredReadScopes = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
];
for (const scope of requiredReadScopes) {
  if (!youtubeConnect.includes(scope)) failures.push("YouTube analytics OAuth is missing required read-only scope: " + scope);
}
for (const scope of ["youtube.upload", "youtube.force-ssl"]) {
  if (youtubeConnect.includes(scope) || youtubeCallback.includes(scope)) {
    failures.push("YouTube analytics OAuth must not request publish/delete scope: " + scope);
  }
}
if (!youtubeConnect.includes('requireAdminApi("analytics.read")') || !youtubeCallback.includes('requireAdminApi("analytics.read")')) {
  failures.push("YouTube OAuth connection must be protected by analytics.read, not social publishing permission");
}
if (!youtubeConnect.includes("YOUTUBE_REDIRECT_URI") || !youtubeCallback.includes("YOUTUBE_REDIRECT_URI")) {
  failures.push("YouTube OAuth authorize and token exchange must use one canonical redirect URI");
}
if (!youtubeCallback.includes('permission: "analytics.read"')) failures.push("YouTube OAuth audit event must use analytics.read permission");
if (!analyticsPanel.includes("/api/admin/social/youtube/connect") || !analyticsPanel.includes("قراءة فقط")) {
  failures.push("read-only YouTube account connection must be available from the analytics dashboard");
}

if (failures.length) {
  console.error("EXTERNAL_SOCIAL_RETIREMENT_CHECK_FAILED");
  for (const failure of failures) console.error("❌ " + failure);
  process.exit(1);
}
console.log("✅ External social publishing is retired; YouTube remains read-only analytics only.");
