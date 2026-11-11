const PUBLISHED_ROUTE_SCOPES = Object.freeze([
  { dataset: "surahs", prefix: "/quran", slug: (row) => row.number ?? row.id },
  { dataset: "hadith_books", prefix: "/hadith", slug: (row) => row.slug ?? row.id },
  { dataset: "prophets", prefix: "/prophets", slug: (row) => row.slug },
  { dataset: "battles", prefix: "/battles", slug: (row) => row.slug },
  { dataset: "conquests", prefix: "/conquests", slug: (row) => row.slug },
  { dataset: "articles", prefix: "/articles", slug: (row) => row.slug },
  { dataset: "duas", prefix: "/dua", slug: (row) => row.slug },
  { dataset: "companions", prefix: "/companions", slug: (row) => row.slug },
  { dataset: "stories", prefix: "/stories", slug: (row) => row.slug },
  { dataset: "scholars", prefix: "/scholars", slug: (row) => row.slug },
]);

function routeSlug(route, prefix) {
  if (typeof route !== "string" || !route.startsWith(`${prefix}/`)) return null;
  const segment = route.slice(prefix.length + 1).split("/")[0].split(/[?#]/)[0];
  if (!segment) return null;
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

export function getBlockedPublishedContentRoutes(previousRoutes, exported) {
  const blocked = new Set();
  if (!Array.isArray(previousRoutes)) return blocked;

  for (const scope of PUBLISHED_ROUTE_SCOPES) {
    const dataset = exported.find((item) => item.dataset === scope.dataset);
    if (!dataset || !Array.isArray(dataset.rows)) {
      throw new Error(
        `Offline route pruning cannot validate ${scope.prefix}: the published ${scope.dataset} inventory is unavailable.`,
      );
    }

    const allowedSlugs = new Set(
      dataset.rows
        .map((row) => scope.slug(row))
        .filter((value) => value !== null && value !== undefined)
        .map((value) => String(value).trim())
        .filter(Boolean),
    );

    for (const route of previousRoutes) {
      const slug = routeSlug(route, scope.prefix);
      if (slug !== null && !allowedSlugs.has(slug)) blocked.add(route);
    }
  }

  return blocked;
}
