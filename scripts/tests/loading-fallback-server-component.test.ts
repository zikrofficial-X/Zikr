import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const componentPath = join(root, "src/components/ui/page-skeleton.tsx");
const source = readFileSync(componentPath, "utf8");
assert.doesNotMatch(source, /^['"]use client['"];?/m);
assert.doesNotMatch(source, /\b(?:useState|useEffect|useMemo|useCallback|useRef|useContext)\s*\(/);
function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (/\.(?:ts|tsx)$/.test(entry.name)) files.push(full);
  }
  return files;
}
const usages = walk(join(root, "src")).filter((file) => /import\s+\{\s*PageSkeleton\s*\}\s+from\s+['"]@\/components\/ui\/page-skeleton['"]/.test(readFileSync(file, "utf8")));
assert.ok(usages.length > 0);
for (const file of usages) {
  assert.equal(file.split(/[\\/]/).at(-1), "loading.tsx");
  assert.doesNotMatch(readFileSync(file, "utf8"), /^['"]use client['"];?/m);
}
console.log(`✅ PageSkeleton remains server-rendered in all ${usages.length} loading fallbacks`);
