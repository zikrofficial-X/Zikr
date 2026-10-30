# Phase 17 — Runtime-Optional Data Ownership
## Updated production checkpoint — 2026-10-30

### Live audit
The following tables were queried directly in Supabase Production on 2026-10-30:

| Table | Rows | Runtime consumer | Decision |
|---|---:|---|---|
| hadith_explanations | 0 | None in active `src/` | RETIRED |
| recent_recitations | 0 | None in active `src/` | RETIRED |
| reciter_favorites | 0 | None in active `src/` | RETIRED |
| tawasheeh_favorites | 0 | None in active `src/` | RETIRED |
| tawasheeh_playlists | 0 | None in active `src/` | RETIRED |
| tawasheeh_playlist_items | 0 | None in active `src/` | RETIRED |

Dependency audit:
- Foreign-key dependencies: 0.
- View/function dependencies: 0.
- RLS policies remain on the tables.
- Two harmless timestamp triggers remain on `hadith_explanations` and `tawasheeh_playlists`.
- The tables remain in generated Supabase types; types are intentionally preserved until a separately approved table-retirement stage.

### Decision
All six tables remain **RETIRED from the runtime contract**, but their table structures and RLS policies are preserved. Phase 17 does not drop tables.

### Implementation
- Updated `DATA_LIFECYCLE_MANIFEST_2026-10-02.json` with the production audit.
- Added `scripts/verify-data-lifecycle.mjs` and `data:lifecycle:check` to `verify` and `verify:pr`.
- Phase 19 migration removes only the seven unused, non-unique indexes attached to these runtime-retired tables (plus the obsolete HeyGen processing index if present).

### Gate
Phase 17 closes only after:
- `pnpm data:lifecycle:check` passes;
- full repository quality gate passes;
- Supabase migration replay passes;
- production index audit confirms only the intended indexes were removed.

### Explicit non-change
No table, row, RLS policy, or trigger is dropped in this phase.
