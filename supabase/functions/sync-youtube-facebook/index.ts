import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY') ?? ''
const YOUTUBE_CHANNEL_ID = Deno.env.get('YOUTUBE_CHANNEL_ID') ?? ''
const FACEBOOK_PAGE_ID = Deno.env.get('FACEBOOK_PAGE_ID') ?? ''
const FACEBOOK_PAGE_ACCESS_TOKEN = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN') ?? ''
const META_GRAPH_API_VERSION = Deno.env.get('META_GRAPH_API_VERSION') ?? ''
const BATCH_SIZE = Math.max(1, Math.min(10, Number(Deno.env.get('SOCIAL_SYNC_BATCH_SIZE') ?? '3')))
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
  const supplied = req.headers.get('x-zikr-sync-secret') ?? ''
  if (!supplied) throw new Error('Unauthorized sync request.')
  const { data, error } = await supabase
    .from('social_sync_state')
    .select('sync_secret_hash')
    .eq('id', 1)
    .maybeSingle()
  if (error || !data?.sync_secret_hash || (await sha256(supplied)) !== data.sync_secret_hash) {
    throw new Error('Unauthorized sync request.')
  }
}

function requireConfig() {
  const missing = [
    ['SUPABASE_URL', SUPABASE_URL],
    ['SUPABASE_SERVICE_ROLE_KEY', SUPABASE_SERVICE_ROLE_KEY],
    ['YOUTUBE_API_KEY', YOUTUBE_API_KEY],
    ['YOUTUBE_CHANNEL_ID', YOUTUBE_CHANNEL_ID],
    ['FACEBOOK_PAGE_ID', FACEBOOK_PAGE_ID],
    ['FACEBOOK_PAGE_ACCESS_TOKEN', FACEBOOK_PAGE_ACCESS_TOKEN],
    ['META_GRAPH_API_VERSION', META_GRAPH_API_VERSION],
  ].filter(([, value]) => !value).map(([name]) => name)
  if (missing.length) throw new Error(`Missing configuration: ${missing.join(', ')}`)
  if (!/^v\d+\.\d+$/.test(META_GRAPH_API_VERSION)) {
    throw new Error(`Invalid Meta Graph API version: ${META_GRAPH_API_VERSION}`)
  }
}

