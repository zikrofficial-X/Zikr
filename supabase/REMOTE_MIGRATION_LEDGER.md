# Supabase Remote Migration Ledger

This file records migrations applied directly to the live ZIKR Supabase project during the 2026-09-19 cleanup/rebuild pass.

| Remote version | Name | Purpose |
|---|---|---|
| 20260919021149 | content_catalog_phase2_20260919 | Adds and normalizes content-category catalogues for articles, duas, videos and tawasheeh. |
| 20260919021225 | editorial_expansion_phase2b_20260919 | Adds the phase-2 original editorial article set. |
| 20260919021236 | story_expansion_phase2_20260919 | Adds the original ethical-fiction story set with explicit fiction metadata. |
| 20260919021330 | kids_content_expansion_phase2d_20260919 | Adds the expanded family-friendly kids content set and publishes it safely. |
| 20260919021452 | cleanup_subscription_legacy_column_20260919 | Removes the unused legacy `verificationtoken` column after confirming zero rows used it. |
| 20260919050125 | remove_redundant_nonunique_indexes | Removes exact redundant non-unique indexes where an equivalent UNIQUE index already provides the same key coverage. |
| 20260919050332 | remove_redundant_prefix_indexes | Removes zero-scan non-unique prefix indexes fully covered by longer active indexes. |
| 20260919044739 | retire_orphaned_legacy_tables | Retires audited, empty legacy runtime tables; later local history keeps the remote version as a reconciliation marker. |
| 20260919045742 | retire_orphaned_legacy_tables | Records the idempotent legacy-table cleanup applied while reconciling the live migration history. |
| 20260919060000 | retire_orphaned_legacy_tables | Records the canonical repository migration that retains the same safe cleanup in local history. |
| 20260919065535 | quran_supabase_storage_20260919100000 | Adds the canonical `quran-audio` Storage bucket metadata and deterministic targets for the 114-surah × 7-reciter library. |
| 20260929025052 | quran_schema_compatibility_20260929 | Reconciles the remote migration history with the repository after the compatibility migration was already applied to the live project. The local marker is intentionally idempotent and does not replay production schema changes. |

## Operational rules

- The live database is the source of truth for the remote migration ledger.
- Historical migration/archive files are not deleted merely to reduce file count; they are retained when they provide audit history.
- New runtime code must use canonical environment names and the current `src/` feature architecture.
- Content migrations must be idempotent where practical and must not fabricate Quran, hadith or historical attributions.
- When a future local migration replay is required, generate the SQL from a fresh schema/content snapshot rather than inventing historical migration bodies.

Last updated: 2026-10-02.


Validation note: the rebuild branch is being validated through GitHub Actions after schema/type compatibility fixes. No production-success claim is made until the current quality gate and deployment are green.
- **20261001214711 — kids_games_schema_reconciliation_20261002**
  - Applied to production on 2026-10-02.
  - Reconciles the 20260929 kids-game schema regression with the canonical generated Supabase types.
  - Restores atomic/idempotent game-result processing, achievement catalog integrity, progress uniqueness, and the 12-game catalog.
- **20261001221622 — kids_games_enhanced_content**
  - Applied to production on 2026-10-02 as a schema-neutral migration-history reconciliation marker.
  - Replaced the legacy 8-digit `20260929` history entry so hosted Supabase migration ordering no longer collides with 14-digit `20260929xxxxxx` versions.
  - The original enhanced-content SQL is preserved under `supabase/legacy_migrations/` for audit/history reference.

## Phase 4 reconciliation addendum — 2026-10-02

A live-versus-repository reconciliation was completed against the production migration history.

| Metric | Result |
|---|---:|
| Repository migrations | 291 |
| Remote migration history entries | 291 |
| Local-only versions | 0 |
| Remote-only versions | 0 |
| Duplicate version IDs | 0 |
| Shared version IDs | 291 |
| Exact descriptive-name matches | 288 |
| Historical descriptive-name mismatches | 3 |

