import "server-only";

const GITHUB_API = "https://api.github.com";
const DEFAULT_REPOSITORY = "zikrcontact-del/Zikr";

type WorkflowInputs = Record<string, string>;

function githubToken() {
  return (
    process.env.GITHUB_PAT?.trim() ||
    process.env.GITHUB_DISPATCH_TOKEN?.trim() ||
    process.env.GH_DISPATCH_TOKEN?.trim() ||
    process.env.GITHUB_TOKEN?.trim() ||
    ""
  );
}

export async function dispatchGitHubWorkflow(
  workflowFile: string,
  inputs: WorkflowInputs = {},
) {
  const token = githubToken();
  if (!token) {
    throw new Error("GitHub workflow dispatch token is not configured.");
  }

  const repository =
    process.env.GITHUB_REPOSITORY?.trim() || DEFAULT_REPOSITORY;

  const response = await fetch(
    `${GITHUB_API}/repos/${repository}/actions/workflows/${encodeURIComponent(workflowFile)}/dispatches`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref: "main", inputs }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    },
  );

  if (response.status !== 204) {
    const detail = (await response.text().catch(() => "")).slice(0, 500);
    throw new Error(
      `GitHub workflow dispatch failed (${response.status}): ${detail || "unknown error"}`,
    );
  }

  return { workflowFile, repository };
}
