function reviewTimestamp(review) {
  const value = review?.submitted_at ?? review?.created_at;
  const timestamp = typeof value === "string" ? Date.parse(value) : Number.NaN;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

/**
 * A CODEOWNER approval is valid only for the exact PR head being released.
 * A later review by the same owner supersedes an earlier review, matching
 * GitHub's latest-review state while preventing stale approvals after pushes.
 */
export function hasCurrentCodeOwnerApproval(reviews, owner, headSha) {
  const expectedLogin = String(owner ?? "").trim().replace(/^@/, "").toLowerCase();
  const expectedHead = String(headSha ?? "").trim().toLowerCase();
  if (!expectedLogin || !expectedHead || !Array.isArray(reviews)) return false;

  const latestReview = reviews
    .filter((review) =>
      review &&
      typeof review === "object" &&
      typeof review.user?.login === "string" &&
      review.user.login.toLowerCase() === expectedLogin
    )
    .slice()
    .sort((left, right) => reviewTimestamp(left) - reviewTimestamp(right))
    .at(-1);

  return latestReview?.state?.toUpperCase() === "APPROVED" &&
    typeof latestReview.commit_id === "string" &&
    latestReview.commit_id.toLowerCase() === expectedHead;
}
