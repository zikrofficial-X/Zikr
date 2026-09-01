#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

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
const keepFiles = args.has('keep-files');

const supabaseUrl = process.env.SUPABASE_URL || args.get('supabase-url') || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const sourceChannelId = process.env.YOUTUBE_CHANNEL_ID || '';
const facebookPageId = process.env.FACEBOOK_PAGE_ID || '';
const facebookPageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '';
const metaGraphApiVersion = process.env.META_GRAPH_API_VERSION || '';

function die(message) {
  console.error(`\nERROR: ${message}`);
  process.exit(1);
}

function requireConfig() {
  if (!takeoutDir) die('Takeout directory is required.');
  if (!supabaseUrl && !dryRun) die('SUPABASE_URL is required.');
  if (!serviceRoleKey && !dryRun) die('SUPABASE_SERVICE_ROLE_KEY is required.');
  if (!sourceChannelId) die('YOUTUBE_CHANNEL_ID is required.');
  if (!facebookPageId && !dryRun) die('FACEBOOK_PAGE_ID is required.');
  if (!facebookPageAccessToken && !dryRun) die('FACEBOOK_PAGE_ACCESS_TOKEN is required.');
  if (!metaGraphApiVersion && !dryRun) die('META_GRAPH_API_VERSION is required.');
  if (metaGraphApiVersion && !/^v\d+\.\d+$/.test(metaGraphApiVersion)) die('META_GRAPH_API_VERSION must look like vXX.X.');
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

function normalize(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ');
}

function looksLikeYoutubeId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{11}$/.test(value);
}

function collectIds(value, ids = new Set()) {
  if (!value || typeof value !== 'object') return ids;
  if (Array.isArray(value)) {
    for (const item of value) collectIds(item, ids);
    return ids;
  }
  for (const [key, child] of Object.entries(value)) {
    if (typeof child === 'string') {
      const text = child.trim();
      if (/video.?id|youtube.?id/i.test(key) && looksLikeYoutubeId(text)) ids.add(text);
      for (const match of text.matchAll(/[?&]v=([A-Za-z0-9_-]{11})/g)) ids.add(match[1]);
      for (const match of text.matchAll(/(?:embed|shorts|youtu\.be)\/([A-Za-z0-9_-]{11})/gi)) ids.add(match[1]);
    } else {
      collectIds(child, ids);
    }
  }
  return ids;
}

function collectHints(value, hints = []) {
  if (!value || typeof value !== 'object') return hints;
  if (Array.isArray(value)) {
    for (const item of value) collectHints(item, hints);
    return hints;
  }
  const ids = [...collectIds(value)];
  const title = String(value.title ?? value.name ?? value.videoTitle ?? '').trim();
  const file = String(value.fileName ?? value.filename ?? value.file ?? value.path ?? '').trim();
  if (ids.length && (title || file)) hints.push({ ids, title, file });
  for (const child of Object.values(value)) if (child && typeof child === 'object') collectHints(child, hints);
  return hints;
}

