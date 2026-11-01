# ZIKR File Status Matrix — 2026-11-01

## Scope

- Repository: `zikrofficial-X/Zikr`
- Inventory baseline: `9e429094ae9f296f1d2875d1d2a648148e7a7f9d`
- Files inventoried: **1491**
- This is the first-pass inventory required by Phase 1 of the platform repair plan.
- Statuses are conservative. No file is marked `UNUSED` or `DELETE CANDIDATE` without a verified dependency/reference trace.
- A classification of `ACTIVE` means the file is in an active runtime/configuration area; it does not by itself prove that every export is reachable.
- Applied Supabase migrations are immutable. Historical duplicates and compatibility mirrors are preserved.

## Status counts

| Status | Files |
|---|---:|
| ACTIVE / CI-CD | 17 |
| ACTIVE / DYNAMIC RUNTIME ENTRY | 27 |
| ACTIVE / EDGE FUNCTION | 8 |
| ACTIVE / FEATURE MODULE | 211 |
| ACTIVE / IMMUTABLE MIGRATION | 379 |
| ACTIVE / NATIVE PLATFORM | 75 |
| ACTIVE / ROOT CONFIG | 8 |
| ACTIVE / RUNTIME ENTRY | 251 |
| ACTIVE / SHARED RUNTIME | 58 |
| ACTIVE / SHARED UI | 40 |
| ACTIVE / STATIC ASSET | 69 |
| DOC | 145 |
| DUPLICATE / IMMUTABLE MIGRATION | 8 |
| LEGACY / COMPATIBILITY MIRROR | 1 |
| LEGACY / PRESERVE | 1 |
| REVIEW_REQUIRED | 90 |
| TEST | 29 |
| TEST / OPERATIONS | 74 |

## Required next-pass decisions

1. Trace imports, route registration, dynamic route consumers, worker invocations, workflow references, SQL dependencies, triggers, RPC callers, and storage paths.
2. Upgrade provisional statuses to `ACTIVE`, `LEGACY`, `DUPLICATE`, `UNUSED`, `DYNAMIC`, `TEST`, `DOC`, or `DELETE CANDIDATE` only when supported by evidence.
3. For every proposed deletion, record all references searched, runtime ownership, migration history, and rollback strategy.
4. Do not delete empty database tables or assets based only on zero-row/zero-reference observations.

## File-by-file inventory

