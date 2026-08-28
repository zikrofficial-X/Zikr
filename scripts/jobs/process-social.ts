#!/usr/bin/env node
/**
 * Background Job: Process Social Publishing Queue
 *
 * Fetches queued social media posts from Supabase and publishes them:
 * 1. Fetch queued items from social_publish_queue table
 * 2. Publish to Facebook (if configured)
 * 3. Publish to YouTube (if configured)
 * 4. Update queue item status
 *
 * This script is called by GitHub Actions workflow: .github/workflows/background-jobs.yml
 *
 * Schedule: Every 15 minutes (every 15 minutes)
 * Timeout: 15 minutes
 *
 * Run with: pnpm tsx scripts/jobs/process-social.ts
 *
 * Environment Variables Required:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - DATABASE_URL
 * - NEXT_PUBLIC_SITE_URL
 */

import {
  claimPendingSocialPublishItems,
  processSocialPublishItem,
} from "@/lib/services/social-publishing";

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const BATCH_SIZE = 10; // Process up to 10 items per run
const JOB_NAME = "process-social";
const LOG_PREFIX = `[${JOB_NAME}]`;

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

function validateEnvironment(): void {
  const required = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_SITE_URL",
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `${LOG_PREFIX} Missing required environment variables: ${missing.join(", ")}`
    );
  }

  const optional = [
    "YOUTUBE_CLIENT_ID",
    "YOUTUBE_CLIENT_SECRET",
    "YOUTUBE_REFRESH_TOKEN",
    "FACEBOOK_PAGE_ID",
    "FACEBOOK_PAGE_ACCESS_TOKEN",
  ];

  const unconfigured = optional.filter(key => !process.env[key]);
  if (unconfigured.length > 0) {
    console.warn(
      `${LOG_PREFIX} Optional publishing targets not configured: ${unconfigured.join(", ")}`
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Job Logic
// ─────────────────────────────────────────────────────────────────────────────

interface JobResult {
  success: boolean;
  processed: number;
  succeeded: number;
  failed: number;
}

async function runJob(): Promise<JobResult> {
  console.log(`${LOG_PREFIX} Starting social publishing job`);
  console.log(`${LOG_PREFIX} Timestamp: ${new Date().toISOString()}`);
  console.log(`${LOG_PREFIX} Batch size: ${BATCH_SIZE}`);
  console.log("");

  let totalProcessed = 0;
  let totalSucceeded = 0;
  let totalFailed = 0;

  try {
    validateEnvironment();
    console.log(`${LOG_PREFIX} Environment validation passed`);
    console.log("");

    // Claim items before any external side effect. This prevents duplicate
    // publishing when an older/manual entrypoint overlaps the scheduler.
    console.log(
      `${LOG_PREFIX} Claiming queued social items (limit: ${BATCH_SIZE})...`
    );
    const queuedItems = await claimPendingSocialPublishItems(BATCH_SIZE);

    if (queuedItems.length === 0) {
      console.log(`${LOG_PREFIX} No queued social items found`);
      console.log("");
      console.log(`${LOG_PREFIX} Job completed`);
      console.log(`${LOG_PREFIX} Processed: 0, Succeeded: 0, Failed: 0`);
      return {
        success: true,
        processed: 0,
        succeeded: 0,
        failed: 0,
      };
    }

    console.log(`${LOG_PREFIX} Found ${queuedItems.length} queued item(s)`);
    console.log("");

    // Process each item (in parallel is OK for social publishing)
    let itemIndex = 0;
    const results = await Promise.all(
      queuedItems.map(async item => {
        itemIndex++;
        const currentIndex = itemIndex;
        console.log(
          `${LOG_PREFIX} [${currentIndex}/${queuedItems.length}] Processing item: ${item.id}`
        );
        console.log(`  Type: ${item.content_type}`);
        console.log(`  Platforms: ${item.target_platforms.join(", ")}`);
        console.log(`  Status: ${item.status}`);

        try {
          const success = await processSocialPublishItem(item, {
            alreadyClaimed: true,
          });
          if (success) {
            totalSucceeded++;
            console.log(`  ✅ Published successfully to all platforms`);
          } else {
            totalFailed++;
            console.log(`  ⚠️  Partial failure (see details in database)`);
          }
          return { success: true };
        } catch (err) {
          totalFailed++;
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.error(`  ❌ Error: ${errorMsg}`);
          return { success: false, error: errorMsg };
        }
      })
    );

    totalProcessed = results.length;

    // Summary
    console.log("");
    console.log(`${LOG_PREFIX} Job completed`);
    console.log(
      `${LOG_PREFIX} Processed: ${totalProcessed}, Succeeded: ${totalSucceeded}, Failed: ${totalFailed}`
    );
    console.log("");

    return {
      success: totalFailed === 0,
      processed: totalProcessed,
      succeeded: totalSucceeded,
      failed: totalFailed,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`${LOG_PREFIX} Fatal error: ${errorMsg}`);
    console.error("");
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Execute Job
// ─────────────────────────────────────────────────────────────────────────────

runJob()
  .then(result => {
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error(`${LOG_PREFIX} Unhandled error:`, error);
    process.exit(1);
  });
