# ZIKR v1.4.13 Validation Record

## Release

- Version: `1.4.13`
- Android versionCode: `44`
- Android applicationId: `com.zikr.app`
- Android target SDK: `36`
- Canonical production URL: `https://zikrmediaofficial.vercel.app`

## Video generation

Production generation is locked to the free deterministic FFmpeg template renderer. The production route and background runner no longer select or pass through the legacy HeyGen provider path. HeyGen database columns/migrations remain only for historical schema compatibility and are not part of the active production execution path.

The renderer uses trusted Quran rows from `quran_ayahs`, optional HTTPS recitation audio, Arabic captions, a 1080x1920 MP4 output, and Supabase Storage persistence. It is a no-paid-provider path rather than a hosted generative-video model.

## Social publishing

Generated videos are placed into the existing queue-driven publishing flow. YouTube publication uses the configured OAuth 2.0 client ID/secret and refresh token; Facebook publication uses the Page access token and Page ID. The production worker records partial/failure results instead of falsely marking an item complete.

## Verification evidence

- GitHub Admin 2.0 Quality Gate run `#136` for the current source completed successfully.
- Vercel production deployment for commit `c8b8652eb3f82b6ac788989fb1e195c529a47e52` reached `READY` with no error/fatal runtime logs in the checked post-deploy window.
- Vercel build logs for the current deployment showed 75 tests passed and 0 failures before the production build stage.
- Supabase currently contains 11 completed generated-video requests with persisted `video_url` values. There are 4 failed historical requests. The database currently reports 0 rows with a persisted `youtube_id`; therefore this record does not falsely claim a fresh YouTube upload was proven from the current queue without a provider-side publish event.

## Release integrity

Provider secrets are not committed to source. Runtime credentials are consumed from protected server-side environment/CI secrets only.
