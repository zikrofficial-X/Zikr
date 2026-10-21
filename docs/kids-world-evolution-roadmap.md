# ZIKR Kids and Games Evolution Roadmap

## Purpose

Build a coherent, child-friendly learning world with clear navigation, age-aware discovery, original game identities, meaningful gameplay, verified educational content, and reliable progress tracking. Improvements must build on the current game registry, level rules, offline-result queue, server validation, and progress/achievement services; they must not replace those systems with a parallel implementation.

## Current release: Phase A — Visual identity and discovery

Status: the core runtime artwork and discovery implementation is present. The release remains blocked if the registry, runtime dispatch, static metadata, database catalog, or production checks disagree.

- Give every registered game a bespoke vector scene rather than a generic icon.
- Localize artwork names for screen readers and make repeated SVG instances safe by generating unique gradient IDs.
- Show a curated mix of game genres on the Kids landing page with artwork, learning skill, category, and estimated play time.
- Add a test contract that verifies all 13 registered games have an explicit art scene and gameplay dispatch, unique Arabic names, and defined learning goals.
- Keep the full searchable catalog at /kids/games and retain the current progress API.

## Phase B — Game-by-game gameplay acceptance

Status: **implementation closed** (2026-10-21). The merged implementation passed the GitHub Quality Gate, including gameplay-difficulty and managed-timeout contracts for all 13 registered games. Physical device acceptance is not misreported as complete: the touch-phone, keyboard, desktop, and end-to-end result checklist remains a required release gate under Phase G.

- Implemented localized, game-specific briefings and control guides before runtime mount; the game engine waits for an explicit start action.
- Added an in-game help path that pauses play and restores the previous pause state when help closes.
- Automated contracts cover all 13 registered games, including gameplay difficulty, timer cancellation, pause handling, and game dispatch.
- Delayed callbacks in active learning, action, values, and Letter Lab runtimes use the shared pause-aware timer manager and are scoped to their run.
- **Separate release gate still pending:** physically play-test all 13 games on a touch phone, keyboard, and desktop; verify pause/resume/mute/visibility/restart/completion and authenticated/offline result submission before a production release is described as fully accepted.

## Phase C — Verified educational content

Status: **in progress**. The per-game provenance manifest and CI contract are merged. A repository-level wording and basic child-safety audit is recorded in `docs/kids-content-editorial-audit-2026-10-21.md`; content without an appropriate source or review sign-off remains flagged rather than labelled approved.

- Maintain `src/lib/games/content-manifest.ts` with per-game source references, source fields, canonical age groups, learning objectives, review state, and a revision number.
- CI verifies manifest coverage for every registered game, source record/file existence, structured memory and wudu content, quiz answer bounds, and the shared deduplicated scenario pool.
- Keep Quran text sourced from the canonical Quran data; do not manually paraphrase or manufacture Quran content for puzzles.
- Keep wudu and knowledge questions tied to approved educational records.
- Build Mosque Adventure and ZIKR Road from one shared, source-backed pool of approved child-friendly scenarios; deduplicate prompts and enforce a minimum scenario count in CI.
- Good Deeds scenarios and Cleanup labels have a repository-level wording/safety review record; this is not external child-development certification. Letter Lab pedagogy remains marked for editorial review. Quran, wudu, and factual quiz records are source-linked but this audit does not independently certify religious authenticity.
- Acceptance gate: every question or religious-text puzzle has a traceable source, and unavailable source data fails safely.

## Phase D — Kids section information architecture

Status: **implementation closed** (2026-10-21). A shared localized section navigator is mounted across Kids routes, primary paths have one canonical Arabic/English label and destination, the landing page derives the number of games from the canonical registry, and the route contract is part of `pnpm test`. The catalogue continues to filter by age, skill/search, category, difficulty, and duration.

- Added canonical destinations for home, stories and activities, learning, audio, games, creative coloring, progress, achievements, and the family guide.
- Rendered the same navigation on Kids landing, catalogue, activity details, and progress/achievement/family routes, with RTL/LTR support, keyboard-visible focus, touch-sized targets, and active-route feedback.
- Removed the stale hard-coded “12 games” label; the displayed count now follows `GAME_REGISTRY`.
- Added an automated navigation contract for unique IDs/URLs, bilingual labels/descriptions, registered direct or dynamic destinations, existing discovery facets, and the canonical game count.
- Loading and unavailable-content states are now announced accessibly and explain next steps in Arabic and English instead of incorrectly implying that all English content is missing.
- **Separate release gate still pending:** manually verify the two-step discovery goal with children/caregivers and test small-screen scrolling, RTL/LTR, keyboard focus, and contrast as part of Phase G. The automated route contract does not replace a usability study.

## Phase E — Art and audio asset system

- Define an asset manifest per game for characters, backgrounds, props, animations, and sound events.
- Prefer compressed SVG/vector assets for interface art; use sprite sheets only where actual animation materially improves play.
- Provide reduced-motion and sound-off experiences and avoid loading large art packs before a game is opened.
- Coloring now offers six original vector scenes, keyboard-operable paint regions, and a rotation that guarantees each difficulty visits all six scenes across the 30-level progression.
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