The three historical naming differences are:

- **20261001221622** — repository file `kids_games_history_repair`; remote name `kids_games_enhanced_content`. This is the schema-neutral migration-history reconciliation marker. The original enhanced-content SQL remains under `supabase/legacy_migrations/`.
- **20261002054010** — repository file `finish_rls_overlap_cleanup_20261002`; remote name `20261002120000_finish_rls_overlap_cleanup_20261002`. The repository commit explicitly aligned the migration timestamp history.
- **20261002054042** — repository file `finish_admin_public_policy_merge_20261002`; remote name `20261002130000_finish_admin_public_policy_merge_20261002`. The repository commit explicitly aligned the migration timestamp history.

These are descriptive-name differences for versions that exist on both sides. No migration repair is required.

Repeated descriptive names elsewhere in the history are also not duplicate version IDs; each repeated name maps to distinct migration versions.

The repository's `scripts/validate-migrations.mjs` remains the canonical local replay validator. This phase did not mutate production migration history or schema.

Last reconciled: 2026-10-02.

- **20261002073929 — phase6_security_hardening_20261002**
  - Applied to production on 2026-10-02.
  - Revokes anonymous DML privileges from the public schema while preserving the public contact-form insert path.
  - Removes Data API table privileges for `admin_audit_log`, `admin_settings`, `content_revisions`, `video_automation_runs`, and `youtube_sync_state` from `anon` and `authenticated`; service-role access remains available for server/worker paths.

- **20261002113000** — `scheduler_hardening_20261002`
  - Applied to production in Phase 13 to pin active cron endpoints to the canonical Supabase project URL.
- **20261002114000** — `retire_dead_media_cleanup_cron_20261002`
  - Applied to production in Phase 13 to retire the cron job targeting an undeployed media-cleanup Edge Function.



## Phase 5 migration-history reconciliation — 2026-10-08

The live Supabase project exposed five remote migration versions that were not present in the repository migration directory. These entries were already applied to production through the previous control-plane repair pass, so the correct fix is history reconciliation markers, not replaying the DDL.

| Remote version | Remote name | Local canonical implementation |
|---|---|---|
| 20261008014118 | repoint_production_cron_to_current_project_v2 | 20261008050000_repoint_production_cron_to_current_project.sql |
| 20261008015328 | retire_obsolete_cleanup_cron | 20261008060000_retire_obsolete_cleanup_cron.sql |
| 20261008015449 | content_translation_queue | 20261003090000_content_translation_queue.sql |
| 20261008015452 | content_library_summary_en | 20261004190000_content_library_summary_en.sql |
| 20261008015534 | harden_translation_queue_and_kids_timestamp_helpers | 20261008070000_harden_translation_queue_and_kids_timestamp_helpers.sql |

The five new files under supabase/migrations/ are schema-neutral SELECT 1 markers keyed to the remote version IDs. They exist solely so the managed Supabase migration workflow can resolve the remote-history check without replaying already-applied production changes.

The remaining repository-only migrations are intentionally preserved as forward migrations and are not deleted or renamed in this reconciliation.

Last reconciled: 2026-10-08.


## Phase 6 migration-history reconciliation — 2026-11-06

The Supabase production migration history returned two additional versions for the internal video queue constraint update. The repository already contains the canonical schema-changing migration at `20261106160000_allow_internal_videos_in_content_publish_queue.sql`. These two remote versions are represented locally by schema-neutral markers so preview/development branches can reproduce the exact migration ledger without replaying extra production DDL.

| Remote version | Remote name | Local reconciliation file | Operation |
|---|---|---|---|
| 20261106184415 | allow_internal_videos_in_content_publish_queue | `20261106184415_allow_internal_videos_in_content_publish_queue.sql` | `SELECT 1` marker only |
| 20261106184600 | allow_internal_videos_in_content_publish_queue | `20261106184600_allow_internal_videos_in_content_publish_queue.sql` | `SELECT 1` marker only |

