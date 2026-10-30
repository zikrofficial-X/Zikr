import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const manifestPath = "docs/finalization/DATA_LIFECYCLE_MANIFEST_2026-10-02.json";
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const failures = [];
const retired = [
  "hadith_explanations",
  "recent_recitations",
  "reciter_favorites",
  "tawasheeh_favorites",
  "tawasheeh_playlists",
  "tawasheeh_playlist_items",
];

for (const table of retired) {
  const entry = manifest.entries.find((item) => item.table === table);
  if (!entry || entry.state !== "RETIRED") failures.push(`Manifest must mark ${table} RETIRED`);
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (/\.(?:ts|tsx|js|jsx)$/.test(entry.name)) files.push(full);
  }
  return files;
}

const sourceFiles = (await walk("src")).filter((file) => file !== "src/lib/types/supabase.ts");
for (const file of sourceFiles) {
  const source = await readFile(file, "utf8");
  for (const table of retired) {
    if (new RegExp(`\\b${table}\\b`).test(source)) {
      failures.push(`Runtime source still references retired table ${table}: ${file}`);
    }
  }
}

if (failures.length) {
  console.error("Data lifecycle contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Data lifecycle contract passed: six empty tables are runtime-retired; generated types remain preserved.");
