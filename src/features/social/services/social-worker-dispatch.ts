export type SocialWorkerDispatchOutcome<T> =
  | { workerDispatched: true; worker: T; error: null }
  | { workerDispatched: false; worker: null; error: unknown };

/**
 * Keep a committed queue mutation distinct from the best-effort request that
 * wakes the publisher. The scheduled workflow is configured as a fallback, but
 * its enabled state is owner-controlled; callers must not turn a saved queue
 * update into a retryable 500 when immediate dispatch fails.
 */
export async function dispatchSocialWorkerSafely<T>(
  dispatch: () => Promise<T>,
): Promise<SocialWorkerDispatchOutcome<T>> {
  try {
    return { workerDispatched: true, worker: await dispatch(), error: null };
  } catch (error) {
    return { workerDispatched: false, worker: null, error };
  }
}
