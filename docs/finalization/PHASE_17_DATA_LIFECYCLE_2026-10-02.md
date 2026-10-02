# Phase 17 — Runtime-Optional Data Ownership
## ZIKR Finalization — 2026-10-02

### Live audit
The following tables were checked directly in Supabase:
- hadith_explanations: 0 rows
- recent_recitations: 0 rows
- reciter_favorites: 0 rows
- tawasheeh_favorites: 0 rows
- tawasheeh_playlists: 0 rows
- tawasheeh_playlist_items: 0 rows

Repository source search found no active `src/` runtime consumer for these exact table names. Their remaining references are migration/type/history infrastructure.

### Decision
All six are classified **RETIRED from the runtime contract**.

This phase does **not** drop them from production. They remain available for the coordinated Phase 18 database retirement migration after:
- source/type dependency verification;
- production migration rehearsal;
- rollback planning;
- final release gate.

### Gate
Phase 17 closes only when:
- `data:lifecycle:check` passes;
- full repository quality gate passes;
- Supabase production health passes.

### Explicit non-change
`game_scenarios` is excluded from retirement because it contains 12 live rows and requires a separate content-ownership decision.
