import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { KIDS_SECTION_LINKS } from "../../src/features/kids/data/navigation";
import { kidsContent } from "../../src/features/kids/data/content";
import { GAME_REGISTRY } from "../../src/lib/games/registry";

const ids = KIDS_SECTION_LINKS.map(link => link.id);
const hrefs = KIDS_SECTION_LINKS.map(link => link.href);

assert.equal(new Set(ids).size, ids.length, "Kids navigation IDs must be unique");
assert.equal(new Set(hrefs).size, hrefs.length, "Kids navigation destinations must not be duplicated");
assert.ok(KIDS_SECTION_LINKS.length >= 8, "the common navigation must expose the major Kids pathways");

for (const link of KIDS_SECTION_LINKS) {
  assert.ok(link.labelAr.trim(), "Arabic navigation label missing: " + link.id);
  assert.ok(link.labelEn.trim(), "English navigation label missing: " + link.id);
  assert.ok(link.descriptionAr.trim(), "Arabic navigation description missing: " + link.id);
  assert.ok(link.descriptionEn.trim(), "English navigation description missing: " + link.id);
  assert.ok(link.href.startsWith("/kids"), "Kids navigation must stay within the Kids section: " + link.href);

  const directPagePath = "src/app" + link.href + "/page.tsx";
  if (existsSync(directPagePath)) continue;

  const slug = link.href.slice("/kids/".length);
  const dynamicPageExists = existsSync("src/app/kids/[slug]/page.tsx");
  assert.ok(dynamicPageExists, "missing direct page and Kids dynamic route for " + link.href);
  assert.ok(
    slug in GAME_REGISTRY || kidsContent.some(item => item.slug === slug),
    "dynamic Kids destination must resolve to a registered game or known content record: " + link.href,
  );
}

const layout = readFileSync("src/app/kids/layout.tsx", "utf8");
assert.ok(layout.includes("KidsSectionNavigation"), "the shared navigation must be rendered across Kids routes");

const landing = readFileSync("src/app/kids/page.tsx", "utf8");
assert.ok(
  landing.includes("Object.keys(GAME_REGISTRY).length"),
  "the landing page game count must come from the canonical registry, not a stale hard-coded number",
);

const gameCatalog = readFileSync("src/features/kids/components/games/games-index.tsx", "utf8");
for (const contract of ["matchesAge", "matchesDuration", "matchesCategory", "skillAr", "skillEn", "normalizeKidsGameSearch"]) {
  assert.ok(gameCatalog.includes(contract), "game catalog must preserve age/category/duration/skill discovery: " + contract);
}

console.log("Kids navigation passed: localized labels, unique live destinations, canonical game count, and discoverability filters are consistent.");
