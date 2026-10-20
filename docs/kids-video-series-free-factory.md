# ZIKR Kids Video Series and Free-Only Generation

## Content model

The Video Factory now ships with four original fictional children's series:

- **مغامرات سليم ونور** — honesty, friendship, apologies, teamwork, planning and listening.
- **أصدقاء الحديقة** — nature care, cleanup safety, water conservation and respect for wildlife.
- **نادي المخترعين الصغار** — problem solving, safe experiments, measurement and teamwork.
- **خطوات خير صغيرة** — kindness, fairness, respectful feedback and shared responsibility.

The first curated season contains six episodes per series (24 ready-to-produce episode cards). The deterministic factory can continue producing later seasons without an LLM. Every episode contains a stable series ID, season/episode number, age group, visual theme, learning objective, short story and audience question. Validation rejects malformed episodes, raw URLs and unsupported religious attributions.

Children's stories use the existing database category `other` plus structured metadata (`audience: "kids"`, `contentFormat: "series_episode"`, series/season/episode fields). This avoids a new database enum migration. The existing `kids_friendly` Arabic narration profile is used. Quran videos continue to require human recitation audio and must never fall back to TTS.

## Visuals and rendering

Kids episodes select a dedicated SVG background by `visualTheme`: garden, nature, workshop or neighborhood. The existing FFmpeg renderer, Arabic captions, narration checks, output codec/resolution checks, source metadata and storage path remain in place. If a public free video-generation Space is unavailable, provider routing falls back to the local FFmpeg template renderer.

## No-paid-provider policy

Production generation sets `VIDEO_FREE_ONLY=true`. In this mode the router only permits the configured public Hugging Face Spaces and the local template renderer; ComfyUI/custom endpoints and `free_api` endpoints are skipped. Gemini planning is also disabled unless an operator explicitly turns free-only mode off. The production workflow no longer injects `GEMINI_API_KEY`. Arabic narration uses the existing Edge TTS path and gTTS fallback.

Public free Spaces and no-key TTS endpoints are externally operated services, so free quotas and availability can change. This design avoids intentionally calling custom billing-enabled generation endpoints and keeps local FFmpeg rendering available as a fallback; it cannot guarantee third-party uptime or quotas.

## Schedule and publication

The GitHub Actions worker runs in four six-hour UTC windows. The daily target is released proportionally across those windows, so a target of 12 with a batch size of 3 can seed up to 3 jobs each run. The seven-lane content rotation schedules Quran, hadith, dua, adhkar, verified stories, a kids serial episode and an editorial reminder. The worker queues generated outputs; `publish-social.yml` processes social jobs separately. Each children’s social caption includes the series name, season, episode and learning objective.

Automatic external publication still requires valid target-specific credentials in GitHub's production environment and correct runtime configuration. Without credentials, videos can be generated and stored, but external social publication is skipped. Publication remains idempotent through existing automation keys and queue records.

## Verification

Run `pnpm kids:video:check` to validate 1,000 generated episodes and inspect the integration between the story factory, admin catalogue, provider restrictions, assets and scheduled worker. The generation workflow runs this check before processing the production queue.
