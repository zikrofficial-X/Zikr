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

const publisher = read("src/features/social/services/social-publishing.ts");
const adminSocial = read("src/app/api/admin/social/route.ts");
if (adminSocial.includes("/api/internal/video-processing")) failures.push("admin social retry references a retired noop endpoint");
if (!adminSocial.includes('dispatchGitHubWorkflow("publish-social.yml")')) failures.push("admin social retry must use the canonical GitHub social workflow");
if (!publisher.includes("updated_at=eq.")) failures.push("social queue claims must use optimistic updated_at concurrency");
if (!publisher.includes('env.SOCIAL_PUBLISH_FACEBOOK_ENABLED !== "true"')) failures.push("Facebook publisher must require explicit feature enablement");
if (!publisher.includes("isFacebookAuthFailure")) failures.push("Facebook auth failures must be classified separately");
if (!publisher.includes("authBlocked: hasAuthFailure")) failures.push("Facebook auth failures must block repeated automatic retries");
if (!publisher.includes("platformResults")) failures.push("platform-level results must be persisted");
if (!publisher.includes("pendingPlatforms")) failures.push("already-successful platforms must be excluded from retries");
if (!publisher.includes("remoteId")) failures.push("successful providers must persist their remote platform IDs");
if (publisher.includes("console.log(pageAccessToken") || publisher.includes("console.log(env.FACEBOOK_PAGE_ACCESS_TOKEN")) failures.push("Facebook access tokens must never be logged");

const queue = read("scripts/jobs/template-video-automation.ts");
if (!queue.includes('process.env.SOCIAL_PUBLISH_FACEBOOK_ENABLED === "true"')) failures.push("new Facebook queue targets must be explicitly enabled");
if (!queue.includes("findSocialQueueByAutomationKey")) failures.push("social queue idempotency lookup is required");
if (!queue.includes("desiredTargets = [...new Set([...existingTargets, ...targets])]")) failures.push("existing social targets must be preserved without duplicates");

const env = read("src/lib/env.ts");
if (!env.includes("SOCIAL_PUBLISH_FACEBOOK_ENABLED")) failures.push("server env must expose the Facebook feature gate");
if (!env.includes('SOCIAL_PUBLISH_FACEBOOK_ENABLED: validatedEnv.SOCIAL_PUBLISH_FACEBOOK_ENABLED || "false"')) failures.push("Facebook feature gate must default to false");

const example = read(".env.example");
if (!example.includes("SOCIAL_PUBLISH_FACEBOOK_ENABLED=false")) failures.push(".env.example must keep Facebook publishing disabled by default");

const generationWorkflow = read(".github/workflows/generate-ai-video.yml");
if (!generationWorkflow.includes('AUTO_VIDEO_PUBLISH_ENABLED: "true"')) failures.push("video generation must keep social queueing enabled");
if (!generationWorkflow.includes('SOCIAL_PUBLISH_ENABLED: "false"')) failures.push("video generation must not execute social publishing directly");

const workflow = read(".github/workflows/publish-social.yml");
if (!workflow.includes('SOCIAL_PUBLISH_ENABLED: "true"')) failures.push("dedicated GitHub social workflow must explicitly enable publishing");
if (!workflow.includes('BACKGROUND_JOB_TARGET: "social"')) failures.push("GitHub social workflow must only process the social queue");
if (!workflow.includes("FACEBOOK_PAGE_ACCESS_TOKEN")) failures.push("GitHub social workflow must receive the Facebook access-token secret");

const adminApi = read("src/app/api/admin/social/route.ts");
if (!adminApi.includes("authBlockedPlatforms")) failures.push("Admin retry path must understand Facebook auth-blocked platforms");
if (!adminApi.includes("youtubeConfigured")) failures.push("Admin social health must expose YouTube configuration");
if (!adminApi.includes("facebookAuthBlocked")) failures.push("Admin social health must expose Facebook auth-block count");
if (!adminApi.includes("target_platforms: platforms")) failures.push("Admin retry must narrow targets to actually retryable platforms");
if (!adminApi.includes("platformStats")) failures.push("Admin social API must expose platform-level queue statistics");
if (!adminApi.includes("oldestQueuedAt")) failures.push("Admin social API must expose the oldest queued timestamp");
if (!adminApi.includes('action === "run_worker"')) failures.push("Admin social API must support manual worker dispatch");

const adminUi = read("src/app/admin/social/social-client.tsx");
if (!adminUi.includes("Facebook Auth Blocks")) failures.push("Admin social UI must show Facebook auth-block count");
if (!adminUi.includes("سجلات فشل اعتماد Facebook السابقة")) failures.push("Admin social UI must label Facebook auth-blocks as historical queue records");
if (adminUi.includes("Facebook متوقف حاليًا بسبب اعتماد منتهي")) failures.push("Admin social UI must not claim current Facebook credentials are expired based only on historical queue failures");
if (!adminUi.includes("هذا العداد تاريخي")) failures.push("Admin social UI must explicitly distinguish historical auth-blocks from current Facebook health");
if (!adminUi.includes("تشغيل العامل الآن")) failures.push("Admin social UI must expose the manual worker control");
if (!adminUi.includes("successRate")) failures.push("Admin social UI must show platform success rates");

const migration = read("supabase/migrations/20260929045633_create_social_publish_queue_20260929.sql");
if (!migration.includes("idx_social_publish_queue_automation_key")) failures.push("social queue must retain unique automation-key idempotency");

const packageJson = JSON.parse(read("package.json"));
if (!packageJson.scripts["social:publish:check"]) failures.push("social:publish:check must be registered");
if (!packageJson.scripts["verify:pr"]?.includes("pnpm social:publish:check")) failures.push("verify:pr must include social publishing verification");
if (!packageJson.scripts["verify"]?.includes("pnpm social:publish:check")) failures.push("verify must include social publishing verification");

if (failures.length) {
  console.error("SOCIAL_PUBLISHING_CHECK_FAILED");
  for (const failure of failures) console.error(`❌ ${failure}`);
  process.exit(1);
}
console.log("✅ Phase 14 Social Publishing checks passed");
