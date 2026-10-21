# ZIKR Kids Content Review — 2026-10-21

## Scope

This repository-level wording and child-safety review covers:

- The three scenario sources used by ZIKR Runner, ZIKR Road, and Mosque Adventure: `game-scenario-smart-choice`, `quiz-akhlaq-adventure`, and `quiz-akhlaq-daily-life`.
- The 12 Good Deeds scenarios in `DEEDS`.
- The 16 sorting objects and four destination zones in Mosque Cleanup.
- The child-facing instructions for Letter Lab.

## Findings

### Values and decision scenarios

The scenario pool uses practical, understandable choices: asking a teacher about a found item, not responding to strangers who request a photo or location, telling a trusted adult about an uncomfortable message, apologizing and repairing harm, including a peer, taking turns, pausing when angry, checking uncertain information, being truthful, and resolving disagreements calmly.

The child-safety framing is appropriate for the target age group shown in the source records (9–12): unknown-person situations direct the child toward a trusted adult rather than contact with a stranger; the lost-wallet and animal-help prompts also route action through a trusted adult. CI continues to require at least 15 unique prompts and verifies valid answer indexes and duplicate removal.

### Good Deeds

All 12 scenes describe low-risk, fictional actions such as sharing, greeting a virtual guest, watering an imaginary plant, placing a book, helping carry a box inside a scene, noticing another character's need, taking turns, tidying items, greeting politely, offering water to a virtual character, and guiding a character. The content does not ask a child for personal information, recommend meeting strangers, or instruct the child to handle dangerous equipment.

A wording mismatch was found in the “Listening Ears” scene: it implied a listening/audio interaction not implemented by the runtime. The instruction now says to notice the character's need and choose a suitable moment to help.

### Mosque Cleanup

The 16 items align with the four sorting zones: books, lighting, soft/play items, and plants. The labels are concrete, use common terms, and do not contain a religious or safety claim. The educational book containing Quran text is treated only as an item to place on a shelf; the activity does not modify or quiz Quran text.

### Letter Lab

The instruction previously said “Choose the letter you hear and see” even though the game currently presents a visual target and does not play an audio prompt. The instruction now describes visual letter matching. The letter inventory and the broader teaching approach still need a maintained source/curriculum review before the manifest can call them reviewed.

## Review status and limitations

This is a source-code wording and basic child-safety review, not a formal child-development evaluation or an independent religious-scholar review. The per-game manifest uses `repository-copy-review-complete` only for Good Deeds and Mosque Cleanup copy reviewed here. Letter Lab remains `editorial-review-required`. Religious wording, Quran text, wudu material, and knowledge-question correctness continue to rely on their existing named source records and canonical Quran retrieval; this review does not independently certify their religious authenticity.

Future text or scenario changes must increment the relevant manifest revision and rerun `pnpm test`.
