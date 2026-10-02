# ZIKR Kids Games 3.0 — Gameplay & Visual Audit

Release branch: `kids-games-3.0-full-gameplay-visuals-20261003`

## Scope

All 12 games were reviewed and updated without replacing the existing secure progress/offline architecture.

| # | Game | Gameplay update | Visual update |
|---|---|---|---|
| 1 | ZIKR Runner | Existing free-run progression and difficulty retained; dedicated world scene added | Runner World with moon, path lights, terrain layers |
| 2 | ZIKR Memory | Scored hint mechanic added; hint has a score cost and timed highlight | Memory Garden with animated card scenery |
| 3 | Wudu Challenge | Verified content and step progression preserved | Water Station scene and water-flow visual language |
| 4 | Verse Puzzle | Hint mechanic added with controlled penalty; verified Quran source preserved | Verse Library scene |
| 5 | ZIKR Quiz | 50/50 lifeline added and reset per question | Knowledge Hall scene |
| 6 | Mosque Adventure | Interactive station progression and learning checkpoints retained | Mosque Courtyard map scene |
| 7 | ZIKR Road | Lane navigation/checkpoints retained | Road of Choices environment |
| 8 | ZIKR Jump | Physics/platform progression retained | Star Platforms scene |
| 9 | Good Deeds | Each scene now requires a 3-step interaction instead of a single completion click | Good Deeds Village scene |
| 10 | Hilal Fly | Flight/obstacle/star progression retained | Hilal Sky scene |
| 11 | Mosque Cleanup | Drag-and-drop added in addition to tap selection | Clean & Organize environment |
| 12 | ZIKR Coloring | Custom color mixing and palette extension added | Creative Studio scene |

## Preserved contracts

- Verified Quran/Wudu/quiz content is preserved.
- Existing game result validation and secure RPC are preserved.
- Existing XP, achievements, progress and offline queue are preserved.
- 20 deterministic levels × 3 difficulties × 12 games remain the canonical level contract.
- Supabase gameplay metadata is versioned as gameplay/visual/interaction version 3.

## Supabase

The 3.0 catalog migration updates only game metadata. No user progress or result rows are rewritten.

Expected production catalog:
- 12 published games
- 720 level rows
- 20 levels per game
- 3 difficulties per game
- RLS remains enabled on `kids_game_levels`

## Verification contract

The final verifier now checks:
- all 12 dedicated visual worlds
- world scene mounting for every runtime
- memory/verse hint mechanics
- quiz 50/50
- Good Deeds multi-step interaction
- Mosque Cleanup drag/drop
- Coloring color mixing
- canonical 20×3 level migration
- preservation of the offline result pipeline
