function isSafeKidsSlug(value) {
  const slug = typeof value === "string" ? value.trim() : "";
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug);
}

export function getPublishedKidsRoutes(currentRows) {
  const routes = new Set();
  for (const row of Array.isArray(currentRows) ? currentRows : []) {
    if (!row || (row.type === "story" && row.metadata?.age_appropriate !== true)) continue;
    const slug = typeof row.slug === "string" ? row.slug.trim() : "";
    if (!isSafeKidsSlug(slug)) continue;
    routes.add(`/kids/${slug}`);
  }
  return [...routes].sort();
}

export function getBlockedKidsRoutes(previousRows, currentRows, previousRoutes = []) {
  const rows = Array.isArray(currentRows) ? currentRows : [];
  const previous = Array.isArray(previousRows) ? previousRows : [];
  const visibleSlugs = new Set(
    rows
      .filter(row => row && (row.type !== "story" || row.metadata?.age_appropriate === true))
      .map(row => typeof row?.slug === "string" ? row.slug.trim() : "")
      .filter(isSafeKidsSlug),
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
