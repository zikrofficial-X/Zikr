export type FacebookProfileSyncFailureInput = {
  configured: boolean;
  stale: boolean;
  lookupFailed: boolean;
};

/**
 * A missing Facebook Page is not a failed sync. A configured but stale Page is,
 * and an exception while resolving the credential/profile is always a failure:
 * the worker could not establish whether the integration was healthy.
 */
export function getFacebookProfileSyncFailureCount(
  input: FacebookProfileSyncFailureInput,
): number {
  return input.lookupFailed || (input.configured && input.stale) ? 1 : 0;
}
