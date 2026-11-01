# ZIKR Video Factory — Implementation Status — 2026-11-01

## Source baseline

- Repository: `zikrofficial-X/Zikr`
- Production baseline reviewed: `9e429094ae9f296f1d2875d1d2a648148e7a7f9d`
- Repair branch: `codex/zikr-comprehensive-repair-2026-11-01`
- No production video, social queue, or storage records were modified by this audit.

## Implemented in the current source

| Capability | Current implementation | Status |
|---|---|---|
| Source-locked Quran/Hadith/Dua/Adhkar/Story | `video-sources.ts` resolves published canonical rows and worker compares the request text against the current source before rendering. | Implemented |
| Quran human recitation only | Quran source resolution requires a reciter row and `quran_audio` record; worker obtains the per-ayah MP3 and refuses TTS if the recitation is unavailable. | Implemented, provider alignment hardened in repair branch |
| Arabic TTS | Edge TTS primary with gTTS fallback; request-specific voice profile, rate and pitch. | Implemented |
| Voice profiles | Human Quran recitation, male MSA Hadith, male MSA documentary, Egyptian Arabic kids. | Implemented |
| Text/audio technical QA | Arabic ratio, text length, URL/markup checks, duration, words-per-second, silence, peak volume, ffprobe streams/codecs/resolution/bitrate. | Implemented |
| Visual providers | Provider router, AI visual policy, bounded per-run attempts and deterministic template fallback. | Implemented |
| Video rendering | FFmpeg template, captions, source card, branding, vertical/horizontal output and metadata. | Implemented |
| Human approval | Video requests carry `approvalStatus=awaiting_human_review`; automatic social publishing remains separately gated. | Implemented |
| Social queue | GitHub Actions publisher and idempotent queue/retry path exist. | Implemented; disabled by default until owner opt-in |
| Admin Factory navigation | Unified Video Factory hub and source/script/voice/visual/template/QA/queue/publishing links. | Implemented, some subpages are informational hubs rather than full editors |

## Quran audio provider alignment

Production `quran_audio` rows are full-surah recitation records (`ayah_id` is null in the inspected sample); they are not per-ayah MP3 segments. The current video flow therefore uses the catalog row to verify the selected human reciter and a separate per-ayah audio endpoint for the exact ayah segment.

The default per-ayah endpoint is Alafasy. A mismatch between `QURAN_VIDEO_RECITER_CODE` and `QURAN_AYAH_AUDIO_RECITER_CODE` could otherwise label one reciter while playing another. The repair branch now rejects that mismatch and the deployment validator checks the two settings.

Required alignment when configuring a different reciter:
- `QURAN_VIDEO_RECITER_CODE`: reciter code in `quran_reciters`.
- `QURAN_AYAH_AUDIO_RECITER_CODE`: the reciter actually served by the configured per-ayah audio CDN.
- `QURAN_AYAH_AUDIO_BASE_URL`: per-ayah audio base URL for that same reciter.

Do not set one of these independently. If a matching per-ayah source is not verified, the Quran video request must fail closed.

## Current scheduler

- The canonical video worker is scheduled by GitHub Actions, not Vercel Cron or Supabase pg_cron.
- The workflow schedule is four times per day: `17 3,9,15,21 * * *` UTC.
- The worker divides the daily target into four six-hour windows and uses UTC-day automation keys to avoid duplicate seeding.
- Admin Run Now is a direct dispatch path; it does not create another recurring scheduler.
- The social publisher runs on its own 15-minute GitHub Actions schedule, but the repository variable `SOCIAL_PUBLISH_ENABLED` defaults to `false`.

The earlier review's description of a two-hour schedule with a six-hour slot index is not the current implementation and must not be used as the production configuration.

## Remaining gaps — not to be represented as completed

1. **Speech-to-text transcript alignment is not implemented.** Current Audio QA is signal/duration/pace/text QA; it does not transcribe generated speech and compare every spoken word to the canonical text. This requires a selected STT provider/model and a privacy/cost/runtime decision.
2. **Voice preview is not implemented in the Admin UI.** Current voice pages display profiles and configuration but do not synthesize and play a production-equivalent preview.
3. **Voice profile selection is not a complete Admin control.** The worker accepts request metadata and environment defaults; the profile pages are currently read-only.
4. **A first-class persisted schedule table is not implemented.** The current deterministic UTC quota/slot logic works as described above, but it is not the editable schedule model proposed in the older review.
5. **Manual browser/device acceptance remains required** for audio playback, caption timing, mobile rendering, review/approval, and each publishing target.
6. **Religious/editorial review remains required** for every new Quran/Hadith/Dua/Adhkar/Story source and its presentation. Automated source-lock checks do not replace qualified review.

## Release gates

- [ ] Confirm `QURAN_VIDEO_RECITER_CODE`, `QURAN_AYAH_AUDIO_RECITER_CODE`, and `QURAN_AYAH_AUDIO_BASE_URL` refer to the same reciter.
- [ ] Run `pnpm quran:canonical:check`, `pnpm voice:factory:check`, `pnpm video:qa:check`, `pnpm scheduler:check`, `pnpm social:publish:check`.
- [ ] Listen to generated samples for each TTS profile; check pronunciation, pacing and clipping.
- [ ] Verify source-locked Quran video playback uses human recitation and never TTS.
- [ ] Complete STT alignment design and implementation before claiming word-level audio verification.
- [ ] Test video approval and social publishing in a non-production/dry-run context before enabling the repository variable.
- [ ] Complete a real phone-browser acceptance pass.

