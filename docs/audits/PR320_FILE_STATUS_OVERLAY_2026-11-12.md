# PR #320 file-status overlay — 2026-11-13

## Snapshot identity

- Repository: zikrofficial-X/Zikr
- PR: https://github.com/zikrofficial-X/Zikr/pull/320
- Branch: audit/zikr-kids-daily-priority-20261110
- Base: main@c4560d9ccb222bea5814cc4db32d4c3f1a2101b3
- Source-code checkpoint: 58ba74a709b96ff6017a0a0f3598c773c4ea3de5; recursive tree: a4be94f5eb0d37cb9bcbda51c1cedbe8feea517c.
- Current branch head before this overlay-only correction: b47ca152ab98bac101391ff01b0dceb0969a3770. The preceding documentation reconciliation was commit b47ca152ab98bac101391ff01b0dceb0969a3770.
- Branch inventory after adding the branch manifest: 2,266 entries (1,769 files, 497 directories). Main inventory: 2,154 entries (1,662 files, 492 directories). No main paths are deleted.
- Full PR file listing: 311 changed paths (107 added, 204 modified, 0 removed). The GitHub compare endpoint returns at most 300 file records; the PR changed-file listing was used for the full count.
- Branch snapshot manifest: docs/audits/PR320_REPO_MANIFEST_2026-11-13.jsonl, 2,265 records, pinned to source head 58ba74a709b96ff6017a0a0f3598c773c4ea3de5 / tree a4be94f5eb0d37cb9bcbda51c1cedbe8feea517c; it excludes its own new file. Main-baseline manifest: docs/audits/REPO_MANIFEST_2026-11-10.jsonl, 2,153 records (1,661 blobs, 492 directories), pinned to main@c4560d9ccb222bea5814cc4db32d4c3f1a2101b3; it matches the complete main tree except its own entry.
- This overlay has 310 rows and excludes itself. Table delta: 106 added, 204 modified. Status counts: 50 CONTENT_READ_TESTED_PASS, 25 CONTENT_READ_PENDING_TRACE, 224 REVIEW_REQUIRED, 11 FIXED_TESTED_PENDING_LIVE_APPLY.
- Exact source-head checks at 58ba74a709b96ff6017a0a0f3598c773c4ea3de5: GitHub ZIKR / Quality Gate run 43358852165 was IN_PROGRESS; CircleCI source-verify and application-build-docs were PENDING; CircleCI config-guard was SUCCESS. The documentation commit b47ca152ab98bac101391ff01b0dceb0969a3770 has GitHub ZIKR / Quality Gate run 43359566153 IN_PROGRESS; CircleCI source-verify and application-build-docs PENDING; config-guard SUCCESS. This overlay correction creates another docs-only commit and therefore another exact-head check set.
- Repair batch A: server-side remote social deletion now requires explicit platforms and rejects YouTube before queue reads/provider calls. Commits: db7af471bf0fb04ddf429b8b4c254b0268a9f35f and f20ed2200c77eaec0e3307da35cd30cae7e3d482.
- Repair batch B: media audit catalog writes now advance updated_at with buildNextRowVersionUpdatedAt; a same-millisecond regression test and verifier were added. Commits: 48b52bdab385914f0c05f4c2cf9500db32ec4fe5, 094d0b568cbca18e7bcbe4e2067cc466f936a343, and 58ba74a709b96ff6017a0a0f3598c773c4ea3de5.
- Supabase project zqtssvlvmkzeeyqghqfk: 418 remote migrations through 20261110170000, 430 local migration files, 12 pending. Eleven are test-backed and await owner-approved live apply; one remains REVIEW_REQUIRED. No migration was applied. Security advisor: auth_leaked_password_protection WARN. Performance advisor: 81 unused-index findings; no index was removed.
- Vercel production remains READY at dpl_8LVdTi35Uc9PT5TwrcgHR1Wq1RHu on main@c4560d9ccb222bea5814cc4db32d4c3f1a2101b3, not this audit branch. Read-only GET smoke returned 200 for /api/health, /, /kids, /quran/1/1, and the AASA endpoint. AASA returns 200 but has empty applinks.details and webcredentials.apps. No audit-branch deployment was created.
- A historical TypeError: fetch failed group for /quran/[surah]/[ayah] was last seen 2026-11-12 11:41 UTC; /quran/1/1 returned 200 on 2026-11-13 and the error was not reproduced.
- PR #320 remains open, unmerged, without owner review or a requested reviewer; merge state is unstable. No protected-branch or approval gate was bypassed.
- Safety: no content generation, Gemini request, social publishing, push notification, production DB mutation, migration application, storage/media deletion, secret rotation, mobile release, merge, or audit-branch deployment was triggered.

## Changed-file inventory

