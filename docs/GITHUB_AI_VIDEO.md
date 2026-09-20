# ZIKR GitHub AI Video Action

The repository includes a manual workflow at `.github/workflows/generate-ai-video.yml`. It creates a vertical 1080×1920 MP4 on a standard GitHub-hosted runner and uploads the result as a downloadable artifact. The renderer uses free open-source FFmpeg and SVG tooling; it does not call a paid video-generation provider.

When the repository secret `GEMINI_API_KEY` is present, the workflow asks Gemini's free-tier API for a short, structured scene plan. If the secret is absent or the API is unavailable, the workflow automatically uses the reviewed safe fallback scenes, so the action remains runnable without paid credentials. The fallback is intentionally general and does not fabricate Quran or hadith citations.

Run it from **GitHub → Actions → Generate ZIKR AI Video → Run workflow**, then enter a title, language, and approximate duration. The resulting MP4 and metadata are available under the workflow run's artifact. The workflow is manual-only by design; it does not create an uncontrolled recurring publisher or change Supabase data.

## Optional configuration

| Name | Where | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | GitHub Actions secret | Optional free-tier scene planning through Gemini |
| `GEMINI_MODEL` | GitHub Actions variable | Optional model override; defaults to `gemini-2.0-flash-lite` |

No Vercel variable is required for this artifact-only workflow. Vercel variables such as `VIDEO_GENERATOR`, `VIDEO_AUTO_PUBLISH`, and `VIDEO_BACKGROUND_BATCH_SIZE` belong to the production queue and are separate from this manual workflow. Publishing to YouTube, Facebook, or Supabase storage is deliberately not enabled by this action.
