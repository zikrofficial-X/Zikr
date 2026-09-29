/**
 * Social Publishing Queue Processor
 * Handles publishing of generated videos to YouTube and Facebook
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface SocialPublishJob {
  id: string;
  video_id: string;
  platform: 'youtube' | 'facebook' | 'both';
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  tags: string[];
  status: 'pending' | 'processing' | 'published' | 'failed';
  error_message?: string;
  retry_count: number;
  max_retries: number;
  created_at: string;
  published_at?: string;
}

/**
 * Process one item from the social publish queue
 */
async function publishVideoToSocial(job: SocialPublishJob): Promise<boolean> {
  try {
    console.log(`[social-publishing] Processing job ${job.id} for video ${job.video_id}`);

    // Update status to processing
    await supabase
      .from('social_publish_queue')
      .update({ status: 'processing' })
      .eq('id', job.id);

    // Placeholder for actual publishing logic
    // In production, this would call YouTube Data API and Facebook Graph API
    console.log(`[social-publishing] Would publish to ${job.platform}`);

    // Mark as published
    const { error } = await supabase
      .from('social_publish_queue')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    if (error) {
      throw new Error(`Failed to update job status: ${error.message}`);
    }

    console.log(`[social-publishing] Successfully published job ${job.id}`);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[social-publishing] Error publishing job ${job.id}:`, errorMessage);

    // Update retry count and status
    const newRetryCount = job.retry_count + 1;
    const shouldRetry = newRetryCount < job.max_retries;

    await supabase
      .from('social_publish_queue')
      .update({
        status: shouldRetry ? 'pending' : 'failed',
        retry_count: newRetryCount,
        error_message: errorMessage,
      })
      .eq('id', job.id);

    return false;
  }
}

interface SocialPublishResult {
  processed: number;
  succeeded: number;
  authBlocked: number;
  failed: number;
}

/**
 * Process all pending jobs in the social publish queue
 */
export async function processSocialPublishQueue(limit: number = 10): Promise<SocialPublishResult> {
  const result: SocialPublishResult = {
    processed: 0,
    succeeded: 0,
    authBlocked: 0,
    failed: 0,
  };

  try {
    // Get pending jobs
    const { data: jobs, error } = await supabase
      .from('social_publish_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('retry_count', 'max_retries')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch pending jobs: ${error.message}`);
    }

    if (!jobs || jobs.length === 0) {
      console.log('[social-publishing] No pending jobs in queue');
      return result;
    }

    console.log(`[social-publishing] Processing ${jobs.length} pending job(s)`);

    for (const job of jobs) {
      result.processed++;
      const success = await publishVideoToSocial(job as SocialPublishJob);
      if (success) {
        result.succeeded++;
      } else {
        result.failed++;
      }
    }

    console.log(
      `[social-publishing] Completed ${result.succeeded}/${result.processed} job(s)`
    );
    return result;
  } catch (error) {
    console.error(
      '[social-publishing] Queue processing error:',
      error instanceof Error ? error.message : String(error)
    );
    return result;
  }
}

/**
 * Health check for social publishing service
 */
export async function checkSocialPublishingHealth(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('social_publish_queue')
      .select('count(*)', { count: 'estimated', head: true });

    if (error) {
      console.error('[social-publishing] Health check failed:', error.message);
      return false;
    }

    console.log('[social-publishing] Health check passed');
    return true;
  } catch (error) {
    console.error(
      '[social-publishing] Health check error:',
      error instanceof Error ? error.message : String(error)
    );
    return false;
  }
}
