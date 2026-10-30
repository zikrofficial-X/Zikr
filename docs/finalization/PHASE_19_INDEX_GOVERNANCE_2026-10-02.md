# Phase 19 — Index / Performance Governance
## Updated production checkpoint — 2026-10-30

### Advisor snapshot
Supabase Performance Advisor reports 70 unused-index findings (INFO). This is not a reason to bulk-delete indexes: usage counters are workload- and reset-window-dependent.

### Verified safe retirement set
Seven non-unique, non-primary indexes were checked directly:
- `hadith_explanations_hadith_id_idx`
- `recent_recitations_user_id_idx`
- `recent_recitations_reciter_id_idx`
- `reciter_favorites_reciter_id_idx`
- `tawasheeh_favorites_tawasheeh_id_idx`
- `tawasheeh_playlist_items_tawasheeh_id_idx`
- `tawasheeh_playlists_user_id_idx`

Each was valid/ready, non-unique, 8 KiB, on a table with zero rows and no FK/view/function dependency. These exact indexes are retired by `20261030070000_retire_runtime_optional_indexes.sql`. The migration also drops `idx_video_generation_requests_processing_heygen` only if it still exists.

### Preserve
- Primary, unique, constraint-backed, and foreign-key indexes.
- All indexes on active Quran, Kids, Prayer, Content, Social, and Admin tables unless workload evidence proves redundancy.
- The remaining unused-index findings are not removed in bulk.

### Verification
- Re-run Performance Advisor after the migration.
- Confirm the seven named indexes are absent.
- Confirm all remaining indexes are valid and ready.
- Run migration replay, app verification, and production health checks.
