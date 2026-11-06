#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const failures = [];
const read = (path) => {
  if (!existsSync(path)) {
    failures.push("missing required internal-only policy file: " + path);
    return "";
  }
  return readFileSync(path, "utf8");
};

const socialApi = read("src/app/api/admin/social/route.ts");
const writtenApi = read("src/app/api/admin/social/written/route.ts");
const facebookConnect = read("src/app/api/admin/social/facebook/connect/route.ts");
const facebookCallback = read("src/app/api/admin/social/facebook/callback/route.ts");
const youtubeConnect = read("src/app/api/admin/social/youtube/connect/route.ts");
const youtubeCallback = read("src/app/api/admin/social/youtube/callback/route.ts");
const youtubeCredentials = read("src/features/social/services/youtube-oauth-credentials.ts");
const videoAutomation = read("src/features/videos/services/video-automation.ts");
const videoWorker = read("scripts/jobs/template-video-automation.ts");
const runner = read("scripts/run-background-jobs.ts");
const socialWorkflow = read(".github/workflows/publish-social.yml");

for (const [name, source] of [
  ["social control API", socialApi],
  ["written social API", writtenApi],
  ["Facebook connect API", facebookConnect],
  ["Facebook callback API", facebookCallback],
]) {
  if (!source.includes("status: 410") || !/RETIRED/.test(source)) {
    failures.push(name + " must be retired and return HTTP 410");
  }
}
if (socialApi.includes("social_publish_queue") || socialApi.includes("dispatchGitHubWorkflow") || socialApi.includes("fetch(")) {
  failures.push("retired social control API must not read, mutate, or dispatch external publishing");
}
if (!youtubeConnect.includes("youtube.readonly") || !youtubeConnect.includes("yt-analytics.readonly")) {
  failures.push("YouTube OAuth must request only channel and analytics read scopes");
}
if (youtubeConnect.includes("youtube.upload") || youtubeConnect.includes("youtube.force-ssl") || youtubeConnect.includes("youtube") && youtubeConnect.includes("include_granted_scopes\", \"true\"")) {
  failures.push("YouTube OAuth must not request or inherit upload/write scopes");
}
if (youtubeCallback.includes('canReadChannel: set.has(YOUTUBE_READ_SCOPE)') === false ||
    youtubeCallback.includes('const YOUTUBE_SCOPE = "https://www.googleapis.com/auth/youtube"')) {
  failures.push("YouTube OAuth callback must reject broad upload-capable grants");
}
if (!youtubeCredentials.includes("granted_scopes") || !youtubeCredentials.includes("yt-analytics.readonly") || youtubeCredentials.includes("getServerEnv")) {
  failures.push("YouTube analytics must require a stored credential with explicit read-only scopes and no unknown-scope fallback");
}
if (!videoAutomation.includes('throw new Error("EXTERNAL_SOCIAL_PUBLISHING_RETIRED")') ||
    videoAutomation.includes("https://www.googleapis.com/upload/youtube/v3/videos") ||
    videoAutomation.includes("graph.facebook.com")) {
  failures.push("video provider upload functions must fail closed without external network calls");
}
if (videoWorker.includes("social_publish_queue") || videoWorker.includes("queueSocialItems") || videoWorker.includes("reconcileCompletedVideoSocialQueue")) {
  failures.push("video generation worker must not create or reconcile external social queue records");
}
if (runner.includes("social_publish_queue") || runner.includes("reconcileCompletedVideoSocialQueue")) {
  failures.push("background runner must not process historical external social queue records");
}
if (socialWorkflow.includes("\n  schedule:") || !socialWorkflow.includes("if: false") || !socialWorkflow.includes('SOCIAL_PUBLISH_ENABLED: "false"')) {
  failures.push("external social workflow must have no automatic schedule and remain explicitly disabled");
}

const migration = read("supabase/migrations/20261106090800_production_blockers_and_social_insights.sql");
if (!migration.includes("CREATE TABLE IF NOT EXISTS public.social_post_insights")) {
  failures.push("historical social insight storage must be retained for audit");
}
if (failures.length) {
  console.error("INTERNAL_ONLY_SOCIAL_POLICY_CHECK_FAILED");
  for (const failure of failures) console.error("❌ " + failure);
  process.exit(1);
}
console.log("✅ Internal-only video delivery, retired social publishing, and read-only YouTube analytics contracts passed.");
