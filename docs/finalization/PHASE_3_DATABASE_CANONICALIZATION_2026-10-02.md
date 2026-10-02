# ZIKR Finalization — Phase 3 Database Canonicalization

Date: 2026-10-02
Repository: zikr-org/Zikr
Baseline main commit: e1b84fac78d1ddb1fb971f7ec456b5ae37936edf
Working branch: audit/phase-0-1-finalization
Supabase project: kdotmrjfecgafiommzwz
Database: PostgreSQL 17.6.1

## 1. Phase objective

Phase 3 classifies the live production database before any destructive schema work.

Classification is based on:
- live production rows
- foreign keys
- triggers
- views
- database functions
- RLS/policy state
- active GitHub code references
- migration history
- known route/feature ownership from Phase 2

No table, index, function, policy, or data was deleted or mutated in this phase.

## 2. Live schema facts

- Public tables: **85**
- Current remote migration history contains a long reconciled chain with historical/archived entries and many September/October repair/reconciliation migrations.
- Production database status: ACTIVE_HEALTHY.
- Public tables are RLS-enabled across the current schema.
- Current Security Advisor findings:
  - 4 internal tables have RLS enabled with zero policies: admin_audit_log, admin_settings, content_revisions, video_automation_runs.
  - leaked-password protection is disabled.
- Current Performance Advisor finding: 91 unused indexes. These remain advisory; no index is dropped on this evidence alone.
- Critical live data examples:
  - quran_ayahs 6,236
  - quran_audio 19,608
  - quran_reciters 172
  - quran_surahs 114
  - hadiths 2,964
  - articles 91
  - videos 17
  - video_generation_requests 59
  - social_publish_queue 38
  - video_automation_runs 7
  - game_scenarios 12
  - kids_games 12
  - kids_game_progress 4
  - kids_game_results 9
  - kids_achievements 11
  - kids_user_achievements 8
  - prophets 25
  - prophet_sections 150
  - companions 17
  - companion_stories 22
  - battles 21
  - battle_events 84
  - conquests 15
  - conquest_events 60
  - duas 33
  - scholars 8
  - stories 21
  - tawasheeh 22

## 3. Canonical ownership classes

### CANONICAL — keep as the production source of truth

These tables have current runtime ownership, real data, durable relationships, or active feature/API references:

- admin_role_assignments
- admin_settings
- article_categories
- articles
- background_reminder_preferences
- battle_events
- battles
- companion_stories
- companions
- competitions
- conquest_events
- conquests
- contacts
- content_agent_queue
- content_agent_runs
- content_agent_sources
- content_library
- content_revisions
- content_sources
- dua_categories
- duas
- favorites
- hadith_books
- hadiths
- kids_achievements
- kids_character_selection
- kids_content
- kids_game_levels
- kids_game_progress
- kids_game_questions
- kids_game_results
- kids_games
- kids_player_progress
- kids_user_achievements
- media_assets
- memorization_plans
- memorization_progress
- notifications
- pinned_messages
- prayer_locations
- prayer_notification_deliveries
- prayer_notifications
- prayer_preferences
- prayer_schedule_cache
- profiles
- prophet_sections
- prophets
- push_runtime_settings
- push_subscriptions
- quran_audio
- quran_ayahs
- quran_reciters
- quran_surahs
- quran_tafsir
- reading_progress
- reminders
- scholars
- site_audio_assets
- site_settings
- social_publish_queue
- stories
- tawasheeh
- tawasheeh_categories
- user_behavior
- video_automation_runs
- video_categories
- video_generation_requests
- videos
- youtube_feed_cache
- youtube_sync_state

### CANONICAL / RUNTIME-OPTIONAL — keep, but usage needs explicit ownership

These are legitimate domain tables but current app-code usage was not strong enough in this pass to justify treating them as disposable or as the core read path:

- hadith_explanations
- recent_recitations
- reciter_favorites
- tawasheeh_favorites
- tawasheeh_playlists
- tawasheeh_playlist_items

Rule: do not delete them. In Phase 17/19 they must receive an explicit product state:
ACTIVE, source-backed, or retired.

### TRANSITION — keep temporarily while consolidating

#### Audit

Current objects:
- admin_actions_audit
- admin_audit_log
- admin_audit_events

Canonical target:
- admin_audit_events

