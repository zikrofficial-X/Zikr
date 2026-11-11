export function getBlockedKidsRoutes(previousRows, currentRows, previousRoutes = []) {
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

  // The manifest can outlive an older dataset row (for example, routes
  // that were already removed before the previous kids.json snapshot). Prune
  // every stale Kids detail route directly from the prior route inventory too.
  for (const route of Array.isArray(previousRoutes) ? previousRoutes : []) {
    if (typeof route !== "string" || !route.startsWith("/kids/")) continue;
    const slug = route.slice("/kids/".length).split(/[?#]/, 1)[0].replace(/\/+$/, "");
    if (!visibleSlugs.has(slug)) blocked.add(route);
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
