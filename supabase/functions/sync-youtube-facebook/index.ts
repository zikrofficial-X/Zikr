import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY') ?? ''
const YOUTUBE_CHANNEL_ID = Deno.env.get('YOUTUBE_CHANNEL_ID') ?? ''
const FACEBOOK_PAGE_ID = Deno.env.get('FACEBOOK_PAGE_ID') ?? ''
const FACEBOOK_PAGE_ACCESS_TOKEN = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN') ?? ''
type JsonObject = Record<string, unknown>;

const FACEBOOK_GRAPH_API_VERSION = Deno.env.get('FACEBOOK_GRAPH_API_VERSION') ?? 'v26.0'
const MEDIA_BUCKET = Deno.env.get('YOUTUBE_FACEBOOK_MEDIA_BUCKET') ?? 'youtube-facebook-media'
const BATCH_SIZE = Math.max(1, Math.min(10, Number(Deno.env.get('SOCIAL_SYNC_BATCH_SIZE') ?? '3')))
const MAX_DISCOVERY_PAGES_PER_RUN = Math.max(1, Math.min(10, Number(Deno.env.get('SOCIAL_SYNC_DISCOVERY_PAGES_PER_RUN') ?? '5')))
const RETRY_LIMIT = 8
const STALE_PROCESSING_MS = 30 * 60 * 1000
const AMBIGUOUS_RECHECK_MS = 60 * 60 * 1000
const WAITING_MEDIA_EXPIRY_MS = 14 * 24 * 60 * 60 * 1000

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
const errMsg = (e: unknown) => (e instanceof Error ? e.message : JSON.stringify(e))

async function sha256(value: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(bytes)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function auth(req: Request) {
  const authorization = req.headers.get('authorization') ?? ''
  const bearer = authorization.replace(/^Bearer\\s+/i, '').trim()
  if (bearer) {
    const { data, error } = await supabase.rpc('get_push_scheduler_secret')
    if (!error && typeof data === 'string' && data.length > 0 && bearer === data) return
  }

  const supplied = req.headers.get('x-zikr-sync-secret') ?? ''
  if (!supplied) throw new Error('Unauthorized sync request.')
  const { data, error } = await supabase
    .from('social_sync_state')
    .select('sync_secret_hash')
    .eq('id', 1)
    .maybeSingle()
  if (!error && data?.sync_secret_hash && (await sha256(supplied)) === data.sync_secret_hash) return
  throw new Error('Unauthorized sync request.')
}
function requireConfig() {
  const missing = [
    ['SUPABASE_URL', SUPABASE_URL],
    ['SUPABASE_SERVICE_ROLE_KEY', SUPABASE_SERVICE_ROLE_KEY],
    ['YOUTUBE_API_KEY', YOUTUBE_API_KEY],
    ['YOUTUBE_CHANNEL_ID', YOUTUBE_CHANNEL_ID],
  ].filter(([, value]) => !value).map(([name]) => name)
  if (missing.length) throw new Error(`Missing configuration: ${missing.join(', ')}`)

  const hasFacebookConfig = Boolean(FACEBOOK_PAGE_ID && FACEBOOK_PAGE_ACCESS_TOKEN)
  if (hasFacebookConfig && !/^v\\d+\\.\\d+$/.test(FACEBOOK_GRAPH_API_VERSION)) {
    throw new Error(`Invalid Meta Graph API version: ${FACEBOOK_GRAPH_API_VERSION}`)
  }
}
async function youtube(path: string, params: Record<string, string | number | undefined>) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`)
  url.searchParams.set('key', YOUTUBE_API_KEY)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value))
  }
  const response = await fetch(url, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(20_000),
  })
  const text = await response.text()
  if (!response.ok) throw new Error(`YouTube ${response.status}: ${text.slice(0, 1000)}`)
  return JSON.parse(text) as JsonObject
}

async function discoverYouTubePage(playlistId: string, pageToken?: string) {
  const result = await youtube('playlistItems', {
    part: 'snippet,contentDetails',
    playlistId,
    maxResults: 50,
    pageToken,
  })
  return {
    videos: (result.items ?? []).flatMap((item: JsonObject) => {
      const id = item.contentDetails?.videoId
      if (!id) return []
      return [{
        id: String(id),
        title: item.snippet?.title ?? 'Untitled YouTube video',
        description: item.snippet?.description ?? '',
        publishedAt: item.snippet?.publishedAt ?? null,
        thumbnailUrl:
          item.snippet?.thumbnails?.maxres?.url ??
          item.snippet?.thumbnails?.high?.url ??
          item.snippet?.thumbnails?.medium?.url ??
          item.snippet?.thumbnails?.default?.url ??
          null,
        sourceUrl: `https://www.youtube.com/watch?v=${id}`,
      }]
    }),
    nextPageToken: (result.nextPageToken as string | undefined) ?? null,
  }
}

