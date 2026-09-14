# ZIKR v1.4.13 Validation Record

## Release
- Version: `1.4.13`
- Android versionCode: `44`
- Android applicationId: `com.zikr.app`
- Android target SDK: `36`
- Canonical production URL: `https://zikrmediaofficial.vercel.app`

## Video generation
Production video generation is locked to the free deterministic FFmpeg template renderer. The production route and background runner do not select, submit, or poll HeyGen jobs. Legacy HeyGen database columns/migrations remain only for historical compatibility and are not part of the active production execution path.

The renderer uses trusted Quran rows from `quran_ayahs`, optional HTTPS recitation audio, Arabic captions, a 1080x1920 MP4 output, and Supabase Storage persistence. This is the project's no-paid-provider production renderer; it is deterministic rather than a hosted generative-video model.

## Social publishing
Generated media is placed into the existing queue-driven publishing flow. YouTube publishing uses OAuth 2.0 client credentials and refresh token; Facebook publishing uses the configured Page access token and Page ID. Provider results are recorded per target and partial failures are not reported as full success.

## Validation evidence
- GitHub Admin 2.0 Quality Gate run `#136` for the reviewed code state completed successfully.
- Vercel production deployment for commit `c8b8652eb3f82b6ac788989fb1e195c529a47e52` reached `READY`; the checked post-deploy window had no error/fatal runtime logs.
- Vercel build logs showed 75 tests passed and 0 failures before the production build stage.
- Supabase currently reports 11 completed video-generation rows with persisted `video_url` values and 4 failed historical rows. No current row has a persisted `youtube_id`, so this record does not claim a fresh YouTube upload was proven by database state alone.

## Release integrity
Provider secrets are not committed to source. Runtime credentials are consumed from protected server-side environments only.
