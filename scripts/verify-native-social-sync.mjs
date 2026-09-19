import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = [
  'src/features/social/services/native-social-sync.ts',
  'src/lib/env.ts',
  '.env.example',
];

for (const file of files) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) throw new Error(`Missing required file: ${file}`);
}

const publisher = fs.readFileSync(path.join(root, 'src/features/social/services/native-social-sync.ts'), 'utf8');
if (!publisher.includes('assertNativeMediaUrl')) throw new Error('Native media guard is missing.');
if (!publisher.includes("url.protocol !== 'https:'")) throw new Error('HTTPS media validation is missing.');
if (!publisher.includes('youtube\\.com|youtu\\.be')) throw new Error('YouTube URL rejection guard is missing.');
if (publisher.includes('/feed')) throw new Error('Native publisher must not use Facebook feed endpoint.');
if (!publisher.includes('FACEBOOK_GRAPH_API_VERSION')) throw new Error('Canonical Facebook Graph API variable is missing from native sync.');

const env = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
for (const key of ['FACEBOOK_GRAPH_API_VERSION', 'NATIVE_SOCIAL_SYNC_ENABLED', 'FACEBOOK_PAGE_ID', 'FACEBOOK_PAGE_ACCESS_TOKEN', 'YOUTUBE_CHANNEL_ID']) {
  if (!env.includes(key)) throw new Error(`Missing environment declaration: ${key}`);
}
if (env.includes('META_GRAPH_API_VERSION')) throw new Error('Stale META_GRAPH_API_VERSION declaration is forbidden.');

console.log('Native social sync phase 1 static verification: PASS');
