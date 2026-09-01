#!/usr/bin/env node
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const raw = process.argv[i];
  if (!raw.startsWith('--')) continue;
  const [key, inline] = raw.slice(2).split('=', 2);
  if (inline !== undefined) args.set(key, inline);
  else args.set(key, process.argv[i + 1]?.startsWith('--') ? '' : (process.argv[++i] ?? ''));
}

const supabaseUrl = process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const syncSecret = process.env.SOCIAL_SYNC_SECRET || '';
const channelId = process.env.YOUTUBE_CHANNEL_ID || '';
const pageId = process.env.FACEBOOK_PAGE_ID || '';
const graphVersion = process.env.META_GRAPH_API_VERSION || 'v25.0';
const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '';
const videoIdArg = args.get('video-id') || '';
const limit = Math.max(1, Math.min(100, Number(args.get('limit') || 1)));
const workDir = path.resolve(args.get('work-dir') || '.zikr-native-backfill');
const keepFiles = args.has('keep-files');
const chunkSize = 16 * 1024 * 1024;

function fail(message) { console.error(`ERROR: ${message}`); process.exit(1); }
function requireConfig() {
  for (const [name, value] of [['SUPABASE_URL', supabaseUrl], ['SUPABASE_SERVICE_ROLE_KEY', serviceRoleKey], ['SOCIAL_SYNC_SECRET', syncSecret], ['YOUTUBE_CHANNEL_ID', channelId], ['FACEBOOK_PAGE_ID', pageId], ['FACEBOOK_PAGE_ACCESS_TOKEN', token]]) {
    if (!value) fail(`${name} is required.`);
  }
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
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${typeof body === 'string' ? body.slice(0, 800) : JSON.stringify(body).slice(0, 1200)}`);
  return body;
}

function run(command, commandArgs, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, { stdio: ['ignore', 'pipe', 'pipe'], ...options });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolve({ stdout, stderr }) : reject(new Error(`${command} exited with ${code}: ${stderr.slice(-1500)}`)));
  });
}

async function downloadWithYtDlp(videoId, outputPath) {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const argsList = [
    '--no-playlist', '--no-progress', '--newline', '--restrict-filenames',
    '-f', 'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b',
    '--merge-output-format', 'mp4',
    '-o', outputPath,
    url,
  ];
  await run('yt-dlp', argsList);
}

async function startUpload(fileSize) {
  const params = new URLSearchParams({
    upload_phase: 'start',
    file_size: String(fileSize),
    access_token: token,
  });
  const response = await fetch(`https://graph-video.facebook.com/${graphVersion}/${pageId}/videos`, { method: 'POST', body: params });
  const text = await response.text();
  let body; try { body = JSON.parse(text); } catch { body = { raw: text }; }
  if (!response.ok || !body?.upload_session_id || body.start_offset === undefined || body.end_offset === undefined) {
    throw new Error(`Facebook start failed (${response.status}): ${JSON.stringify(body).slice(0, 1400)}`);
  }
  return body;
}

async function transferChunk(uploadSessionId, startOffset, buffer) {
  const form = new FormData();
  form.set('upload_phase', 'transfer');
  form.set('upload_session_id', uploadSessionId);
  form.set('start_offset', String(startOffset));
  form.set('video_file_chunk', new Blob([buffer], { type: 'application/octet-stream' }), 'chunk.bin');
  form.set('access_token', token);
  const response = await fetch(`https://graph-video.facebook.com/${graphVersion}/${pageId}/videos`, { method: 'POST', body: form });
  const text = await response.text();
  let body; try { body = JSON.parse(text); } catch { body = { raw: text }; }
  if (!response.ok) throw new Error(`Facebook transfer failed (${response.status}): ${JSON.stringify(body).slice(0, 1400)}`);
  return body;
}

