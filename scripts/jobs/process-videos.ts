#!/usr/bin/env node
/**
 * Background Job: Process Videos
 *
 * Production video generation is handled by the free deterministic FFmpeg
 * renderer. This compatibility entrypoint intentionally delegates to the
 * same queue used by the production internal route, so legacy HeyGen settings
 * cannot change the generator or block video creation.
 *
 * Run with: pnpm tsx scripts/jobs/process-videos.ts
 */

import {
  processTemplateVideoQueue,
  seedAutomatedVideoRequests,
} from './template-video-automation';

const BATCH_SIZE = Math.max(1, Number(process.env.VIDEO_BACKGROUND_BATCH_SIZE ?? 3));

async function runJob(): Promise<void> {
  console.log('[process-videos] Production generator: free template/FFmpeg');
  console.log('[process-videos] HeyGen is disabled and is not part of this execution path.');

  const queued = await seedAutomatedVideoRequests();
  const result = await processTemplateVideoQueue(BATCH_SIZE);

  console.log(
    '[process-videos] Result:',
    JSON.stringify({ generator: 'template', queued, ...result }, null, 2)
  );

  if (result.failed > 0) {
    throw new Error(`Video generation completed with ${result.failed} failed item(s).`);
  }
}

runJob().catch((error) => {
  console.error('[process-videos] Fatal error:', error);
  process.exit(1);
});