async function youtube(path: string, params: Record<string, string | number | undefined>) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`)
  url.searchParams.set('key', YOUTUBE_API_KEY)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value))
  }
  const response = await fetch(url, { headers: { accept: 'application/json' } })
  const text = await response.text()
  if (!response.ok) throw new Error(`YouTube ${response.status}: ${text.slice(0, 1000)}`)
  return JSON.parse(text)
}

async function discoverYouTubeVideos() {
  const channel = await youtube('channels', {
    part: 'contentDetails',
    id: YOUTUBE_CHANNEL_ID,
  })
  const playlistId = channel.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
  if (!playlistId) throw new Error('YouTube uploads playlist not found for configured channel.')

  const videos: Array<{
    id: string
    title: string
    description: string
    publishedAt: string | null
    thumbnailUrl: string | null
    sourceUrl: string
  }> = []

  let pageToken: string | undefined
  for (let page = 0; page < 5; page += 1) {
    const result = await youtube('playlistItems', {
      part: 'snippet,contentDetails',
      playlistId,
      maxResults: 50,
      pageToken,
    })
    for (const item of result.items ?? []) {
      const id = item.contentDetails?.videoId
      if (!id) continue
      videos.push({
        id,
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
      })
    }
    if (!result.nextPageToken) break
    pageToken = result.nextPageToken
  }
  return { playlistId, videos }
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

function mediaFromRow(row: any) {
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
  const mediaByYoutubeId = new Map<string, string>()
  if (!sourceVideoIds.length) return mediaByYoutubeId

  for (let offset = 0; offset < sourceVideoIds.length; offset += 100) {
    const ids = sourceVideoIds.slice(offset, offset + 100)
    const { data, error } = await supabase
      .from('videos')
      .select('youtube_id,content_ref,metadata')
      .in('youtube_id', ids)
    if (error) throw new Error(`Supabase videos lookup failed: ${JSON.stringify(error)}`)
    for (const row of data ?? []) {
      if (row.youtube_id) {
        const media = mediaFromRow(row)
        if (media) mediaByYoutubeId.set(row.youtube_id, media)
      }
    }
  }
  return mediaByYoutubeId
}

async function discoverAndQueue() {
  const { playlistId, videos } = await discoverYouTubeVideos()
  const ids = videos.map((video) => video.id)
  const resolvedMedia = await resolveMediaForJobs(ids)

  const payload = videos.map((video) => {
    const media = resolvedMedia.get(video.id) ?? null
    return {
      source_video_id: video.id,
      source_channel_id: YOUTUBE_CHANNEL_ID,
      title: video.title,
      description: video.description,
      source_published_at: video.publishedAt,
      thumbnail_url: video.thumbnailUrl,
      source_url: video.sourceUrl,
      source_media_url: media,
      facebook_post_type: 'video',
      status: media ? 'pending' : 'waiting_media',
      last_error: media ? null : 'Original video media is not available yet.',
      next_attempt_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  })

  if (payload.length) {
    const { error } = await supabase
      .from('social_sync_jobs')
      .upsert(payload, { onConflict: 'source_channel_id,source_video_id', ignoreDuplicates: false })
    if (error) throw new Error(`Supabase queue upsert failed: ${JSON.stringify(error)}`)
  }

  const { error: stateError } = await supabase.from('social_sync_state').upsert(
    {
      id: 1,
      source_channel_id: YOUTUBE_CHANNEL_ID,
      uploads_playlist_id: playlistId,
      last_seen_video_id: videos[0]?.id ?? null,
      last_seen_published_at: videos[0]?.publishedAt ?? null,
      batch_size: BATCH_SIZE,
      backfill_complete: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  )
  if (stateError) throw new Error(`Supabase state update failed: ${JSON.stringify(stateError)}`)

  return {
    playlistId,
    discovered: videos.length,
    resolvedMedia: resolvedMedia.size,
  }
}

async function getReadyJobs(limit: number) {
  const { data, error } = await supabase
    .from('social_sync_jobs')
    .select('*')
    .eq('source_channel_id', YOUTUBE_CHANNEL_ID)
    .eq('status', 'pending')
    .not('source_media_url', 'is', null)
    .lte('next_attempt_at', new Date().toISOString())
    .order('source_published_at', { ascending: false, nullsFirst: false })
    .limit(limit)
  if (error) throw new Error(`Ready-job lookup failed: ${JSON.stringify(error)}`)
  return data ?? []
}

async function updateJob(id: string, patch: Record<string, unknown>) {
  const { error } = await supabase
    .from('social_sync_jobs')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(`Job update failed: ${JSON.stringify(error)}`)
}

async function publishFacebookVideo(job: any) {
  const sourceMediaUrl = safeHttpsUrl(job.source_media_url)
  if (!sourceMediaUrl) throw new Error('Invalid source_media_url; expected an HTTPS URL to the original video file.')

  const form = new URLSearchParams()
  form.set('file_url', sourceMediaUrl)
  form.set('title', String(job.title ?? '').slice(0, 255))
  form.set('description', String(job.description ?? '').slice(0, 10000))
  form.set('published', 'true')
  form.set('access_token', FACEBOOK_PAGE_ACCESS_TOKEN)

  const response = await fetch(
    `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${FACEBOOK_PAGE_ID}/videos`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form,
    },
  )
  const text = await response.text()
  let body: any = null
  try { body = JSON.parse(text) } catch { body = { raw: text.slice(0, 1500) } }
  if (!response.ok || !body?.id) {
    const message = body?.error?.message ?? body?.raw ?? `Facebook upload failed (${response.status})`
    throw new Error(`Facebook ${response.status}: ${message}`)
  }
  return String(body.id)
}

async function processReadyJobs() {
  const jobs = await getReadyJobs(BATCH_SIZE)
  const summary = { selected: jobs.length, published: 0, failed: 0, skipped: 0 }

  for (const job of jobs) {
    try {
      const { data: claimed, error: claimError } = await supabase
        .from('social_sync_jobs')
        .update({ status: 'processing', locked_at: new Date().toISOString(), attempts: (job.attempts ?? 0) + 1 })
        .eq('id', job.id)
        .eq('status', 'pending')
        .select('id')
        .maybeSingle()
      if (claimError) throw claimError
      if (!claimed) {
        summary.skipped += 1
        continue
      }

      const facebookId = await publishFacebookVideo(job)
      await updateJob(job.id, {
        status: 'published',
        facebook_post_id: facebookId,
        published_at_facebook: new Date().toISOString(),
        locked_at: null,
        last_error: null,
      })
      summary.published += 1
    } catch (error) {
      const message = errMsg(error).slice(0, 4000)
      const next = new Date(Date.now() + 15 * 60 * 1000).toISOString()
      await updateJob(job.id, {
        status: 'failed',
        last_error: message,
        locked_at: null,
        next_attempt_at: next,
      })
      summary.failed += 1
      console.error('[sync-youtube-facebook] publish failure', job.id, message)
    }
  }

  return summary
}

Deno.serve(async (req) => {
  try {
    await auth(req)
    requireConfig()
    const url = new URL(req.url)
    const mode = url.searchParams.get('mode') === 'backfill' ? 'backfill' : 'incremental'
    const discovery = await discoverAndQueue()
    const processing = await processReadyJobs()

    const { data: totals, error: totalsError } = await supabase
      .from('social_sync_jobs')
      .select('status,source_media_url')
      .eq('source_channel_id', YOUTUBE_CHANNEL_ID)
    if (totalsError) throw new Error(`Queue summary failed: ${JSON.stringify(totalsError)}`)

    const summary = {
      total: totals?.length ?? 0,
      waitingMedia: totals?.filter((x) => x.status === 'waiting_media').length ?? 0,
      pending: totals?.filter((x) => x.status === 'pending').length ?? 0,
      processing: totals?.filter((x) => x.status === 'processing').length ?? 0,
      failed: totals?.filter((x) => x.status === 'failed').length ?? 0,
      published: totals?.filter((x) => x.status === 'published').length ?? 0,
      withMedia: totals?.filter((x) => !!x.source_media_url).length ?? 0,
    }

    return json({ ok: true, mode, discovery, processing, queue: summary })
  } catch (error) {
    const message = errMsg(error)
    console.error('[sync-youtube-facebook]', message)
    return json({ ok: false, error: message }, message === 'Unauthorized sync request.' ? 401 : 500)
  }
})
