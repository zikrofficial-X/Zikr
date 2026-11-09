#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
const failures = [];
const read = (file) => existsSync(file) ? readFileSync(file, "utf8") : "";
const social = read(".github/workflows/publish-social.yml");
const video = read(".github/workflows/generate-ai-video.yml");
const written = read(".github/workflows/generate-written-content.yml");
const sitePublisher = read("scripts/jobs/content-publishing.ts");
if (!social) failures.push("external publisher workflow is missing");
if (/^\s{2}(schedule|workflow_run):/m.test(social)) failures.push("external publisher must have no schedule or workflow_run trigger");
if (!/^\s{2}workflow_dispatch:/m.test(social) || !/disabled:\s*\n\s+if:\s*false/m.test(social)) failures.push("manual dispatch must be inert behind an unconditional false job gate");
if (/SOCIAL_PUBLISH_ENABLED:\s*["']true|BACKGROUND_JOB_TARGET:\s*["']social|SOCIAL_PUBLISH_(FACEBOOK|YOUTUBE)_ENABLED/m.test(social)) failures.push("external publishing credentials or enabled execution must not be configured");
if (!video.includes('BACKGROUND_JOB_TARGET: "videos"') || !video.includes('AUTO_VIDEO_ENABLED: "true"')) failures.push("scheduled internal video generation must remain enabled");
for (const token of ["AUTO_VIDEO_PUBLISH_ENABLED", "YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "FACEBOOK_PUBLISHING_REQUESTED", "SOCIAL_PUBLISH_ENABLED"]) {
  if (video.includes(token)) failures.push("internal video workflow must not depend on external publishing: " + token);
}
if (!written.includes("schedule:") || !written.includes('WRITTEN_CONTENT_ENABLED: "true"')) failures.push("internal written-content schedule must remain enabled");
if (!sitePublisher.includes('"videos"')) failures.push("internal site publisher must keep the video queue enabled");
if (failures.length) {
  console.error("INTERNAL_ONLY_SOCIAL_POLICY_CHECK_FAILED");
  for (const failure of failures) console.error("❌ " + failure);
  process.exit(1);
}
console.log("✅ External publishing triggers fail closed; internal video, written-content and site queues remain enabled.");
