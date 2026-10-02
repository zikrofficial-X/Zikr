# ZIKR Kids World

## Scope

Kids World is the Arabic-first, RTL-friendly game area under `/kids/games`. The central registry in `lib/games/registry.ts` is the source of truth for the twelve registered game IDs, runtime kind, age groups, difficulty options, score limits, and display metadata. The registry is shared by the game shell, Kids content adapter, score validator, admin selector, seed migration, and progress labels.

## Adding a game

Add a complete entry to `GAME_REGISTRY` first. Choose a runtime kind that is implemented by `WorldGameStage`; do not add a catalog-only label. Set conservative per-game limits and keep the Arabic description accurate. For a verified-content game, add or reuse data in `lib/data/kids-content.ts` and expose it through `lib/games/verified-content.ts`. Keep Quran text sourced from the existing database retrieval path; never generate, normalize, or paraphrase it.

If the game is publishable through the Kids admin form, the registry selector already exposes it. The server action still validates `gameId` with `isRegisteredGameId`; client options are not an authorization boundary. Add an idempotent seed row only when the game should ship in the default catalog, and use a new migration rather than editing a migration already applied to Supabase.

## Runtime and accessibility

`KidsWorldGameShell` owns difficulty, HUD, pause, mute, fullscreen, restart, submission, and offline status. `WorldGameStage` delegates to either the lifecycle-safe Phaser bridge or a focused React mini-game. Phaser wrappers are browser-only, lazy-load Phaser, dispose the instance on unmount, and apply `touch-action: none` so swipe controls do not scroll the page. Canvas play is interactive but not fully screen-reader accessible; the surrounding UI must provide labels, status text, pause/mute controls, and an escape route.

Audio feedback is generated locally with `ToneFeedback`. It is optional, non-autoplay, uses no external media, and is controlled by the same explicit `setMuted` contract as Phaser sound. Do not add copyrighted music, commercial characters, iframe games, trackers, ads, gambling, or monetization.

## Verified educational content

Wudu steps and Kids quiz questions must come from `lib/games/verified-content.ts`, which adapts existing approved Kids content without inventing material. Wudu choices may be shuffled for play, but their exact approved wording must remain unchanged. Verse Puzzle receives exact Quran text from `/api/kids/games/verse`; it uses indexed tokens so repeated words remain distinct and completion is checked against original token indexes.

## Persistence and RLS

Anonymous play is local. When an authenticated result is submitted, `app/api/kids/games/score/route.ts` authenticates with the cookie-bound Supabase client, derives `authData.user.id` on the server, validates the payload, and invokes `kids_record_game_result_internal` through `createAdminClient()`. The internal RPC derives XP in SQL and performs the result, per-game progress, player progress, and achievement updates atomically. It accepts no client XP parameter and is executable only by `service_role`. The legacy `kids_record_game_result` signature remains only for migration-history compatibility and is not executable by application roles.

The tables `kids_game_results`, `kids_player_progress`, `kids_game_progress`, `kids_achievements`, and `kids_user_achievements` have private user RLS where applicable. Never pass a client user ID as authority, expose the service-role key, or grant authenticated clients access to the internal processor. Apply database changes only through additive migrations and verify grants, policies, and Supabase advisors after each live change.

## Offline queue

`lib/games/offline-queue.ts` stores unsent results in IndexedDB with bounded retry metadata, deduplication by client submission ID, and online-event synchronization. Private score/progress APIs stay network-only in the service worker; only the public verified verse endpoint is eligible for the controlled content cache. Do not cache user-specific responses or allow unbounded queue growth.

## Validation commands

Run the following from the repository root after changes:

```bash
pnpm check
pnpm lint
pnpm test
pnpm build
pnpm verify
```

For live Supabase verification, confirm the new migration appears in the migration list, inspect function grants for both result processors, query only bounded metadata, and run security and performance advisors. For browser verification, test `/kids`, `/kids/games`, each registered game, `/kids/progress`, `/kids/achievements`, a non-game Kids detail page, guest score handling, pause/mute/restart, touch behavior, and console/runtime errors. Production deployment status must be reported from the actual Vercel deployment state; a blocked deployment is not a successful live verification.

## ZIKR Memory content contract

ZIKR Memory uses the structured `memory_pairs` field from the existing `game-memory-dhikr-cards` Kids content item. The runtime must consume these verified pairs through `getVerifiedMemoryPairs()`; it must not parse prose from `content_ar` or duplicate the pair text inside the component.

Difficulty is gameplay, not metadata only: easy uses 3 pairs, normal 4, and hard 5. The content integrity check `pnpm kids:memory:check` is part of both PR and main canonical verification.

The current pair count is intentionally small so the first reference game remains readable and touch-friendly. New pairs should be added to the structured source first, then covered by the integrity check before the runtime is expanded.