| Path | Change | Source-head blob SHA-1 | Bytes | Status |
|---|---|---|---:|---|
| .circleci/config.yml | MODIFIED | b7673986b2bbbb03a617faf85266d221d0b5afb7 | 38250 | CONTENT_READ_PENDING_TRACE |
| .env.example | MODIFIED | 376208c11f8af5efa500fb6e9820d13884f768d3 | 8241 | CONTENT_READ_PENDING_TRACE |
| .github/workflows/audit-video-media.yml | MODIFIED | d5411d7ff24233724d8212a4543993a0125c5d20 | 1964 | CONTENT_READ_PENDING_TRACE |
| .github/workflows/publish-social.yml | MODIFIED | 29c0524d123075c3d93ef8f4d35cec8b0b6ddb1d | 9680 | CONTENT_READ_PENDING_TRACE |
| .github/workflows/quality-gate.yml | MODIFIED | 61c15f455bfe3dcaa462466e0a9af4bda4a8f3fc | 4727 | REVIEW_REQUIRED |
| .github/workflows/release-finalization.yml | MODIFIED | b8d63ae66d8ab9441d1ee351a2708f98835bca21 | 16998 | CONTENT_READ_PENDING_TRACE |
| .github/workflows/storage-retention.yml | MODIFIED | 618897128a2c6bf1bc1cb0b8908b1c0183df22d0 | 5063 | CONTENT_READ_PENDING_TRACE |
| .gitignore | MODIFIED | 12594eba3cb52a5de9723fee782804cba9a023d9 | 1632 | REVIEW_REQUIRED |
| android/app/src/main/AndroidManifest.xml | MODIFIED | 4090657e7b7de1b16c0d653a0663e50d6846bcbb | 3457 | REVIEW_REQUIRED |
| android/app/src/main/res/xml/file_paths.xml | MODIFIED | 591ff1ff6c38cad9405d22da57bb8e65430a8e67 | 213 | REVIEW_REQUIRED |
| capacitor.config.json | MODIFIED | a7e77c6caf9a31a90a590c78b0a4ad99a846db0f | 2029 | REVIEW_REQUIRED |
| docs/admin/ADMIN_API_PERMISSION_MATRIX_2026-11-06.md | MODIFIED | b755f38f3d8b75effb75b97646b30a05d6fdc8e5 | 7365 | REVIEW_REQUIRED |
| docs/admin/SOCIAL_PUBLISHING_OPERATIONS.md | MODIFIED | 8adadaf3b3a6bb2abdede5d2fcf9eb8f26f1da13 | 6862 | REVIEW_REQUIRED |
| docs/audits/CONTINUOUS_CLOSEOUT_LEDGER.md | MODIFIED | 95fafe89acc8e09b89c1c6127567e5e6b2f32902 | 193597 | CONTENT_READ_TESTED_PASS |
| docs/audits/FILE_STATUS_MATRIX_2026-11-01.md | MODIFIED | 2938ecf467d442dc539c30f797908d35b447192a | 674484 | CONTENT_READ_TESTED_PASS |
| docs/audits/PR320_REPO_MANIFEST_2026-11-13.jsonl | ADDED | 5652b1ade83a48f9f677e54b8eac081bf54dc771 | 328301 | CONTENT_READ_TESTED_PASS |
| docs/audits/REPO_MANIFEST_2026-11-10.jsonl | MODIFIED | ae8849ca2127dd5ee1d6e327fb07405e3a05cbc2 | 311031 | CONTENT_READ_TESTED_PASS |
| docs/background-jobs.md | MODIFIED | ba7a0dd48794e6088948d41d1379b4d162376c5d | 11451 | REVIEW_REQUIRED |
| docs/circleci-supabase-environment.md | MODIFIED | 1dabaf72209c8faf7bdd8d1d0c245e9eeb2901a3 | 7248 | REVIEW_REQUIRED |
| docs/environment-variables.md | MODIFIED | 43c3b4453dddb6324f07b73a2fb1d57b85fc93f3 | 17970 | REVIEW_REQUIRED |
| docs/GITHUB_AI_VIDEO.md | MODIFIED | c72f7242923763a41981dcce856b343042ca45c2 | 5274 | REVIEW_REQUIRED |
| docs/MONETAG_SMARTLINK_PLACEMENT.md | MODIFIED | 4516283b915e5ed06d60758ac0de2f4c6a70b359 | 3553 | REVIEW_REQUIRED |
| docs/native-oauth-fix.md | MODIFIED | 1325d2648ea323ca72c6da0aedb25186f3337e3b | 1212 | REVIEW_REQUIRED |
| ios/App/App.xcodeproj/project.pbxproj | MODIFIED | 1cd37c2fc9e6f76b6045ce7aaeada9c2440d19e6 | 17243 | REVIEW_REQUIRED |
| ios/App/App/AppDebug.entitlements | ADDED | a2b0d7ebeeffcd04126f1e412761d7f2c469c6d6 | 445 | REVIEW_REQUIRED |
| ios/App/App/Info.plist | MODIFIED | f38153d83836f03e9afc60f312dcafcb63d09186 | 2401 | REVIEW_REQUIRED |
| ios/App/Podfile | MODIFIED | ddf8bb9a4f87fe6e6c05aa1ab1c5e734cf2c224b | 1852 | REVIEW_REQUIRED |
| mobile-shell/index.html | ADDED | 2ebf7ae7b16b2d971cc009878b44be9d4b1b91ae | 1199 | REVIEW_REQUIRED |
| mobile/capacitor-dependencies.json | MODIFIED | dc9b7955207c96b7aadb8893cd23e9c67abe56e2 | 809 | REVIEW_REQUIRED |
| mobile/README.md | MODIFIED | fc3584fbb947a09a8c5ae9ef0e34363a1a2e8fa2 | 3561 | REVIEW_REQUIRED |
| package.json | MODIFIED | 139d78869ffd5545c32a8d71b0ca5ef50f201312 | 17425 | REVIEW_REQUIRED |
| PROJECT_STATUS.md | MODIFIED | f61f961d16e80809986f80168ed7bc3681de4c59 | 149399 | CONTENT_READ_TESTED_PASS |
| public/offline-content/v1/companion_stories.json | MODIFIED | ef1cad9d7db75ee6677edc9dba3387debb95695a | 30421 | REVIEW_REQUIRED |
| public/offline-content/v1/kids.json | MODIFIED | dc32c0bdbd722f0f920d7db2a690074de0194fcc | 52752 | REVIEW_REQUIRED |
| public/offline-content/v1/manifest.json | MODIFIED | 9d95f4df6b9e85227aed64e171a207a89da787ad | 8419 | REVIEW_REQUIRED |
| public/sw.js | MODIFIED | ab231576712d15811e84285be9ed4b38eca20d09 | 20234 | CONTENT_READ_TESTED_PASS |
| scripts/cleanup-supabase-storage.mjs | MODIFIED | ac084325a310a2c961753ccfe5fb1f2bc0800e79 | 48888 | REVIEW_REQUIRED |
| scripts/export-offline-content.mjs | MODIFIED | bae5e6a4e1892cc7490e4425953a839c8f9e9998 | 10456 | REVIEW_REQUIRED |
| scripts/jobs/audit-video-media.ts | MODIFIED | 2d3e32ab65ff7c1779279fa2bc33c73d2926f021 | 14558 | CONTENT_READ_PENDING_TRACE |
| scripts/jobs/content-publishing.ts | MODIFIED | dbf6a1e994fa85b814d289c58e01f9c92d47cfc7 | 16404 | CONTENT_READ_PENDING_TRACE |
| scripts/jobs/hf-space-video.py | MODIFIED | f66f54abc1910db8d4ab79d557e21e9d5147a07a | 10784 | CONTENT_READ_TESTED_PASS |
| scripts/jobs/social-publishing.ts | MODIFIED | 1e2b06835e1c34839fd8509c13e520ad0d37b2ab | 6084 | CONTENT_READ_PENDING_TRACE |
| scripts/jobs/template-video-automation.ts | MODIFIED | 0e35cecf240bba4878c17e932fff1f36571f21d9 | 139119 | REVIEW_REQUIRED |
| scripts/jobs/written-content-automation.ts | MODIFIED | 73ae69cbe3bf92f684c9e6bc9b30465019a26203 | 27436 | REVIEW_REQUIRED |
| scripts/lib/offline-export-parent-scope.mjs | ADDED | 84f310f8de5db9c06d9385228c1579bc2e2105f1 | 1576 | REVIEW_REQUIRED |
| scripts/lib/offline-export-route-pruning.mjs | ADDED | 785921269a2dee1544151279cba1f4666b4f0191 | 2039 | REVIEW_REQUIRED |
| scripts/lib/offline-kids-route-safety.mjs | ADDED | 146f4961315f6ae144d288070b9ef0cff7a71a94 | 2353 | REVIEW_REQUIRED |
| scripts/platform-route-baseline.mjs | MODIFIED | fd20a2a384fe262a50b11c8aab23b48368f007fd | 777 | CONTENT_READ_TESTED_PASS |
| scripts/run-background-jobs.ts | MODIFIED | 2640dc91d485dae517fa8c27bf758e620835a3f0 | 19444 | REVIEW_REQUIRED |
| scripts/sync-hadith-english.ts | MODIFIED | 45381ecbe49fd26fa4504ffd450f4850a4c04993 | 4718 | REVIEW_REQUIRED |
| scripts/tests/admin-rbac-rls.test.mjs | MODIFIED | 04fdfd76bd448cc5d73db371a26af78dafd1aac5 | 20197 | REVIEW_REQUIRED |
| scripts/tests/admin-role-resolution.test.ts | ADDED | 8cc71b4d4dff6464e695e6808dedc79876d1f5d5 | 7466 | REVIEW_REQUIRED |
| scripts/tests/admin-role-update.integration-setup.sql | MODIFIED | f85b0aa510e576e68d2c1c37d79e9352740fbf89 | 2851 | CONTENT_READ_TESTED_PASS |
| scripts/tests/admin-role-update.integration.sh | MODIFIED | ab76eba83975025631fd72c3187b7e2f70803fa3 | 1485 | CONTENT_READ_TESTED_PASS |
| scripts/tests/admin-role-update.integration.sql | MODIFIED | 05b84137862b14cad3e3d0ffe47ae6054470c013 | 9529 | REVIEW_REQUIRED |
| scripts/tests/admin-video-retry-step-up.test.mjs | ADDED | d987ee0b240037ec17d88ed89791d806137d076d | 1523 | REVIEW_REQUIRED |
| scripts/tests/app-association-route-contract.test.mjs | ADDED | c2b26101eaeb0e01663e0778e331e444b3dd8935 | 1790 | REVIEW_REQUIRED |
| scripts/tests/background-job-outcome.test.ts | MODIFIED | 6a87adec1d2aca8a27e4cf1c177af1b71127a88c | 12240 | REVIEW_REQUIRED |
| scripts/tests/background-reminder-schedule.integration-setup.sql | ADDED | 71185280925b76afd847b22d1e7ea9c2e93c3204 | 4163 | REVIEW_REQUIRED |
| scripts/tests/background-reminder-schedule.integration.sh | ADDED | a495717252b474ee19d1ce96d014e304124f229b | 1477 | REVIEW_REQUIRED |
| scripts/tests/background-reminder-schedule.integration.sql | ADDED | 134899152eed59928429d4a9f43aa22bf272f6fd | 3281 | CONTENT_READ_TESTED_PASS |
| scripts/tests/bounded-json-body.test.ts | ADDED | 17da4a47354973a9e9dd4878f4139dff4c1a7161 | 4211 | CONTENT_READ_TESTED_PASS |
| scripts/tests/ci-architecture-source-syntax.test.mjs | ADDED | 687c75434abbb8829e6024b5ee0558a8b22dd3f4 | 612 | REVIEW_REQUIRED |
| scripts/tests/client-table-privilege-hardening.integration-setup.sql | ADDED | 528a960201011497507da96f3538dcf3dc82af45 | 1835 | REVIEW_REQUIRED |
| scripts/tests/client-table-privilege-hardening.integration.sh | ADDED | 718f64df64d87900704dd79483e58980eb08d019 | 1380 | REVIEW_REQUIRED |
| scripts/tests/client-table-privilege-hardening.integration.sql | ADDED | bcaac9682e432f1e0edad523e0a97e2fd972a922 | 1576 | REVIEW_REQUIRED |
| scripts/tests/cloudinary-image-validation.test.ts | ADDED | 96735e3648cbd1c0ee46d27a3860d28414407e9d | 1657 | REVIEW_REQUIRED |
| scripts/tests/cloudinary-upload-safety.test.mjs | ADDED | 018e75246534f7e4f675b582ef106b7852626b84 | 953 | REVIEW_REQUIRED |
| scripts/tests/contact-validation.test.ts | MODIFIED | 2cd69798441b5a11af58af18e5357190ab92b725 | 2756 | REVIEW_REQUIRED |
| scripts/tests/content-publishing-contract.test.mjs | ADDED | 80eb6ee8a71e420ad61ea0740fd8641aab7677f0 | 12122 | REVIEW_REQUIRED |
| scripts/tests/english-content-sync-contract.test.mjs | ADDED | 9e1333a0b50ed1e6a275ea9f11eb24966fd3531f | 7614 | REVIEW_REQUIRED |
| scripts/tests/facebook-credentials.test.ts | ADDED | 1789ac91af6a366b922276474a39ed08ae5e8e26 | 3291 | REVIEW_REQUIRED |
| scripts/tests/gitignore-secrets.test.mjs | ADDED | 3c169f33da340a006b3bbd958da1d541aa2d8275 | 867 | REVIEW_REQUIRED |
| scripts/tests/hf_space_video_safety_test.py | ADDED | c8ab5c8cec8e4fd74c53ad6b7c1a645f06e7dda0 | 6901 | CONTENT_READ_TESTED_PASS |
| scripts/tests/kids-content-visibility.test.ts | ADDED | c2843cefc6688763960375005f908d344e8664b8 | 46321 | REVIEW_REQUIRED |
| scripts/tests/kids-game-levels-rls.integration-setup.sql | ADDED | 9c29e02305dd9e7a30692f53385628b9c21d28b7 | 4115 | REVIEW_REQUIRED |
| scripts/tests/kids-game-levels-rls.integration.sh | ADDED | 672c1649fa4b39bd731c8b214b7d3985686a31c3 | 1426 | CONTENT_READ_TESTED_PASS |
| scripts/tests/kids-game-levels-rls.integration.sql | ADDED | f5f4dae9ed2dca5a682cf35112c95e4bf2f20dc3 | 3310 | REVIEW_REQUIRED |
| scripts/tests/kids-game-publication-rls-contract.test.ts | ADDED | ddf7583f2dd175c620f06915167975c59690c7f6 | 4488 | REVIEW_REQUIRED |
| scripts/tests/kids-game-runtime-contract.test.ts | MODIFIED | 9051beec3b1948e447345251203d68b012603910 | 4865 | REVIEW_REQUIRED |
| scripts/tests/kids-legacy-submit-result-body-limit.test.mjs | ADDED | 50487f2453072d08358c52fe69db0ad11ede4633 | 3096 | CONTENT_READ_TESTED_PASS |
| scripts/tests/kids-share-rate-limit.test.ts | ADDED | 89f3fc70bf8427f4ee4a4862bfa8457c14eee48d | 3331 | REVIEW_REQUIRED |
| scripts/tests/kids-video-series.test.ts | MODIFIED | 881ec4abc56df23e9fe1f7418b8c0d13c4f33fc4 | 4974 | REVIEW_REQUIRED |
| scripts/tests/native-google-oauth-contract.test.mjs | MODIFIED | da5a4ff4281fc64639afb3713162ed630b410ad1 | 12525 | REVIEW_REQUIRED |
| scripts/tests/native-reminder-safety.test.ts | ADDED | 22a1f9791c1e7f9216b19e52dde65d847a426ce3 | 7136 | REVIEW_REQUIRED |
| scripts/tests/offline-export-parent-scope.test.mjs | ADDED | 518ec5e153dc0638229694dcb83a41b5be5355ae | 2753 | REVIEW_REQUIRED |
| scripts/tests/offline-export-route-pruning.test.mjs | ADDED | 26b9e05579eeb9ff956653c696226b8571cb597c | 3644 | REVIEW_REQUIRED |
| scripts/tests/offline-kids-route-safety.test.mjs | ADDED | 5de2b0d8f238227b094b17f7184c3c0a31c3e7f5 | 5168 | REVIEW_REQUIRED |
| scripts/tests/offline-route-safety.test.ts | ADDED | 694b816091f24218e3682f92314fdc8e57ead7ae | 4062 | REVIEW_REQUIRED |
| scripts/tests/platform-route-baseline.test.mjs | ADDED | e02b8dd3c9762fa9fa95ddca49e97c0b131609ec | 1591 | CONTENT_READ_TESTED_PASS |
| scripts/tests/prayer-alert-ref-sync.test.mjs | ADDED | 43956438237387944072b93cdd2cca193cd33d25 | 1134 | REVIEW_REQUIRED |
| scripts/tests/prayer-notification-pagination.test.ts | ADDED | 4d68bfbd6d1e9260c450592441c02c441cd9e1a6 | 38467 | REVIEW_REQUIRED |
| scripts/tests/prayer-reminder-preferences.test.ts | ADDED | 0ccc0e53254c866c2f692f9fe2d756811bea9a55 | 1919 | CONTENT_READ_TESTED_PASS |
| scripts/tests/prayer-times.test.ts | MODIFIED | 45ee3da30e714d3c7bcf548bf8f66c7e21cf39cd | 6494 | REVIEW_REQUIRED |
| scripts/tests/profile-sync.test.ts | ADDED | ed2404b4435e63412ddceb8a6f5006202218e7cc | 2814 | REVIEW_REQUIRED |
| scripts/tests/prophet-sections-rls.integration-setup.sql | ADDED | 871c7f3fc3e79b458dbedb65f555739a1de9b3e1 | 1545 | REVIEW_REQUIRED |
| scripts/tests/prophet-sections-rls.integration.sh | ADDED | f00aeabb64dd30128efa74c49d7c0b19e7a93dd6 | 1323 | CONTENT_READ_TESTED_PASS |
| scripts/tests/prophet-sections-rls.integration.sql | ADDED | 41729cbbf33526905c4f95e90b53743ed1b0f4bb | 1119 | REVIEW_REQUIRED |
| scripts/tests/safe-redirect.test.ts | ADDED | 4c35d8d5ce880dc4bd75f1c45622e7beb5304df0 | 5117 | REVIEW_REQUIRED |
| scripts/tests/service-worker-ads-scope.test.ts | ADDED | 76a8d632a2b3dac7da2ab155cdd32cbc89a9e1fe | 7398 | CONTENT_READ_TESTED_PASS |
| scripts/tests/social-deletion.test.ts | MODIFIED | b9c0883478ab1b17e9df24eabc37107d23393426 | 18975 | CONTENT_READ_PENDING_TRACE |
| scripts/tests/social-insights-worker-status.test.ts | ADDED | 1651deeb245aafef23d0cfc656a80480f72be4a0 | 1901 | CONTENT_READ_TESTED_PASS |
| scripts/tests/social-platform-isolation.test.ts | MODIFIED | 7440e9df0cc660f4d433a0acaf3010ab15f79b01 | 36702 | REVIEW_REQUIRED |
| scripts/tests/social-post-insights-storage.test.ts | MODIFIED | 90b6fea565a586d5cbc24d142fe1b22d7788f9cd | 2714 | REVIEW_REQUIRED |
| scripts/tests/social-published-video-cleanup.test.ts | MODIFIED | 826dd6f106efe982d55ea4e5292d3d7ffc906db9 | 8341 | REVIEW_REQUIRED |
| scripts/tests/social-queue-selection.test.ts | MODIFIED | dc10e52cdc9924f9448f4ec25aed131e9aefa814 | 13087 | REVIEW_REQUIRED |
| scripts/tests/spiritual-ai-retriever.test.mjs | ADDED | 5742e12726c4a8ee74d2ec9549754330cc3a86cb | 812 | REVIEW_REQUIRED |
| scripts/tests/storage-retention.test.mjs | MODIFIED | 41f3d9397d126aa0cf6ec713232edf5eff9bf6f3 | 35613 | REVIEW_REQUIRED |
| scripts/tests/supabase-admin-rest-abort.test.ts | ADDED | 6d07bc706cc606f9f56c6f15f11aae42159611b4 | 6389 | REVIEW_REQUIRED |
| scripts/tests/translation-queue-recovery.test.ts | ADDED | 223b67c943196345b21a56937f256cefa1cee519 | 1689 | REVIEW_REQUIRED |
| scripts/tests/video-contract.test.ts | MODIFIED | d7c0f46d1f4ca30c3ec548ac88e70cf18d5d264f | 6174 | REVIEW_REQUIRED |
| scripts/tests/video-custom-provider-registry.test.ts | MODIFIED | e17cc2cc96702d0ab80e1be3934e94dc1390e5ef | 2836 | CONTENT_READ_TESTED_PASS |
| scripts/tests/video-duplicate-recovery.test.ts | MODIFIED | 4eb701061deea00391a82c763b37fa98854c20ab | 16093 | REVIEW_REQUIRED |
| scripts/tests/video-media-fallback.test.ts | MODIFIED | 0194fa7d58f2ce46609c4fa6e6b2e8a89c6167ff | 17098 | REVIEW_REQUIRED |
| scripts/tests/video-media-url.test.ts | ADDED | 6e942e98149103261aac6cbc361f777b72a9dd8f | 12303 | CONTENT_READ_PENDING_TRACE |
| scripts/tests/video-publish-approval.test.ts | MODIFIED | c26501619e4ac2944ad5c2d9bcb8f6dc1f105d8d | 8168 | REVIEW_REQUIRED |
| scripts/tests/video-purge-contract.test.mjs | MODIFIED | e1d52d6f9595f4f0b08cda01bf7473247fc84d12 | 22475 | REVIEW_REQUIRED |
| scripts/tests/video-queue-claim.test.ts | ADDED | d43147ee7e28c5add2cb967c56569b4e46b203f0 | 28008 | REVIEW_REQUIRED |
| scripts/tests/video-storage-retention-contract.integration.sh | ADDED | 7a26b2233803ef6d54d737cf84e4640c2e70b3e3 | 1762 | CONTENT_READ_TESTED_PASS |
| scripts/tests/video-storage-retention-contract.integration.sql | ADDED | 66fd924f9d71deb18fbf4a3fd8b04cea816f7c8e | 4131 | REVIEW_REQUIRED |
| scripts/tests/written-content-automation.test.ts | MODIFIED | 44ea9d9f13c2ccbc923aff28e0626572f5fab17e | 38279 | REVIEW_REQUIRED |
| scripts/tests/youtube-oauth-credentials.test.ts | MODIFIED | 277bec14ca460d28c3a01a717df4e7e4f1fc08ea | 13913 | REVIEW_REQUIRED |
| scripts/translate-published-articles-en.ts | MODIFIED | 731c33f6fa9bdf926d7ad9d1bb250b190ffaf190 | 17439 | REVIEW_REQUIRED |
| scripts/validate-deployment-env.mjs | MODIFIED | baac74d74cf16083acdd75a4cb08baa309738da4 | 6270 | REVIEW_REQUIRED |
| scripts/validate-migrations.mjs | MODIFIED | 1f61b9d487908f163f41414de1084ad49e8a039f | 25247 | CONTENT_READ_PENDING_TRACE |
| scripts/verify-admin-api-guards.mjs | MODIFIED | 884445c32700d18155eb784f1be92ac1379bcf78 | 18570 | REVIEW_REQUIRED |
| scripts/verify-admin-architecture.mjs | MODIFIED | 9a10c6acce503e0dacbd05bb7a86b7aa434e3f12 | 12537 | REVIEW_REQUIRED |
| scripts/verify-admin-governance.mjs | MODIFIED | b5302d3609e9bba0c4ff946d6fa7859586f87296 | 17130 | REVIEW_REQUIRED |
| scripts/verify-admin-health.mjs | MODIFIED | 8d3b4c0ee35242df059bb80baab9c2878ead54df | 6520 | REVIEW_REQUIRED |
| scripts/verify-admin-video-factory.mjs | MODIFIED | 803be2c1d3313435c8db110cde19647e59bfd6df | 20947 | REVIEW_REQUIRED |
| scripts/verify-adsense-readiness.mjs | MODIFIED | a75371e68af4b8c6bbf7a1daa15bdec26145ec34 | 11062 | CONTENT_READ_TESTED_PASS |
| scripts/verify-auth-config.mjs | MODIFIED | 19aa13dfef18d104352cf25c2fee323060294952 | 6025 | REVIEW_REQUIRED |
| scripts/verify-ci-architecture.mjs | MODIFIED | c98148b8ae3a65f9a368f97e4531bc28bc531c08 | 34744 | REVIEW_REQUIRED |
| scripts/verify-consent-mode.mjs | MODIFIED | e8ae89328973818aabc7353efb2008505c7141d9 | 2978 | CONTENT_READ_TESTED_PASS |
| scripts/verify-google-search-console.mjs | MODIFIED | e66b1c88db77c6d7e79abb850f6327efeee05325 | 6022 | CONTENT_READ_TESTED_PASS |
| scripts/verify-information-architecture.mjs | MODIFIED | 39668458402fa5f61a6378b2229e610ba21f8df6 | 9843 | REVIEW_REQUIRED |
| scripts/verify-kids-games-final.ts | MODIFIED | 5c42f4f3245511c15d5aea3b18b14fc8810f6510 | 21683 | CONTENT_READ_TESTED_PASS |
| scripts/verify-kids-video-factory.mjs | MODIFIED | 84e4eba826d4d289fdf6edbf3c85bb0075d32531 | 9695 | REVIEW_REQUIRED |
| scripts/verify-mobile-ads-free.mjs | MODIFIED | 99ac7f69e4a814ab1e0e5162b6286c30e4a2870a | 7783 | CONTENT_READ_TESTED_PASS |
| scripts/verify-mobile-readiness.mjs | MODIFIED | a3f1c9f841c569efd02064163c733233933afbd7 | 20612 | REVIEW_REQUIRED |
| scripts/verify-platform-routes.mjs | MODIFIED | 2b1307bfafc59d68d176c218f1b316a9b750110c | 7942 | CONTENT_READ_PENDING_TRACE |
| scripts/verify-production-smoke.mjs | MODIFIED | 257ece88f3d030c9aea1fbfd5f3724a190863a1e | 9789 | REVIEW_REQUIRED |
| scripts/verify-project-integrity.mjs | MODIFIED | a9f903375d30e45b53a2295028b103c1bd72e4e4 | 17222 | REVIEW_REQUIRED |
| scripts/verify-release-contract.mjs | MODIFIED | b22a73dcb1ad972b0e9aae929e0bd38edaf14405 | 29169 | REVIEW_REQUIRED |
| scripts/verify-scheduler.mjs | MODIFIED | 14732aecd8e392bc53fd4dd7e23e6d99e226b784 | 15676 | REVIEW_REQUIRED |
| scripts/verify-security-hardening.mjs | MODIFIED | 55930d547d55cc0c1d59d39853003f0a744127d5 | 6828 | CONTENT_READ_PENDING_TRACE |
| scripts/verify-social-publishing.mjs | MODIFIED | dbf85c01aa7c21df77cd2c8e4b01a329b622efa5 | 26090 | REVIEW_REQUIRED |
| scripts/verify-video-factory.mjs | MODIFIED | c30d4b95bdeace52ae48c7e2b63062384bc60f01 | 12309 | REVIEW_REQUIRED |
| scripts/verify-video-media-audit.mjs | MODIFIED | 9527daa9839d1d21c709e3957ce709d5253d9b76 | 9377 | CONTENT_READ_PENDING_TRACE |
| scripts/verify-video-queue-priority.mjs | MODIFIED | df79f330a8e53b0770fc5b224030485d5d1d3380 | 8710 | REVIEW_REQUIRED |
| src/app/.well-known/apple-app-site-association/route.ts | MODIFIED | 38a68a057c1443c2a7b43ff82bc605f7d7db801a | 879 | REVIEW_REQUIRED |
| src/app/admin/content-actions.ts | MODIFIED | 012e5705136b230665d98df7b5458461a54b5e59 | 5817 | REVIEW_REQUIRED |
| src/app/admin/health/page.tsx | MODIFIED | 0fa3cfd17f2238a33ac3cd80b86cf856e897b9e7 | 15108 | REVIEW_REQUIRED |
| src/app/admin/kids/actions.ts | MODIFIED | e7ada098310e575c7eab639fb95486071a594f6a | 6085 | REVIEW_REQUIRED |
| src/app/admin/kids/games/page.tsx | MODIFIED | e4ff6905531002c0a9940993715bc99a23d9e6ce | 8182 | REVIEW_REQUIRED |
| src/app/admin/kids/levels/page.tsx | MODIFIED | c0f871aaff38d31cdbfb993c2bedbdbb6b92b6e2 | 6923 | REVIEW_REQUIRED |
| src/app/admin/media/media-client.tsx | MODIFIED | 08905489568826f23f8e8ab1bff0d5ada2a4f012 | 10348 | REVIEW_REQUIRED |
| src/app/admin/security/page.tsx | MODIFIED | 59ddd7856665eeebfe1e44247ef9c477b86652c6 | 4481 | REVIEW_REQUIRED |
| src/app/admin/security/step-up/page.tsx | MODIFIED | 748a1de1429c5ceba33da5415df0b766dd826bd8 | 1439 | REVIEW_REQUIRED |
| src/app/admin/settings/page.tsx | MODIFIED | 870998e3e27193d8936e12b0456c94265f806ba5 | 4576 | REVIEW_REQUIRED |
| src/app/admin/social/page.tsx | MODIFIED | 58ea3d3d612799a5594032fc06cd551d1fd76b43 | 600 | REVIEW_REQUIRED |
| src/app/admin/social/social-client.tsx | MODIFIED | f4102f4bc1ba803c5a3a3f9c98696908d1671f64 | 82067 | CONTENT_READ_PENDING_TRACE |
| src/app/admin/social/written-studio/written-studio-client.tsx | MODIFIED | ef654164c39f9241be95bc78f8d299741cad4fe3 | 14818 | REVIEW_REQUIRED |
| src/app/admin/system-actions.ts | MODIFIED | 28751e20fcaf7cad72d4093ca24346f02622e0f4 | 13514 | REVIEW_REQUIRED |
| src/app/admin/users/page.tsx | MODIFIED | 1753e0fa3043fa4c3d79989495a6bf6c1f01d0fa | 8783 | REVIEW_REQUIRED |
| src/app/admin/video/visuals/page.tsx | MODIFIED | 0d119e8587eb6ea135c9de1a76a4c4e4c71af2f6 | 12041 | CONTENT_READ_PENDING_TRACE |
| src/app/api/admin/cloudinary/image/route.ts | MODIFIED | 5277adb612684240e6c2b62deeb31b37ff57f4c3 | 2990 | REVIEW_REQUIRED |
| src/app/api/admin/media/route.ts | MODIFIED | 7b3bd72eeaf60bae0167800881dd071c9364cba9 | 4238 | REVIEW_REQUIRED |
| src/app/api/admin/site-audio/route.ts | MODIFIED | 0fa43679606d1aaebc8fb870b09811cef1b48240 | 6690 | REVIEW_REQUIRED |
| src/app/api/admin/social/facebook/callback/route.ts | MODIFIED | e2749f62d411c88a807dbaff33ae59417d64b8bd | 8024 | REVIEW_REQUIRED |
| src/app/api/admin/social/facebook/connect/route.ts | MODIFIED | a2746870995134711d9145366d001c81fe0358c6 | 2545 | REVIEW_REQUIRED |
| src/app/api/admin/social/route.ts | MODIFIED | 3c662233df10b42007438ff44d6093f92ff3ba87 | 50825 | CONTENT_READ_PENDING_TRACE |
| src/app/api/admin/social/written/route.ts | MODIFIED | 084f03577b46de75bea7b0b4d3d0f5f2bbccb9e8 | 4533 | REVIEW_REQUIRED |
| src/app/api/admin/social/youtube/callback/route.ts | MODIFIED | 6bd3a3e0fede235c36fd622f980ecdd96f03a097 | 7724 | REVIEW_REQUIRED |
| src/app/api/admin/social/youtube/connect/route.ts | MODIFIED | 84b4496feb3888f820d4faa7f4a2078f35ad37cc | 3004 | REVIEW_REQUIRED |
| src/app/api/admin/video-generation/route.ts | MODIFIED | 0fed3b6cee8674f94123bdb8983fd47245bd1b67 | 10190 | REVIEW_REQUIRED |
| src/app/api/admin/video-purge/route.ts | MODIFIED | 7b32f611ba33889496670b734ed696e98a68c5c6 | 31499 | REVIEW_REQUIRED |
| src/app/api/admin/videos/[id]/retry/route.ts | MODIFIED | e6c452f07e3ceca72321e438f03fb1664dde7c9f | 2229 | CONTENT_READ_TESTED_PASS |
| src/app/api/admin/videos/[id]/route.ts | MODIFIED | 561d05199d9ee06bc55b1c50c7ce4d48fdd5414b | 5468 | REVIEW_REQUIRED |
| src/app/api/contact/route.ts | MODIFIED | 7451e4f538a5dc3ed4044dac6f7e552ebfcff4ae | 2080 | REVIEW_REQUIRED |
| src/app/api/kids/content/[slug]/route.ts | MODIFIED | 1ef60bf34de0032082cd91ec59261b71853a6831 | 927 | REVIEW_REQUIRED |
| src/app/api/kids/content/route.ts | MODIFIED | 058d0d2f3802b51924d0b59d1eb9c4969153e60c | 506 | REVIEW_REQUIRED |
| src/app/api/kids/games/score/route.ts | MODIFIED | b2e93c220256be5ab7774937c137319b418db569 | 1292 | CONTENT_READ_TESTED_PASS |
| src/app/api/kids/games/submit-result/route.ts | MODIFIED | 9cfddb9e9ffc364f759e63788bd8d9ffb4d9d36a | 3602 | CONTENT_READ_TESTED_PASS |
| src/app/api/kids/games/validate/route.ts | MODIFIED | 58012eb0cd98f1696398b17e8cd23f13407fcdb9 | 3503 | REVIEW_REQUIRED |
| src/app/api/kids/social-posts/route.ts | MODIFIED | fec5a1faef65bbef87200c3c98c83dd699ac8642 | 2929 | REVIEW_REQUIRED |
| src/app/api/kids/track-share/route.ts | MODIFIED | 6dc9b3ed2bc87f759ba51037f270ad3273fc0092 | 3441 | REVIEW_REQUIRED |
| src/app/api/kids/videos/route.ts | MODIFIED | 5b42492212a73ac223017afb93467f27c7b9d472 | 6057 | CONTENT_READ_PENDING_TRACE |
| src/app/api/push/subscription/route.ts | MODIFIED | c377e339c77a2e75af39d5b4e8146e3595cd5ec4 | 7669 | REVIEW_REQUIRED |
| src/app/auth/callback/route.ts | MODIFIED | 22032e684dc8b3da0517bde1d7e85743e2d92196 | 4211 | REVIEW_REQUIRED |
| src/app/kids/[slug]/layout.tsx | MODIFIED | 7af008ae10923dada8cc76653a6058fbb7b47d57 | 1364 | REVIEW_REQUIRED |
| src/app/kids/[slug]/page.tsx | MODIFIED | 7380d14bdd0fda2af0cccf21d86add7a713a702a | 23061 | CONTENT_READ_PENDING_TRACE |
| src/app/kids/page.tsx | MODIFIED | 65e1cdd49e259f8399a3345723122945b57b3640 | 31548 | REVIEW_REQUIRED |
| src/app/kids/videos/[slug]/page.tsx | MODIFIED | 750de4e7501e0ad4656b1d58680cfdf3b0fa6b37 | 6809 | REVIEW_REQUIRED |
| src/app/kids/videos/page.tsx | MODIFIED | 207cd1e63e58d0bc8b56f8e72fb8e6d5f7244649 | 4947 | REVIEW_REQUIRED |
| src/app/layout.tsx | MODIFIED | 3eba8c320e3c3ffb541c161a810bbe25b378bd2a | 6589 | CONTENT_READ_TESTED_PASS |
| src/app/sitemap.ts | MODIFIED | be73250d48aadca9f86681fef6e5c4dfb70270b4 | 7798 | REVIEW_REQUIRED |
| src/components/layout/adsense-slot.tsx | MODIFIED | 3a3aa137c4d2fa91bbda8197e7e0f83d48210b51 | 2091 | CONTENT_READ_TESTED_PASS |
| src/components/layout/deferred-runtime.tsx | MODIFIED | 06cdaa10a5e804c1a197b89374911fbbc0203c64 | 2016 | CONTENT_READ_TESTED_PASS |
| src/components/layout/native-capacitor-bridge.tsx | MODIFIED | f2b10ba7fc166f889a04f82033cb699919c1d4f3 | 13909 | REVIEW_REQUIRED |
| src/components/layout/native-google-oauth-handler.tsx | MODIFIED | 7a18dc10879699083708bccea1a34e91608413e3 | 4863 | REVIEW_REQUIRED |
| src/components/layout/runtime-effects.tsx | MODIFIED | 1d358572133816df8d64b68c3b3809672145e264 | 1670 | CONTENT_READ_TESTED_PASS |
| src/components/layout/service-worker-register.tsx | MODIFIED | 7554c65516997dca85be95e07108bd3a86e97086 | 7130 | CONTENT_READ_TESTED_PASS |
| src/components/layout/web-advertising-runtime.tsx | MODIFIED | 2d0cabfa055f2acd3e6b129f6b338aec8e135b04 | 6014 | REVIEW_REQUIRED |
| src/features/admin/actions/users.ts | MODIFIED | 4a3262fda9bc1f6e68dc05c79e6d8f492a15494e | 1885 | REVIEW_REQUIRED |
| src/features/admin/components/cloudinary-image-upload-field.tsx | MODIFIED | 20ca0ab2a8dd8c05da40953667b31c6e49ff1ea9 | 3503 | REVIEW_REQUIRED |
| src/features/admin/components/kids-content-manager.tsx | MODIFIED | 3f3fe55a6d7dbe37e3ca4835fc1f2278bb6b19ab | 13207 | REVIEW_REQUIRED |
| src/features/admin/components/purge-generated-videos-control.tsx | MODIFIED | 581da317f968b1461ffd1f79d28a44f042958ef6 | 12877 | REVIEW_REQUIRED |
| src/features/admin/components/site-audio-manager.tsx | MODIFIED | 70ecd31da1bcf0f7f7b5c4b11be3a0f7172089d2 | 10858 | REVIEW_REQUIRED |
| src/features/admin/components/traffic-revenue-panel.tsx | MODIFIED | f258774bacf3978417d92130aabf44ebf8059317 | 20136 | REVIEW_REQUIRED |
| src/features/admin/components/users-table.tsx | MODIFIED | 67c5d8fc334c6bb42a4d29b13ab3f6883463cdcf | 10751 | REVIEW_REQUIRED |
| src/features/admin/services/admin.ts | MODIFIED | b48cea6d914650825a396af9ffc875be8202e8d0 | 3064 | REVIEW_REQUIRED |
| src/features/admin/services/content.ts | MODIFIED | 2ecf6adca7c384f0f3015f3c092c36a1858e4f2e | 12731 | REVIEW_REQUIRED |
| src/features/admin/services/permissions.ts | MODIFIED | 476bdb4b401b540558f0ac6cedc3ce007c1c5140 | 4720 | REVIEW_REQUIRED |
| src/features/admin/services/platform.ts | MODIFIED | 0fce9022a4a8b415de95b51a39c9e94ed3103edb | 16453 | REVIEW_REQUIRED |
| src/features/admin/services/security-policy.ts | ADDED | 3d20551e56b1a5f8aa3f46ba50dcdda0b774514b | 278 | REVIEW_REQUIRED |
| src/features/admin/services/security.ts | MODIFIED | cd63ec214184a364730408f0f0365cc79e3dcdaa | 3041 | REVIEW_REQUIRED |
| src/features/admin/utils/step-up-client.ts | ADDED | 60cb1d39c96f3c2c4a137c27e95391d63055bfed | 449 | REVIEW_REQUIRED |
| src/features/admin/video-requests/components/admin-video-requests-client.tsx | MODIFIED | e5dcaccc04b337d5b9edc475cddc79755dd85153 | 21407 | REVIEW_REQUIRED |
| src/features/articles/services/translation-queue-recovery.ts | ADDED | a87da77a1344f89473be9212d1ffc6a1df512755 | 1628 | REVIEW_REQUIRED |
| src/features/auth/actions.ts | MODIFIED | c3b247562a3c0b0f68b86cc7cbbfb91650e82ad3 | 11273 | REVIEW_REQUIRED |
| src/features/auth/components/google-oauth-button.tsx | MODIFIED | 0f415ecef3ea3673e98e15160a15eb1c0604c271 | 10009 | REVIEW_REQUIRED |
| src/features/auth/components/login-page.tsx | MODIFIED | 5c77547f2294e2d17e3d93dec53ef9ce9b8e4c0e | 6155 | REVIEW_REQUIRED |
| src/features/auth/integrations/google-oauth.ts | MODIFIED | b989ab9b9675f1cb418471052259ae858734a544 | 3595 | REVIEW_REQUIRED |
| src/features/kids/components/kids-share.tsx | MODIFIED | 68f1c8b7ac57202056e607f596349853b38e654b | 6902 | REVIEW_REQUIRED |
| src/features/kids/data/content.ts | MODIFIED | ed309d23297c844046ea3ccaab52c02d7a387218 | 70326 | REVIEW_REQUIRED |
| src/features/kids/services/client-address.ts | ADDED | 2784dc4cbd899870d533c56b67c488ef5a5b4600 | 72 | REVIEW_REQUIRED |
| src/features/kids/services/kids-content-validation.ts | ADDED | 56886ff5049f4fd527e10afbce480d03b5fea9f0 | 5238 | REVIEW_REQUIRED |
| src/features/kids/services/kids-content-visibility.ts | ADDED | 2a0ecc791494b39e79096431e402982c7ff586f1 | 1914 | REVIEW_REQUIRED |
| src/features/kids/services/kids-content.ts | MODIFIED | d31dfe298e05845bc3a756e89b5b40eca9ba25c1 | 6313 | REVIEW_REQUIRED |
| src/features/kids/services/kids-offline-content.ts | ADDED | cfe7e9b4748acbab7dde534e090f6d75233966bd | 1599 | REVIEW_REQUIRED |
| src/features/kids/services/share-rate-limit.ts | ADDED | c7550eae6bd1f2ca1ce46e061161e58d664a7775 | 1165 | REVIEW_REQUIRED |
| src/features/media/services/cloudinary-validation.ts | MODIFIED | a3951459fee8e0baf3a03e107f64252dcdb5bde9 | 1796 | REVIEW_REQUIRED |
| src/features/media/services/cloudinary.ts | MODIFIED | 257e6abfe8ae281ca6491a1aeeb09a6ea451b5e7 | 3079 | REVIEW_REQUIRED |
| src/features/notifications/services/push-endpoint.ts | ADDED | 72ddd8e83669bf6599d3b6bb56b22353ec56fa87 | 1086 | REVIEW_REQUIRED |
| src/features/notifications/services/push-subscription-request.ts | ADDED | 378fc61d3b67be1608eb764d516380a9e96dd174 | 491 | REVIEW_REQUIRED |
| src/features/prayer/hooks/use-prayer-alert.ts | MODIFIED | c5aad576b0bf935d65aa2dfbd06d40aec9b11a98 | 19865 | REVIEW_REQUIRED |
| src/features/prayer/services/prayer-alert-settings.ts | ADDED | 6ec49843358b3f526897680ddf3bafa4afa89e8f | 1235 | REVIEW_REQUIRED |
| src/features/prayer/services/prayer-notification-schedule.ts | ADDED | dccb29d132066a2110a8c3bc4fef03a36ccc638f | 5434 | REVIEW_REQUIRED |
| src/features/prayer/services/prayer-reminder-preferences.ts | ADDED | 59db8bb4e6a58e2fb2b31e46ad88d819213bc398 | 1347 | CONTENT_READ_TESTED_PASS |
| src/features/profile/components/profile-local-settings.tsx | MODIFIED | ac575de036d4e4ca04b696f61ba2f91331e66106 | 8395 | REVIEW_REQUIRED |
| src/features/profile/services/profile-sync.ts | ADDED | fd9c2bd727ef52e7524a0f1a9fe64417e048ee90 | 1870 | REVIEW_REQUIRED |
| src/features/profile/services/profile.ts | MODIFIED | 70801feec3d6d200eb7a2001a3413b2feee0eebd | 12094 | REVIEW_REQUIRED |
| src/features/reminders/hooks/use-dhikr-reminder.ts | MODIFIED | 33f99cc4756b8f7f73db96f86718654c2883f0f1 | 8326 | REVIEW_REQUIRED |
| src/features/reminders/hooks/use-salawat-reminder.ts | MODIFIED | e5c23c537a7fe71182a707fecab11ffa1eb45025 | 12500 | REVIEW_REQUIRED |
| src/features/reminders/services/reminder-preferences.ts | MODIFIED | 04f03aa42620b8c898842b373fec12616382899e | 5336 | CONTENT_READ_TESTED_PASS |
| src/features/reminders/services/reminder-settings.ts | ADDED | ceacd1acdc136fb3f39f4adc0bd22b05d4c249f0 | 1726 | REVIEW_REQUIRED |
| src/features/reminders/services/reminder-timezone-sync.ts | ADDED | 4f775b633bbcf20fa6ab9d19f9d9a1e4c16f376e | 3137 | REVIEW_REQUIRED |
| src/features/social/services/facebook-credentials.ts | MODIFIED | 0a899f6e544170daf84f227d6061529a953037f6 | 25824 | REVIEW_REQUIRED |
| src/features/social/services/facebook-oauth-policy.ts | ADDED | 4255a4fa8d6f698c78b37fd1ba3effc3810c9284 | 510 | REVIEW_REQUIRED |
| src/features/social/services/facebook-queue-recovery-policy.ts | MODIFIED | 693b9177da465e9eeb1bec57507e6de1ab960cf0 | 6377 | REVIEW_REQUIRED |
| src/features/social/services/kids-video-social-visibility.ts | ADDED | e2cedf399ce113919867ad134d0a41777cccf399 | 8796 | REVIEW_REQUIRED |
| src/features/social/services/platform-availability.ts | MODIFIED | 0fc8de7b940948987e38841f3f75e16145234c89 | 15924 | CONTENT_READ_PENDING_TRACE |
| src/features/social/services/social-insights-sync-status.ts | ADDED | ce95d7e7b9200c1aa75d88f220c969be0ce0ef41 | 540 | CONTENT_READ_TESTED_PASS |
| src/features/social/services/social-publish-recovery-policy.ts | ADDED | f915f966c3b61c5a5756c13a83805025aff5b553 | 5575 | REVIEW_REQUIRED |
| src/features/social/services/social-publishing.ts | MODIFIED | 1839cb8add807b62199b48edf7daf0f4e7bdfae7 | 63689 | REVIEW_REQUIRED |
| src/features/social/services/social-queue-metadata.ts | ADDED | 7c4ab95e260299f38009b0c52ce9bd60af591dce | 9803 | CONTENT_READ_PENDING_TRACE |
| src/features/social/services/social-queue-selection.ts | MODIFIED | c58fb19e27a1d336c075f3f4dd08fefe4a50792a | 5391 | REVIEW_REQUIRED |
| src/features/social/services/written-content.ts | MODIFIED | 48e584bb1412fea3f45c108cb8ad32e6f3bf405a | 20417 | REVIEW_REQUIRED |
| src/features/social/services/youtube-oauth-credentials.ts | MODIFIED | 1b53e559c1e7b66ff43dcbd42e4870bced716812 | 5888 | CONTENT_READ_TESTED_PASS |
| src/features/social/services/youtube-video-disclosure.ts | ADDED | 46188e3a4c319b443dedb99f7591ab32caf397d6 | 1874 | REVIEW_REQUIRED |
| src/features/spiritual-ai/services/retriever.ts | MODIFIED | 5f1b1025d2caf2846a40580963b398e77ffd9160 | 12781 | REVIEW_REQUIRED |
| src/features/videos/providers/hf-space-provider.ts | MODIFIED | bc91a4e683f238a27b672030e3634047f3c7d402 | 8280 | CONTENT_READ_TESTED_PASS |
| src/features/videos/providers/types.ts | MODIFIED | 60a065094c53e0d0317ffa953ccc6ba6f3a382d8 | 5233 | REVIEW_REQUIRED |
| src/features/videos/services/background-job-outcome.ts | MODIFIED | 67aba7bed6d6acaaf781d50e5d34841a3d8ab217 | 4397 | REVIEW_REQUIRED |
| src/features/videos/services/background-job-settings.ts | ADDED | 6fe4773b8667c99668e0d222228bd86c90e0ded1 | 1559 | REVIEW_REQUIRED |
| src/features/videos/services/duplicate-video-recovery.ts | MODIFIED | 3f683834bd9ce8ee2c8d22e4118c131d476c0a5a | 4442 | CONTENT_READ_PENDING_TRACE |
| src/features/videos/services/video-automation-quota.ts | ADDED | 21979cba8c3e07fe7c9b3878507602f2b5d16c77 | 1201 | REVIEW_REQUIRED |
| src/features/videos/services/video-automation.ts | MODIFIED | cab86117ee21599a3bd3cfcb3440494da420d7bc | 27093 | REVIEW_REQUIRED |
| src/features/videos/services/video-lease-heartbeat.ts | ADDED | 6a37f0644d94cc39d9fdc64f370aacbd546a1776 | 2714 | REVIEW_REQUIRED |
| src/features/videos/services/video-media-audit-outcome.ts | ADDED | a8f9c3a0c3bcf096c1d8d1198509fa8aa0307f5e | 1409 | CONTENT_READ_TESTED_PASS |
| src/features/videos/services/video-media-contract.ts | MODIFIED | 5f30b92cdf0d55a33aebe9e36827bdfdf39481d3 | 14231 | CONTENT_READ_TESTED_PASS |
| src/features/videos/services/video-media-url.ts | ADDED | 1bee3a9b2ff103905c433696649982255d072873 | 2768 | REVIEW_REQUIRED |
| src/features/videos/services/video-publish-approval.ts | MODIFIED | 075972030389d03b4d324532efb3908db9bf7a8c | 9598 | REVIEW_REQUIRED |
| src/features/videos/services/video-queue-claim.ts | ADDED | a7008672cc6be6cc4193d791031da1c8a3d2f21f | 7279 | CONTENT_READ_TESTED_PASS |
| src/features/videos/services/videos.ts | MODIFIED | 2e81dc118c85b4637f628c51ac21116df323a059 | 10540 | REVIEW_REQUIRED |
| src/lib/ads/runtime-policy.ts | ADDED | bc5983b510df01b78e6cb129d39fc45d5c7ccb4b | 520 | CONTENT_READ_TESTED_PASS |
| src/lib/async-serial-queue.ts | ADDED | edbf8e7ccfc685996f3901617f36b0f1eeed7f75 | 303 | REVIEW_REQUIRED |
| src/lib/auth-enhanced.ts | MODIFIED | a64b46b73b1c3e6b50195311b225ad7fc8500d93 | 4859 | REVIEW_REQUIRED |
| src/lib/offline-pack.ts | MODIFIED | 2d3feee223b2d8457f7462b326a326f1f7523b64 | 22058 | REVIEW_REQUIRED |
| src/lib/offline-route-safety.ts | ADDED | 31e3e786326f9107bfebd467f11655603f112ab4 | 2754 | REVIEW_REQUIRED |
| src/lib/push-subscription.ts | MODIFIED | d5f0cd778d5e6ae9b743ac67707a3160275ea1bf | 5189 | REVIEW_REQUIRED |
| src/lib/request/bounded-json-body.ts | ADDED | 7839bc6dffff5a3543804ddd5027a13b64794941 | 2356 | CONTENT_READ_TESTED_PASS |
| src/lib/request/client-address.ts | ADDED | 849173b46f1d2a514528e69f8a225305ebcd80ce | 505 | REVIEW_REQUIRED |
| src/lib/safe-redirect.ts | ADDED | 77d04c3dcbbb269be022e9394871f83d25de9b2f | 957 | REVIEW_REQUIRED |
| src/lib/site.ts | MODIFIED | 315027458e621b963e9b014e6d2d49fa23115f17 | 10486 | CONTENT_READ_TESTED_PASS |
| src/lib/smartlink.ts | MODIFIED | 41410a919a5e4dc07c5d759d4adfa6c3267f7901 | 518 | REVIEW_REQUIRED |
| src/lib/supabase/admin-rest.ts | MODIFIED | 5dcd5ed0b44ae2b61109460f398ad98d766c2786 | 7286 | REVIEW_REQUIRED |
| src/lib/supabase/row-version.ts | ADDED | 5c540edd66d2836ed011b254956a9734e03b81a4 | 973 | CONTENT_READ_PENDING_TRACE |
| src/lib/supabase/server.ts | MODIFIED | 41acb47f0404d508437d0cb7ed32733790a9e280 | 9987 | REVIEW_REQUIRED |
| src/lib/timezone.ts | ADDED | 9092f78dcca95190b15712d00aa124c6be3de516 | 497 | REVIEW_REQUIRED |
| src/lib/types/supabase.ts | MODIFIED | d13532baa82c6a52f7893b97671238a0ad10a43c | 143047 | REVIEW_REQUIRED |
| src/proxy.ts | MODIFIED | d619f906b16ad81cfe6fa03945db59eed66dc5c8 | 3765 | REVIEW_REQUIRED |
| supabase/functions/prayer-notification-worker/delivery-lease.ts | ADDED | 99e5cc116240ac40d4e8a964127a9199eb6e6102 | 1734 | CONTENT_READ_TESTED_PASS |
| supabase/functions/prayer-notification-worker/eligibility.ts | ADDED | 919ec392d848dca85a662d83333378c820120a55 | 1082 | CONTENT_READ_TESTED_PASS |
| supabase/functions/prayer-notification-worker/index.ts | MODIFIED | e2a5499be84693091a8c2429ca88138d96241c76 | 37148 | CONTENT_READ_PENDING_TRACE |
| supabase/functions/prayer-notification-worker/pagination.ts | ADDED | cb29782035ddac43ecd89ae6be38ea205eeb79d2 | 1539 | CONTENT_READ_TESTED_PASS |
| supabase/functions/prayer-notification-worker/time-zone.ts | ADDED | ae3fc5f385065e178a62e12c64551ac39a5dbbb8 | 7832 | CONTENT_READ_TESTED_PASS |
| supabase/migrations/20261110212000_kids_content_public_read_respects_active_state.sql | ADDED | a78613f40f726d4f6a651537358dcbfd320b4ccd | 1126 | FIXED_TESTED_PENDING_LIVE_APPLY |
| supabase/migrations/20261111000000_revoke_anon_public_admin_predicate.sql | ADDED | dda93dde9da350241acaaff8716757de34cab971 | 292 | FIXED_TESTED_PENDING_LIVE_APPLY |
| supabase/migrations/20261111003000_expand_kids_content_supported_types.sql | ADDED | fc8f78f1952cda2b8e7d73ff19bdbcc3297681c7 | 529 | FIXED_TESTED_PENDING_LIVE_APPLY |
| supabase/migrations/20261111010000_background_reminders_respect_quiet_hours_timezone.sql | ADDED | bdaa9347e4ed82341e41cb530be2bdfaf6664a88 | 3689 | FIXED_TESTED_PENDING_LIVE_APPLY |
| supabase/migrations/20261111020000_admin_role_update_blocks_self_demotion.sql | ADDED | fc7b5a5f20ba00cc7f58999fd90f4f0d7fa8d574 | 4567 | FIXED_TESTED_PENDING_LIVE_APPLY |
| supabase/migrations/20261111030000_prophet_sections_public_read_requires_published_parent.sql | ADDED | cd4ded8e43abf387d8a43570efbb1419bca0b1c7 | 892 | FIXED_TESTED_PENDING_LIVE_APPLY |
| supabase/migrations/20261111040000_kids_game_levels_require_published_game.sql | ADDED | 7e34fab2d82f9041508d90a32f7eb4d1ece4d4a6 | 1505 | FIXED_TESTED_PENDING_LIVE_APPLY |
| supabase/migrations/20261111050000_admin_role_assignments_service_role_only.sql | ADDED | ed8db98ead1ee9d4ca3e3bc0687f1d9fe57a9615 | 1040 | FIXED_TESTED_PENDING_LIVE_APPLY |
| supabase/migrations/20261111153000_harden_video_storage_retention_rpc.sql | ADDED | 84df5125f490426cb9fa82c51a8a5ae851fd9c7b | 6979 | REVIEW_REQUIRED |
| supabase/migrations/20261111170000_kids_game_questions_require_published_parent.sql | ADDED | f82ded75be503f24cdbf7ca2fab2a5421f0efb70 | 1328 | FIXED_TESTED_PENDING_LIVE_APPLY |
| supabase/migrations/20261112103200_revoke_client_non_dml_table_privileges.sql | ADDED | 62aac500644bff871612b0fe0cc776611b589c77 | 898 | FIXED_TESTED_PENDING_LIVE_APPLY |
| supabase/migrations/20261113000000_background_reminder_intervals_allow_disabled.sql | ADDED | c67e6cfcf0b1ba85801dfbd3f8d0861826c9466c | 862 | FIXED_TESTED_PENDING_LIVE_APPLY |

