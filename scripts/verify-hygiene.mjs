#!/usr/bin/env node

import path from 'node:path';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const root = process.cwd();
const failures = [];
const read = (file) => (existsSync(path.join(root, file)) ? readFileSync(path.join(root, file), 'utf8') : '');
const fail = (message) => failures.push(message);

const forbiddenFiles = [
  'AUDIT_REPAIR_FINAL.md',
  'AUDIT_REPAIR_FINAL.txt',
  'AUDIT_REPAIR_FORCE.md',
  'AUDIT_REPAIR_NOTE.md',
  'TEMP_RELEASE_FIX.md',
  'apply_migration.json',
  'apply_rls_cleanup.json',
  'scripts/jobs/process-social.ts',
];

for (const file of forbiddenFiles) {
  if (existsSync(path.join(root, file))) fail(`Stale/temporary artifact must not be tracked: ${file}`);
}

const envExample = read('.env.example');
if (envExample.includes('META_GRAPH_API_VERSION')) {
  fail('Stale environment key META_GRAPH_API_VERSION is still present; use FACEBOOK_GRAPH_API_VERSION.');
}

const packageJson = read('package.json');
try {
  const pkg = JSON.parse(packageJson);
  if (pkg.scripts?.['social:process']) fail('Deprecated social:process script alias is still present.');
  if (pkg.scripts?.['automation:run']) fail('Redundant automation:run alias is still present; use background:jobs.');
} catch (error) {
  fail(`package.json is not valid JSON: ${error instanceof Error ? error.message : 'unknown error'}`);
}

const envAndRuntimeFiles = [
  '.env.example',
  'src/lib/env.ts',
];
const envAndRuntimeDirs = [
  'src/app',
  'src/features',
  'src/components',
  'supabase/functions',
];

const staleRuntimeTokens = [
  'mohamedalaa7785-cpu/Zikr',
  'zikr-zikrmediaofficial.vercel.app',
  'qjcrvgbgmumwhzxdbgad',
  'NEXT_PUBLIC_QURAN_API',
  'NEXT_PUBLIC_HADITH_API',
  'QURAN_AUDIO_CDN_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
];

function scanFile(relativePath) {
  const full = path.join(root, relativePath);
  if (!existsSync(full)) return;
  let source = '';
  try { source = readFileSync(full, 'utf8'); } catch { return; }
  for (const token of staleRuntimeTokens) {
    if (source.includes(token)) fail(`Stale runtime reference '${token}' found in ${relativePath}`);
  }
}

function walkRuntime(relativeDir) {
  const absolute = path.join(root, relativeDir);
  if (!existsSync(absolute)) return;
  const entries = readdirSync(absolute, { withFileTypes: true });
  for (const entry of entries) {
    const rel = path.join(relativeDir, entry.name);
    const full = path.join(root, rel);
    if (entry.isDirectory()) {
      walkRuntime(rel);
    } else if (/\.(?:ts|tsx|js|mjs|json|yml|yaml|toml|env)$/i.test(entry.name)) {
      let source = '';
      try { source = readFileSync(full, 'utf8'); } catch { continue; }
      for (const token of staleRuntimeTokens) {
        if (source.includes(token)) fail(`Stale runtime reference '${token}' found in ${rel}`);
      }
    }
  }
}

for (const file of envAndRuntimeFiles) scanFile(file);
for (const dir of envAndRuntimeDirs) walkRuntime(dir);

for (const legacyDir of ['app', 'pages', 'src/hooks']) {
  if (existsSync(path.join(root, legacyDir))) fail(`Legacy runtime directory must not exist: ${legacyDir}`);
}

if (failures.length) {
  console.error('REPOSITORY_HYGIENE_CHECK_FAILED');
  for (const failure of failures) console.error(`❌ ${failure}`);
  process.exit(1);
}

console.log('✅ Repository hygiene checks passed');
