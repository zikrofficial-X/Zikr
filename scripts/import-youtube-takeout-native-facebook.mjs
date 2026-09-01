#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const raw = process.argv[i];
  if (!raw.startsWith('--')) continue;
  const [key, inline] = raw.slice(2).split('=', 2);
  if (inline !== undefined) args.set(key, inline);
  else args.set(key, process.argv[i + 1]?.startsWith('--') ? '' : (process.argv[++i] ?? ''));
}

const takeoutDir = path.resolve(args.get('takeout-dir') || 'Takeout');
const dryRun = args.has('dry-run');
const deleteAfter = !args.has('keep-files');
const batchSize = Math.max(1, Math.min(3, Number(args.get('batch-size') || 1)));

const supabaseUrl = process.env.SUPABASE_URL || args.get('supabase-url') || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const syncSecret = process.env.SOCIAL_SYNC_SECRET || '';
const sourceChannelId = process.env.YOUTUBE_CHANNEL_ID || '';
const functionUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/sync-youtube-facebook?mode=backfill`;

function die(message) {
  console.error(`\nERROR: ${message}`);
  process.exit(1);
}

function requireConfig() {
  if (!supabaseUrl) die('SUPABASE_URL is required.');
  if (!serviceRoleKey && !dryRun) die('SUPABASE_SERVICE_ROLE_KEY is required for upload/update operations.');
  if (!syncSecret && !dryRun) die('SOCIAL_SYNC_SECRET is required.');
  if (!sourceChannelId) die('YOUTUBE_CHANNEL_ID is required.');
}

async function walk(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else out.push(full);
  }
  return out;
}

function isVideo(file) {
  return /\.(mp4|mov|m4v|webm)$/i.test(file);
}

function compactText(value) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

function looksLikeYoutubeId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{11}$/.test(value);
}

function collectStrings(value, result = new Set()) {
  if (!value || typeof value !== 'object') return result;
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, result);
    return result;
  }
  for (const [key, child] of Object.entries(value)) {
    if (typeof child === 'string') {
      const text = child.trim();
      if (/video.?id|youtube.?id/i.test(key) && looksLikeYoutubeId(text)) result.add(text);
      const match = text.match(/[?&]v=([A-Za-z0-9_-]{11})/);
      if (match) result.add(match[1]);
      const pathMatch = text.match(/(?:embed|shorts|youtu\.be)\/([A-Za-z0-9_-]{11})/i);
      if (pathMatch) result.add(pathMatch[1]);
    } else {
      collectStrings(child, result);
    }
  }
  return result;
}

function collectMetadataHints(value, hints = []) {
  if (!value || typeof value !== 'object') return hints;
  if (Array.isArray(value)) {
    for (const item of value) collectMetadataHints(item, hints);
    return hints;
  }
  const idSet = collectStrings(value, new Set());
  const title = compactText(value.title || value.name || value.videoTitle);
  const file = value.fileName || value.filename || value.file || value.path;
  if (idSet.size && (title || file)) hints.push({ ids: [...idSet], title, file: typeof file === 'string' ? file : '' });
  for (const child of Object.values(value)) {
    if (child && typeof child === 'object') collectMetadataHints(child, hints);
  }
  return hints;
}

async function readTakeoutMetadata(files) {
  const maps = [];
  for (const file of files.filter((f) => f.toLowerCase().endsWith('.json'))) {
    try {
      const raw = await fs.readFile(file, 'utf8');
      const parsed = JSON.parse(raw);
      maps.push(...collectMetadataHints(parsed));
    } catch {
      // Ignore non-JSON or malformed secondary metadata files.
    }
  }
  return maps;
}

async function supa(pathname, options = {}) {
  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}${pathname}`, {
    ...options,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) {
    throw new Error(`Supabase ${response.status}: ${typeof body === 'string' ? body.slice(0, 500) : JSON.stringify(body).slice(0, 1000)}`);
  }
  return body;
}

async function listJobs() {
  const query = `/rest/v1/social_sync_jobs?source_channel_id=eq.${encodeURIComponent(sourceChannelId)}&select=id,source_video_id,title,status,source_media_url&order=source_published_at.asc.nullslast`;
  return await supa(query);
}

function normalize(value) {
  return compactText(value).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ');
}

