#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const failures = [];
const read = (path) => {
  if (!existsSync(path)) {
    failures.push(`missing required Video QA file: ${path}`);
    return "";
  }
  return readFileSync(path, "utf8");
};

const service = read("src/features/videos/services/videos.ts");
for (const token of [
  "function resolveVideoMediaUrl",
  "function resolveVideoThumbnail",
  "function isPubliclyRenderableVideo",
  "https://i.ytimg.com/vi/",
  "defaultOgImage",
  "rows.filter(isPubliclyRenderableVideo)",
]) {
  if (!service.includes(token)) failures.push(`video service missing QA contract: ${token}`);
}
if (service.includes("metadata.content_ref")) failures.push("generic content_ref must not be treated as a playable video URL");
if (!service.includes("Math.min(100, safeLimit * 2)")) failures.push("video query must over-fetch enough rows to fill the public renderable limit");
if (!service.includes("renderableRows.slice(0, safeLimit)")) failures.push("video service must cap after renderability filtering");

const detail = read("src/app/videos/[slug]/page.tsx");
if (!detail.includes("images: video.thumbnailUrl")) failures.push("video detail metadata must expose the resolved thumbnail");
if (!detail.includes("poster={video.thumbnailUrl || undefined}")) failures.push("direct video player must consume the resolved poster");
if (!detail.includes("video.youtubeId")) failures.push("video detail must retain YouTube playback path");

const site = read("src/lib/site.ts");
if (!site.includes('defaultOgImage = "/branding/og-image.png"')) failures.push("QA placeholder must use the canonical local OG image");

const pkg = JSON.parse(read("package.json"));
if (!pkg.scripts["video:qa:check"]) failures.push("video:qa:check must be registered");
if (!pkg.scripts["verify:pr"]?.includes("pnpm video:qa:check")) failures.push("verify:pr must include Video QA verification");
if (!pkg.scripts["verify"]?.includes("pnpm video:qa:check")) failures.push("verify must include Video QA verification");

if (failures.length) {
  console.error("VIDEO_QA_CHECK_FAILED");
  for (const failure of failures) console.error(`❌ ${failure}`);
  process.exit(1);
}
console.log("✅ Phase 12 Video QA checks passed");
