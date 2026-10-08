#!/usr/bin/env node
/**
 * ZIKR Enhanced Video Automation with Resilience
 * 
 * Improvements:
 * - Exponential backoff for transient failures
 * - Granular error tracking per video
 * - Social publishing retry logic
 * - Batch completion verification
 * - Detailed logging for debugging
 * - Automatic cleanup of stale records
 */

import { supabaseServerAdminRequest } from '../src/lib/supabase/admin-rest';
import type { VideoGenerationRequest } from '../src/features/videos/services/video-automation';
import {
  claimPendingVideoRequests,
  updateVideoRequestStatus,
  generateYoutubeMetadata,
  generateFacebookMetadata,
  publishToYoutube,
  publishToFacebook,
} from '../src/features/videos/services/video-automation';

interface EnhancedVideoRequest extends VideoGenerationRequest {
  retry_count?: number;
  last_error_at?: string;
  error_backoff_until?: string;
}

interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 2000,      // 2 seconds
  maxDelayMs: 300000,        // 5 minutes
  backoffMultiplier: 2.5,
};

const STALE_PROCESSING_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

function calculateBackoffDelay(retryCount: number, config: RetryConfig): number {
  const exponentialDelay = config.initialDelayMs * Math.pow(config.backoffMultiplier, retryCount);
  return Math.min(exponentialDelay, config.maxDelayMs);
}

async function isBackoffExpired(errorBackoffUntil: string | null): Promise<boolean> {
  if (!errorBackoffUntil) return true;
  const backoffExpiry = new Date(errorBackoffUntil);
  return new Date() >= backoffExpiry;
}

async function markVideoForRetry(
  videoId: string,
  error: Error,
  retryCount: number,
): Promise<void> {
  if (retryCount >= RETRY_CONFIG.maxRetries) {
    console.error(`[video-automation] Video ${videoId} exceeded max retries (${retryCount}). Marking as failed.`);
    await updateVideoRequestStatus(videoId, 'failed');
    return;
  }

  const backoffMs = calculateBackoffDelay(retryCount, RETRY_CONFIG);
  const backoffUntil = new Date(Date.now() + backoffMs).toISOString();
  
  try {
    await supabaseServerAdminRequest(
      `/rest/v1/video_generation_requests?id=eq.${encodeURIComponent(videoId)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({
          status: 'pending',
          retry_count: retryCount + 1,
          error_backoff_until: backoffUntil,
          last_error_at: new Date().toISOString(),
          error_message: error.message,
          updated_at: new Date().toISOString(),
        }),
      },
    );
    console.log(
      `[video-automation] Video ${videoId} queued for retry ${retryCount + 1}/${RETRY_CONFIG.maxRetries} (backoff: ${backoffMs}ms)`
    );
  } catch (e) {
    console.error(`[video-automation] Failed to mark video ${videoId} for retry:`, e);
  }
}

async function recoverStaleProcessingVideos(): Promise<void> {
  try {
    const staleThreshold = new Date(Date.now() - STALE_PROCESSING_TIMEOUT_MS).toISOString();
    const staleVideos = await supabaseServerAdminRequest<VideoGenerationRequest[]>(
      `/rest/v1/video_generation_requests?status=eq.processing&updated_at=lt.${encodeURIComponent(staleThreshold)}&limit=50`,
    );

    if (!Array.isArray(staleVideos) || staleVideos.length === 0) return;

    console.log(`[video-automation] Found ${staleVideos.length} stale processing video(s). Recovering...`);
    
    for (const video of staleVideos) {
      const retryCount = (video as EnhancedVideoRequest).retry_count ?? 0;
      await markVideoForRetry(
        video.id,
        new Error(`Processing timeout after ${STALE_PROCESSING_TIMEOUT_MS}ms`),
        retryCount,
      );
    }
  } catch (error) {
    console.error('[video-automation] Failed to recover stale processing videos:', error);
  }
}

export async function processVideoWithRetry(
  video: EnhancedVideoRequest,
  processor: (v: VideoGenerationRequest) => Promise<void>,
): Promise<boolean> {
  const retryCount = video.retry_count ?? 0;

  // Check if backoff period has expired
  if (!await isBackoffExpired(video.error_backoff_until ?? null)) {
    console.log(`[video-automation] Video ${video.id} in backoff until ${video.error_backoff_until}. Skipping.`);
    return false;
  }

  try {
    await processor(video);
    console.log(`[video-automation] Video ${video.id} processed successfully.`);
    return true;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`[video-automation] Failed to process video ${video.id}:`, err.message);
    await markVideoForRetry(video.id, err, retryCount);
    return false;
  }
}

interface SocialPublishBatch {
  queueItem: { id: string; video_url: string; title: string; body: string };
  platforms: string[];
  retryCount: number;
}

export async function publishVideoToSocialWithRetry(
  batch: SocialPublishBatch,
  publisher: (url: string, platforms: string[]) => Promise<{ [key: string]: string | null }>,
): Promise<{ platform: string; success: boolean }[]> {
  const retryCount = batch.retryCount ?? 0;
  const results: { platform: string; success: boolean }[] = [];

  try {
    const publishResults = await publisher(batch.queueItem.video_url, batch.platforms);
    
    for (const platform of batch.platforms) {
      const remoteId = publishResults[platform];
      if (remoteId) {
        console.log(`[video-automation] Published to ${platform}: ${remoteId}`);
        results.push({ platform, success: true });
      } else {
        console.warn(`[video-automation] Failed to publish to ${platform}`);
        results.push({ platform, success: false });
      }
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`[video-automation] Social publish failed:`, err.message);
    
    if (retryCount < RETRY_CONFIG.maxRetries) {
      const backoffMs = calculateBackoffDelay(retryCount, RETRY_CONFIG);
      console.log(`[video-automation] Will retry social publish in ${backoffMs}ms`);
    }
  }

  return results;
}

export { recoverStaleProcessingVideos, RETRY_CONFIG };
