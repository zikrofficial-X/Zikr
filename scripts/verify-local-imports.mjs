import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json'];
const sourceDirs = ['app', 'components', 'lib', 'scripts'];
const failures = [];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function existsAsModule(basePath) {
  for (const extension of extensions) {
    const candidate = `${basePath}${extension}`;
    if (existsSync(candidate) && statSync(candidate).isFile()) return true;
  }

  if (existsSync(basePath) && statSync(basePath).isDirectory()) {
    for (const extension of extensions.slice(1)) {
      const candidate = join(basePath, `index${extension}`);
      if (existsSync(candidate) && statSync(candidate).isFile()) return true;
    }
  }

  return false;
}

function resolveImport(specifier, fromFile) {
  if (specifier.startsWith('@/')) return resolve(root, specifier.slice(2));
  if (specifier.startsWith('./') || specifier.startsWith('../')) return resolve(dirname(fromFile), specifier);
  return null;
}

const importPattern = /(?:import|export)\s+(?:type\s+)?(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]|import\(['"]([^'"]+)['"]\)/g;

for (const sourceDir of sourceDirs) {
  const absoluteDir = join(root, sourceDir);
  if (!existsSync(absoluteDir)) continue;

  for (const file of walk(absoluteDir)) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(importPattern)) {
      const specifier = match[1] ?? match[2];
      const resolved = resolveImport(specifier, file);
      if (!resolved) continue;
      if (!existsAsModule(resolved)) {
        failures.push(`${file.replace(`${root}/`, '')}: unresolved local import ${specifier}`);
      }
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`❌ ${failure}`);
  process.exit(1);
}

console.log('✅ Local import smoke check passed');