The canonical constraint change remains in the existing `20261106160000` migration. These markers do not change schema, rows, queue contents, or external publishing behavior. Do not delete or rewrite the existing migration files.

This reconciliation is based on the live production migration list captured on 2026-11-06. The active project reports 403 migration entries, matching the repository chain in this release branch. The project has one default `main` branch and no preview branches.

Last reconciled in repository: 2026-11-06 (including private likes and trigger-maintained public aggregates).


## Active project cutover — 2026-11-06

The production binding has moved to Supabase project `zqtssvlvmkzeeyqghqfk` (organization `Zikrofficial`, region `eu-west-2`). This supersedes `ymxdswkaxafakugktsim` as the active application target. Historical migration bodies and dated audit snapshots retain the old reference as historical evidence; active configuration, workers, CI, and release validation must use the new project.

| Version | Migration | Status |
|---|---|---|
| 20261106205519 | `revoke_public_execution_on_rls_auto_enable` | Applied to active project; anon/authenticated execution revoked, postgres-owned `ensure_rls` event trigger remains enabled. |
| 20261106210440 | `repoint_active_cron_jobs_to_current_project` | Applied to active project; active prayer/source-agent cron jobs target the canonical Supabase host. |
| 20261106210520 | `repoint_active_cron_jobs_to_current_project` | Applied as a no-op reconciliation marker for the exact remote migration ledger. |
| 20261106213918 | `video_likes` | Applied to active project; authenticated users can add/remove their own likes. Public totals are exposed only through an RLS-protected count table. |
| 20261106214309 | `secure_video_like_count_summary` | Applied to active project; like totals are maintained by a trigger-only function whose EXECUTE privilege is revoked from public roles. |

The active project snapshot contained 400 migrations before this cutover; the security migration, both cron migration versions, and the video likes migration are now applied, bringing the live ledger to 405 entries. Public schema RLS was enabled on all 90 inspected tables. Health Advisor had no findings. The remaining Security Advisor warning is the Supabase Auth leaked-password protection setting, which is unavailable on the current Free plan.

Do not rewrite old migration SQL or historical snapshots to make their former project URLs appear current. New forward migrations and current runtime configuration must use the active project reference.


## 2026-11-14T1150Z live migration and schema comparison — read-only

