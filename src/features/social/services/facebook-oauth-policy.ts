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


export const FACEBOOK_REQUIRED_PUBLISH_PERMISSIONS = Object.freeze([
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
]);

export const FACEBOOK_OPTIONAL_INSIGHTS_PERMISSION = "read_insights";

export const FACEBOOK_REQUESTED_PERMISSIONS = Object.freeze([
  ...FACEBOOK_REQUIRED_PUBLISH_PERMISSIONS,
  FACEBOOK_OPTIONAL_INSIGHTS_PERMISSION,
]);

export function hasFacebookPublishingPermissions(permissions: unknown): boolean {
  const granted = new Set(
    Array.isArray(permissions)
      ? permissions.filter((permission): permission is string => typeof permission === "string")
      : [],
  );
  return FACEBOOK_REQUIRED_PUBLISH_PERMISSIONS.every((permission) => granted.has(permission));
}

export function hasFacebookInsightsPermission(permissions: unknown): boolean {
  return Array.isArray(permissions) &&
    permissions.includes(FACEBOOK_OPTIONAL_INSIGHTS_PERMISSION);
}