## Open coverage and safety notes

- The main-baseline matrix remains at 1,525 REVIEW_REQUIRED rows and zero closed modules; this branch overlay does not close the main backlog.
- REVIEW_REQUIRED means the complete source/import/consumer/runtime trace is still open. CONTENT_READ_PENDING_TRACE means the source was inspected but its full consumer trace or exact-head test remains open. CONTENT_READ_TESTED_PASS means the current blob was read and its focused test passed on the preceding exact full-gate head where noted; it is not a module-wide closure. FIXED_TESTED_PENDING_LIVE_APPLY means the SQL contract passed but production migration application remains owner-gated.
- Twelve local migrations are absent from the 418 applied remote versions. Eleven remain test-backed/pending owner apply; the remaining migration is still REVIEW_REQUIRED pending re-read/retest. No production migration was applied.
- Supabase leaked-password protection remains disabled (security advisor WARN). The performance advisor reports 81 unused indexes; these are not proof that indexes are safe to delete.
- The production deployment and smoke results apply only to main@c4560d9ccb222bea5814cc4db32d4c3f1a2101b3. The audit branch has no Preview/production deployment. iOS AASA app identifiers and physical device acceptance remain open.
- PR #320 has no owner review. Do not merge until the CODEOWNERS owner review, exact-head checks, and all protected-branch requirements are satisfied.
- No content generation, Gemini work, social publishing, push notification, production database mutation, storage/media deletion, secret rotation, Android/iOS release, merge, or deployment was triggered.

The audit remains OPEN. No repository-wide error-free or project-closed claim is made.
