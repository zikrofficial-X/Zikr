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

const workflow = read(".github/workflows/generate-ai-video.yml");
if (!workflow.includes("SOCIAL_PUBLISH_FACEBOOK_ENABLED: ${{ secrets.FACEBOOK_PAGE_ACCESS_TOKEN != '' && secrets.FACEBOOK_PAGE_ID != '' }}")) failures.push("autonomous GitHub worker must keep Facebook publishing configuration-controlled by repository secrets");

const adminApi = read("src/app/api/admin/social/route.ts");
if (!adminApi.includes("authBlockedPlatforms")) failures.push("Admin retry path must understand Facebook auth-blocked platforms");
if (!adminApi.includes("youtubeConfigured")) failures.push("Admin social health must expose YouTube configuration");
if (!adminApi.includes("facebookAuthBlocked")) failures.push("Admin social health must expose Facebook auth-block count");
if (!adminApi.includes("target_platforms: platforms")) failures.push("Admin retry must narrow targets to actually retryable platforms");

const adminUi = read("src/app/admin/social/social-client.tsx");
if (!adminUi.includes("Facebook Auth Blocks")) failures.push("Admin social UI must show Facebook auth-block count");
if (!adminUi.includes("Facebook متوقف حاليًا")) failures.push("Admin social UI must explain the disabled Facebook state");

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
