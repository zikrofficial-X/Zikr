import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { getBlockedPublishedContentRoutes } from "../lib/offline-export-route-pruning.mjs";

test("offline route pruning removes a route whose companion is no longer published", () => {
  const routes = [
    "/companions",
    "/companions/bilal",
    "/companions/bilal-ibn-rabah",
  ];
  const exported = [
    {
      dataset: "companions",
      rows: [{ id: "7e0074fc-5b8b-593d-8f46-94d6d174d885", slug: "bilal-ibn-rabah" }],
    },
    {
      dataset: "prophets",
      rows: [{ id: "40000000-0000-4000-8000-000000000001", slug: "yusuf" }],
    },
    { dataset: "surahs", rows: [{ id: 1 }] },
    { dataset: "hadith_books", rows: [{ id: "50000000-0000-4000-8000-000000000001", slug: "bukhari" }] },
    { dataset: "battles", rows: [{ id: "60000000-0000-4000-8000-000000000001", slug: "badr" }] },
    { dataset: "conquests", rows: [{ id: "70000000-0000-4000-8000-000000000001", slug: "makkah" }] },
    { dataset: "articles", rows: [{ id: "80000000-0000-4000-8000-000000000001", slug: "article-one" }] },
    { dataset: "duas", rows: [{ id: "90000000-0000-4000-8000-000000000001", slug: "dua-one" }] },
    { dataset: "stories", rows: [{ id: "a0000000-0000-4000-8000-000000000001", slug: "story-one" }] },
    { dataset: "scholars", rows: [{ id: "b0000000-0000-4000-8000-000000000001", slug: "scholar-one" }] },
  ];

  const blocked = getBlockedPublishedContentRoutes(routes, exported);
  assert.deepEqual([...blocked], ["/companions/bilal"]);
  assert.equal(blocked.has("/companions"), false);
  assert.equal(blocked.has("/companions/bilal-ibn-rabah"), false);
});

test("offline route pruning removes only dynamic paths absent from published datasets", () => {
  const routes = ["/prophets", "/prophets/unpublished-prophet", "/prophets/yusuf", "/articles/missing"];
  const exported = [
    { dataset: "prophets", rows: [{ id: "40000000-0000-4000-8000-000000000001", slug: "yusuf" }] },
    { dataset: "articles", rows: [{ id: "80000000-0000-4000-8000-000000000001", slug: "published-article" }] },
    { dataset: "surahs", rows: [{ id: 1 }] },
    { dataset: "hadith_books", rows: [{ id: "50000000-0000-4000-8000-000000000001", slug: "bukhari" }] },
    { dataset: "battles", rows: [{ id: "60000000-0000-4000-8000-000000000001", slug: "badr" }] },
    { dataset: "conquests", rows: [{ id: "70000000-0000-4000-8000-000000000001", slug: "makkah" }] },
    { dataset: "duas", rows: [{ id: "90000000-0000-4000-8000-000000000001", slug: "dua-one" }] },
    { dataset: "companions", rows: [{ id: "7e0074fc-5b8b-593d-8f46-94d6d174d885", slug: "bilal-ibn-rabah" }] },
    { dataset: "stories", rows: [{ id: "a0000000-0000-4000-8000-000000000001", slug: "story-one" }] },
    { dataset: "scholars", rows: [{ id: "b0000000-0000-4000-8000-000000000001", slug: "scholar-one" }] },
  ];

  const blocked = getBlockedPublishedContentRoutes(routes, exported);
  assert.deepEqual([...blocked].sort(), ["/articles/missing", "/prophets/unpublished-prophet"]);
  assert.equal(blocked.has("/prophets"), false);
  assert.equal(blocked.has("/prophets/yusuf"), false);
});

test("the offline exporter merges Kids and published-content route pruning", () => {
  const exporter = readFileSync("scripts/export-offline-content.mjs", "utf8");
  assert.match(exporter, /getBlockedPublishedContentRoutes\(previous\.routes, exported\)/);
  assert.match(exporter, /new Set\(\[\.\.\.blockedKidsRoutes, \.\.\.blockedPublishedContentRoutes\]\)/);
  assert.match(exporter, /previous\.routes\.filter\(\(route\) => !blockedRoutes\.has\(route\)\)/);
});
