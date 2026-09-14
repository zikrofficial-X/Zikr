# ZIKR v1.4.13 Validation Record

Production video generation is locked to the free deterministic FFmpeg template renderer. The production Vercel route and background runner do not select, submit, or poll HeyGen jobs. Legacy HeyGen schema is retained only for migration/history compatibility.

The renderer uses trusted Quran rows, optional HTTPS recitation audio, Arabic captions, a 1080x1920 MP4, and Supabase Storage. Social publishing remains queue-driven: YouTube uses OAuth 2.0 credentials and Facebook uses the configured Page access token.

Release metadata: version `1.4.13`, Android versionCode `44`, applicationId `com.zikr.app`, target SDK `36`.

Validation evidence from the reviewed release path: GitHub Admin 2.0 Quality Gate completed successfully for the free-renderer code state; Vercel reached READY for the code state before the final documentation-only commits; the build evidence showed 75 tests passed and 0 failed. Current Supabase data contains 11 completed rendered-video rows. No fresh YouTube provider upload is claimed without a provider-side success event.

Provider secrets are never committed and are consumed only from protected server-side environments.
