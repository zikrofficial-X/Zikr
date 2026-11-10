# Offline Content Snapshot Operations

The daily offline snapshot is refreshed by `.github/workflows/refresh-offline-content.yml`. Changes to the exporter or its validation contract also trigger a refresh on `main`; changes to generated JSON assets do not recursively trigger another run.

## Tafsir source policy

The live `public.quran_tafsir` table is currently empty. The repository contains a previously validated, attributed offline Tafsir corpus with 6,236 rows. Until the canonical source corpus is restored and its provenance/licensing is verified, the exporter retains that exact committed file rather than inventing or synthesizing Tafsir text.

When this fallback is used, the offline manifest records:
- `staleDatasets: ["tafsir"]`;
- `datasets.tafsir.source = "previous-validated-snapshot"`;
- `datasets.tafsir.stale = true`.

The exporter accepts this fallback only when the manifest points to the exact canonical `/offline-content/v1/tafsir.json` file, the declared count is at least 6,000, the file is a JSON array, and its actual row count matches the manifest. If any check fails, the entire snapshot refresh fails closed. Other datasets retain their normal minimum-row safety floors.

## Restoring live Tafsir

Do not seed or replace the database Tafsir corpus from an unverified source. Restore it only from a source with confirmed provenance, attribution, and redistribution rights, then import it through a reviewed migration/ingestion process. Once `quran_tafsir` contains at least 6,000 validated rows, the next offline snapshot run will automatically replace the retained snapshot and clear its stale marker.