async function finishUpload(uploadSessionId, title, description) {
  const params = new URLSearchParams({
    upload_phase: 'finish',
    upload_session_id: uploadSessionId,
    title: String(title || '').slice(0, 255),
    description: String(description || '').slice(0, 10000),
    published: 'true',
    access_token: token,
  });
  const response = await fetch(`https://graph-video.facebook.com/${graphVersion}/${pageId}/videos`, { method: 'POST', body: params });
  const text = await response.text();
  let body; try { body = JSON.parse(text); } catch { body = { raw: text }; }
  if (!response.ok || body?.success === false) throw new Error(`Facebook finish failed (${response.status}): ${JSON.stringify(body).slice(0, 1400)}`);
  return body;
}

async function uploadNative(filePath, title, description) {
  const stat = await fs.stat(filePath);
  const session = await startUpload(stat.size);
  let start = Number(session.start_offset);
  let end = Number(session.end_offset);
  const handle = await fs.open(filePath, 'r');
  try {
    while (start < stat.size) {
      const length = Math.max(1, end - start);
      const buffer = Buffer.alloc(length);
      const { bytesRead } = await handle.read(buffer, 0, length, start);
      if (!bytesRead) throw new Error('Unexpected EOF during Facebook resumable upload.');
      const result = await transferChunk(session.upload_session_id, start, buffer.subarray(0, bytesRead));
      start = Number(result.start_offset ?? start + bytesRead);
      end = Number(result.end_offset ?? Math.min(stat.size, start + chunkSize));
      process.stdout.write(`\\rUploading ${Math.min(100, Math.round((start / stat.size) * 100))}%`);
    }
  } finally { await handle.close(); }
  process.stdout.write('\\n');
  return finishUpload(session.upload_session_id, title, description);
}

async function fetchJobs() {
  const select = 'id,source_video_id,title,description,status,source_media_url,facebook_post_id';
  const filters = [`source_channel_id=eq.${encodeURIComponent(channelId)}`, 'order=source_published_at.asc.nullslast', 'limit=100', `select=${select}`];
  if (videoIdArg) filters.push(`source_video_id=eq.${encodeURIComponent(videoIdArg)}`);
  filters.push('status=neq.published');
  return supa(`/rest/v1/social_sync_jobs?${filters.join('&')}`);
}

async function mark(id, patch) {
  return supa(`/rest/v1/social_sync_jobs?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(patch) });
}

async function main() {
  requireConfig();
  await fs.mkdir(workDir, { recursive: true });
  const jobs = (await fetchJobs()).slice(0, limit);
  if (!jobs.length) { console.log('No unpublished jobs found.'); return; }
  console.log(`Processing ${jobs.length} video(s).`);

  for (const job of jobs) {
    const filePath = path.join(workDir, `${job.source_video_id}.mp4`);
    try {
      console.log(`\\n[1/3] Downloading ${job.source_video_id}...`);
      await downloadWithYtDlp(job.source_video_id, filePath);
      const stat = await fs.stat(filePath);
      if (!stat.size) throw new Error('yt-dlp produced an empty file.');

      await mark(job.id, { status: 'processing', attempts: Number(job.attempts || 0) + 1, last_error: null, locked_at: new Date().toISOString() });
      console.log(`[2/3] Uploading ${job.source_video_id} directly to Facebook as Native Video...`);
      const result = await uploadNative(filePath, job.title, job.description);
      const facebookId = result.id || result.video_id || result.post_id || null;
      if (!facebookId && result.success !== true) throw new Error(`Facebook accepted request without a publish ID: ${JSON.stringify(result)}`);

      await mark(job.id, {
        status: 'published',
        facebook_post_id: facebookId,
        published_at_facebook: new Date().toISOString(),
        locked_at: null,
        last_error: null,
        source_media_url: null,
      });
      console.log(`[3/3] SUCCESS ${job.source_video_id} -> ${facebookId || 'published'}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await mark(job.id, { status: 'failed', last_error: message.slice(0, 4000), locked_at: null, next_attempt_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() }).catch(() => {});
      console.error(`FAILED ${job.source_video_id}: ${message}`);
    } finally {
      if (!keepFiles) await fs.rm(filePath, { force: true }).catch(() => {});
    }
  }
}

await main();
