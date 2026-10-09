import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS_DIR = join(ROOT, 'supabase', 'migrations');

// Immutable legacy duplicates that are already recorded as separate versions
// in the production migration ledger. Keep both files unchanged; deleting one
// would desynchronize local migration files from the production history.
const ALLOWED_LEGACY_DUPLICATES = [
  [
    '20261001212603_video_pipeline_hardening_20261002.sql',
    '20261002000001_video_pipeline_hardening.sql',
  ],
  [
    '20261002125440_remote_history_marker_video_automation.sql',
    '20261002125451_remote_history_marker_video_automation.sql',
  ],
];

const files = readdirSync(MIGRATIONS_DIR)
  .filter((file) => file.endsWith('.sql'))
  .sort();
const hashes = new Map();

for (const file of files) {
  const content = readFileSync(join(MIGRATIONS_DIR, file));
  const hash = createHash('sha256').update(content).digest('hex');
  const group = hashes.get(hash) ?? [];
  group.push(file);
  hashes.set(hash, group);
}

const normalizeGroup = (group) => [...group].sort().join('\n');
const actualDuplicates = [...hashes.values()]
  .filter((group) => group.length > 1)
  .map(normalizeGroup)
  .sort();
const allowedDuplicates = ALLOWED_LEGACY_DUPLICATES
  .map(normalizeGroup)
  .sort();

const missingAllowedFiles = ALLOWED_LEGACY_DUPLICATES.flat().filter(
  (file) => !files.includes(file),
);

if (missingAllowedFiles.length > 0) {
  console.error(
    '[migration-duplicates] Expected legacy migration file(s) missing:',
    missingAllowedFiles.join(', '),
  );
  process.exit(1);
}

if (JSON.stringify(actualDuplicates) !== JSON.stringify(allowedDuplicates)) {
  console.error('[migration-duplicates] Unexpected duplicate SQL migration content found.');
  console.error('Expected historical duplicate groups:');
  for (const group of allowedDuplicates) console.error(`---\n${group}`);
  console.error('Actual duplicate groups:');
  for (const group of actualDuplicates) console.error(`---\n${group}`);
  console.error(
    'Do not delete or rewrite applied migrations. Add a new forward migration and review the duplicate history explicitly.',
  );
  process.exit(1);
}

for (const group of ALLOWED_LEGACY_DUPLICATES) {
  const [first, second] = group;
  const firstHash = createHash('sha256')
    .update(readFileSync(join(MIGRATIONS_DIR, first)))
    .digest('hex');
  const secondHash = createHash('sha256')
    .update(readFileSync(join(MIGRATIONS_DIR, second)))
    .digest('hex');
  if (firstHash !== secondHash) {
    console.error(
      `[migration-duplicates] Legacy duplicate pair changed unexpectedly: ${first} / ${second}`,
    );
    process.exit(1);
  }
}

console.log(
  `[migration-duplicates] OK: ${files.length} migration files; ${ALLOWED_LEGACY_DUPLICATES.length} documented immutable legacy duplicate groups; no new duplicates.`,
);
