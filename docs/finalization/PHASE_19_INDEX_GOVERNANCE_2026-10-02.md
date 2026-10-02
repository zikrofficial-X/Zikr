# Phase 19 — Index / Performance Governance
## ZIKR Finalization — 2026-10-02

### Advisor snapshot
Supabase Performance Advisor currently reports 77 unused-index findings after Phase 18 retirement.

### Deliberate cleanup
Only indexes attached to runtime-retired tables and the obsolete HeyGen processing path are scheduled for removal:
- hadith_explanations_hadith_id_idx
- recent_recitations user/played_at/reciter indexes
- reciter_favorites_reciter_id_idx
- tawasheeh_favorites user/tawasheeh indexes
- tawasheeh_playlists user index
- tawasheeh_playlist_items_tawasheeh_id_idx
- idx_video_generation_requests_processing_heygen

Primary/unique/constraint-backed indexes are preserved.

### Non-goals
Do not bulk-delete the remaining unused-index findings. Many belong to active Quran, Kids, Prayer, Content, Social, or Admin paths and need workload evidence before removal.