async function getUploadsPlaylist() {
  const result = await youtube('channels', { part: 'contentDetails', id: YOUTUBE_CHANNEL_ID })
  const playlistId = result.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
  if (!playlistId) throw new Error('YouTube uploads playlist not found for configured channel.')
  return String(playlistId)
}

function safeHttpsUrl(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'https:') return null
    if (/youtube\.com|youtu\.be/i.test(url.hostname)) return null
    return url.toString()
  } catch {
    return null
  }
}

function mediaFromVideoRow(row: JsonObject) {
  const metadata = row?.metadata && typeof row.metadata === 'object' ? row.metadata : {}
  return (
    safeHttpsUrl(row?.content_ref) ??
    safeHttpsUrl(metadata.sourceVideoUrl) ??
    safeHttpsUrl(metadata.generatedVideoUrl) ??
    safeHttpsUrl(metadata.mediaUrl) ??
    safeHttpsUrl(metadata.media_url) ??
    safeHttpsUrl(metadata.videoUrl) ??
    safeHttpsUrl(metadata.video_url) ??
    null
  )
}

async function resolveMediaForJobs(sourceVideoIds: string[]) {
  const mediaByYoutubeId = new Map<string, { url: string; path: string | null; mime: string | null; size: number | null }>()
  if (!sourceVideoIds.length) return mediaByYoutubeId

  for (let offset = 0; offset < sourceVideoIds.length; offset += 100) {
    const ids = sourceVideoIds.slice(offset, offset + 100)
    const { data, error } = await supabase
      .from('videos')
      .select('youtube_id,content_ref,metadata')
      .in('youtube_id', ids)
    if (error) throw new Error(`Supabase videos lookup failed: ${JSON.stringify(error)}`)
    for (const row of data ?? []) {
      const media = mediaFromVideoRow(row)
      if (row.youtube_id && media) mediaByYoutubeId.set(String(row.youtube_id), { url: media, path: null, mime: null, size: null })
    }
  }

  const { data: waitingJobs, error: waitingError } = await supabase
    .from('social_sync_jobs')
    .select('source_video_id,source_media_path,source_media_mime,source_media_size')
    .eq('source_channel_id', YOUTUBE_CHANNEL_ID)
    .in('source_video_id', sourceVideoIds)
    .not('source_media_path', 'is', null)
  if (waitingError) throw new Error(`Supabase media-path lookup failed: ${JSON.stringify(waitingError)}`)

  for (const job of waitingJobs ?? []) {
    const path = typeof job.source_media_path === 'string' ? job.source_media_path.trim() : ''
    if (!path || mediaByYoutubeId.has(String(job.source_video_id))) continue
    const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path)
    const url = safeHttpsUrl(data.publicUrl)
    if (url) {
      mediaByYoutubeId.set(String(job.source_video_id), {
        url,
        path,
        mime: job.source_media_mime ?? null,
        size: job.source_media_size ?? null,
      })
    }
  }

  return mediaByYoutubeId
}

