# Phase 15 — Kids Production Integrity
## ZIKR Finalization — 2026-10-02

### Objective

Audit the Kids Games production surface after the scheduler/social/video phases and add a single source-level production gate without rewriting live game data.

### Live Supabase audit

`public.kids_games` currently contains:

- 12 games.
- 12 published games.
- 1 featured game.
- 12 rows without `cover_url`.
- 12 rows without `icon_url`.

The frontend does not use those DB art fields as the authoritative game artwork. The public games index renders original deterministic card art from the canonical TypeScript game registry, so the missing DB art fields are a data-model cleanup candidate rather than a current rendering failure.

`public.kids_game_results` currently contains:

- 9 result rows.
- 4 distinct game IDs played.
- 0 rows with negative score, duration, or XP values in the audited columns.

### Source audit

The canonical registry contains the 12 production game IDs:

- zikr-runner
- zikr-memory
- wudu-challenge
- verse-puzzle
- zikr-quiz
- mosque-adventure
- zikr-road
- zikr-jump
- good-deeds
- hilal-fly
- mosque-cleanup
- zikr-coloring

The unified game stage already routes these IDs, and the games index preserves filtering, progress loading, best-score display, and the empty state. The game shell preserves offline result synchronization.

The existing `verify-kids-games-final.ts` remains the detailed runtime contract: rebuilt runtimes, deterministic level generation, legacy-runtime exclusion, progression rules, shared character/collectible systems, and offline progress integration.

### Improvement applied

Added `scripts/verify-kids-production.mjs` as a higher-level production gate. It verifies:

- the canonical 12-game registry is complete;
- all 12 IDs are present in the unified stage;
- all three supported difficulties remain represented;
- the games index still loads progress and handles filters/empty states;
- the educational safety guide remains on the Kids Games page;
- offline result synchronization remains connected;
- all existing Kids verification scripts remain registered;
- the detailed Kids Games verifier remains executable;
- the new gate is part of both `verify` and `verify:pr`.

### Deliberate non-changes

No production game rows were modified. No placeholder cover/icon URLs were inserted into Supabase because the frontend currently treats the registry as the authoritative visual source. The 12 empty DB media columns are therefore retained for a later schema/data cleanup decision instead of fabricating assets.

### Next technical debt identified

The registry still contains a TypeScript-check suppression comment. Removing that suppression safely requires a dedicated type-safety pass rather than a blind deletion; this is carried forward as a separate hardening task.

### Release gate

The Phase 15 source gate is deterministic. Repository-wide CI execution remains subject to the existing GitHub Actions observability limitation documented in earlier checkpoints.
