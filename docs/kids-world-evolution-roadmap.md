# ZIKR Kids and Games Evolution Roadmap

## Purpose

Build a coherent, child-friendly learning world with clear navigation, age-aware discovery, original game identities, meaningful gameplay, verified educational content, and reliable progress tracking. Improvements must build on the current game registry, level rules, offline-result queue, server validation, and progress/achievement services; they must not replace those systems with a parallel implementation.

## Current release: Phase A — Visual identity and discovery

Status: implemented in the companion GitHub change.

- Give every registered game a bespoke vector scene rather than a generic icon.
- Localize artwork names for screen readers and make repeated SVG instances safe by generating unique gradient IDs.
- Show a curated mix of game genres on the Kids landing page with artwork, learning skill, category, and estimated play time.
- Add a test contract that verifies all 12 registered games have an explicit art scene and gameplay dispatch, unique Arabic names, and defined learning goals.
- Keep the full searchable catalog at /kids/games and retain the current progress API.

## Phase B — Game-by-game gameplay acceptance

- Implement localized, game-specific three-step briefings and control guides before runtime mount; the timer and game engine wait for an explicit start action.
- Let players reopen the same guide from inside a running game; opening help pauses the round and closing it restores the prior pause state.
- Play-test each of the 12 games on a touch phone, keyboard, and desktop.
- Verify each title has its own control scheme, win condition, feedback, and replay flow; shared UI must not make the actual gameplay interchangeable.
- Verify easy, normal, and hard change gameplay behaviour, not only the label.
- Test pause, resume, mute, visibility-change pause, restart, completion, and result submission.
- Acceptance gate: all game runtime tests and the mobile smoke checklist pass before expanding the catalogue.

## Phase C — Verified educational content

- Maintain a per-game content manifest with source, age range, learning objective, review status, and revision.
- Keep Quran text sourced from the canonical Quran data; do not manually paraphrase or manufacture Quran content for puzzles.
- Keep wudu and knowledge questions tied to approved educational records.
- Build Mosque Adventure and ZIKR Road from one shared, source-backed pool of approved child-friendly scenarios; deduplicate prompts and require a minimum scenario count in CI.
- Review values-based scenarios for age suitability, clarity, and practical actions a child can understand.
- Acceptance gate: every question or religious-text puzzle has a traceable source, and unavailable source data fails safely.

## Phase D — Kids section information architecture

- Group activities by age, skill, duration, and activity type.
- Separate stories, learning activities, audio, creative tools, games, achievements, and progress into clear paths.
- Keep labels consistent between the landing page, catalogue, detail pages, and Admin Kids editor.
- Ensure empty, loading, offline, and unavailable states remain understandable in Arabic and English.
- Acceptance gate: a child can find a suitable activity in two navigation steps without duplicate or dead links.

## Phase E — Art and audio asset system

- Define an asset manifest per game for characters, backgrounds, props, animations, and sound events.
- Prefer compressed SVG/vector assets for interface art; use sprite sheets only where actual animation materially improves play.
- Provide reduced-motion and sound-off experiences and avoid loading large art packs before a game is opened.
- Coloring now offers six original vector scenes, keyboard-operable paint regions, and a rotation that guarantees each difficulty visits all six scenes across the 20 levels.
- Track asset dimensions, format, source/rights, and game ownership.
- Good Deeds, Cleanup, and Coloring localize child-facing titles, instructions, activity content, feedback, HUD labels, and artwork descriptions in Arabic and English.
- Memory, Wudu, Verse Puzzle, and Quiz localize their controls, feedback, progress labels, and headers; verified dhikr, wudu steps, Quran text, quiz questions, and choices remain explicitly identified in their original Arabic wording.
- Use ZIKR Memory as the reference gameplay experience: pair-progress text must match the metric shown, and cards must expose their flipped state and content through accessible labels; localize all 11 existing situation labels without changing the verified Arabic dhikr. Memoize the verified pair pool so routine HUD/feedback renders do not recompute the seeded board. Cancel hint, mismatch-reveal, and level-advance timeouts on restart, difficulty changes, level transitions, and unmount so an older round cannot mutate a new board.
- Acceptance gate: no game card depends on a remote image for its core identity and no missing asset breaks gameplay.

## Phase F — Progress, privacy, and family controls

- Preserve server-side score bounds, authenticated result validation, offline queue retry, deduplication, XP, and achievements.
- Make progress readable without ranking children against each other.
- Add family-facing guidance for age suitability and optional break reminders; do not collect child-sensitive data that is not needed for gameplay.
- Acceptance gate: logged-out, online, offline, and reconnect flows do not lose or duplicate results.

## Phase G — Release readiness

- Add browser-level smoke coverage for catalogue filtering, opening every game, starting/restarting, difficulty changes, and result states.
- Run typecheck, lint, existing game-contract tests, route/integrity checks, and production build in CI.
- Verify mobile layout, Arabic RTL, English LTR, keyboard focus, contrast, reduced motion, and tap target sizes.
- Merge only after CI is green; deploy and verify production separately from the source change.

## Non-negotiable project rules

- No destructive Supabase schema changes as part of a visual/gameplay-only release.
- No editing verified Quran source text to manufacture a puzzle or answer.
- No replacing the existing game registry or result pipeline with duplicated systems.
- No claiming a game or release is complete until its runtime and acceptance checks pass.
