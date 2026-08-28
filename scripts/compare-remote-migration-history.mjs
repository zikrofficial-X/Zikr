import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const resultPath = process.argv[2];
if (!resultPath) throw new Error("Usage: node scripts/compare-remote-migration-history.mjs <result.json>");
const raw = JSON.parse(readFileSync(resultPath, "utf8")).result;
const match = raw.match(/\n\[(.*)\]\n<\/untrusted-data-/s);
if (!match) throw new Error("Could not parse MCP result payload");
const remote = JSON.parse(`[${match[1]}]`);
const root = process.cwd();
const dirs = [join(root, "supabase", "migrations")];
const local = new Map();
for (const dir of dirs) {
  for (const file of readdirSync(dir)) {
    const m = /^(\d+)_.*\.sql$/.exec(file);
    if (m) local.set(m[1], file);
  }
}
const missing = remote.filter(({ version }) => !local.has(version));
const nameMismatches = remote.filter(({ version, name }) => {
  if (!name || !local.has(version)) return false;
  return !local.get(version).startsWith(`${version}_${name}.sql`);
});
console.log(JSON.stringify({ remoteCount: remote.length, localCount: local.size, missing, nameMismatches }, null, 2));
