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
