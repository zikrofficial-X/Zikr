export type WorkflowDispatchEnvironment = {
  VERCEL?: string;
  VERCEL_URL?: string;
  VERCEL_ENV?: string;
  VERCEL_GIT_COMMIT_REF?: string;
};

/**
 * Vercel Preview and Development deployments share production-backed
 * integrations. They must never dispatch a GitHub workflow that executes
 * with production repository secrets. Local development remains available
 * for explicit developer testing outside a Vercel deployment.
 */
export function isGitHubWorkflowDispatchAllowed(
  env: WorkflowDispatchEnvironment,
): boolean {
  const isVercelRuntime = env.VERCEL === "1" || Boolean(env.VERCEL_URL?.trim());
  if (!isVercelRuntime) return true;

  return env.VERCEL_ENV === "production" &&
    env.VERCEL_GIT_COMMIT_REF === "main";
}
