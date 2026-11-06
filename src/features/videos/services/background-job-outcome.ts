export type BackgroundJobOutcomeInput = {
  videoSucceeded: number;
  videoFailed: number;
  socialFailed: number;
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
 * but let the workflow complete so the dependent social publisher can run.
 * A wholly failed generation batch, a social-provider failure, or an internal
 * site-publishing failure remains a failed workflow.
 */
export function evaluateBackgroundJobOutcome(input: BackgroundJobOutcomeInput): BackgroundJobOutcome {
  const videoSucceeded = Math.max(0, Math.floor(input.videoSucceeded));
  const videoFailed = Math.max(0, Math.floor(input.videoFailed));
  const socialFailed = Math.max(0, Math.floor(input.socialFailed));
  const hasPartialVideoFailures = videoFailed > 0 && videoSucceeded > 0;
  const fatalVideoFailures = videoFailed > 0 && videoSucceeded === 0 ? videoFailed : 0;
  const fatalFailureCount = fatalVideoFailures + socialFailed + (input.sitePublishingFailed ? 1 : 0);

  return {
    hasPartialVideoFailures,
    shouldFailRun: fatalFailureCount > 0,
    fatalFailureCount,
  };
}
