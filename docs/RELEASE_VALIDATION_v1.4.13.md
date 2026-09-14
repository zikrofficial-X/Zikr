# ZIKR v1.4.13 Validation Record

Production video generation is locked to the free deterministic FFmpeg renderer. The production Vercel route and background runner do not select, submit, or poll HeyGen jobs. Legacy HeyGen schema is retained only for compatibility.

The renderer uses trusted Quran rows, optional HTTPS recitation audio, Arabic captions, a 1080x1920 MP4, and Supabase Storage. Social publishing remains queue-driven: YouTube uses OAuth 2.0 credentials and Facebook uses the configured Page access token.

Release metadata: version `1.4.13`, Android versionCode `44`, applicationId `com.zikr.app`, target SDK `36`.

Validation: the reviewed code state passed the GitHub quality gate and the Vercel production build; 75 tests passed and 0 failed in the Vercel build logs. Current Supabase data contains rendered video URLs; no database-only claim is made that a fresh YouTube provider upload has succeeded without a current provider-side event.
