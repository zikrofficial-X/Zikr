import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ignoredDirs = new Set([
  'node_modules',
  '.next',
  '.git',
  'android/.gradle',
  'ios/App/Pods',
  // Capacitor copies compiled Next.js output into this ignored native
  // WebView directory; bundled dependency examples contain example.com URLs.
  'ios/App/App/public',
  'android/app/src/main/assets/public',
]);
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.md', '.json']);
const forbidden = [
  /['\"]abc123['\"]/g,
  /['\"]def456['\"]/g,
  /['\"]ghi789['\"]/g,
  /youtube\.com\/watch\?v=dQw4w9WgXcQ/gi,
  /https?:\/\/example\.(com|org|net)\b/gi,
  /https?:\/\/example\.invalid\b/gi,
];

function shouldIgnore(relativePath) {
  const normalized = relativePath.split(path.sep).join('/');
  return [...ignoredDirs].some((dir) => normalized === dir || normalized.startsWith(`${dir}/`));
}

function walk(dir, hits = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const relative = path.relative(root, full);
    if (shouldIgnore(relative)) continue;
    if (entry.isDirectory()) {
      walk(full, hits);
      continue;
    }
    if (!extensions.has(path.extname(entry.name))) continue;
    const text = fs.readFileSync(full, 'utf8');
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const pattern of forbidden) {
        if (pattern.test(line)) {
          hits.push(`${relative}:${index + 1}: ${line.trim()}`);
          pattern.lastIndex = 0;
          break;
        }
        pattern.lastIndex = 0;
      }
    });
  }
  return hits;
}

const hits = walk(root);
if (hits.length > 0) {
  console.error('Placeholder or invalid external media references found:');
  for (const hit of hits) console.error(`- ${hit}`);
  process.exit(1);
}

console.log('Placeholder media verification passed.');
