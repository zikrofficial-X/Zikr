#!/usr/bin/env node
/**
 * Background Job: Process Videos
 *
 * Fetches pending video generation requests from Supabase and processes them:
 * 1. Generate video using HeyGen API
 * 2. Publish to YouTube (if configured)
 * 3. Publish to Facebook (if configured)
 * 4. Update database with results
 *
 * This script is called by GitHub Actions workflow: .github/workflows/background-jobs.yml
 *
 * Schedule: Daily at 3:00 AM UTC (0 3 * * *)
 * Timeout: 15 minutes
 *
 * Run with: pnpm tsx scripts/jobs/process-videos.ts
 *
 * Environment Variables Required:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - DATABASE_URL
 * - HEYGEN_API_KEY
 * - HEYGEN_AVATAR_ID
 * - HEYGEN_VOICE_ID
 */

import { getPendingVideoRequests, processVideoGenerationRequest } from '@/lib/services/video-automation';

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const BATCH_SIZE = 3; // Process in small batches due to HeyGen API rate limiting
const JOB_NAME = 'process-videos';
const LOG_PREFIX = `[${JOB_NAME}]`;

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

function validateEnvironment(): void {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'HEYGEN_API_KEY',
    'HEYGEN_AVATAR_ID',
    'HEYGEN_VOICE_ID',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`${LOG_PREFIX} Missing required environment variables: ${missing.join(', ')}`);
  }

  const optional = [
    'YOUTUBE_CLIENT_ID',
    'YOUTUBE_CLIENT_SECRET',
    'YOUTUBE_REFRESH_TOKEN',
    'FACEBOOK_PAGE_ID',
    'FACEBOOK_PAGE_ACCESS_TOKEN',
  ];

  const unconfigured = optional.filter((key) => !process.env[key]);
  if (unconfigured.length > 0) {
    console.warn(
      `${LOG_PREFIX} Optional video publishing targets not configured: ${unconfigured.join(', ')}`
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
  console.log(`${LOG_PREFIX} Starting video processing job`);
  console.log(`${LOG_PREFIX} Timestamp: ${new Date().toISOString()}`);
  console.log(`${LOG_PREFIX} Batch size: ${BATCH_SIZE}`);
  console.log('');

  let totalProcessed = 0;
  let totalSucceeded = 0;
  let totalFailed = 0;

  try {
    validateEnvironment();
    console.log(`${LOG_PREFIX} Environment validation passed`);
    console.log('');

    // Fetch pending requests
    console.log(`${LOG_PREFIX} Fetching pending video requests (limit: ${BATCH_SIZE})...`);
    const pendingRequests = await getPendingVideoRequests(BATCH_SIZE);

    if (pendingRequests.length === 0) {
      console.log(`${LOG_PREFIX} No pending video requests found`);
      console.log('');
      console.log(`${LOG_PREFIX} Job completed`);
      console.log(`${LOG_PREFIX} Processed: 0, Succeeded: 0, Failed: 0`);
      return {
        success: true,
        processed: 0,
        succeeded: 0,
        failed: 0,
      };
    }

    console.log(`${LOG_PREFIX} Found ${pendingRequests.length} pending request(s)`);
    console.log('');

    // Process each request sequentially
    for (const request of pendingRequests) {
      totalProcessed++;
      console.log(`${LOG_PREFIX} [${totalProcessed}/${pendingRequests.length}] Processing video: ${request.id}`);
      console.log(`  Title: ${request.title}`);
      console.log(`  Status: ${request.status}`);

      try {
        const success = await processVideoGenerationRequest(request);
        if (success) {
          totalSucceeded++;
          console.log(`  ✅ Completed successfully`);
        } else {
          totalFailed++;
          console.log(`  ❌ Failed (see error details in database)`);
        }
      } catch (err) {
        totalFailed++;
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`  ❌ Error: ${errorMsg}`);
      }
      console.log('');
    }

    // Summary
    console.log(`${LOG_PREFIX} Job completed`);
    console.log(`${LOG_PREFIX} Processed: ${totalProcessed}, Succeeded: ${totalSucceeded}, Failed: ${totalFailed}`);
    console.log('');

    return {
      success: totalFailed === 0,
      processed: totalProcessed,
      succeeded: totalSucceeded,
      failed: totalFailed,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`${LOG_PREFIX} Fatal error: ${errorMsg}`);
    console.error('');
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Execute Job
// ─────────────────────────────────────────────────────────────────────────────

runJob()
  .then((result) => {
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error(`${LOG_PREFIX} Unhandled error:`, error);
    process.exit(1);
  });
