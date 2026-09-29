# ZIKR Autonomous AI Video Worker

The production video automation workflow lives at `.github/workflows/generate-ai-video.yml`.

## Automatic operation

The workflow runs every two hours and supports manual dispatch for diagnostics. It invokes:

```bash
pnpm background:jobs
```

The worker:

1. Seeds idempotent source-locked Quran/Hadith/Dua requests.
2. Renders videos with the free deterministic FFmpeg template renderer.
3. Stores generated MP4 files in Supabase Storage.
4. Places successful videos into the social publishing queue.
5. Publishes automatically to configured YouTube and Facebook targets.

## Safety

The workflow does not rewrite Quran or hadith source text. Gemini is optional and is restricted to a short reflection/caption layer. Provider credentials are read from GitHub Actions secrets.

Required production secrets include:

```text
SUPABASE_SERVICE_ROLE_KEY
YOUTUBE_CLIENT_ID
YOUTUBE_CLIENT_SECRET
YOUTUBE_REFRESH_TOKEN
YOUTUBE_CHANNEL_ID
FACEBOOK_PAGE_ID
FACEBOOK_PAGE_ACCESS_TOKEN
```

Only the credentials for configured providers are required for that provider's publishing path. Video generation remains independent of social-provider availability.

## Manual diagnostics

Use GitHub Actions → **ZIKR Autonomous AI Video Worker** → **Run workflow** to process a controlled batch manually. Normal operation does not require opening the admin panel or pressing a generate button.

## Recovery

CircleCI's `background-jobs` parameter remains available as a manual recovery path. It must not be configured as a second recurring schedule.