| Path | First-pass status | Evidence / handling |
|---|---|---|
| `.circleci/config.yml` | ACTIVE / CI-CD | Automation workflow or CI configuration |
| `.env.example` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `.github/CODEOWNERS` | ACTIVE / CI-CD | Automation workflow or CI configuration |
| `.github/dependabot.yml` | ACTIVE / CI-CD | Automation workflow or CI configuration |
| `.github/workflows/android-native-login-test.yml` | ACTIVE / CI-CD | Automation workflow or CI configuration |
| `.github/workflows/circleci-config-validation.yml` | ACTIVE / CI-CD | Automation workflow or CI configuration |
| `.github/workflows/dispatch-android-release-recovery.yml` | ACTIVE / CI-CD | Automation workflow or CI configuration |
| `.github/workflows/english-content-sync.yml` | ACTIVE / CI-CD | Automation workflow or CI configuration |
| `.github/workflows/generate-ai-video.yml` | ACTIVE / CI-CD | Automation workflow or CI configuration |
| `.github/workflows/publish-android-release-assets.yml` | ACTIVE / CI-CD | Automation workflow or CI configuration |
| `.github/workflows/publish-social.yml` | ACTIVE / CI-CD | Automation workflow or CI configuration |
| `.github/workflows/quality-gate.yml` | ACTIVE / CI-CD | Automation workflow or CI configuration |
| `.github/workflows/reconcile-supabase-migration-history.yml` | ACTIVE / CI-CD | Automation workflow or CI configuration |
| `.github/workflows/release-finalization.yml` | ACTIVE / CI-CD | Automation workflow or CI configuration |
| `.github/workflows/release-vercel.yml` | ACTIVE / CI-CD | Automation workflow or CI configuration |
| `.github/workflows/storage-retention.yml` | ACTIVE / CI-CD | Automation workflow or CI configuration |
| `.github/workflows/supabase-production-health.yml` | ACTIVE / CI-CD | Automation workflow or CI configuration |
| `.github/workflows/supabase-restore-seed-data.yml` | ACTIVE / CI-CD | Automation workflow or CI configuration |
| `.gitignore` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `.prettierignore` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `.prettierrc` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `.release-tag` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `.vercelignore` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `AGENTS.md` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `BRAND_ASSETS_README.md` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `CLAUDE.md` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `DEPLOYMENT_CHECKLIST.md` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `DOCUMENTATION_INDEX.md` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `PROJECT_STATUS.md` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `README.md` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `RELEASE_STATUS.md` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `SECURITY.md` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `TODO.md` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `android/.gitignore` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/.gitignore` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/build.gradle` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/capacitor.build.gradle` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/proguard-rules.pro` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/AndroidManifest.xml` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/java/com/zikr/app/MainActivity.java` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/drawable-land-hdpi/splash.png` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/drawable-land-mdpi/splash.png` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/drawable-land-xhdpi/splash.png` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/drawable-land-xxhdpi/splash.png` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/drawable-land-xxxhdpi/splash.png` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/drawable-port-hdpi/splash.png` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/drawable-port-mdpi/splash.png` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/drawable-port-xhdpi/splash.png` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/drawable-port-xxhdpi/splash.png` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/drawable-port-xxxhdpi/splash.png` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/drawable/ic_launcher_background.xml` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/drawable/ic_launcher_foreground.png` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/drawable/ic_stat_zikr.xml` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/drawable/splash.xml` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/layout/activity_main.xml` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/mipmap-hdpi/ic_launcher.png` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/mipmap-mdpi/ic_launcher.png` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/raw/adhan.wav` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/raw/adhan_01_charon.wav` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/raw/adhan_02_algieba.wav` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/raw/adhan_03_enceladus.wav` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/raw/adhan_04_iapetus.wav` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/raw/adhan_05_alnilam.wav` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/raw/adhan_alt.mp3` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/raw/salawat.wav` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/values/colors.xml` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/values/strings.xml` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/values/styles.xml` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/xml/file_paths.xml` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/app/src/main/res/xml/network_security_config.xml` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/build.gradle` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/capacitor.settings.gradle` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/gradle.properties` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/gradle/wrapper/gradle-wrapper.jar` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/gradle/wrapper/gradle-wrapper.properties` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/gradlew` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/gradlew.bat` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/settings.gradle` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `android/variables.gradle` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `capacitor.config.json` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `components.json` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `docs/ADMIN_REORGANIZATION_PLAN_2026-10-30.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/ADSENSE_REVIEW_2026-10-15.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/ARCHITECTURE.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/AUTH_SYSTEM_GUIDE.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/AUTOMATION_OWNERSHIP_2026-10-08.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/CANONICAL_AUTH_CONFIG.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/CI_CD_ARCHITECTURE_2026_10_08.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/CI_CD_WORKFLOWS_REVIEW_2026_10_08.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/DATABASE_SCHEMA_INDEX.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/DEPLOYMENT_GUIDE.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/ENABLE_GOOGLE_OAUTH.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/ENVIRONMENT_GOVERNANCE_2026-10-08.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/GITHUB_AI_VIDEO.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/GITHUB_AUTOMATION_AUDIT_2026-10.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/GITHUB_VERCEL_SUPABASE_SYNC.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/INFRASTRUCTURE_AUDIT_2026-10-30.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/KIDS_GAME_ASSETS.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/LAUNCH_CHECKLIST.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/LOCAL_NATIVE_BACKFILL.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/MASTER_GROWTH_RENEWAL_PLAN_2026-10-20.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/MIGRATION_DUPLICATE_POLICY.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/NATIVE_BACKFILL_STATUS.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/NEXT_PROGRAMMING_PHASE_PLAN_2026-10-30.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/OAUTH_FIX_NOTES.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/OFFLINE_SUPPORT.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/README_RELEASE.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/SOURCE_OF_TRUTH.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/SUPABASE_FREE_MIGRATION_FINAL_2026-09-29.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/TROUBLESHOOTING.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/VERCEL_GIT_IDENTITY.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/VIDEO_AUTOMATION_FIXES_2026_10_08.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/VIDEO_PUBLISHING_GUIDE.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/YOUTUBE_TAKEOUT_NATIVE_BACKFILL.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/admin/ADMIN_CONSOLE_GOVERNANCE.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/admin/ADMIN_ROLLOUT_CHECKLIST.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/api/README.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/api/openapi.yaml` | DOC | Project documentation; freshness and ownership review required |
| `docs/api/postman_collection.json` | DOC | Project documentation; freshness and ownership review required |
| `docs/apk-github-release-plan.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/apply-verified-content-pack.json` | DOC | Project documentation; freshness and ownership review required |
| `docs/archive/AUDIT_2026_10_08_BASELINE.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/archive/CONTENT_AND_PAGES_AUDIT_20260929.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/archive/CONTENT_DATABASE_AUDIT_20260929.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/archive/DEPLOYMENT_READY_CHECKLIST.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/archive/FINAL_DELIVERY_SUMMARY_v1.1.0.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/archive/IMPLEMENTATION_GUIDE_KIDS_ENHANCEMENT_v1.1.0.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/archive/KIDS_GAMES_3.0_AUDIT.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/archive/KIDS_GAMES_COMPREHENSIVE_AUDIT.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/archive/KIDS_GAMES_IMPLEMENTATION_v1.1.0.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/archive/KIDS_SECTION_AUDIT_v1.1.0.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/archive/KIDS_SECTION_ENHANCEMENT_SUMMARY.txt` | DOC | Project documentation; freshness and ownership review required |
| `docs/archive/MIGRATION_HANDOFF_20260920.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/archive/NATIVE_YOUTUBE_FACEBOOK_PHASE1.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/archive/PROJECT_AUDIT_REPORT.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/archive/PROJECT_STATUS_v1.1.0_FINAL.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/archive/README.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/archive/SUPABASE_MIGRATION_AUDIT_OLD_2026-09-29.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/archive/migration-parity-2026-09-01.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/archive/release-ci-fix-v1.3.2.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/archive/release-status-1.4.2.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/assets-guide.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/audio/HUMAN_AUDIO_LIBRARY_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/background-jobs.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/branding/identity-rollout.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/circleci-supabase-environment.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/closeout/ZIKR_ALL_PLANS_CLOSEOUT_2026-10-30.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/companion-scholar-source-notes-2026-08-22.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/controlled-release.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/daily-content-operations.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/deployment-sync.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/e2e-test-report-2026-10-15.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/environment-variables.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/facebook-oauth-reconnection.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/facebook-page-verification-2026-08-22.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/ANDROID_RELEASE_RECOVERY.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/DATA_LIFECYCLE_MANIFEST_2026-10-02.json` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/DEPRECATION_MATRIX_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_0_1_BASELINE_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_0_1_FILE_INVENTORY_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_10_CHECKPOINT_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_10_VIDEO_FACTORY_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_11_AI_VISUAL_FACTORY_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_11_CHECKPOINT_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_12_CHECKPOINT_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_12_VIDEO_QA_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_13_CHECKPOINT_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_13_SCHEDULER_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_14_CHECKPOINT_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_14_SOCIAL_PUBLISHING_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_15_ADMIN_VIDEO_FACTORY_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_15_CHECKPOINT_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_15_KIDS_PRODUCTION_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_16_23_MASTER_PLAN_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_16_ADMIN_ROUTE_HARDENING_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_17_DATA_LIFECYCLE_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_18_DB_RETIREMENT_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_19_INDEX_GOVERNANCE_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_20_ASSET_HYGIENE_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_21_TEST_QA_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_22_RELEASE_CLOSURE_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_2_ARCHITECTURE_MAP_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_2_CHECKPOINT_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_3_CHECKPOINT_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_3_DATABASE_CANONICALIZATION_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_4_CHECKPOINT_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_4_MIGRATION_RECONCILIATION_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_5_CHECKPOINT_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_5_ENVIRONMENT_RECONCILIATION_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_6_CHECKPOINT_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_6_SECURITY_HARDENING_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_7_CHECKPOINT_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_7_CONTENT_CANONICALIZATION_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_8_CHECKPOINT_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_8_QURAN_CANONICALIZATION_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_9_CHECKPOINT_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PHASE_9_VOICE_FACTORY_2026-10-02.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PRODUCTION_HARDENING_2026-10-04.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/PRODUCTION_RELEASE.flag` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/RELEASE_RETRY.flag` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/ZIKR_ALL_PLANS_CLOSEOUT_2026-10-30.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/android-release-recovery-run-v1.1.3.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/finalization/preview-payload-and-ci-fallback-20261009.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/google-search-console-verification.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/kids-content-editorial-audit-2026-10-21.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/kids-video-series-free-factory.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/kids-world-evolution-roadmap.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/kids-world.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/native-oauth-fix.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/production-scheduling.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/releases/1.1.1.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/releases/1.1.10.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/releases/1.1.2.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/releases/1.1.3.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/releases/1.1.4.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/releases/1.1.5.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/releases/1.1.6.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/releases/1.1.7.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/releases/1.1.8.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/releases/1.1.9.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/releases/v1.1.0.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/secure-apk-release-protection-plan.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/short-prophet-stories-inspection-2026-08-18.txt` | DOC | Project documentation; freshness and ownership review required |
| `docs/skill-search-zikr-2026-08-18.json` | DOC | Project documentation; freshness and ownership review required |
| `docs/supabase-remediation-evidence-2026-08-15.md` | DOC | Project documentation; freshness and ownership review required |
| `docs/zikr-security-hardening-and-apk-plan.md` | DOC | Project documentation; freshness and ownership review required |
| `eslint.config.mjs` | ACTIVE / ROOT CONFIG | Build, runtime, or deployment configuration |
| `ios/.gitignore` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `ios/App/App.xcodeproj/project.pbxproj` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `ios/App/App.xcworkspace/xcshareddata/IDEWorkspaceChecks.plist` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `ios/App/App/App.entitlements` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `ios/App/App/AppDelegate.swift` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `ios/App/App/Assets.xcassets/Contents.json` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `ios/App/App/Assets.xcassets/Splash.imageset/Contents.json` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-1.png` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-2.png` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `ios/App/App/Base.lproj/LaunchScreen.storyboard` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `ios/App/App/Base.lproj/Main.storyboard` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `ios/App/App/Info.plist` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `ios/App/App/Resources/adhan.wav` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `ios/App/App/Resources/adhan_alt.mp3` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `ios/App/App/Resources/salawat.wav` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `ios/App/Podfile` | ACTIVE / NATIVE PLATFORM | Mobile app/native configuration or source |
| `mobile/README.md` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `mobile/capacitor-dependencies.json` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `next-env.d.ts` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `next.config.ts` | ACTIVE / ROOT CONFIG | Build, runtime, or deployment configuration |
| `package.json` | ACTIVE / ROOT CONFIG | Build, runtime, or deployment configuration |
| `plan.md` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `pnpm-lock.yaml` | ACTIVE / ROOT CONFIG | Build, runtime, or deployment configuration |
| `pnpm-workspace.yaml` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `postcss.config.mjs` | ACTIVE / ROOT CONFIG | Build, runtime, or deployment configuration |
| `proxy.ts` | ACTIVE / ROOT CONFIG | Build, runtime, or deployment configuration |
| `public/ads.txt` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/apple-touch-icon.png` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/audio/adhan-01-charon.wav` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/audio/adhan-02-algieba.wav` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/audio/adhan-03-enceladus.wav` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/audio/adhan-04-iapetus.wav` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/audio/adhan-05-alnilam.wav` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/audio/adhan.mp3` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/audio/adhan.wav` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/audio/kids-adventure-theme.mp3` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/audio/kids-learning-theme.mp3` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/audio/kids-night-theme.mp3` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/audio/salawat.wav` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/banners/homepage/main-hero.svg` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/branding/brand-artwork.webp` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/branding/logo-gold.webp` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/branding/og-image.jpg` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/branding/pattern.svg` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/branding/zikr-brand-guidelines.md` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/data-deletion.html` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/favicon.ico` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/google3526c15e10fa1913.html` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/google6f7827292f8e19bc.html` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/icons/icon-192.png` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/icons/icon-192.svg` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/icons/icon-512-maskable.png` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/icons/icon-512.png` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/icons/icon-512.svg` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/kids/games/scene-moon-sky.webp` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/kids/games/scene-mosque-courtyard.webp` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/kids/games/scene-night-garden.webp` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/manus-routes.json` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/offline-content/v1/article_categories.json` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/offline-content/v1/articles.json` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/offline-content/v1/ayahs.json` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/offline-content/v1/battle_events.json` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/offline-content/v1/battles.json` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/offline-content/v1/companion_stories.json` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/offline-content/v1/companions.json` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/offline-content/v1/conquest_events.json` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/offline-content/v1/conquests.json` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/offline-content/v1/duas.json` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/offline-content/v1/hadith.json` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/offline-content/v1/hadith_books.json` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/offline-content/v1/kids.json` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/offline-content/v1/manifest.json` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/offline-content/v1/prophet_sections.json` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/offline-content/v1/prophets.json` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/offline-content/v1/scholars.json` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/offline-content/v1/stories.json` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/offline-content/v1/surahs.json` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/offline-content/v1/tafsir.json` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/offline-content/v2/routes.json` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/offline.html` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/quran/NOTICE.md` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/quran/manifest.json` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/quran/mushaf-hafs.json` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/sw.js` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/video/templates/calm.svg` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/video/templates/dawn.svg` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/video/templates/emerald.svg` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/video/templates/gold.svg` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/video/templates/kids-garden.svg` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/video/templates/kids-nature.svg` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/video/templates/kids-neighborhood.svg` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/video/templates/kids-workshop.svg` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/video/templates/night.svg` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/video/templates/paper.svg` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `public/video/templates/rose.svg` | ACTIVE / STATIC ASSET | Public runtime asset; reference/licensing review still required |
| `scripts/cleanup-supabase-storage.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/ensure-ffmpeg.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/export-offline-content.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/generate-arabic-voice.py` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/generate-ci-build-report.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/import-youtube-takeout-native-facebook.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/jobs/admin-queue-alerts.ts` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/jobs/content-publishing.ts` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/jobs/hf-space-video.py` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/jobs/social-publishing.ts` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/jobs/template-video-automation.ts` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/platform-route-baseline.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/prepare-mobile-assets.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/reconcile-supabase-migration-history.sh` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/run-background-jobs.ts` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/sync-hadith-english.ts` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/tests/admin-rbac-rls.test.mjs` | TEST | Automated test or test fixture |
| `scripts/tests/app-update-download.test.ts` | TEST | Automated test or test fixture |
| `scripts/tests/arabic-search-normalization.test.ts` | TEST | Automated test or test fixture |
| `scripts/tests/auth-password-security.test.ts` | TEST | Automated test or test fixture |
| `scripts/tests/contact-validation.test.ts` | TEST | Automated test or test fixture |
| `scripts/tests/facebook-reels-rate-limit.test.ts` | TEST | Automated test or test fixture |
| `scripts/tests/kids-action-games-localization.test.ts` | TEST | Automated test or test fixture |
| `scripts/tests/kids-asset-manifest.test.ts` | TEST | Automated test or test fixture |
| `scripts/tests/kids-content-manifest.test.ts` | TEST | Automated test or test fixture |
| `scripts/tests/kids-game-db-trigger.integration-setup.sql` | TEST | Automated test or test fixture |
| `scripts/tests/kids-game-db-trigger.integration.sh` | TEST | Automated test or test fixture |
| `scripts/tests/kids-game-db-trigger.integration.sql` | TEST | Automated test or test fixture |
| `scripts/tests/kids-game-result-validation.test.ts` | TEST | Automated test or test fixture |
| `scripts/tests/kids-game-runtime-contract.test.ts` | TEST | Automated test or test fixture |
| `scripts/tests/kids-gameplay-difficulty.test.ts` | TEST | Automated test or test fixture |
| `scripts/tests/kids-navigation.test.ts` | TEST | Automated test or test fixture |
| `scripts/tests/kids-timeout-safety.test.ts` | TEST | Automated test or test fixture |
| `scripts/tests/kids-video-series.test.ts` | TEST | Automated test or test fixture |
| `scripts/tests/kids-visual-contract.test.ts` | TEST | Automated test or test fixture |
| `scripts/tests/native-google-oauth-contract.test.mjs` | TEST | Automated test or test fixture |
| `scripts/tests/performance-index-contract.test.mjs` | TEST | Automated test or test fixture |
| `scripts/tests/phase21-games.test.ts` | TEST | Automated test or test fixture |
| `scripts/tests/prayer-times.test.ts` | TEST | Automated test or test fixture |
| `scripts/tests/production-smoke-contract.test.ts` | TEST | Automated test or test fixture |
| `scripts/tests/schema-contract.test.ts` | TEST | Automated test or test fixture |
| `scripts/tests/search-index-contract.test.ts` | TEST | Automated test or test fixture |
| `scripts/tests/storage-retention.test.mjs` | TEST | Automated test or test fixture |
| `scripts/tests/video-contract.test.ts` | TEST | Automated test or test fixture |
| `scripts/tests/video-publish-approval.test.ts` | TEST | Automated test or test fixture |
| `scripts/translate-published-articles-en.ts` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/validate-deployment-env.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/validate-migrations.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-admin-api-guards.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-admin-architecture.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-admin-governance.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-admin-module-registry.ts` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-admin-pages.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-admin-video-factory.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-adsense-readiness.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-ai-visual-factory.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-arabic-search.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-auth-config.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-canonical-config.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-ci-architecture.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-content-canonicalization.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-content-integrity.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-data-lifecycle.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-gemini-audio.ts` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-google-search-console.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-hygiene.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-image-assets.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-information-architecture.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-kids-games-final.ts` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-kids-hilal-fly.ts` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-kids-memory.ts` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-kids-mosque-adventure.ts` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-kids-production.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-kids-quiz.ts` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-kids-verse.ts` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-kids-video-factory.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-kids-wudu.ts` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-kids-zikr-jump.ts` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-kids-zikr-road.ts` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-local-imports.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-local-quran.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-migration-duplicates.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-mobile-navigation.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-mobile-readiness.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-offline-content.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-placeholder-media.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-platform-routes.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-production-smoke.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-project-integrity.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-quran-canonicalization.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-quran-offline.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-release-contract.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-release-metadata.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-scheduler.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-security-hardening.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-social-publishing.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-supabase-db-url.py` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-supabase-production.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-video-factory.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-video-qa.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-video-queue-priority.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/verify-voice-factory.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `scripts/video-engine-check.mjs` | TEST / OPERATIONS | Build, validation, maintenance, or operational script; invocation traced in a later pass |
| `src/app/.well-known/apple-app-site-association/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/.well-known/assetlinks.json/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/about/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/about/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/adhkar/error.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/adhkar/layout.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/adhkar/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/adhkar/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/features/admin/video-studio/components/admin-video-studio-client.tsx` | ACTIVE / FEATURE MODULE | Imported by canonical `/admin/video/studio`; route-independent client UI |
| `src/app/admin/ai-video/curated/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/ai-video/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/alerts/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/analytics/analytics-dashboard.tsx` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `src/app/admin/analytics/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/android/actions.ts` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `src/app/admin/android/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/audio/adhan/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/audio/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/audio/quran/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/audio/site-audio/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/audio/tts/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/audit/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/automation/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/battles/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/categories/actions.ts` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `src/app/admin/categories/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/content-actions.ts` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `src/app/admin/content/content-console.tsx` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `src/app/admin/content/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/control/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/editorial-actions.ts` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `src/app/admin/editorial/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/error.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/health/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/kids/actions.ts` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `src/app/admin/kids/analytics/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/kids/assets/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/kids/content/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/kids/games/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/kids/levels/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/kids/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/knowledge/actions.ts` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `src/app/admin/knowledge/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/layout.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/library/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/media/media-client.tsx` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `src/app/admin/media/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/not-found.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/notifications/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/prophets/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/queues/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/release/actions.ts` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `src/app/admin/release/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/search/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/sections/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/sections/sections-client.tsx` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `src/app/admin/security/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/security/step-up/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/seo/actions.ts` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `src/app/admin/seo/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/settings/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/site-audio/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/social/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/social/social-client.tsx` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `src/app/admin/social/youtube-import/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/sources/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/system-actions.ts` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `src/app/admin/users/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/video-factory/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/video-factory/publishing/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/video-factory/qa/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/video-factory/queue/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/video-factory/scheduler/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/video-factory/scripts/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/video-factory/sources/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/video-factory/templates/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/video-factory/visuals/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/video-factory/voices/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/video/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/video/requests/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/video/studio/curated/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/video/studio/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/admin/videos/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/features/admin/video-requests/components/admin-video-requests-client.tsx` | ACTIVE / FEATURE MODULE | Imported by canonical `/admin/video/requests`; route-independent client UI |
| `src/app/api/admin/analytics/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/admin/cloudinary/image/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/admin/content/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/admin/media/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/admin/overview/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/admin/page-view/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/admin/sections/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/admin/site-audio/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/admin/site-audio/upload/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/admin/social/facebook/callback/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/admin/social/facebook/connect/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/admin/social/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/admin/video-generation/narration-upload/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/admin/video-generation/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/admin/video-generation/sources/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/admin/videos/[id]/retry/route.ts` | ACTIVE / DYNAMIC RUNTIME ENTRY | Dynamic route or segment; verify route contract |
| `src/app/api/admin/videos/[id]/route.ts` | ACTIVE / DYNAMIC RUNTIME ENTRY | Dynamic route or segment; verify route contract |
| `src/app/api/admin/videos/create/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/admin/videos/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/admin/videos/upload/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/admin/youtube-facebook/register-media/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/admin/youtube-facebook/upload-url/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/app-version/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/auth/profile-sync/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/contact/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/content/articles/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/content/companions/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/content/prophets/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/content/stats/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/content/stories/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/content/videos/[slug]/route.ts` | ACTIVE / DYNAMIC RUNTIME ENTRY | Dynamic route or segment; verify route contract |
| `src/app/api/download/android/aab/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/download/android/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/duas/categories/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/duas/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/geocode/reverse/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/hadith/books/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/health/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/internal/youtube-facebook/cleanup-media/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/kids/content/[slug]/route.ts` | ACTIVE / DYNAMIC RUNTIME ENTRY | Dynamic route or segment; verify route contract |
| `src/app/api/kids/content/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/kids/games/achievements/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/kids/games/progress/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/kids/games/score/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/kids/games/submit-result/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/kids/games/validate/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/kids/games/verse/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/kids/track-share/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/poetry-insight/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/prayer-location/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/prayer-times/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/push/public-key/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/push/subscription/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/quran/audio/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/quran/reciters/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/quran/surahs/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/reminders/background/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/search/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/site-audio/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/site-settings/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/storage/presign/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/tawasheeh/categories/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/tawasheeh/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/user/favorites/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/user/notifications/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/api/user/profile/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/articles/[slug]/layout.tsx` | ACTIVE / DYNAMIC RUNTIME ENTRY | Dynamic route or segment; verify route contract |
| `src/app/articles/[slug]/page.tsx` | ACTIVE / DYNAMIC RUNTIME ENTRY | Dynamic route or segment; verify route contract |
| `src/app/articles/error.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/articles/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/articles/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/audio/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/auth/actions.ts` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `src/app/auth/callback/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/auth/forgot/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/auth/google/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/auth/layout.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/auth/login/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/auth/register/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/auth/reset/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/battles/[slug]/page.tsx` | ACTIVE / DYNAMIC RUNTIME ENTRY | Dynamic route or segment; verify route contract |
| `src/app/battles/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/battles/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/companions/[slug]/page.tsx` | ACTIVE / DYNAMIC RUNTIME ENTRY | Dynamic route or segment; verify route contract |
| `src/app/companions/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/companions/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/competitions/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/competitions/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/conquests/[slug]/page.tsx` | ACTIVE / DYNAMIC RUNTIME ENTRY | Dynamic route or segment; verify route contract |
| `src/app/conquests/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/conquests/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/contact/layout.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/contact/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/contact/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/content/[slug]/page.tsx` | ACTIVE / DYNAMIC RUNTIME ENTRY | Dynamic route or segment; verify route contract |
| `src/app/data-deletion/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/dua/[slug]/layout.tsx` | ACTIVE / DYNAMIC RUNTIME ENTRY | Dynamic route or segment; verify route contract |
| `src/app/dua/[slug]/page.tsx` | ACTIVE / DYNAMIC RUNTIME ENTRY | Dynamic route or segment; verify route contract |
| `src/app/dua/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/dua/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/duas/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/editorial-policy/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/error.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/faq/layout.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/faq/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/faq/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/favorites/actions.ts` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `src/app/favorites/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/favorites/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/globals.css` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `src/app/hadith/[book]/[id]/page.tsx` | ACTIVE / DYNAMIC RUNTIME ENTRY | Dynamic route or segment; verify route contract |
| `src/app/hadith/[book]/page.tsx` | ACTIVE / DYNAMIC RUNTIME ENTRY | Dynamic route or segment; verify route contract |
| `src/app/hadith/error.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/hadith/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/hadith/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/kids/[slug]/layout.tsx` | ACTIVE / DYNAMIC RUNTIME ENTRY | Dynamic route or segment; verify route contract |
| `src/app/kids/[slug]/page.tsx` | ACTIVE / DYNAMIC RUNTIME ENTRY | Dynamic route or segment; verify route contract |
| `src/app/kids/achievements/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/kids/adventures/layout.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/kids/adventures/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/kids/audio/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/kids/games/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/kids/layout.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/kids/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/kids/parent-dashboard/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/kids/progress/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/kids/puzzle/layout.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/kids/puzzle/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/knowledge/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/layout.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/library/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/llms.txt/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/manifest.ts` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `src/app/memorization/actions.ts` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `src/app/memorization/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/memorization/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/memorization/progress-tracker.tsx` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `src/app/memorization/voice-recorder.tsx` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `src/app/mushaf/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/not-found.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/offline-library/offline-library-client.tsx` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `src/app/offline-library/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/platform/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/platform/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/poetry/layout.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/poetry/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/poetry/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/prayer-times/error.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/prayer-times/layout.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/prayer-times/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/prayer-times/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/privacy/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/privacy/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/profile/avatar-actions.ts` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `src/app/profile/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/profile/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/prophets/[slug]/layout.tsx` | ACTIVE / DYNAMIC RUNTIME ENTRY | Dynamic route or segment; verify route contract |
| `src/app/prophets/[slug]/page.tsx` | ACTIVE / DYNAMIC RUNTIME ENTRY | Dynamic route or segment; verify route contract |
| `src/app/prophets/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/prophets/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/qibla/layout.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/qibla/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/qibla/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/quran/[surah]/[ayah]/page.tsx` | ACTIVE / DYNAMIC RUNTIME ENTRY | Dynamic route or segment; verify route contract |
| `src/app/quran/[surah]/page.tsx` | ACTIVE / DYNAMIC RUNTIME ENTRY | Dynamic route or segment; verify route contract |
| `src/app/quran/error.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/quran/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/quran/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/radio/layout.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/radio/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/radio/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/reciters/[slug]/layout.tsx` | ACTIVE / DYNAMIC RUNTIME ENTRY | Dynamic route or segment; verify route contract |
| `src/app/reciters/[slug]/page.tsx` | ACTIVE / DYNAMIC RUNTIME ENTRY | Dynamic route or segment; verify route contract |
| `src/app/reciters/layout.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/reciters/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/reciters/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/robots.ts` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `src/app/scholars/[slug]/page.tsx` | ACTIVE / DYNAMIC RUNTIME ENTRY | Dynamic route or segment; verify route contract |
| `src/app/scholars/layout.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/scholars/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/scholars/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/search/layout.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/search/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/search/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/sections/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/settings/layout.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/settings/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/sitemap-content/[id]/route.ts` | ACTIVE / DYNAMIC RUNTIME ENTRY | Dynamic route or segment; verify route contract |
| `src/app/sitemap-index.xml/route.ts` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/sitemap.ts` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `src/app/spiritual-ai/actions.ts` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `src/app/spiritual-ai/layout.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/spiritual-ai/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/spiritual-ai/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/stories/[slug]/page.tsx` | ACTIVE / DYNAMIC RUNTIME ENTRY | Dynamic route or segment; verify route contract |
| `src/app/stories/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/stories/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/tafsir/layout.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/tafsir/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/tafsir/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/tasbeeh/layout.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/tasbeeh/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/tasbeeh/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/tawasheeh/layout.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/tawasheeh/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/tawasheeh/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/terms/layout.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/terms/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/terms/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/videos/[slug]/layout.tsx` | ACTIVE / DYNAMIC RUNTIME ENTRY | Dynamic route or segment; verify route contract |
| `src/app/videos/[slug]/page.tsx` | ACTIVE / DYNAMIC RUNTIME ENTRY | Dynamic route or segment; verify route contract |
| `src/app/videos/error.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/videos/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/videos/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/wird/actions.ts` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `src/app/wird/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/youtube/loading.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/youtube/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/app/zakat/page.tsx` | ACTIVE / RUNTIME ENTRY | Application page, API, or layout entry |
| `src/components/audio/audio-library.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/content/content-guide.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/content/content-references.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/content/editorial-depth.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/content/editorial-utility-depth.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/layout/adsense.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/layout/analytics.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/layout/app-update-checker.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/layout/auth-nav-actions.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/layout/deferred-analytics.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/layout/deferred-runtime.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/layout/footer.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/layout/google-funding-choices.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/layout/install-prompt.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/layout/language-aware-nav.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/layout/language-provider.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/layout/language-toggle.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/layout/mobile-nav.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/layout/native-capacitor-bridge-loader.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/layout/native-capacitor-bridge.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/layout/native-google-oauth-handler.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/layout/navbar.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/layout/notification-permission-banner.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/layout/offline-navigation-guard.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/layout/prayer-alert-provider.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/layout/runtime-effects.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/layout/service-worker-register.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/layout/site-shell.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/media/resilient-profile-image.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/platform/android-release-card.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/ui/Logo.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/ui/badge.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/ui/button.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/ui/card.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/ui/container.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/ui/input.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/ui/page-error.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/ui/page-skeleton.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/ui/progress.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/components/ui/section-header.tsx` | ACTIVE / SHARED UI | Shared UI implementation; usage tracing still to be verified |
| `src/features/adhkar/components/adhkar-page.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/admin/actions/users.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/admin/actions/video.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/admin/components/admin-breadcrumbs.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/admin/components/admin-command-palette.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/admin/components/admin-live-queue-dashboard.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/admin/components/admin-module-directory.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/admin/components/admin-page-view-tracker.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/admin/components/admin-platform-command-center.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/admin/components/admin-section-hub.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/admin/components/admin-sidebar.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/admin/components/admin-step-up.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/admin/components/audio-choice-field.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/admin/components/cloudinary-image-upload-field.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/admin/components/role-permissions-matrix.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/admin/components/site-audio-manager.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/admin/components/users-table.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/admin/components/video-upload-field.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/admin/config/modules.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/admin/config/navigation.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/admin/services/admin.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/admin/services/analytics.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/admin/services/audit.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/admin/services/battles.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/admin/services/content.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/admin/services/knowledge.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/admin/services/permissions.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/admin/services/platform.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/admin/services/prophets.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/admin/services/rate-limit.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/admin/services/safe-read.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/admin/services/security.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/admin/services/youtube.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/articles/data/adsense-editorial.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/articles/data/articles.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/articles/data/extended-editorial.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/articles/data/fallback.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/articles/data/longform-editorial.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/articles/services/articles.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/articles/types/articles.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/audio/data/tawasheeh-fallback.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/audio/services/radio.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/audio/services/site-audio.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/audio/services/tawasheeh.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/auth/actions.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/auth/components/forgot-password-page.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/auth/components/google-oauth-button.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/auth/components/login-page.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/auth/components/register-page.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/auth/components/reset-password-page.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/auth/integrations/google-oauth.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/battles/services/battles.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/battles/types/battles.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/companions/data/fallback.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/companions/services/companions.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/companions/types/companions.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/companions/utils/companions.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/competitions/data/fallback.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/competitions/types.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/conquests/data/conquests-detail-fallback-extended.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/conquests/data/conquests-detail-fallback.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/conquests/data/conquests-fallback.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/conquests/services/conquests.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/contact/rate-limit-identity.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/contact/services/contact.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/contact/services/rate-limit.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/contact/validation.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/content-library/services/content-library.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/content/services/stats.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/dua/data/fallback.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/dua/services/dua.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/dua/types/dua.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/favorites/services/favorites.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/hadith/data/fallback.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/hadith/services/hadith.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/hadith/types/hadith.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/home/components/home-interactive.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/kids/components/games/game-shell.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/kids/components/games/games-index.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/kids/components/games/kids-action-adventure.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/kids/components/games/kids-action-runner-road.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/kids/components/games/kids-game-art.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/kids/components/games/kids-game-kit.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/kids/components/games/kids-game-motion.css` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/kids/components/games/kids-game-visuals.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/kids/components/games/kids-learning-games.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/kids/components/games/kids-letter-lab.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/kids/components/games/kids-values-coloring.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/kids/components/games/progress-dashboard.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/kids/components/games/use-managed-timeouts.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/kids/components/games/world-game-stage.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/kids/components/kids-achievements-board.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/kids/components/kids-audio-hub.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/kids/components/kids-quiz.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/kids/components/kids-section-navigation.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/kids/components/kids-share.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/kids/data/audio-client.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/kids/data/audio.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/kids/data/content.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/kids/data/games-enhanced.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/kids/data/games-index.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/kids/data/games-levels-enhanced.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/kids/data/navigation.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/kids/data/stories.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/kids/services/games.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/kids/services/kids-content.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/media/services/cloudinary-validation.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/media/services/cloudinary.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/media/services/media-assets.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/memorization/services/progress.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/notifications/services/notifications.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/notifications/services/quran-reminder.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/notifications/services/user-notifications.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/offline/components/offline-indicator.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/offline/hooks/use-offline-data.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/offline/hooks/use-offline-status.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/poetry/data/fallback.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/poetry/services/poetry-insight.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/prayer/components/adhan-player.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/prayer/components/prayer-times-page.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/prayer/hooks/use-adhan-player.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/prayer/hooks/use-prayer-alert.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/prayer/hooks/use-prayer-times.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/prayer/services/prayer-times.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/prayer/services/saved-prayer-location.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/profile/components/avatar-upload.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/profile/components/profile-local-settings.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/profile/services/profile.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/prophets/data/fallback.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/prophets/services/prophets.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/prophets/types/prophets.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/qibla/components/qibla-page.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/qibla/services/qibla.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/quran/actions.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/quran/components/audio-player.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/quran/components/bookmark-button.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/quran/components/continue-reading-banner.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/quran/components/mark-surah-read.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/quran/components/mushaf-bookmark.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/quran/components/quran-auth-banner.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/quran/components/quran-catalog-page.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/quran/components/quran-page-header.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/quran/components/reading-progress-card.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/quran/components/surah-search.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/quran/components/surah-skeleton.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/quran/components/tafsir-library.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/quran/components/wird-dashboard.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/quran/data/fallback.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/quran/hooks/use-quran-wird.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/quran/services/offline-audio.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/quran/services/quran-client.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/quran/services/quran-server.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/quran/services/quran.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/quran/services/reading-progress.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/quran/types/quran.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/quran/utils/quran-progress.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/quran/utils/surah-mapping.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/quran/utils/surah-names.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/releases/android-download-url.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/releases/services/github-android-release.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/releases/services/github-release-manager.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/reminders/hooks/use-dhikr-reminder.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/reminders/hooks/use-salawat-reminder.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/reminders/services/reminder-preferences.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/scholars/components/scholars-page.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/scholars/data/fallback.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/scholars/services/scholars.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/scholars/types/scholars.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/search/services/search.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/site-content/services/site-content.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/social/integrations/facebook.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/social/services/facebook-credentials.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/social/services/facebook-reels-rate-limit.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/social/services/native-social-sync.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/social/services/social-publishing.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/spiritual-ai/services/ai.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/spiritual-ai/services/gemini-client.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/spiritual-ai/services/policy.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/spiritual-ai/services/retriever.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/stories/data/fallback.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/stories/services/stories.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/stories/types/stories.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/tasbeeh/components/tasbeeh-page.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/tasbeeh/services/tasbeeh.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/videos/components/youtube-feed-card.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/videos/data/curated-content.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/videos/data/fallback.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/videos/data/kids-story-factory.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/videos/data/verified-content.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/videos/integrations/youtube.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/videos/providers/ai-visual-policy.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/videos/providers/comfyui-provider.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/videos/providers/content-hash.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/videos/providers/free-api-provider.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/videos/providers/hf-space-provider.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/videos/providers/provider-router.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/videos/providers/template-provider.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/videos/providers/types.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/videos/services/narration-quality.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/videos/services/render-duration.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/videos/services/video-automation.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/videos/services/video-publish-approval.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/videos/services/video-sources.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/videos/services/videos.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/videos/services/voice-profiles.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/videos/types/videos.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/wird/services/progress.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/zakat/components/zakat-dashboard.tsx` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/features/zakat/hooks/use-zakat-reminder.ts` | ACTIVE / FEATURE MODULE | Feature implementation; import/dependency reachability still to be verified |
| `src/lib/audio/config.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/audio/curated-library.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/audio/spiritual-tones.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/auth-enhanced.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/content-quality.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/data/content-merge.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/env.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/games/asset-manifest.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/games/content-manifest.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/games/game-instructions.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/games/game-missions.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/games/game-runner.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/games/gameplay-helpers.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/games/good-deeds.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/games/hilal-fly.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/games/kids-level-system.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/games/mosque-adventure.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/games/mosque-cleanup.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/games/offline-queue.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/games/registry.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/games/run-stats.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/games/search.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/games/tone-feedback.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/games/validation.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/games/verified-content.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/games/verse-puzzle.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/games/zikr-coloring.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/games/zikr-jump.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/games/zikr-road.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/games/zikr-runner.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/github/dispatch-workflow.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/i18n.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/i18n/server.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/location/reverse-geocode.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/navigation/catalog.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/offline-db.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/offline-pack.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/offline-settings.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/push-subscription.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/search/arabic-normalization.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/security/pwned-password.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/seo.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/services/api-health.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/services/http.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/services/storage.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/site.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/supabase/admin-rest.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/supabase/client.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/supabase/guard.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/supabase/middleware.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/supabase/server.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/types/common.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/types/prayer.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/types/supabase.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/types/video.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/utils.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/lib/utils/companions.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `src/styles/tokens.css` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `src/types/google-generative-ai.d.ts` | ACTIVE / SHARED RUNTIME | Shared runtime utility, hook, type, or data source |
| `supabase/REMOTE_MIGRATION_LEDGER.md` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/config.toml` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/functions/_shared/auth.ts` | ACTIVE / EDGE FUNCTION | Deployed Supabase function source; verify deployment hash separately |
| `supabase/functions/_shared/cors.ts` | ACTIVE / EDGE FUNCTION | Deployed Supabase function source; verify deployment hash separately |
| `supabase/functions/_shared/islamic-ai.ts` | ACTIVE / EDGE FUNCTION | Deployed Supabase function source; verify deployment hash separately |
| `supabase/functions/health/index.ts` | ACTIVE / EDGE FUNCTION | Deployed Supabase function source; verify deployment hash separately |
| `supabase/functions/prayer-notification-worker/deno.json` | ACTIVE / EDGE FUNCTION | Deployed Supabase function source; verify deployment hash separately |
| `supabase/functions/prayer-notification-worker/index.ts` | ACTIVE / EDGE FUNCTION | Deployed Supabase function source; verify deployment hash separately |
| `supabase/functions/source-verified-content-agent/index.ts` | ACTIVE / EDGE FUNCTION | Deployed Supabase function source; verify deployment hash separately |
| `supabase/functions/spiritual-ai/index.ts` | ACTIVE / EDGE FUNCTION | Deployed Supabase function source; verify deployment hash separately |
| `supabase/legacy_migrations/20260929_080000_kids_games_enhanced_content.sql` | LEGACY / PRESERVE | Legacy/archive source; preserve until migration/runtime dependencies are proven absent |
| `supabase/migration-notes-0019-safety-fixes.md` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations/20240705000001_archived_legacy.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20240705000002_archived_legacy.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20240705000003_archived_legacy.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20250705000001_archived_legacy.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20250705000002_rls_triggers_storage.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260530000000_0000_young_rattler.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260530000100_0001_wakeful_stepford_cuckoos.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260530000200_0002_noisy_nocturne.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260530000300_0003_glorious_vanisher.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260530000400_0004_phase2_auth_foundation.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260530000500_0005_phase3_content.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260530000600_0006_phase4_scholars_stories.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260530000700_0007_production_hardening.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260530000800_0008_rls_hardening.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260530000900_0009_admin_memorization_youtube.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260605000010_0010_missing_content_modules.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260607050808_0011_videos_and_categories.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260610000012_0012_prayer_times_system.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260610000013_0013_tawasheeh_and_reciters.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260610000014_0014_content_modules.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260630000015_0015_comprehensive_rls.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260630000017_0017_video_automation.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260704000016_0016_auto_profile_creation.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260704000018_0018_complete_missing_tables.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260705000000_0019_safety_fixes.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260705000014_0014_tawasheeh_seed_data.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260705000019_0019_safe_guards.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260705070523_archived_initial_schema.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260705070652_archived_rls_triggers_storage.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260706000020_0020_fts_catchall.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260710000001_video_error_columns.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260710000002_0021_drizzle_sync.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260807000001_google_oauth_profile_sync.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260807002000_0020_cancel_billing.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260807080425_20260807_fix_security_findings.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260807080459_20260807_revoke_explicit_execute_grants.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260807090000_20260807_restore_runtime_tables.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260807131440_revoke_execute_on_profile_trigger_functions.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260807131504_revoke_explicit_execute_on_profile_trigger_functions.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814120000_0033_atomic_kids_share_counter.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814121000_0034_lock_down_kids_share_rpc.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814122000_0035_reconcile_contacts_notification_column.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814123000_0036_harden_admin_rls_predicate.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814130000_0037_durable_heygen_jobs.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814140000_0038_harden_profiles_auth_integrity.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814141000_0039_restrict_profile_guard_execution.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814143626_add_missing_foreign_key_indexes.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814143804_optimize_rls_auth_initplans.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814143905_optimize_rls_jwt_initplans.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814153000_0040_restore_login_profile_timestamp.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814160000_prayer_push_scheduler.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814170000_0042_cleanup_duplicate_foreign_keys.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814180000_0043_scope_admin_policies.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814182908_cleanup_supabase_duplicates.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814183000_0044_explicit_internal_table_denies.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814190000_0045_background_dhikr_reminders.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814191947_cleanup_duplicate_content_policies.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814193230_video_processing_scheduler.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814214330_0046_video_assets_storage.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814215000_0047_hadith_metadata_columns.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814220001_seed_open_hadith_library.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814220002_seed_open_hadith_library.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814220003_seed_open_hadith_library.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814220004_seed_open_hadith_library.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814220005_seed_open_hadith_library.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814220006_seed_open_hadith_library.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814220007_seed_open_hadith_library.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814220008_seed_open_hadith_library.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814220009_seed_open_hadith_library.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814220010_seed_open_hadith_library.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814220450_seed_open_hadith_library_01.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814220507_seed_open_hadith_library_02.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814220522_seed_open_hadith_library_03.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814220538_seed_open_hadith_library_04.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814220555_seed_open_hadith_library_05.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814220612_seed_open_hadith_library_06.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814220631_seed_open_hadith_library_07.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814220647_seed_open_hadith_library_08.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814220703_seed_open_hadith_library_09.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814220720_seed_open_hadith_library_10.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814221000_seed_content_library.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814221014_seed_zikr_content_library.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814221746_0047_hadith_metadata_columns.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814221931_seed_zikr_content_library.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814222022_seed_zikr_content_library.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814222316_seed_zikr_content_library.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814222836_seed_open_hadith_library_01.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814222853_seed_open_hadith_library_02.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814222910_seed_open_hadith_library_03.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814222927_seed_open_hadith_library_04.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814222946_seed_open_hadith_library_05.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814223005_seed_open_hadith_library_06.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814223026_seed_open_hadith_library_07.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814223050_seed_open_hadith_library_08.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814223152_seed_open_hadith_library_09.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814223211_seed_open_hadith_library_10.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814224131_campaign_content_expansion_20260815.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814224329_general_content_expansion_20260815.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814224432_general_content_schema_compat_20260815.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814224556_companion_stories_expansion_20260815.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814224800_companion_stories_expansion_20260815.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814224845_companion_schema_compat_20260815.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814230001_seed_hadith_expansion_01.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814230002_seed_hadith_expansion_02.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814230003_seed_hadith_expansion_03.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814230004_seed_hadith_expansion_04.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814230005_seed_hadith_expansion_05.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814230006_seed_hadith_expansion_06.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814230007_seed_hadith_expansion_07.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814230008_seed_hadith_expansion_08.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814230009_seed_hadith_expansion_09.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814230010_seed_hadith_expansion_10.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260814235407_harden_legacy_admin_rpc.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260815004709_kids_adventure_library.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260815104409_harden_prayer_times_cache_rls.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260815104455_deduplicate_prayer_times_cache_policy.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260815113852_index_content_references.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260815114042_expand_companion_biographies.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260815115851_cleanup_multiple_permissive_policies.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260815120950_remove_video_categories_policy_overlap.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260815220000_campaign_content_expansion.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260815220500_general_content_schema_compat.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260815221000_general_content_expansion.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260815221500_companion_schema_compat.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260815222000_companion_stories_expansion.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260815223000_harden_legacy_admin_rpc.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260815235000_kids_adventure_library.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260817074018_quran_expansion_schema.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260817074038_quran_tafsir_expansion_01.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260817074103_quran_tafsir_expansion_02.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260817074131_quran_tafsir_expansion_03.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260817074153_quran_tafsir_expansion_04.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260817074216_quran_tafsir_expansion_05.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260817074237_quran_tafsir_expansion_06.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260817074304_quran_tafsir_expansion_07.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260817074324_quran_tafsir_expansion_08.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260817074342_quran_tafsir_expansion_09.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260817074401_quran_audio_expansion.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260817075255_quranic_duas_expansion.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260817075724_articles_expansion.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260817081135_hide_unverified_media.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260817113003_dhikr_quran_articles.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260817114548_reconcile_companion_biographies.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260817114822_index_scholar_biography_sources.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260817210802_expand_prophet_stories_from_quran.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260817210929_deduplicate_prophet_story_references.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260817211606_index_article_source_urls.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260817213201_fix_prophet_story_newlines.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260817213758_replace_literal_newlines.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260817220127_add_automation_dedup_keys.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260817222000_index_prophet_story_completeness.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260821175629_source_verified_content_agent.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260821175933_schedule_source_verified_content_agent.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260821192434_tawasheeh_verified_audio_expansion.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260822080822_verified_companions_scholars_content_pack_20260822.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260822081012_fix_verified_content_reference_shape_20260822.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260822081106_normalize_companion_reference_types_20260822.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260822200947_grant_profiles_authenticated_table_privileges.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260827175416_kids_game_results.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260827175605_optimize_kids_game_results_rls.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260827182800_kids_world_progress.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260827182831_seed_kids_world_games.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260827184319_kids_world_function_security.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260827184749_index_kids_achievement_fk.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260827185900_kids_world_secure_result_processor.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260828000000_site_audio_assets.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260828000001_youtube_feed_cache_history.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260828000002_site_audio_assets.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260828000003_youtube_feed_cache.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260828075228_harden_youtube_trigger_search_path.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260828111711_harden_youtube_trigger_search_path.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260901012050_harden_youtube_trigger_search_path_final.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260901034914_youtube_facebook_native_sync_phase2.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260901035110_youtube_facebook_sync_scheduler_auth.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260901035139_youtube_facebook_sync_state_seed.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260901041737_allow_direct_native_publish_without_storage.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260901043149_20260901090000_create_admin_actions_audit.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260901051927_youtube_facebook_backfill_cursor_and_retry.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260901051946_youtube_facebook_backfill_cursor_v2.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260901051951_youtube_facebook_sync_retry_safety.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260901052054_protect_social_sync_publication_state.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260901053058_add_youtube_facebook_media_import.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260901053451_add_youtube_facebook_media_cleanup_tracking.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260901053510_schedule_youtube_facebook_media_cleanup.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260901053559_schedule_youtube_facebook_media_cleanup.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260901055136_harden_admin_audit_rls_and_audio_fk_index.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260901055404_document_current_hardening_state.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260901090000_create_admin_actions_audit.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260901103753_content_hub_admin_library_20260901.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260901105000_rebuild_content_hub_schema.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260901105107_security_performance_hardening_20260901.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260901105124_dedupe_library_rls_select_policies_20260901.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260901120955_compatibility_media_assets.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260901123902_final_rls_security_cleanup.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260901124136_lock_admin_snapshot_rpc.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260901124303_remove_remaining_content_hub_policy_duplicates.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260901155000_remove_remaining_content_hub_policy_duplicates.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260901160256_relax_social_sync_processing_recovery_safely.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260901160713_social_sync_state_processing_guard_v2.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260901162000_move_pg_net_out_of_public.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260901162535_document_pg_net_public_schema_limit.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260901162840_document_pg_net_public_schema_limit_v2.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260901165051_reconcile_remote_migration_history_20260901.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260901194900_reconcile_remote_migration_history_20260901.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260904174702_restore_admin_actions_audit_table_20260904.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260905000000_reconcile_remote_migration_history_final.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260905013955_adsense_content_quality_hotfix_2026_09_05.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260905014003_adsense_content_depth_hotfix_2026_09_05.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260905190421_unified_admin_audit_immutable.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260905193000_unified_admin_audit_immutable.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260905195702_admin_platform_foundation_20260905.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260905201128_admin_security_controls_20260905.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260906164530_security_hardening_20260906.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260907022407_backfill_published_article_english_20260907.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260907050000_backfill_published_article_english_20260907.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260911021025_harden_social_video_reels_and_cleanup.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260911030000_harden_social_video_reels_and_cleanup_reconciliation.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260911031229_harden_social_video_reels_and_cleanup_reconciliation.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260911040038_harden_rls_policies_and_deduplicate_fts_indexes.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260911040944_relocate_pg_net_to_extensions.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260911150920_admin_rbac_assignments_v1.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260911154207_harden_admin_rls_and_indexes.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260911181500_admin_rbac_assignments_v1.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260911181501_harden_admin_rls_and_indexes.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260914065256_audit_indexes_20260914.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260914065331_repair_video_queue_indexes_20260914.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260914065344_repair_video_queue_heygen_index_20260914.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260914065607_repair_rest_request_defaults_20260914.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260914070033_reconcile_remote_migration_history_checkpoint_20260914.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260915004110_retire_vercel_video_processing_cron.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260919012921_cleanup_content_library_scaffolding.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260919012923_cleanup_quran_catalog_agent_queue.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260919013530_editorial_expansion_articles_20260919.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260919013633_editorial_expansion_stories_20260919.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260919020218_reconcile_remote_content_expansion_phase1.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260919020228_reconcile_remote_content_expansion_deterministic.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260919021149_reconcile_remote_content_catalog_phase2.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260919021225_reconcile_remote_editorial_expansion_phase2b.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260919021236_reconcile_remote_story_expansion_phase2.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260919021330_reconcile_remote_kids_content_expansion_phase2d.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260919021452_reconcile_remote_cleanup_subscription_legacy_column.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260919044739_reconcile_remote_retire_orphaned_legacy_tables.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260919045742_retire_orphaned_legacy_tables.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260919050000_content_expansion_phase1.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260919050125_remove_redundant_nonunique_indexes.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260919050332_remove_redundant_prefix_indexes.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260919051000_fix_content_expansion_deterministic_and_publish_approved_stories.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260919053408_canonical_quran_surah_counts_20260919.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260919060000_retire_orphaned_legacy_tables.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260919065535_quran_supabase_storage_20260919100000.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260929000000_quran_audio_external_source_status.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260929010000_seed_canonical_quran_catalog.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260929025052_quran_schema_compatibility_20260929.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260929035722_security_performance_hardening_20260929.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260929035746_tighten_video_category_public_read_20260929.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260929035802_deduplicate_video_admin_policies_20260929.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260929035817_revoke_public_profile_trigger_rpc_20260929.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260929035845_dedupe_exact_public_read_policies_20260929.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260929041121_scholars_catalog_expansion_20260929.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260929041133_normalize_scholar_categories_20260929.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260929042104_content_sources_articles_20260929.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260929042122_expand_fictional_story_records_20260929.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260929042147_expand_prophet_bios_and_references_20260929.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260929042156_expand_scholar_bios_20260929.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260929042215_expand_companion_profiles_20260929.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260929042234_content_source_quality_hardening_20260929.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260929042337_prophet_profile_depth_pass_20260929.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260929042442_prophet_short_profile_depth_20260929.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260929042450_companion_scholar_depth_followup_20260929.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260929042509_annotate_missing_hadith_grades_20260929.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260929044232_add_video_url_to_video_generation_requests_20260929.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260929045633_create_social_publish_queue_20260929.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260929062722_security_seo_hardening_20260929.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260929063916_revert_internal_table_policies_20260929.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20260929070000_070000_kids_games_modernization.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261001212603_video_pipeline_hardening_20261002.sql` | DUPLICATE / IMMUTABLE MIGRATION | Documented historical duplicate; preserve both ledger versions |
| `supabase/migrations/20261001214711_kids_games_schema_reconciliation_20261002.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261001221622_kids_games_history_repair.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261001230711_media_assets_legacy_compat.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261002000001_video_pipeline_hardening.sql` | DUPLICATE / IMMUTABLE MIGRATION | Documented historical duplicate; preserve both ledger versions |
| `supabase/migrations/20261002042321_expand_audio_kinds_and_repair_duplicate_kids_index.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261002042816_optimize_rls_auth_initplans_20261002.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261002042835_optimize_remaining_video_narrations_rls_20261002.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261002042917_editorial_content_expansion_20261002.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261002044747_harden_free_tier_view_and_function_search_path_20261002.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261002050101_verified_video_content_pack.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261002054010_finish_rls_overlap_cleanup_20261002.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261002054042_finish_admin_public_policy_merge_20261002.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261002065000_unified_videos_social_sync.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261002073929_phase6_security_hardening_20261002.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261002090000_verified_video_content_pack.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261002092943_retire_coordinated_legacy_subsystems_20261002.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261002093637_govern_retired_indexes_20261002.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261002100000_multi_provider_free_video_engine.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261002110000_consolidate_rls_policy_overlaps_20261002.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261002113000_scheduler_hardening_20261002.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261002114000_retire_dead_media_cleanup_cron_20261002.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261002125440_remote_history_marker_video_automation.sql` | DUPLICATE / IMMUTABLE MIGRATION | Documented historical duplicate; preserve both ledger versions |
| `supabase/migrations/20261002125451_remote_history_marker_video_automation.sql` | DUPLICATE / IMMUTABLE MIGRATION | Documented historical duplicate; preserve both ledger versions |
| `supabase/migrations/20261002130000_retire_coordinated_legacy_subsystems_20261002.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261002133000_govern_retired_indexes_20261002.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261002155139_android_release_control_seed.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261002155316_unified_videos_social_sync_20261002.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261002160000_video_automation_queue_defaults.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261002160440_human_audio_library_20261002.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261002170000_android_release_control_seed.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261002171223_offline_quran_profile_daily_reminders.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261002171549_content_hub_audio_cloudinary_seed_20261002.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261002172804_human_audio_library_expansion_20261002.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261002172917_server_only_deny_policies_20261002.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261002172946_index_unindexed_foreign_keys_20261002.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261002173000_content_hub_audio_cloudinary_seed_20261002.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261002174500_human_audio_library_expansion_20261002.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261002211738_20261003010000_kids_games_level_catalog.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261002212922_20261003030000_kids_games_gameplay_visual_catalog.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261003082439_content_translation_queue.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261003090000_content_translation_queue.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261004180228_reconcile_content_library_summary_en.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261004190000_content_library_summary_en.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261008014118_repoint_production_cron_to_current_project_v2.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261008015328_retire_obsolete_cleanup_cron.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261008015449_content_translation_queue.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261008015452_content_library_summary_en.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261008015534_harden_translation_queue_and_kids_timestamp_helpers.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261008030000_pause_unavailable_scheduler_workers.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261008050000_repoint_production_cron_to_current_project.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261008060000_retire_obsolete_cleanup_cron.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261008070000_harden_translation_queue_and_kids_timestamp_helpers.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261008074605_reconcile_social_sync_cron_and_child_rls.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261008080000_set_primary_admin_mohamed_alaa.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261008082029_20261008110000_restore_admin_rate_limit_contract.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261008082203_20261008120000_consolidate_duplicate_public_read_policies.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261008085309_20261008090000_tighten_rls_policy_role_scope_20261008.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261008085550_20261008091000_remove_articles_admin_policy_overlap.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261009054919_kids_games_client_write_hardening_20261009.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261009145051_android_releases_storage_bucket.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261009160001_quran_ayahs_seed_chunk_02.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261009160002_quran_ayahs_seed_chunk_03.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261009160003_quran_ayahs_seed_chunk_04.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261009160004_quran_ayahs_seed_chunk_05.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261009160005_quran_ayahs_seed_chunk_06.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261009160006_quran_ayahs_seed_chunk_07.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261009160007_quran_ayahs_seed_chunk_08.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261009160008_quran_ayahs_seed_chunk_09.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261009160009_quran_ayahs_seed_chunk_10.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261009160010_quran_ayahs_seed_chunk_11.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261009160011_quran_ayahs_seed_chunk_12.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261009160012_quran_ayahs_seed_chunk_13.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261009160013_quran_ayahs_seed_chunk_14.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261009180000_android_release_bucket_free_tier_limit.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261012200000_repoint_cron_to_zikrofficial_project.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261012210000_repoint_cron_to_connected_project.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261012220000_free_plan_cron_efficiency.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261014233233_retire_temporary_tafsir_seed_loader_access.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261015000001_reconcile_legacy_category_enum_labels.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261015020000_remove_duplicate_nonunique_indexes.sql` | DUPLICATE / IMMUTABLE MIGRATION | Documented historical duplicate; preserve both ledger versions |
| `supabase/migrations/20261015023317_remove_duplicate_nonunique_indexes.sql` | DUPLICATE / IMMUTABLE MIGRATION | Documented historical duplicate; preserve both ledger versions |
| `supabase/migrations/20261015024511_remove_redundant_prefix_indexes.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261015030550_seed_site_homepage_seo_social_defaults.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261015050000_secure_contact_submission.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261017100000_link_legacy_memory_content_to_runtime.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261017110000_sync_kids_game_metadata_versions.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261020224251_kids_games_level_catalog_extend_to_30.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261020234239_social_facebook_oauth_credentials.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261021094431_social_facebook_reels_rate_limit_cooldown.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261021200000_seed_letter_lab_kids_content.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261021235117_admin_analytics_and_content_scheduler.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261022003101_add_missing_foreign_key_indexes.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261022090000_add_letter_lab_to_kids_game_catalog.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261027200748_video_render_metrics.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261027212803_admin_queue_alert_deliveries.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261028112016_optimize_admin_queue_alert_rls_initplan.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261028112823_social_credentials_explicit_deny_policies.sql` | DUPLICATE / IMMUTABLE MIGRATION | Documented historical duplicate; preserve both ledger versions |
| `supabase/migrations/20261028112833_social_credentials_explicit_deny_policies.sql` | DUPLICATE / IMMUTABLE MIGRATION | Documented historical duplicate; preserve both ledger versions |
| `supabase/migrations/20261030043335_arabic_full_text_search_v2.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261030044153_arabic_search_surahs_and_content_library.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261030050000_admin_rbac_permission_scope.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261030070000_retire_runtime_optional_indexes.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261030071426_admin_queue_observability_indexes.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261030082626_expand_public_content_catalog_20261030.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261030090000_article_tags_and_english_search.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261030094823_content_depth_refresh_20261030.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261030100000_admin_public_rpc_invoker.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261030110000_foreign_key_supporting_indexes.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261030120000_remove_public_storage_listing_policies.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261030121229_video_storage_retention_rpc.sql` | LEGACY / COMPATIBILITY MIRROR | Remote ledger compatibility entry; preserve until ledger is deliberately reconciled |
| `supabase/migrations/20261030130000_video_storage_retention_rpc.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations/20261101090000_harden_kids_game_result_insert_contract.sql` | ACTIVE / IMMUTABLE MIGRATION | Applied migration history; do not edit or delete |
| `supabase/migrations_archive/20240705000001_create_category_type.sql` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations_archive/20240705000001_missing_tables.sql` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations_archive/20240705000002_seed_content.sql` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations_archive/20240705000003_fix_duplicate_migration.sql` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations_archive/20240705000003_seed_stories_articles.sql` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations_archive/20250705000001_initial_schema.sql` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations_archive/20250705000002_rls_triggers_storage.sql` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations_archive/20260530000000_0000_young_rattler.sql` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations_archive/20260530000100_0001_wakeful_stepford_cuckoos.sql` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations_archive/20260530000200_0002_noisy_nocturne.sql` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations_archive/20260530000300_0003_glorious_vanisher.sql` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations_archive/20260530000400_0004_phase2_auth_foundation.sql` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations_archive/20260530000500_0005_phase3_content.sql` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations_archive/20260530000600_0006_phase4_scholars_stories.sql` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations_archive/20260530000700_0007_production_hardening.sql` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations_archive/20260530000800_0008_rls_hardening.sql` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations_archive/20260530000900_0009_admin_memorization_youtube.sql` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations_archive/20260605000010_0010_missing_content_modules.sql` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations_archive/20260607050808_0011_videos_and_categories.sql` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations_archive/20260610000012_0012_prayer_times_system.sql` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations_archive/20260610000013_0013_tawasheeh_and_reciters.sql` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations_archive/20260610000014_0014_content_modules.sql` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations_archive/20260630000015_0015_comprehensive_rls.sql` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations_archive/20260630000017_0017_video_automation.sql` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations_archive/20260704000016_0016_auto_profile_creation.sql` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations_archive/20260704000018_0018_complete_missing_tables.sql` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations_archive/20260705000000_0019_safety_fixes.sql` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations_archive/20260705000014_0014_tawasheeh_seed_data.sql` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations_archive/20260705000019_0019_safe_guards.sql` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations_archive/20260705070523_initial_schema.sql` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations_archive/20260705070652_rls_triggers_storage.sql` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations_archive/20260706000020_0020_fts_catchall.sql` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations_archive/20260710000001_video_error_columns.sql` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations_archive/20260710000002_0021_drizzle_sync.sql` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `supabase/migrations_archive/README.md` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `tailwind.config.ts` | REVIEW_REQUIRED | No safe status assigned without dependency/reference tracing |
| `tsconfig.json` | ACTIVE / ROOT CONFIG | Build, runtime, or deployment configuration |
| `vercel.json` | ACTIVE / ROOT CONFIG | Build, runtime, or deployment configuration |
