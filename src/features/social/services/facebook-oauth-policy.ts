const FACEBOOK_PAGE_PUBLISHING_TASKS = new Set([
  "CREATE_CONTENT",
  "PROFILE_PLUS_CREATE_CONTENT",
  "PROFILE_PLUS_FULL_CONTROL",
]);

/**
 * Meta returns legacy CREATE_CONTENT for classic Page roles and PROFILE_PLUS_*
 * task names for the New Pages Experience. Missing task data must fail closed.
 */
export function hasFacebookPagePublishingTask(tasks: unknown): boolean {
  return Array.isArray(tasks) &&
    tasks.some((task) => typeof task === "string" && FACEBOOK_PAGE_PUBLISHING_TASKS.has(task));
}
