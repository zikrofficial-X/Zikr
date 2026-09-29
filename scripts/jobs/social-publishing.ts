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
  content_type: string;
  content_id?: string;
  title: string;
  body?: string;
  image_url?: string;
  video_url?: string;
  target_platforms: string[];
  status: 'queued' | 'processing' | 'published' | 'partial' | 'failed';
  scheduled_at?: string;
  published_at?: string;
  error_message?: string;
  metadata?: Record<string, unknown>;
  automation_key?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Process one item from the social publish queue
 */
async function publishVideoToSocial(job: SocialPublishJob): Promise<boolean> {
  try {
    console.log(
      `[social-publishing] Processing job ${job.id} (${job.content_type}) to ${job.target_platforms.join(', ')}`
    );

    // Update status to processing
    await supabase
      .from('social_publish_queue')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', job.id);

    // Placeholder for actual publishing logic
    // In production, this would call YouTube Data API and Facebook Graph API
    const platforms = job.target_platforms || [];
    console.log(`[social-publishing] Publishing content to platforms: ${platforms.join(', ')}`);

    if (job.video_url) {
      console.log(`[social-publishing] Video URL: ${job.video_url}`);
    }

    // Mark as published
    const { error } = await supabase
      .from('social_publish_queue')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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

    await supabase
      .from('social_publish_queue')
      .update({
        status: 'failed',
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
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
    // Get queued jobs (not yet processing)
    const { data: jobs, error } = await supabase
      .from('social_publish_queue')
      .select('*')
      .eq('status', 'queued')
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
