export function getBlockedKidsRoutes(previousRows, currentRows) {
  const rows = Array.isArray(currentRows) ? currentRows : [];
  const previous = Array.isArray(previousRows) ? previousRows : [];
  const visibleSlugs = new Set(
    rows
      .filter(row => row && (row.type !== "story" || row.metadata?.age_appropriate === true))
      .map(row => row?.slug)
      .filter(slug => typeof slug === "string" && slug.trim()),
  );
  const blocked = new Set();

  // Remove every previously published Kids route that is no longer present in
  // the current public snapshot, including deleted, unpublished, or inactive
  // games, quizzes, activities, and stories.
  for (const row of previous) {
    const slug = typeof row?.slug === "string" ? row.slug.trim() : "";
    if (slug && !visibleSlugs.has(slug)) blocked.add(`/kids/${slug}`);
  }

  // A story may still be present in the public table query while its
  // age-appropriate approval flag has been withdrawn.
  for (const row of rows) {
    const slug = typeof row?.slug === "string" ? row.slug.trim() : "";
    if (row?.type === "story" && row?.metadata?.age_appropriate !== true && slug) {
      blocked.add(`/kids/${slug}`);
    }
  }

  return blocked;
}
