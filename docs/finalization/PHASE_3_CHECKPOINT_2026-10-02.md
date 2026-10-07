# ZIKR Finalization — Phase 3 Checkpoint

Date: 2026-10-02
Working branch: audit/phase-0-1-finalization
Main baseline: e1b84fac78d1ddb1fb971f7ec456b5ae37936edf
Supabase production: nmdeazfmtncelykzxkhs

## Completed

Phase 3 Database Canonicalization is complete as an analysis/classification stage.

The production database was read and cross-checked against:
- GitHub source references
- foreign keys
- triggers
- functions
- views
- RLS
- migration history
- live row counts
- Supabase security/performance advisors

## Important conclusions

1. There are 85 public tables.
2. Most are canonical runtime tables and should not be removed.
3. Audit is converging on admin_audit_events as the canonical store.
4. video_publishing_config is a strong retirement candidate.
5. video_narrations/free_tier_usage/free_tier_statistics/track_free_tier_usage/free-tier-video-narration form one coordinated legacy subsystem.
6. game_graphics is empty and not referenced by active application code; strong cleanup candidate.
7. game_scenarios is populated (12 rows) and therefore cannot be treated as an orphan without inspecting its data.
8. kids_achievements_legacy_20261002 is empty and only referenced by migration infrastructure; high-confidence legacy candidate.
9. content_library/content_sources/content_revisions are not orphaned merely because some are empty; they are connected to current admin/content workflows.
10. quran_tafsir is empty but still part of the Quran service contract, so it remains canonical until a deliberate fallback/product decision is made.
11. 91 unused indexes remain informational; no destructive index cleanup is authorized yet.
12. Four server-only RLS tables intentionally have no client policy; Phase 6 will handle their schema exposure decision.
13. The remote migration history is complex enough that Phase 4 must reconcile it before any destructive schema action.

## Safety state

No production table, row, index, function, trigger, policy, or migration history was modified in Phase 3.

## Gate

Phase 3 -> Phase 4 is approved for analysis only.

Phase 4 must produce the local-vs-remote migration reconciliation before any cleanup DDL.