Evidence:
- admin_audit_events is used by the active audit service.
- admin_audit_events has append-only UPDATE/DELETE protection.
- admin_actions_audit contains 1 live row and has only migration/type references in the active source scan.
- admin_audit_log contains 0 live rows, no active application consumer was found, and has no policies.

Action:
1. Preserve any historical audit records required by retention.
2. Define a one-way migration into admin_audit_events if fields are semantically compatible.
3. Remove application/type references to legacy audit tables.
4. Retire the legacy tables only after a production verification window.

#### Video publishing config

- video_publishing_config
- Live rows: 0
- No active application consumer was found.
- Current publication behavior is controlled through the newer queue/worker/config model.

Action:
- migrate any required settings into the canonical configuration model, then retire.

### LEGACY SUBSYSTEM — retire as one unit, not table-by-table

Objects:
- video_narrations
- free_tier_usage
- free_tier_statistics (view)
- track_free_tier_usage() (function)
- scripts/jobs/free-tier-video-narration.ts

Evidence:
- video_narrations = 0 rows
- free_tier_usage = 0 rows
- the view reads video_narrations
- track_free_tier_usage() reads video_narrations and writes free_tier_usage
- the active video worker uses video_generation_requests rather than this subsystem
- active code search found the legacy script but no canonical production caller

Action:
- deprecate the subsystem as a coordinated unit after a final operational confirmation.
- do not drop video_narrations or free_tier_usage independently.
- retire view/function/script together.
- keep the historical migrations as audit material.

### TRANSITION — kids schema consolidation

#### game_graphics

- live rows: 0
- no active application runtime consumer found
- depends on game_scenarios
- only timestamp trigger/index/RLS/history infrastructure remains

Decision:
- strong retirement candidate unless it is repurposed as canonical game-asset metadata.
- asset metadata should ultimately live under the canonical kids/media ownership model.

#### game_scenarios

- live rows: 12
- no active application runtime consumer was found in the targeted source scan
- game_graphics has a foreign key to it
- this means the data itself must be evaluated before any deletion

Decision:
- KEEP TEMPORARILY.
- Next phase must inspect all 12 records and determine whether they should become the canonical game metadata source.
- Do not delete because it is populated.

#### kids_achievements_legacy_20261002

- live rows: 0
- active source scan found only migration references
- name explicitly identifies a legacy compatibility table

Decision:
- DELETE CANDIDATE.
- Confirm migration-history intent and runtime schema generation before actual drop.

## 4. Tables with zero rows are not automatically orphaned

The following remain canonical despite being empty because active source code or feature contracts reference them:

- content_library
- content_sources
- content_revisions
- quran_tafsir
- memorization_plans
- memorization_progress
- notifications
- prayer_notification_deliveries
- prayer_notifications
- prayer_preferences
- prayer_schedule_cache
- push_subscriptions
- site_audio_assets
- recent_recitations
- reciter_favorites
- tawasheeh_favorites
- tawasheeh_playlists
- tawasheeh_playlist_items
- various kids level/question structures

The architectural rule is:
**runtime ownership beats row count.**

## 5. Foreign-key dependency backbone

The current schema confirms the following important canonical relationships:

### Content
content_sources -> content_library -> content_revisions
content_sources -> media_assets
content_sources -> kids_game_questions

### Quran
quran_surahs -> quran_ayahs
quran_surahs -> quran_tafsir
quran_reciters -> quran_audio
quran_reciters -> recent_recitations
quran_reciters -> reciter_favorites
profiles -> reading_progress/recent_recitations/reciter_favorites

### Kids
kids_games -> kids_game_levels -> kids_game_questions
profiles -> kids_game_progress
profiles -> kids_game_results
profiles -> kids_player_progress
kids_achievements -> kids_user_achievements
content_sources -> kids_game_questions

### Prayer / notifications
profiles -> prayer_locations/preferences/notifications/push_subscriptions
prayer_locations -> prayer_schedule_cache
push_subscriptions -> prayer_notification_deliveries
profiles -> prayer_notification_deliveries

### History/content
battles -> battle_events
conquests -> conquest_events
companions -> companion_stories
prophets -> prophet_sections

These relationships make the canonical feature boundaries explicit.

## 6. Functions and triggers that affect cleanup

### Protected canonical behavior

