#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';

const failures = [];
const read = (file) => (existsSync(file) ? readFileSync(file, 'utf8') : '');
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
  if (existsSync(file)) fail(`Stale/temporary artifact must not be tracked: ${file}`);
}

const envExample = read('.env.example');
if (envExample.includes('META_GRAPH_API_VERSION')) {
  fail('Stale environment key META_GRAPH_API_VERSION is still present; use FACEBOOK_GRAPH_API_VERSION.');
}

const backgroundWorkflow = read('.github/workflows/background-jobs.yml');
if (backgroundWorkflow.includes('https://eydxvcamhjhajxjrsgym.supabase.co')) {
  fail('Background worker must not contain a hardcoded production Supabase URL fallback.');
}

const packageJson = read('package.json');
try {
  const pkg = JSON.parse(packageJson);
  if (pkg.scripts?.['social:process']) fail('Deprecated social:process script alias is still present.');
  if (pkg.scripts?.['automation:run']) fail('Redundant automation:run alias is still present; use background:jobs.');
} catch (error) {
  fail(`package.json is not valid JSON: ${error instanceof Error ? error.message : 'unknown error'}`);
}

if (failures.length) {
  console.error('REPOSITORY_HYGIENE_CHECK_FAILED');
  for (const failure of failures) console.error(`❌ ${failure}`);
  process.exit(1);
}

console.log('✅ Repository hygiene checks passed');