async function insertNewJobs(videos: Array<{
  id: string
  title: string
  description: string
  publishedAt: string | null
  thumbnailUrl: string | null
  sourceUrl: string
}>) {
  if (!videos.length) return { inserted: 0, media: 0 }
  const resolvedMedia = await resolveMediaForJobs(videos.map((video) => video.id))
  const payload = videos.map((video) => {
    const media = resolvedMedia.get(video.id)
    return {
      source_video_id: video.id,
      source_channel_id: YOUTUBE_CHANNEL_ID,
      title: video.title,
      description: video.description,
      source_published_at: video.publishedAt,
      thumbnail_url: video.thumbnailUrl,
      source_url: video.sourceUrl,
      source_media_url: media?.url ?? null,
      source_media_path: media?.path ?? null,
      source_media_mime: media?.mime ?? null,
      source_media_size: media?.size ?? null,
      facebook_post_type: 'video',
      status: media?.url ? 'pending' : 'waiting_media',
      retryable: true,
      last_error: media?.url ? null : 'Waiting for a matching source video file in the ZIKR media registry.',
      next_attempt_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  })

  const { data, error } = await supabase
    .from('social_sync_jobs')
    .upsert(payload, {
      onConflict: 'source_channel_id,source_video_id',
      ignoreDuplicates: true,
    })
    .select('id')
  if (error) throw new Error(`Supabase queue insert failed: ${JSON.stringify(error)}`)
  return { inserted: data?.length ?? 0, media: resolvedMedia.size }
}

async function expireStaleWaitingMedia() {
  const cutoff = new Date(Date.now() - WAITING_MEDIA_EXPIRY_MS).toISOString()
  const { data, error } = await supabase
    .from('social_sync_jobs')
    .update({
      status: 'failed',
      retryable: false,
      next_attempt_at: new Date().toISOString(),
      last_error: 'Expired waiting-media job: original video media was not found within the retry window. Requeue manually after uploading or registering the media.',
      updated_at: new Date().toISOString(),
    })
    .eq('source_channel_id', YOUTUBE_CHANNEL_ID)
    .eq('status', 'waiting_media')
    .eq('retryable', true)
    .lt('created_at', cutoff)
    .select('id')
  if (error) throw new Error(`Waiting-media expiry failed: ${JSON.stringify(error)}`)
  return data?.length ?? 0
}

async function refreshWaitingMedia(limit = 100) {
  const { data: waiting, error } = await supabase
    .from('social_sync_jobs')
    .select('id,source_video_id,source_media_path')
    .eq('source_channel_id', YOUTUBE_CHANNEL_ID)
    .eq('status', 'waiting_media')
    .eq('retryable', true)
    .gte('created_at', new Date(Date.now() - WAITING_MEDIA_EXPIRY_MS).toISOString())
    .limit(limit)
  if (error) throw new Error(`Waiting-media lookup failed: ${JSON.stringify(error)}`)
  if (!waiting?.length) return 0

  const media = await resolveMediaForJobs(waiting.map((row) => row.source_video_id))
  let promoted = 0
  for (const row of waiting) {
    const resolved = media.get(String(row.source_video_id))
    if (!resolved?.url) continue
    const { error: updateError } = await supabase
      .from('social_sync_jobs')
      .update({
        source_media_url: resolved.url,
        source_media_path: resolved.path,
        source_media_mime: resolved.mime,
        source_media_size: resolved.size,
        source_media_uploaded_at: new Date().toISOString(),
        source_media_deleted_at: null,
        source_media_delete_error: null,
        source_media_match_method: resolved.path ? 'storage_path' : 'video_registry',
        source_media_match_score: 1,
        status: 'pending',
        retryable: true,
        last_error: null,
        next_attempt_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id)
      .eq('status', 'waiting_media')
    if (updateError) throw new Error(`Waiting-media promotion failed: ${JSON.stringify(updateError)}`)
    promoted += 1
  }
  return promoted
}

async function discoverAndQueue() {
  const playlistId = await getUploadsPlaylist()
  const { data: state, error: stateError } = await supabase
    .from('social_sync_state')
    .select('*')
    .eq('id', 1)
    .maybeSingle()
  if (stateError) throw stateError

  let cursor = state?.backfill_complete
    ? undefined
    : (state?.backfill_cursor ?? state?.backfill_page_token ?? undefined)
  let backfillComplete = Boolean(state?.backfill_complete)
  let pages = 0
  let discovered = 0
  let inserted = 0
  let resolvedMedia = 0
  let lastSeenId: string | null = state?.last_seen_video_id ?? null
  let lastSeenPublishedAt: string | null = state?.last_seen_published_at ?? null

  if (!backfillComplete) {
    if (!state?.backfill_started_at) {
      await supabase.from('social_sync_state').update({
        backfill_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', 1)
    }

    for (let i = 0; i < MAX_DISCOVERY_PAGES_PER_RUN; i += 1) {
      const page = await discoverYouTubePage(playlistId, cursor)
      pages += 1
      discovered += page.videos.length
      if (page.videos[0]) {
        lastSeenId = page.videos[0].id
        lastSeenPublishedAt = page.videos[0].publishedAt
      }
      const result = await insertNewJobs(page.videos)
      inserted += result.inserted
      resolvedMedia += result.media
      cursor = page.nextPageToken ?? undefined
      if (!cursor) {
        backfillComplete = true
        break
      }
    }
  } else {
    const page = await discoverYouTubePage(playlistId)
    pages = 1
    discovered = page.videos.length
    if (page.videos[0]) {
      lastSeenId = page.videos[0].id
      lastSeenPublishedAt = page.videos[0].publishedAt
    }
    const result = await insertNewJobs(page.videos)
    inserted += result.inserted
    resolvedMedia += result.media
  }

  const now = new Date().toISOString()
  const { error: stateUpdateError } = await supabase.from('social_sync_state').upsert({
    id: 1,
    source_channel_id: YOUTUBE_CHANNEL_ID,
    uploads_playlist_id: playlistId,
    last_seen_video_id: lastSeenId,
    last_seen_published_at: lastSeenPublishedAt,
    backfill_complete: backfillComplete,
    backfill_cursor: backfillComplete ? null : (cursor ?? null),
    backfill_page_token: backfillComplete ? null : (cursor ?? null),
    backfill_page_count: Number(state?.backfill_page_count ?? 0) + pages,
    backfill_completed_at: backfillComplete ? (state?.backfill_completed_at ?? now) : null,
    last_discovery_at: now,
    batch_size: BATCH_SIZE,
    auto_sync_enabled: state?.auto_sync_enabled ?? true,
    schedule_cron: state?.schedule_cron ?? '*/10 * * * *',
    updated_at: now,
  }, { onConflict: 'id' })
  if (stateUpdateError) throw new Error(`Supabase state update failed: ${JSON.stringify(stateUpdateError)}`)

  return { playlistId, pages, discovered, inserted, resolvedMedia, backfillComplete }
}

async function recoverStaleProcessing() {
  const cutoff = new Date(Date.now() - STALE_PROCESSING_MS).toISOString()
  const { data, error } = await supabase
    .from('social_sync_jobs')
    .select('id,attempts,publish_request_id,facebook_post_id')
    .eq('source_channel_id', YOUTUBE_CHANNEL_ID)
    .eq('status', 'processing')
    .lt('locked_at', cutoff)
    .limit(100)
  if (error) throw new Error(`Stale-job lookup failed: ${JSON.stringify(error)}`)

  let recovered = 0
  for (const job of data ?? []) {
    if (job.facebook_post_id) {
      await supabase.from('social_sync_jobs').update({
        status: 'published',
        retryable: false,
        locked_at: null,
        last_error: null,
        published_at_facebook: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', job.id).eq('status', 'processing')
    } else if (job.publish_request_id) {
      await supabase.from('social_sync_jobs').update({
        status: 'failed',
        next_attempt_at: new Date(Date.now() + AMBIGUOUS_RECHECK_MS).toISOString(),
        locked_at: null,
        last_error: 'Previous Facebook request may have succeeded; manual reconciliation is required before retry.',
        retryable: false,
        updated_at: new Date().toISOString(),
      }).eq('id', job.id).eq('status', 'processing')
    } else {
      const retryable = Number(job.attempts ?? 0) < RETRY_LIMIT
      await supabase.from('social_sync_jobs').update({
        status: 'failed',
        retryable,
        locked_at: null,
        next_attempt_at: new Date().toISOString(),
        last_error: 'Recovered stale processing job.',
        updated_at: new Date().toISOString(),
      }).eq('id', job.id).eq('status', 'processing')
    }
    recovered += 1
  }
  return recovered
}

function isRetryableFacebookFailure(message: string) {
  return /\b429\b|\b5\d\d\b|timeout|timed out|network|temporar|rate limit|service unavailable/i.test(message)
}

async function getReadyJobs(limit: number) {
  const { data, error } = await supabase
    .from('social_sync_jobs')
    .select('*')
    .eq('source_channel_id', YOUTUBE_CHANNEL_ID)
    .in('status', ['pending', 'failed'])
    .eq('retryable', true)
    .lte('next_attempt_at', new Date().toISOString())
    .not('source_media_url', 'is', null)
    .is('facebook_post_id', null)
    .order('source_published_at', { ascending: true, nullsFirst: true })
    .limit(limit)
  if (error) throw new Error(`Ready-job lookup failed: ${JSON.stringify(error)}`)
  return data ?? []
}

async function publishFacebookVideo(job: JsonObject) {
  const sourceMediaUrl = safeHttpsUrl(job.source_media_url)
  if (!sourceMediaUrl) throw new Error('Invalid source_media_url; expected an HTTPS URL to the original video file.')

  const form = new URLSearchParams()
  form.set('file_url', sourceMediaUrl)
  form.set('title', String(job.title ?? '').slice(0, 255))
  form.set('description', `${String(job.description ?? '').slice(0, 9500)}\n\n[ZIKR-YT:${job.source_video_id}]`)
  form.set('published', 'true')
  form.set('access_token', FACEBOOK_PAGE_ACCESS_TOKEN)

  const response = await fetch(`https://graph.facebook.com/${FACEBOOK_GRAPH_API_VERSION}/${FACEBOOK_PAGE_ID}/videos`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: form,
    signal: AbortSignal.timeout(45_000),
  })
  const text = await response.text()
  let body: JsonObject = {}
  try { body = JSON.parse(text) as JsonObject } catch { body = { raw: text.slice(0, 1500) } }
  if (!response.ok || !body?.id) {
    throw new Error(`Facebook ${response.status}: ${body?.error?.message ?? body?.raw ?? 'Facebook upload failed'}`)
  }
  return String(body.id)
}

async function processReadyJobs() {
  if (!FACEBOOK_PAGE_ID || !FACEBOOK_PAGE_ACCESS_TOKEN) {
    return { selected: 0, published: 0, failed: 0, skipped: 0, maxAttempts: 0 }
  }
  const jobs = await getReadyJobs(BATCH_SIZE)
  const summary = { selected: jobs.length, published: 0, failed: 0, skipped: 0, maxAttempts: 0 }

  for (const job of jobs) {
    const attempts = Number(job.attempts ?? 0)
    summary.maxAttempts = Math.max(summary.maxAttempts, attempts + 1)
    const requestId = crypto.randomUUID()
    const { data: claimed, error: claimError } = await supabase
      .from('social_sync_jobs')
      .update({
        status: 'processing',
        locked_at: new Date().toISOString(),
        attempts: attempts + 1,
        publish_request_id: requestId,
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id)
      .in('status', ['pending', 'failed'])
      .eq('retryable', true)
      .is('facebook_post_id', null)
      .select('id')
      .maybeSingle()
    if (claimError) throw claimError
    if (!claimed) {
      summary.skipped += 1
      continue
    }

    try {
      const facebookId = await publishFacebookVideo(job)
      const { error: publishedError } = await supabase.from('social_sync_jobs').update({
        status: 'published',
        facebook_post_id: facebookId,
        published_at_facebook: new Date().toISOString(),
        locked_at: null,
        retryable: false,
        last_error: null,
        updated_at: new Date().toISOString(),
      }).eq('id', job.id).eq('status', 'processing').eq('publish_request_id', requestId)
      if (publishedError) throw publishedError

      await supabase.from('videos').update({
        facebook_id: facebookId,
        facebook_url: `https://www.facebook.com/${facebookId}`,
        updated_at: new Date().toISOString(),
      }).eq('youtube_id', job.source_video_id)

      summary.published += 1
    } catch (error) {
      const message = errMsg(error).slice(0, 4000)
      const ambiguous = /timeout|timed out|network|fetch failed|connection|socket|aborted/i.test(message)
      const retryable = !ambiguous && isRetryableFacebookFailure(message) && (attempts + 1) < RETRY_LIMIT
      const nextAttempt = new Date(Date.now() + Math.min(6 * 60 * 60 * 1000, 15 * 60 * 1000 * (2 ** Math.min(5, attempts)))).toISOString()

      if (ambiguous) {
        await supabase.from('social_sync_jobs').update({
          status: 'processing',
          locked_at: new Date().toISOString(),
          next_attempt_at: new Date(Date.now() + AMBIGUOUS_RECHECK_MS).toISOString(),
          last_error: `Ambiguous Facebook result; retry paused to prevent duplicates. ${message}`,
          retryable: false,
          updated_at: new Date().toISOString(),
        }).eq('id', job.id).eq('status', 'processing').eq('publish_request_id', requestId)
      } else {
        await supabase.from('social_sync_jobs').update({
          status: 'failed',
          locked_at: null,
          next_attempt_at: retryable ? nextAttempt : new Date().toISOString(),
          last_error: message,
          retryable,
          updated_at: new Date().toISOString(),
        }).eq('id', job.id).eq('status', 'processing').eq('publish_request_id', requestId)
      }
      summary.failed += 1
    }
  }

  return summary
}

async function queueSummary() {
  const { data: totals, error } = await supabase
    .from('social_sync_jobs')
    .select('status,source_media_url,retryable')
    .eq('source_channel_id', YOUTUBE_CHANNEL_ID)
  if (error) throw new Error(`Queue summary failed: ${JSON.stringify(error)}`)
  return {
    total: totals?.length ?? 0,
    waitingMedia: totals?.filter((x) => x.status === 'waiting_media').length ?? 0,
    pending: totals?.filter((x) => x.status === 'pending').length ?? 0,
    processing: totals?.filter((x) => x.status === 'processing').length ?? 0,
    failed: totals?.filter((x) => x.status === 'failed').length ?? 0,
    published: totals?.filter((x) => x.status === 'published').length ?? 0,
    retryableFailed: totals?.filter((x) => x.status === 'failed' && x.retryable).length ?? 0,
    withMedia: totals?.filter((x) => !!x.source_media_url).length ?? 0,
  }
}

Deno.serve(async (req) => {
  try {
    await auth(req)
    requireConfig()
    const url = new URL(req.url)
    const forceBackfill = url.searchParams.get('mode') === 'backfill'

    if (forceBackfill) {
      const { error } = await supabase.from('social_sync_state').update({
        backfill_complete: false,
        backfill_cursor: null,
        backfill_page_token: null,
        backfill_page_count: 0,
        backfill_started_at: new Date().toISOString(),
        backfill_completed_at: null,
        updated_at: new Date().toISOString(),
      }).eq('id', 1)
      if (error) throw new Error(`Backfill state reset failed: ${JSON.stringify(error)}`)
    }

    const discovery = await discoverAndQueue()
    const waitingExpired = await expireStaleWaitingMedia()
    const waitingPromoted = await refreshWaitingMedia()
    const recovered = await recoverStaleProcessing()
    const processing = await processReadyJobs()
    const queue = await queueSummary()

    return json({
      ok: true,
      mode: forceBackfill ? 'backfill' : 'incremental',
      discovery,
      waitingExpired,
      waitingPromoted,
      recovered,
      processing,
      queue,
    })
  } catch (error) {
    const message = errMsg(error)
    console.error('[sync-youtube-facebook]', message)
    return json({ ok: false, error: message }, message === 'Unauthorized sync request.' ? 401 : 500)
  }
})