- prevent_admin_audit_events_mutation()
- enforce_content_publish_gate()
- enforce_media_publish_gate()
- sync_media_asset_compat_columns()
- kids_record_game_result()
- kids_record_game_result_internal()
- plan_background_reminder_deliveries()
- create_profile_on_login()
- handle_new_user()
- set_push_scheduler_updated_at()
- validate_game_question()

These are not orphaned simply because a table is empty. They are part of the current database contract.

### Legacy-coupled behavior

- track_free_tier_usage()
- update_video_narrations_timestamp()
- update_game_graphics_timestamp()
- update_game_scenarios_timestamp()

These should be retired only with their dependent legacy objects.

## 7. Security classification

The following currently have RLS without policies and are documented as internal/server-only:

- admin_audit_log
- admin_settings
- content_revisions
- video_automation_runs

Phase 6 will decide whether to:
- move them to a private schema, or
- retain public schema with strictly server-only access and explicit grants/policies where required.

Do not create arbitrary authenticated policies just to silence the advisor.

## 8. Index governance

91 unused-index findings were observed.

No blind DROP operation is authorized.

Indexes fall into three classes:

1. Clearly tied to canonical high-volume paths — retain unless query evidence contradicts them.
2. Likely redundant/overlapping — review with FK/unique/query workload.
3. Attached to legacy/retiring objects — can be retired together with their parent object.

Examples already linked to transition/legacy areas:
- admin_audit_log_admin_id_idx
- admin_audit_log_user_id_idx
- admin_actions_audit_created_at_idx
- game_graphics indexes
- game_scenarios indexes
- video_narrations indexes
- free_tier_usage indexes
- video_generation_requests_processing_heygen
- some unused provider/source indexes

## 9. Migration canonicalization findings

The remote history contains many:
- archived_legacy entries
- duplicate-name seed migrations
- reconciliation migrations
- duplicate hardening migrations
- repeated policy/index cleanup migrations
- September migration-history reconciliation checkpoints
- October compatibility/hardening passes

This does NOT justify rewriting or deleting migration history now.

Phase 4 will:
1. compare local active migrations to remote history,
2. identify exact duplicate versions/names,
3. preserve the remote production history,
4. define a forward-only canonical migration ledger,
5. isolate historical archives from the active chain,
6. verify fresh replay and production schema equivalence.

## 10. Final Phase 3 classification summary

| Class | Decision |
| --- | --- |
| Canonical | Keep and strengthen |
| Runtime-optional | Keep; assign explicit owner later |
| Transition | Migrate/merge before retirement |
| Legacy subsystem | Retire as a coordinated unit |
| Strong delete candidate | Only after dependency + release verification |
| Historical migration | Keep as audit material |

## 11. Immediate candidates for later cleanup

High-confidence candidates:
- admin_audit_log
- admin_actions_audit
- video_publishing_config
- video_narrations
- free_tier_usage
- free_tier_statistics
- track_free_tier_usage()
- scripts/jobs/free-tier-video-narration.ts
- game_graphics
- kids_achievements_legacy_20261002

Conditional candidate:
- game_scenarios

Not candidates for deletion:
- video_generation_requests
- social_publish_queue
- video_automation_runs
- media_assets
- content_sources
- content_library
- quran_audio
- quran_reciters
- quran_ayahs
- kids_games and its active progression/result tables
- prayer scheduler tables
- active content/history tables

## 12. Phase 3 completion criteria

- [x] Live public schema enumerated.
- [x] 85 public tables confirmed.
- [x] Live row counts captured.
- [x] RLS state captured.
- [x] Foreign-key graph sampled and documented.
- [x] Trigger/function dependencies captured.
- [x] Legacy video subsystem dependencies confirmed.
- [x] Audit-table consolidation confirmed.
- [x] Kids legacy tables separated from canonical runtime.
- [x] 91 unused-index findings recorded without destructive action.
- [x] Remote migration history captured for Phase 4.
- [ ] No destructive database operation performed before Phase 4 migration plan.

## 13. Phase 4 gate

Phase 4 must start with migration reconciliation. It must not begin by dropping any table.

Required next artifacts:
- local-vs-remote migration ledger
- duplicate/reconciliation report
- schema fingerprint
- generated TypeScript schema check
- forward-only cleanup migration plan

No production schema mutation was performed during Phase 3.