function chooseMatch(job, videoFiles, metadataHints, used) {
  const idMatches = metadataHints.filter((m) => m.ids.includes(job.source_video_id));
  for (const hint of idMatches) {
    const candidates = videoFiles.filter((file) => !used.has(file) && (!hint.file || path.basename(file).toLowerCase() === path.basename(hint.file).toLowerCase() || file.endsWith(hint.file)));
    if (candidates.length) return candidates[0];
  }
  const jobTitle = normalize(job.title);
  const scored = [];
  for (const file of videoFiles) {
    if (used.has(file)) continue;
    const stem = normalize(path.basename(file, path.extname(file)));
    if (!jobTitle || !stem) continue;
    const tokens = new Set(jobTitle.split(' ').filter((x) => x.length > 2));
    let score = 0;
    for (const token of tokens) if (stem.includes(token)) score += 1;
    if (score >= Math.max(2, Math.min(6, Math.floor(tokens.size * 0.35)))) scored.push({ file, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.file || null;
}

async function uploadFile(file, job) {
  const stat = await fs.stat(file);
  if (stat.size > 50 * 1024 * 1024) {
    throw new Error(`File exceeds Supabase Free plan 50 MB limit: ${path.basename(file)} (${stat.size} bytes).`);
  }
  const content = await fs.readFile(file);
  const safeName = path.basename(file).replace(/[^A-Za-z0-9._+,'@=;:()!$&? -]/g, '_');
  const storagePath = `takeout/${job.source_video_id}-${crypto.randomUUID()}-${safeName}`;
  const upload = await fetch(`${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/social-sync-videos/${encodeURIComponent(storagePath)}`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'video/mp4',
      'x-upsert': 'false',
      'cache-control': '3600',
    },
    body: content,
  });
  if (!upload.ok) throw new Error(`Storage upload ${upload.status}: ${(await upload.text()).slice(0, 600)}`);
  const publicUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/social-sync-videos/${storagePath.split('/').map(encodeURIComponent).join('/')}`;
  await supa(`/rest/v1/social_sync_jobs?id=eq.${encodeURIComponent(job.id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ source_media_url: publicUrl, status: 'pending', last_error: null, next_attempt_at: new Date().toISOString() }),
  });
  return { storagePath, publicUrl };
}

async function runFunction() {
  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-zikr-sync-secret': syncSecret,
    },
  });
  const text = await response.text();
  let body; try { body = JSON.parse(text); } catch { body = text; }
  if (!response.ok) throw new Error(`sync-youtube-facebook ${response.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  return body;
}

async function main() {
  requireConfig();
  const allFiles = await walk(takeoutDir);
  const videos = allFiles.filter(isVideo);
  if (!videos.length) die(`No video files found under ${takeoutDir}`);
  const metadataHints = await readTakeoutMetadata(allFiles);
  console.log(`Found ${videos.length} video files and ${metadataHints.length} metadata records in ${takeoutDir}`);

  if (dryRun) {
    console.log('Dry run: no upload or database changes will be made.');
    return;
  }

  const jobs = await listJobs();
  const used = new Set();
  let matched = 0;
  let uploaded = 0;
  let failed = 0;

  for (const job of jobs) {
    if (job.status === 'published' || job.source_media_url) continue;
    const file = chooseMatch(job, videos, metadataHints, used);
    if (!file) {
      console.log(`WAITING  ${job.source_video_id}  ${job.title}`);
      continue;
    }
    used.add(file);
    matched += 1;
    try {
      const result = await uploadFile(file, job);
      uploaded += 1;
      console.log(`READY    ${job.source_video_id}  ${path.basename(file)}`);
      await runFunction();
      if (deleteAfter && result.storagePath) {
        await supa(`/storage/v1/object/social-sync-videos/${result.storagePath.split('/').map(encodeURIComponent).join('/')}`, { method: 'DELETE' });
      }
      console.log(`PUBLISH  ${job.source_video_id}`);
    } catch (error) {
      failed += 1;
      console.error(`FAILED   ${job.source_video_id}: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (uploaded > 0 && uploaded % batchSize === 0) await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  console.log(`\nSummary: matched=${matched}, uploaded=${uploaded}, failed=${failed}, totalJobs=${jobs.length}`);
  console.log('The importer intentionally processes one native video at a time and removes the temporary Storage object after publish.');
}

await main();
