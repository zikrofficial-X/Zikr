# Phase 11 — AI Visual Factory
## ZIKR Finalization — 2026-10-02

### Objective

Keep AI-generated visuals strictly subordinate to verified ZIKR source content, while making the visual policy reproducible and provider selection bounded.

### Live audit

Production `video_generation_requests` currently contains 4 records with an `aiProvider` value:

- `hf_ltx_fast`: 1
- `hf_wan`: 3

No Gemini provider is persisted as a video visual provider; Gemini is used for the planning layer.

The active AI visual providers are routed through the canonical provider router:

- Hugging Face LTX Fast
- Hugging Face Wan
- ComfyUI
- Free API adapter
- deterministic template fallback

### Controls verified

- AI generation is environment-gated by `VIDEO_AI_ENABLED`.
- Provider order is environment-configurable.
- Per-run AI attempts are bounded by `VIDEO_AI_ATTEMPTS_PER_RUN`.
- Preferred HF provider hints are constrained to the known provider enum.
- Source text is supplied to visual providers only after the worker's source-lock validation.
- The Gemini planner is instructed not to invent Quran, hadith, adhkar, or religious citations.
- HF visual prompting explicitly prohibits depictions of prophets/sacred figures and invented Arabic scripture.
- Final rendering, not the model output, controls the actual Arabic text/subtitles shown in the finished video.
- Final media still passes the Phase 10 codec/resolution/audio QA chain.

### Improvement applied

Introduced `AI_VISUAL_POLICY_VERSION = 2026-10-02-source-locked-v1`.

The shared policy is injected into both the Gemini planner and the Hugging Face visual prompt, and the version is stored in AI planning metadata and render metadata. Source-locked metadata now covers all verified public religious-source categories:

- Quran
- Hadith
- Dua
- Adhkar
- Stories

This makes visual generation auditable by policy version rather than relying on an implicit prompt.

### Verification

Added `scripts/verify-ai-visual-factory.mjs` and registered `ai:visual:check` in `verify:pr` and `verify`.

### Data safety

No database content was rewritten. No AI provider credentials were exposed. No new external provider was introduced.

### Release gate

The source-level AI Visual Factory contract is deterministic. Repository-wide GitHub Actions observability remains the existing tracked exception.
