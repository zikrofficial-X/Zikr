export type SocialWorkerDispatchOutcome<T> =
  | { workerDispatched: true; worker: T; error: null }
  | { workerDispatched: false; worker: null; error: unknown };

/**
 * Keep a committed queue mutation distinct from the best-effort request that
 * wakes the publisher. The scheduled workflow remains the fallback if dispatch
 * fails; callers must not turn an already-saved queue update into a retryable 500.
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