async function readMetadata(files) {
  const hints = [];
  for (const file of files.filter((f) => f.toLowerCase().endsWith('.json'))) {
    try {
      hints.push(...collectHints(JSON.parse(await fs.readFile(file, 'utf8'))));
    } catch {
      // Ignore malformed/irrelevant JSON in a Takeout archive.
    }
  }
  return hints;
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
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${typeof body === 'string' ? body.slice(0, 800) : JSON.stringify(body).slice(0, 1200)}`);
  return body;
}

async function listJobs() {
  return supa(`/rest/v1/social_sync_jobs?source_channel_id=eq.${encodeURIComponent(sourceChannelId)}&select=id,source_video_id,title,status,source_media_url,facebook_post_id&order=source_published_at.asc.nullslast`);
}

function chooseMatch(job, videoFiles, hints, used) {
  const exact = hints.filter((hint) => hint.ids.includes(job.source_video_id));
  for (const hint of exact) {
    const candidates = videoFiles.filter((file) => !used.has(file) && (!hint.file || path.basename(file).toLowerCase() === path.basename(hint.file).toLowerCase() || file.endsWith(hint.file)));
    if (candidates.length) return candidates[0];
  }

  const jobTitle = normalize(job.title);
  const scored = [];
  for (const file of videoFiles) {
    if (used.has(file)) continue;
    const stem = normalize(path.basename(file, path.extname(file)));
    if (!jobTitle || !stem) continue;
    const tokens = [...new Set(jobTitle.split(' ').filter((x) => x.length > 2))];
    let score = 0;
    for (const token of tokens) if (stem.includes(token)) score += 1;
    const threshold = Math.max(3, Math.floor(tokens.length * 0.45));
    if (score >= threshold) scored.push({ file, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.file || null;
}

async function publishDirectToFacebook(file, job) {
  const stat = await fs.stat(file);
  const buffer = await fs.readFile(file);
  const form = new FormData();
  form.append('source', new Blob([buffer], { type: 'video/mp4' }), path.basename(file));
  form.append('title', String(job.title ?? '').slice(0, 255));
  form.append('description', String(job.description ?? '').slice(0, 10000));
  form.append('published', 'true');
  form.append('access_token', facebookPageAccessToken);

  const response = await fetch(`https://graph.facebook.com/${metaGraphApiVersion}/${facebookPageId}/videos`, {
    method: 'POST',
    body: form,
  });
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text.slice(0, 1500) }; }
  if (!response.ok || !body?.id) {
    const msg = body?.error?.message ?? body?.raw ?? `Facebook upload failed (${response.status})`;
    throw new Error(`Facebook ${response.status}: ${msg}`);
  }
  return { id: String(body.id), bytes: stat.size };
}

async function markPublished(job, facebookId) {
  await supa(`/rest/v1/social_sync_jobs?id=eq.${encodeURIComponent(job.id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      status: 'published',
      facebook_post_id: facebookId,
      published_at_facebook: new Date().toISOString(),
      last_error: null,
      locked_at: null,
    }),
  });
}

async function markFailed(job, message) {
  await supa(`/rest/v1/social_sync_jobs?id=eq.${encodeURIComponent(job.id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      status: 'failed',
      last_error: message.slice(0, 4000),
      locked_at: null,
      next_attempt_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    }),
  });
}

async function main() {
  requireConfig();
  const allFiles = await walk(takeoutDir);
  const videoFiles = allFiles.filter(isVideo);
  if (!videoFiles.length) die(`No video files found under ${takeoutDir}`);
  const metadataHints = await readMetadata(allFiles);
  console.log(`Takeout: ${videoFiles.length} video files, ${metadataHints.length} metadata hints.`);

  if (dryRun) {
    console.log('DRY RUN: no Facebook or Supabase writes will occur.');
    return;
  }

  const jobs = await listJobs();
  const used = new Set();
  let matched = 0, published = 0, failed = 0;

  for (const job of jobs) {
    if (job.status === 'published' || job.facebook_post_id) continue;
    const file = chooseMatch(job, videoFiles, metadataHints, used);
    if (!file) {
      console.log(`WAITING ${job.source_video_id} | ${job.title}`);
      continue;
    }
    used.add(file);
    matched += 1;
    try {
      const result = await publishDirectToFacebook(file, job);
      await markPublished(job, result.id);
      published += 1;
      console.log(`PUBLISHED ${job.source_video_id} | ${path.basename(file)} | ${result.bytes} bytes | FB ${result.id}`);
      // The source is the local Takeout archive; no server-side copy is retained.
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      await markFailed(job, message);
      console.error(`FAILED ${job.source_video_id}: ${message}`);
    }
  }

  console.log(`\nSummary: matched=${matched}, published=${published}, failed=${failed}, jobs=${jobs.length}`);
  console.log(`Local source files are ${keepFiles ? 'kept' : 'left untouched'} by this tool.`);
}

await main();