- Supabase project `zqtssvlvmkzeeyqghqfk`: 439 local migrations, 418 remote, 21 local-only, 0 remote-only, 0 duplicate local versions. No migration was pushed or applied.
- Pending local-only migrations:
- `supabase/migrations/20261110212000_kids_content_public_read_respects_active_state.sql`
- `supabase/migrations/20261111000000_revoke_anon_public_admin_predicate.sql`
- `supabase/migrations/20261111003000_expand_kids_content_supported_types.sql`
- `supabase/migrations/20261111010000_background_reminders_respect_quiet_hours_timezone.sql`
- `supabase/migrations/20261111020000_admin_role_update_blocks_self_demotion.sql`
- `supabase/migrations/20261111030000_prophet_sections_public_read_requires_published_parent.sql`
- `supabase/migrations/20261111040000_kids_game_levels_require_published_game.sql`
- `supabase/migrations/20261111050000_admin_role_assignments_service_role_only.sql`
- `supabase/migrations/20261111153000_harden_video_storage_retention_rpc.sql`
- `supabase/migrations/20261111170000_kids_game_questions_require_published_parent.sql`
- `supabase/migrations/20261112103200_revoke_client_non_dml_table_privileges.sql`
- `supabase/migrations/20261113000000_background_reminder_intervals_allow_disabled.sql`
- `supabase/migrations/20261113190000_harden_admin_managed_content_write_permissions.sql`
- `supabase/migrations/20261113200000_youtube_sync_state_playlist_cache.sql`
- `supabase/migrations/20261113210000_reconcile_source_agent_cron_project_ref.sql`
- `supabase/migrations/20261113220000_remove_direct_site_audio_storage_write_policies.sql`
- `supabase/migrations/20261113230000_content_publish_queue_one_active_item.sql`
- `supabase/migrations/20261114000000_site_audio_upload_intents.sql`
- `supabase/migrations/20261114010000_social_publish_queue_target_platform_contract.sql`
- `supabase/migrations/20261114020000_revoke_client_default_function_execute.sql`
- `supabase/migrations/20261114030000_scope_video_storage_writes.sql`
- Missing production contracts: `site_audio_upload_intents`; `background_reminder_preferences.timezone`; `youtube_sync_state.playlists`; `social_publish_queue_target_platforms_check`; `content_publish_queue_one_active_item` partial unique index. Existing social target arrays have zero invalid rows; active content-publish queue has zero duplicate pairs; background reminder preferences currently have zero rows.
- Live RLS still permits direct authenticated admin writes to `kids_content`, `videos`, `video_generation_requests`, `social_publish_queue`, and `site_audio_assets`; `admin_role_assignments` still has super-admin direct writes. Kids public-read policy checks `published=true` but not `is_active=true`. Storage still has direct site-audio, video-assets, and legacy public-assets admin policies. Pending migrations harden these; none was applied.
- Default function ACLs still grant EXECUTE to `anon` and `authenticated` for defaults owned by `postgres` in `public`/`storage` and `supabase_admin` in `graphql`/`graphql_public`/`public`. The specific Kids share-count function is already service-role-only.
- Baseline production contracts verified read-only: `kids_games`, `kids_content`, `content_library`, `content_translation_queue`, and `admin_rate_limits` exist; `content_library.summary_en` exists; anon cannot SELECT `content_translation_queue`; service_role can read `admin_rate_limits`.
- Kids data: 65 rows, all published and active; 35 games, 3 quizzes, 26 stories, 1 wudu item. Every row has an age_group; 20 of 26 stories lack explicit `metadata.age_appropriate=true` and require editorial review. No data was edited.
- Supabase Advisors: Health clean; Security leaked-password protection disabled; Performance 79 unused-index INFO findings. No indexes were removed.
- SQL-only RLS, default-ACL, CHECK-constraint, and partial-index review remains owner-only. No production database, policy, index, function, or storage object was mutated.


## 2026-11-14T1157Z production migration/schema comparison — read-only

- Project `zqtssvlvmkzeeyqghqfk`: 439 local migrations, 418 remote, 21 local-only, 0 remote-only, 0 duplicate local versions. No migration was pushed or applied.
- The 21 local-only migrations are recorded in the immediately preceding migration ledger entry; all remain pending owner review and apply.
- Missing live contracts: `site_audio_upload_intents`; `background_reminder_preferences.timezone`; `youtube_sync_state.playlists`; `social_publish_queue_target_platforms_check`; `content_publish_queue_one_active_item` partial unique index. Existing social target arrays have zero invalid rows; active publish queue has zero duplicate pairs; background reminder preferences currently has zero rows.
- Direct admin RLS writes remain on Kids/video/social/site-audio tables; `admin_role_assignments` still permits super-admin direct writes; Kids public-read policy lacks `is_active=true`; direct site-audio/video/public-assets storage policies remain. Default function ACLs still grant EXECUTE to client roles for defaults owned by postgres/supabase_admin. Kids share-count function itself is service-role-only.
- Baseline tables/columns and anon denial for `content_translation_queue` were verified read-only. Kids live data: 65 rows all active/published; 35 games, 3 quizzes, 26 stories, 1 wudu item; all have age_group, but 20 stories lack explicit `metadata.age_appropriate=true`. No data edited.
- Supabase Advisors: Health clean; Security leaked-password protection disabled; Performance 79 unused-index INFO findings. No indexes or production resources were deleted.
