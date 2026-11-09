export type BackgroundJobOutcomeInput = {
  videoSucceeded: number;
  videoFailed: number;
  sitePublishingFailed: boolean;
};

export type BackgroundJobOutcome = {
  hasPartialVideoFailures: boolean;
  shouldFailRun: boolean;
  fatalFailureCount: number;
};

/**
 * A single invalid video must not suppress delivery of other videos that
 * have already passed QA. Keep the failed item in audit/queue diagnostics,
 * but let the internal site publisher continue. A wholly failed generation
 * batch or an internal site-publishing failure remains a failed workflow.
 */
export function evaluateBackgroundJobOutcome(input: BackgroundJobOutcomeInput): BackgroundJobOutcome {
  const videoSucceeded = Math.max(0, Math.floor(input.videoSucceeded));
  const videoFailed = Math.max(0, Math.floor(input.videoFailed));
  const hasPartialVideoFailures = videoFailed > 0 && videoSucceeded > 0;
  const fatalVideoFailures = videoFailed > 0 && videoSucceeded === 0 ? videoFailed : 0;
  const fatalFailureCount = fatalVideoFailures + (input.sitePublishingFailed ? 1 : 0);

  return {
    hasPartialVideoFailures,
    shouldFailRun: fatalFailureCount > 0,
    fatalFailureCount,
  };
}


export type RunNowConsumptionInput = {
  hasRequest: boolean;
  target: string;
  automationEnabled: boolean;
  videosProcessed: number;
};

/**
 * Run Now is a one-shot dispatch request, not a retry loop. Once the worker
 * processes at least one item, consume the request even when another item
 * failed; failed queue rows retain their own retry schedule.
 */
export function shouldClearRunNowRequest(input: RunNowConsumptionInput): boolean {
  return input.hasRequest &&
    (input.target === "videos" || input.target === "all") &&
    input.automationEnabled &&
    Number.isFinite(input.videosProcessed) &&
    input.videosProcessed > 0;
}
