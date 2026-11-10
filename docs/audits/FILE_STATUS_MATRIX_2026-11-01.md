# ZIKR File Status Matrix — 2026-11-10

## Scope and coverage

- Repository: `zikrofficial-X/Zikr`
- Inventory baseline commit: `bb22f511281ea83b4c64e97f391f6ff1fcb07208`
- Tree source: GitHub recursive Git tree API; `truncated=false`.
- Tree entries: **2127** (1636 files and 491 directories).
- File inventory: **1636 / 1636 (100% of the main tree captured)**.
- Manifest: `docs/audits/REPO_MANIFEST_2026-11-10.jsonl` records path, Git blob/tree SHA, type, mode and byte size where applicable. Its own future blob SHA is excluded to avoid self-reference; it inventories the complete source tree at `bb22f511281ea83b4c64e97f391f6ff1fcb07208`.
- Delta from the previous audit-branch manifest: **3 added**, **1633 changed**, **1 removed** file paths.
- This is automated Git-tree inventory coverage, not manual code review or functional acceptance. Every unverified file remains `REVIEW_REQUIRED`.
- Applied Supabase migrations, native assets, compatibility routes, generated manifests, dynamic imports, workflow references and runtime-discovered files require domain-specific handling.

## Directory distribution

| Top-level path | Files |
|---|---:|
| `.circleci` | 1 |
| `.github` | 22 |
| `[root]` | 29 |
| `android` | 56 |
| `docs` | 168 |
| `ios` | 19 |
| `mobile` | 2 |
| `public` | 75 |
| `scripts` | 143 |
| `src` | 660 |
| `supabase` | 461 |

## File-by-file inventory

| Path | Status | Verification evidence |
|---|---|---|
| `.circleci/config.yml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e691af3687ddd96da337e1b0d5271178c2d5f444); dependency tracing and tests required. |
| `.env.example` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9cb7310c087c14bb6a439fe018810fc3ae4cc2b6); dependency tracing and tests required. |
| `.github/CODEOWNERS` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e722fdd15fb7e5dc68ccd9ed96eb44380af7e1c5); dependency tracing and tests required. |
| `.github/dependabot.yml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → dd530947831021bf02b472f6e0378cad3c97905a); dependency tracing and tests required. |
| `.github/ops/run-published-video-cleanup.trigger` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 46e80bff8350d090b940b7dacdf35cd3e5243ba4); dependency tracing and tests required. |
| `.github/workflows/android-native-login-test.yml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 02183a6ec4a8af2703c6e5af9dcf6b54ab890832); dependency tracing and tests required. |
| `.github/workflows/audit-video-media.yml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7008bf6bfc75cdd029a6adcf5e7f088a817a140e); dependency tracing and tests required. |
| `.github/workflows/backfill-legacy-video-qa.yml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ef4ff38aea10c648e80ddd46519e85c61933dbb2); dependency tracing and tests required. |
| `.github/workflows/circleci-config-validation.yml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 900255a62e7ae4af9e000e7191b9b17f48064225); dependency tracing and tests required. |
| `.github/workflows/dispatch-android-release-recovery.yml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → dfc3c1b54703b2957f3616742e094cc754e77750); dependency tracing and tests required. |
| `.github/workflows/english-content-sync.yml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f5550424862f72cd3e1ccfaa2e08401d6071692b); dependency tracing and tests required. |
| `.github/workflows/generate-ai-video.yml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d73df5b9d454878ccb166428398ad97d826b3d85); dependency tracing and tests required. |
| `.github/workflows/generate-written-content.yml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ac83425059317e181f2041a3464c0e1e25bc8a00); dependency tracing and tests required. |
| `.github/workflows/publish-android-release-assets.yml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e948e363477a4cef222a255fd9114b3327eb74f3); dependency tracing and tests required. |
| `.github/workflows/publish-social.yml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 799346623e75dbfed76b5d11b0547159d0d1dfe1); dependency tracing and tests required. |
| `.github/workflows/quality-gate.yml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 705db58536db3a813e2484506181f2cab2190813); dependency tracing and tests required. |
| `.github/workflows/reconcile-supabase-migration-history.yml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1d68dfaab901ec140535f0739e2b9992b0fb4128); dependency tracing and tests required. |
| `.github/workflows/refresh-offline-content.yml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 482d8fa9ef78650807815ecadd5062c5ab2fbddf); dependency tracing and tests required. |
| `.github/workflows/release-finalization.yml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c9ab2a3488498bddf1cb237bfc077a19f0388eb5); dependency tracing and tests required. |
| `.github/workflows/release-vercel.yml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 319e2b42695b7bdb11b050b2e11eebd7ee6d5184); dependency tracing and tests required. |
| `.github/workflows/storage-retention.yml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b0b467d03f126f6b61b1626269b1299a3f8620a9); dependency tracing and tests required. |
| `.github/workflows/supabase-production-health.yml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5dd3ae8af7b75fd339a2f603540f40c588ae658d); dependency tracing and tests required. |
| `.github/workflows/supabase-restore-seed-data.yml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ebecc5743cfe4e961b09a2e34cf60668087433af); dependency tracing and tests required. |
| `.github/workflows/sync-social-insights.yml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → cf1c70b970c07cca5d3057518dd1a639ca7e7ac8); dependency tracing and tests required. |
| `.gitignore` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8a3693451009b2c7945d696ce73da22bacc9c137); dependency tracing and tests required. |
| `.prettierignore` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 72842592fd0b2d2e7e186e4beeeacada46dabed7); dependency tracing and tests required. |
| `.prettierrc` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 67c0bc83c28a85bbcd4cb081fa91d30b4a79fcfd); dependency tracing and tests required. |
| `.release-tag` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6a99dbb7fd746dc01ec64d847f110bbb56119554); dependency tracing and tests required. |
| `.vercelignore` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9d0d2b77c5cddff416b5381879cad3f997b6c6fc); dependency tracing and tests required. |
| `AGENTS.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → af3b7c84114bafeee578bf1adff2ef74af2cc6a2); dependency tracing and tests required. |
| `android/.gitignore` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d93032f878297e501b50f221731d97e42371d740); dependency tracing and tests required. |
| `android/app/.gitignore` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 043df802a29f1f386a23cba600c84be8eee2a0c6); dependency tracing and tests required. |
| `android/app/build.gradle` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1ca32ce6abc138aca90ebe6e499622e9acdf51c7); dependency tracing and tests required. |
| `android/app/capacitor.build.gradle` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d1d967c27e4f85d5689f79b829afa415bf0ec41f); dependency tracing and tests required. |
| `android/app/proguard-rules.pro` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f1b424510da51fd82143bc74a0a801ae5a1e2fcd); dependency tracing and tests required. |
| `android/app/src/main/AndroidManifest.xml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 96822a3025b5e0d73046f55f8806c12f872a505b); dependency tracing and tests required. |
| `android/app/src/main/java/com/zikr/app/MainActivity.java` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 305e9f860952b209f5a9da454e39611fb86e51ed); dependency tracing and tests required. |
| `android/app/src/main/res/drawable-land-hdpi/splash.png` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e31573b4fc93e60d171f4046c0220e1463075d9e); dependency tracing and tests required. |
| `android/app/src/main/res/drawable-land-mdpi/splash.png` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f7a64923ea1a0565d25fa139c176d6bf42184e48); dependency tracing and tests required. |
| `android/app/src/main/res/drawable-land-xhdpi/splash.png` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 807725501bdd92e94e51e7b2b0006f69e0083a0b); dependency tracing and tests required. |
| `android/app/src/main/res/drawable-land-xxhdpi/splash.png` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 14c6c8fe39fcd51a0414866ad28cbe8ff3acb060); dependency tracing and tests required. |
| `android/app/src/main/res/drawable-land-xxxhdpi/splash.png` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 244ca2506dbe0fd8f6a05520ac7d1a629ea81438); dependency tracing and tests required. |
| `android/app/src/main/res/drawable-port-hdpi/splash.png` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 74faaa583c8221c27a8cb822c3fbe218bafa3299); dependency tracing and tests required. |
| `android/app/src/main/res/drawable-port-mdpi/splash.png` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e944f4ad4e1ca1c8cf9a87b366acc01c4e5c1616); dependency tracing and tests required. |
| `android/app/src/main/res/drawable-port-xhdpi/splash.png` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 564a82ff954aec267492467c0169a270c4e8fea9); dependency tracing and tests required. |
| `android/app/src/main/res/drawable-port-xxhdpi/splash.png` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → bfabe6871a17a5e95b78fb30d49b7d2b4d2fe4c0); dependency tracing and tests required. |
| `android/app/src/main/res/drawable-port-xxxhdpi/splash.png` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6929071268eb03ee0f088142b6523566b78550e2); dependency tracing and tests required. |
| `android/app/src/main/res/drawable/ic_launcher_background.xml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d5fccc538c179838bfdce779c26eebb4fa0b5ce9); dependency tracing and tests required. |
| `android/app/src/main/res/drawable/ic_launcher_foreground.png` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8905acd71562c4e2b64db2f7dc00844e6a062dec); dependency tracing and tests required. |
| `android/app/src/main/res/drawable/ic_stat_zikr.xml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9cbd1215e796c004e008df174182ef4385b20f36); dependency tracing and tests required. |
| `android/app/src/main/res/drawable/splash.xml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4f369306b8a25f879775a7214dfecd3a9c4a23a8); dependency tracing and tests required. |
| `android/app/src/main/res/layout/activity_main.xml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b5ad1387011da0894cc1d91f44f3bd77f5403f5d); dependency tracing and tests required. |
| `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7353dbd1fd82487df2d06121f85f7994728f1070); dependency tracing and tests required. |
| `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7353dbd1fd82487df2d06121f85f7994728f1070); dependency tracing and tests required. |
| `android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d4a8d192de6ff08517a9bd25ff9cefcff3af66a3); dependency tracing and tests required. |
| `android/app/src/main/res/mipmap-hdpi/ic_launcher.png` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5faf0d388e21ddf4dad4046c67a0a274c6077d22); dependency tracing and tests required. |
| `android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b4a0bba4c0f1bcb92e5cdd2297c84a427a0ad7a6); dependency tracing and tests required. |
| `android/app/src/main/res/mipmap-mdpi/ic_launcher.png` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b0b669a4e816d552a41319bd23db0c4d7f32f0b9); dependency tracing and tests required. |
| `android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → acbb08267a70a5ba9de4fe218bd722a8f6e4c660); dependency tracing and tests required. |
| `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 86df01da116d95dbe44d3791f6e12e570bf53903); dependency tracing and tests required. |
| `android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 002dfb140fc75c3055fb3ff4e4f5376a2cd178b0); dependency tracing and tests required. |
| `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9be5b1140f4f3defa70740b328914b548aa67da2); dependency tracing and tests required. |
| `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 06269e488cbcf37fc6cfb66612e1becabb52f430); dependency tracing and tests required. |
| `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7cc0bcbd826e3b910d8d09ff1e80a10e9cdc35d7); dependency tracing and tests required. |
| `android/app/src/main/res/raw/adhan_01_charon.wav` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 692a59b5482915db6674790d0de1e43f9acbca47); dependency tracing and tests required. |
| `android/app/src/main/res/raw/adhan_02_algieba.wav` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6bbd73889e087387c93565546e4a14158883e1cd); dependency tracing and tests required. |
| `android/app/src/main/res/raw/adhan_03_enceladus.wav` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 17cf7ce400a2111d5a261c28bef8cd2d0298dd75); dependency tracing and tests required. |
| `android/app/src/main/res/raw/adhan_04_iapetus.wav` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2015e1931e22c762858f96c02d937c772208e79a); dependency tracing and tests required. |
| `android/app/src/main/res/raw/adhan_05_alnilam.wav` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d41d5d0c36ee04586ae0c524b893f652bfc0ea9e); dependency tracing and tests required. |
| `android/app/src/main/res/raw/adhan_alt.mp3` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 84638c0f13d3c3d6b877f313d27c95b4e541a82e); dependency tracing and tests required. |
| `android/app/src/main/res/raw/adhan.wav` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → df4787311e1faaebe42514a9267b9afd456b4142); dependency tracing and tests required. |
| `android/app/src/main/res/raw/salawat.wav` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4d3bb47cbc7d1dc37530adf7e61b211854cf5e52); dependency tracing and tests required. |
| `android/app/src/main/res/values/colors.xml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8aae936a799cafa31ef56e94a47d725027519cc9); dependency tracing and tests required. |
| `android/app/src/main/res/values/strings.xml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 605c46aa798b82a10ab48391d40ba8b2c49fb613); dependency tracing and tests required. |
| `android/app/src/main/res/values/styles.xml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b03033286daa972a414ad308d21ac0a33bb6c4a6); dependency tracing and tests required. |
| `android/app/src/main/res/xml/file_paths.xml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → bd0c4d80d0473953333d5adb0d38ac713d0d648b); dependency tracing and tests required. |
| `android/app/src/main/res/xml/network_security_config.xml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 34604acf62213a9f964fa2baf3a5a62824f13508); dependency tracing and tests required. |
| `android/build.gradle` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d9fc81f35372be7c547b0d4672e0f34cc01e8294); dependency tracing and tests required. |
| `android/capacitor.settings.gradle` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6fb76f5e1771eed1aa59a9957966cba1aa983750); dependency tracing and tests required. |
| `android/gradle.properties` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0168a630994f822eda8d3269735e209a02540d49); dependency tracing and tests required. |
| `android/gradle/wrapper/gradle-wrapper.jar` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a4b76b9530d66f5e68d973ea569d8e19de379189); dependency tracing and tests required. |
| `android/gradle/wrapper/gradle-wrapper.properties` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ed4c299adbd58d353a07c24fbe4751791c5d4ee8); dependency tracing and tests required. |
| `android/gradlew` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f5feea6d6b116baaca5a2642d4d9fa1f47d574a7); dependency tracing and tests required. |
| `android/gradlew.bat` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9b42019c7915b971238526075306ffba3b666dd5); dependency tracing and tests required. |
| `android/settings.gradle` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 3b4431d7724bd82d1aeb2ce59e7a0504b8869f81); dependency tracing and tests required. |
| `android/variables.gradle` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b9b046a22b8df5f01d325fe5e2cac7e7e1237134); dependency tracing and tests required. |
| `BRAND_ASSETS_README.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → fff67672e91096054f469193ee3f1b34e98e9123); dependency tracing and tests required. |
| `capacitor.config.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 17ce2f556ce3bbfa82c57665b305f43be2a0ee85); dependency tracing and tests required. |
| `CLAUDE.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 43c994c2d3617f947bcb5adf1933e21dabe46bb5); dependency tracing and tests required. |
| `components.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 723b14b8df19bab4c3696be5a96f8177783581f9); dependency tracing and tests required. |
| `DEPLOYMENT_CHECKLIST.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c7fb700b9f3750df36ba34609e812be3d58f0232); dependency tracing and tests required. |
| `docs/ADMIN_REORGANIZATION_PLAN_2026-10-30.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f3f87e9dc72259020340d2059a951e95ae8ec7a3); dependency tracing and tests required. |
| `docs/admin/ADMIN_API_PERMISSION_MATRIX_2026-11-06.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ff99f964bd5d708b2d812c86acd51e5990f3bf7b); dependency tracing and tests required. |
| `docs/admin/ADMIN_CONSOLE_GOVERNANCE.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9a2a8a919817287f57238158ec56e355853ea1f6); dependency tracing and tests required. |
| `docs/admin/ADMIN_ROLLOUT_CHECKLIST.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6784c801657e37851f6bfc232b4868493aa62796); dependency tracing and tests required. |
| `docs/admin/GA4_REPORTING_SETUP.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 56592541f01c6b17f5aaff1b62214a4ac44285d0); dependency tracing and tests required. |
| `docs/admin/SOCIAL_PUBLISHING_OPERATIONS.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d51be3200e323eefb96b495a2b673434cb2a4d4f); dependency tracing and tests required. |
| `docs/admin/ZIKR_TRAFFIC_REVENUE_ENGINE.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0165a2e1b874cbf1664456c90ff509248fdc4186); dependency tracing and tests required. |
| `docs/ADSENSE_REVIEW_2026-10-15.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 84536eb259159b16ffff837cee004f60ac86e186); dependency tracing and tests required. |
| `docs/ADSENSE_SETUP.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 042a85eca8ca23c1d8dda98a364325241ecaabe8); dependency tracing and tests required. |
| `docs/api/openapi.yaml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7deae43f200c46081626b2c10b4934435331a143); dependency tracing and tests required. |
| `docs/api/postman_collection.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 11172c3e83105a040a8492c461f377ef1c123e45); dependency tracing and tests required. |
| `docs/api/README.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → dc2d11d6ce555ddcb8272b8fa8f195db29e440d9); dependency tracing and tests required. |
| `docs/apk-github-release-plan.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1e7cbe2bd028e3bac92e82496adb0f9215912aa3); dependency tracing and tests required. |
| `docs/apply-verified-content-pack.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 124a8865336c9c0c1633c3b39742e0d096199d2a); dependency tracing and tests required. |
| `docs/ARCHITECTURE.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b2776e342cd91a31c05f32a118d63b6eb222b047); dependency tracing and tests required. |
| `docs/archive/AUDIT_2026_10_08_BASELINE.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 86ac7ef9b48efe88ffe83d3ba559f93649096634); dependency tracing and tests required. |
| `docs/archive/CONTENT_AND_PAGES_AUDIT_20260929.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → bf5db474b263f44277127d108df365be6b5a2bf2); dependency tracing and tests required. |
| `docs/archive/CONTENT_DATABASE_AUDIT_20260929.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a24c43406fa403b48eaa82431148c92b42234171); dependency tracing and tests required. |
| `docs/archive/DEPLOYMENT_READY_CHECKLIST.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6a9435a595929c3aeb0cb3ddbdf5a1c11f6ccac8); dependency tracing and tests required. |
| `docs/archive/FINAL_DELIVERY_SUMMARY_v1.1.0.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5efde3e576a86059951f9bc5f0e81d08dade2937); dependency tracing and tests required. |
| `docs/archive/IMPLEMENTATION_GUIDE_KIDS_ENHANCEMENT_v1.1.0.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4f10e43ba76c833ec1dbd53f25738772e6dcd35f); dependency tracing and tests required. |
| `docs/archive/KIDS_GAMES_3.0_AUDIT.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d1ee121b71e03666233416e13c212e38e1a4d533); dependency tracing and tests required. |
| `docs/archive/KIDS_GAMES_COMPREHENSIVE_AUDIT.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 147ec3dfde73703ecb51d5ab48e697e440cc81d3); dependency tracing and tests required. |
| `docs/archive/KIDS_GAMES_IMPLEMENTATION_v1.1.0.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c4068243873e6d6d69f18c33f1df3234c5814592); dependency tracing and tests required. |
| `docs/archive/KIDS_SECTION_AUDIT_v1.1.0.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9568c6171a1d478a015e3224e3c889e96d9ec928); dependency tracing and tests required. |
| `docs/archive/KIDS_SECTION_ENHANCEMENT_SUMMARY.txt` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 44eecc3779d2135c0cd2dd3e48849dfcc830989d); dependency tracing and tests required. |
| `docs/archive/MIGRATION_HANDOFF_20260920.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a828cce2dea8d4edc085a4a39a4bdd8fbd5742d1); dependency tracing and tests required. |
| `docs/archive/migration-parity-2026-09-01.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 16d896708d300a84a5c1c7dbafa546cc904c7906); dependency tracing and tests required. |
| `docs/archive/NATIVE_YOUTUBE_FACEBOOK_PHASE1.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2598a8607977a84e33553f7c0759d3b84b4e2297); dependency tracing and tests required. |
| `docs/archive/PROJECT_AUDIT_REPORT.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b00f5ecffab0c5343be2d9d532b70d89d4893424); dependency tracing and tests required. |
| `docs/archive/PROJECT_STATUS_v1.1.0_FINAL.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e2f2d9744672dc900d18adb55407313a62370539); dependency tracing and tests required. |
| `docs/archive/README.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6eb8b68984a7000e2e1486298d1d39f14aaf6594); dependency tracing and tests required. |
| `docs/archive/release-ci-fix-v1.3.2.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e4e8e50ee0fb926ee682d6caec4d939d102606dc); dependency tracing and tests required. |
| `docs/archive/release-status-1.4.2.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9b8dd82eecde0e23e94152df24f4f0b39adb2c11); dependency tracing and tests required. |
| `docs/archive/SUPABASE_MIGRATION_AUDIT_OLD_2026-09-29.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2538b736a9c3cedda2c6176410ba8ab793e7320b); dependency tracing and tests required. |
| `docs/assets-guide.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 496abc40539f922b9896298c53e698901b0ea1b9); dependency tracing and tests required. |
| `docs/audio/HUMAN_AUDIO_LIBRARY_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2430ff9df2ee3bb081180d8fd9e41b4fe37c30b1); dependency tracing and tests required. |
| `docs/audits/ADMIN_CONSOLE_CLOSEOUT_2026-11-10.md` | REVIEW_REQUIRED | New path at baseline bb22f511281ea83b4c64e97f391f6ff1fcb07208 (blob c71ffe9eb270543c05431f7d188b002d11d0aa9e); usage/dependency review pending. |
| `docs/audits/ADMIN_CONTROL_CENTER_2.0_AUDIT_PLAN_2026-11-06.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7387af5d46907272037520b104f42b79b513ba48); dependency tracing and tests required. |
| `docs/audits/ADMIN_CONTROL_CENTER_2.0_EXECUTION_2026-11-06.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 645787f9652f1f2368c54d127e798f2ad2da7c58); dependency tracing and tests required. |
| `docs/audits/ADMIN_CONTROL_CENTER_CLOSEOUT_2026-11-06.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 400a77eab1cbb9db7f6f8ebfc5ac2e3f1794887f); dependency tracing and tests required. |
| `docs/audits/ARCHITECTURE_MAP_2026-11-01.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b96835e6a1dc30d40568bbc9891d7d5278a4b2b0); dependency tracing and tests required. |
| `docs/audits/FILE_STATUS_MATRIX_2026-11-01.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 3113e99e623f52335a8e27e6c0300f547baaaf4b); dependency tracing and tests required. |
| `docs/audits/PG_CRON_RUNTIME_AUDIT_2026-11-01.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5fc0a95e8227bf2f3c8608d26db6c204c937a03a); dependency tracing and tests required. |
| `docs/audits/PLATFORM_READINESS_2026-11-01.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ed882af34988c81d7e7992758b1f0a511cb14eda); dependency tracing and tests required. |
| `docs/audits/production-snapshot-2026-11-01.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2896e369263b5aa51b35b1ad74175369c621a9f8); dependency tracing and tests required. |
| `docs/audits/REMEDIATION_CLOSEOUT_2026-11-01.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0e8b7cf04531894d1020821de299d1179c8074b4); dependency tracing and tests required. |
| `docs/audits/VERCEL_ENV_AUDIT_2026-11-01.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f928a11e8877b439bf9b2c7b40145139f36a4aa7); dependency tracing and tests required. |
| `docs/audits/VIDEO_FACTORY_STATUS_2026-11-01.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c7fed263652485791b03fc15eef348182e0e4669); dependency tracing and tests required. |
| `docs/AUTH_SYSTEM_GUIDE.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → de2c4753b040087938f2929c0e4a7c26494620fa); dependency tracing and tests required. |
| `docs/AUTOMATION_OWNERSHIP_2026-10-08.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → dde8ae199d317cb2b5725be6bffe4fe1000aa015); dependency tracing and tests required. |
| `docs/background-jobs.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7de70c19fb3c737f403b11290a53cba21dbc5ff4); dependency tracing and tests required. |
| `docs/branding/identity-rollout.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ccfc1a9502914e7e87c482c110798e2e29eb0a07); dependency tracing and tests required. |
| `docs/CANONICAL_AUTH_CONFIG.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6ae33bec06dc548e8efa10e200723925688bb811); dependency tracing and tests required. |
| `docs/CI_CD_ARCHITECTURE_2026_10_08.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → abc86b6e6b1e0b21f377fd46560b46457222cac1); dependency tracing and tests required. |
| `docs/CI_CD_WORKFLOWS_REVIEW_2026_10_08.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 42eed72acb7a8c088ad5f2886d2010d04fc8a152); dependency tracing and tests required. |
| `docs/circleci-supabase-environment.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1b9cc7dd35cf3a6d88ff997d217ce888990bf081); dependency tracing and tests required. |
| `docs/closeout/ZIKR_ALL_PLANS_CLOSEOUT_2026-10-30.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6ba1e474b92cbaee52db3fc1cf0adca77e0a003e); dependency tracing and tests required. |
| `docs/companion-scholar-source-notes-2026-08-22.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ee5a1f7cd2dce6dc6bd0b5217f1d37d10bbe4df0); dependency tracing and tests required. |
| `docs/controlled-release.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f824bc3ea651b58be6da39bc12a50c8ab653b0c7); dependency tracing and tests required. |
| `docs/daily-content-operations.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9db2002ffb7b187f5737c3026d421de2e48769f3); dependency tracing and tests required. |
| `docs/DATABASE_SCHEMA_INDEX.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 3aec90c5c028481ce5cf03d8dc9ac969b8d848f2); dependency tracing and tests required. |
| `docs/DEPLOYMENT_GUIDE.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 047f9c45c031a27e271851e7e7c24bb04dfc41cc); dependency tracing and tests required. |
| `docs/deployment-sync.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e9c9a29b36963343e7519813032d31a9565d3bbe); dependency tracing and tests required. |
| `docs/e2e-test-report-2026-10-15.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 68e3d59da3720df84f0a6e16e4ce0828ecd68783); dependency tracing and tests required. |
| `docs/ENABLE_GOOGLE_OAUTH.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 55dab4dfcc3e5475223c3a36f212863d4b7c6e92); dependency tracing and tests required. |
| `docs/ENVIRONMENT_GOVERNANCE_2026-10-08.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d7afa6d642f2ff2133b71faaf070ac926a60a941); dependency tracing and tests required. |
| `docs/environment-variables.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → bdcb6ce02042be18a954991f5740222886caec0a); dependency tracing and tests required. |
| `docs/facebook-oauth-reconnection.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → bfc2e67a4603c7073feb686dfefce006473894ad); dependency tracing and tests required. |
| `docs/facebook-page-verification-2026-08-22.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ed84ce32ab575c9755a75b74df4debe2faeec879); dependency tracing and tests required. |
| `docs/finalization/ANDROID_RELEASE_RECOVERY.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → efb8f874f2622e263b5bf5249985ae4bd43d579a); dependency tracing and tests required. |
| `docs/finalization/android-release-recovery-run-v1.1.3.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 652125defbe8dea7e930cbf8f50ee43642f8815e); dependency tracing and tests required. |
| `docs/finalization/DATA_LIFECYCLE_MANIFEST_2026-10-02.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9977d1b1d39bc1ddb0364218369faf53b69df08b); dependency tracing and tests required. |
| `docs/finalization/DEPRECATION_MATRIX_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 195f57537496f37d9a3ae9531acd5e0746ae8b6c); dependency tracing and tests required. |
| `docs/finalization/PHASE_0_1_BASELINE_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4197d5f80a0b40cb4840e357b3300f7cdc1cec4b); dependency tracing and tests required. |
| `docs/finalization/PHASE_0_1_FILE_INVENTORY_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 836e0cf0f9d5cb3ba646035c08fd241d2fa80c70); dependency tracing and tests required. |
| `docs/finalization/PHASE_10_CHECKPOINT_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 39df6cb3672fdebf33bb95696da000d74c4da506); dependency tracing and tests required. |
| `docs/finalization/PHASE_10_VIDEO_FACTORY_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c30ef305b8f518fc25a5c99c4af40723dc8ba858); dependency tracing and tests required. |
| `docs/finalization/PHASE_11_AI_VISUAL_FACTORY_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 986e0635bbfa1e9fb7a95098fa7c0637aa0af95e); dependency tracing and tests required. |
| `docs/finalization/PHASE_11_CHECKPOINT_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a2e1613d2db9d869389f0101910579270abdceff); dependency tracing and tests required. |
| `docs/finalization/PHASE_12_CHECKPOINT_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7611ac25f9f7eb0e11e8960725d3732a2f603230); dependency tracing and tests required. |
| `docs/finalization/PHASE_12_VIDEO_QA_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 149c420b707d95c0f2f35c01081e8696d4c7f3bd); dependency tracing and tests required. |
| `docs/finalization/PHASE_13_CHECKPOINT_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c87eb8764381a016efaab35b4a4c0ca70b247e10); dependency tracing and tests required. |
| `docs/finalization/PHASE_13_SCHEDULER_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4c86c63f880c076d7efa02006dec82039e1e2c50); dependency tracing and tests required. |
| `docs/finalization/PHASE_14_CHECKPOINT_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 313e7b456972225e1e4a5e73e3d1110448af0ad9); dependency tracing and tests required. |
| `docs/finalization/PHASE_14_SOCIAL_PUBLISHING_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1e9705b6ee44ebf2cf42314e7490902c60433889); dependency tracing and tests required. |
| `docs/finalization/PHASE_15_ADMIN_VIDEO_FACTORY_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 16297da2cc673bfb5787dc2ddacbed218ff752bf); dependency tracing and tests required. |
| `docs/finalization/PHASE_15_CHECKPOINT_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 65d745bb47186c84a471a68456a0731c4a777b13); dependency tracing and tests required. |
| `docs/finalization/PHASE_15_KIDS_PRODUCTION_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → eeced9c5307702181797b06a7820db3512d2fc5e); dependency tracing and tests required. |
| `docs/finalization/PHASE_16_23_MASTER_PLAN_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1ce5c6080fa7a9c7e105d09c97461b04f9ab77a4); dependency tracing and tests required. |
| `docs/finalization/PHASE_16_ADMIN_ROUTE_HARDENING_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 891d7f7c4980df74a410db3d69439a5abf904f0f); dependency tracing and tests required. |
| `docs/finalization/PHASE_17_DATA_LIFECYCLE_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5e73b0013fcdc240634139fdc992e2acfa3e2b7c); dependency tracing and tests required. |
| `docs/finalization/PHASE_18_DB_RETIREMENT_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 78868ffc2ffac139fe73a2225621e6c333404aa0); dependency tracing and tests required. |
| `docs/finalization/PHASE_19_INDEX_GOVERNANCE_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a8c2f181559c0a745619a3699ab1ff7fda3001a0); dependency tracing and tests required. |
| `docs/finalization/PHASE_2_ARCHITECTURE_MAP_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1a23d41ef3db11124ec15945f427e7d41fa95024); dependency tracing and tests required. |
| `docs/finalization/PHASE_2_CHECKPOINT_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → cc7ca79ccea9a96aa7baf1789810d93790d02983); dependency tracing and tests required. |
| `docs/finalization/PHASE_20_ASSET_HYGIENE_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 22fb90d360e1e925b0879306cf24a3f792788a15); dependency tracing and tests required. |
| `docs/finalization/PHASE_21_TEST_QA_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 07f58308f4e647c13ef7826c85602338bad2d064); dependency tracing and tests required. |
| `docs/finalization/PHASE_22_RELEASE_CLOSURE_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 08be578d4ae8bb0844b38c84e0d3df8f8a2c6003); dependency tracing and tests required. |
| `docs/finalization/PHASE_3_CHECKPOINT_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 775c72a0721948747369eadee71189f3c16eaf73); dependency tracing and tests required. |
| `docs/finalization/PHASE_3_DATABASE_CANONICALIZATION_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 375d6e47b19fca2aaeedaf1c07c3656c14899843); dependency tracing and tests required. |
| `docs/finalization/PHASE_4_CHECKPOINT_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → fac83e360b54fb59ae38580d92ed3c5f2908921f); dependency tracing and tests required. |
| `docs/finalization/PHASE_4_MIGRATION_RECONCILIATION_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 55a9d1db83ab2460834e15514402d3908d530ed7); dependency tracing and tests required. |
| `docs/finalization/PHASE_5_CHECKPOINT_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c9a4fc8ba61d05d9958a9314ec9b0d807d2af13d); dependency tracing and tests required. |
| `docs/finalization/PHASE_5_ENVIRONMENT_RECONCILIATION_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1b96f8db813a0ab368b41026abd63735549b11e6); dependency tracing and tests required. |
| `docs/finalization/PHASE_6_CHECKPOINT_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ac65a6779725e1ac192927ba0243854f30395457); dependency tracing and tests required. |
| `docs/finalization/PHASE_6_SECURITY_HARDENING_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d6ed72b8519f78c30c232ed4dff7f2a8e1dc1ef1); dependency tracing and tests required. |
| `docs/finalization/PHASE_7_CHECKPOINT_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 32a864828971a4e52b760c52e2c78245b01d8356); dependency tracing and tests required. |
| `docs/finalization/PHASE_7_CONTENT_CANONICALIZATION_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f06749a4b1ae45be604bb56d70281b30351bff3c); dependency tracing and tests required. |
| `docs/finalization/PHASE_8_CHECKPOINT_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 08c00d63ee432c91ef45b0df9d5daf51eb93ac56); dependency tracing and tests required. |
| `docs/finalization/PHASE_8_QURAN_CANONICALIZATION_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5b58090ad26289b1f2ec077024953b8ab099046d); dependency tracing and tests required. |
| `docs/finalization/PHASE_9_CHECKPOINT_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4da8a0e7ca06a14c1b8e846454260a9fe01a424d); dependency tracing and tests required. |
| `docs/finalization/PHASE_9_VOICE_FACTORY_2026-10-02.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → bfc0f56bcf2df7bc3770356ba80b3abc2e1d26ce); dependency tracing and tests required. |
| `docs/finalization/preview-payload-and-ci-fallback-20261009.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6c5f2955b7c16ea8c1c795a5e2d0306940dc6574); dependency tracing and tests required. |
| `docs/finalization/PRODUCTION_HARDENING_2026-10-04.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 999913a32c4f19de8b178e1008e78fb29fb7cae7); dependency tracing and tests required. |
| `docs/finalization/PRODUCTION_RELEASE.flag` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a661bae75ca521f5d947b7e9b0a511d85f6d1c25); dependency tracing and tests required. |
| `docs/finalization/RELEASE_RETRY.flag` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7ad0c7a6c16b2d73e43ed1094a62d6a4e3a66b64); dependency tracing and tests required. |
| `docs/finalization/ZIKR_ALL_PLANS_CLOSEOUT_2026-10-30.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 08ce0e10a1c81483cf9c3ab36f0ed8eff4cadd73); dependency tracing and tests required. |
| `docs/GITHUB_AI_VIDEO.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5d80734970d088813938da2fc8a75c63189b1cc8); dependency tracing and tests required. |
| `docs/GITHUB_AUTOMATION_AUDIT_2026-10.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 00102cd48204f2c775fa4366f7dbf8debe7b0c9a); dependency tracing and tests required. |
| `docs/GITHUB_VERCEL_SUPABASE_SYNC.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 49cf2372d4b83d36fee2ae5c6717c029404cd9e6); dependency tracing and tests required. |
| `docs/google-search-console-verification.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 073ab49e17219becbb2d3f103c1d5e9379f781d8); dependency tracing and tests required. |
| `docs/INFRASTRUCTURE_AUDIT_2026-10-30.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d3c14e0822ed2e8d3772f4fed935a0b0b137092c); dependency tracing and tests required. |
| `docs/KIDS_GAME_ASSETS.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 67c3006c8c3aa2dd716cafd0a80848b15462d268); dependency tracing and tests required. |
| `docs/kids-content-editorial-audit-2026-10-21.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0bb35908f2de4dd2393c80d64c1cf7bd4f56b5b2); dependency tracing and tests required. |
| `docs/kids-video-series-free-factory.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d57e0b46dc96419227807eefeeb39d29acbd826d); dependency tracing and tests required. |
| `docs/kids-world-evolution-roadmap.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 74482bf670fc9453e05631ca8960cb8b9b4b9cb0); dependency tracing and tests required. |
| `docs/kids-world.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 332b16f6815ca9d10ceaf2db8a764958d539b156); dependency tracing and tests required. |
| `docs/LAUNCH_CHECKLIST.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b1ea54ee20362684169ec1ee418794b4ad810964); dependency tracing and tests required. |
| `docs/LOCAL_NATIVE_BACKFILL.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 454164f1973543ef6a211ffb759c041d2d81b9d9); dependency tracing and tests required. |
| `docs/MASTER_GROWTH_RENEWAL_PLAN_2026-10-20.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8dc42058a82a5f1e0b0cfaf55d6523cfa007b309); dependency tracing and tests required. |
| `docs/MIGRATION_DUPLICATE_POLICY.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f15e0fe0613cbe3ba93493a4b5471c61873c2934); dependency tracing and tests required. |
| `docs/MONETAG_SMARTLINK_PLACEMENT.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 753d054a4362121bc1e2915ed73d0cfa75e8e164); dependency tracing and tests required. |
| `docs/NATIVE_BACKFILL_STATUS.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 256d17a1e7fb3d2a4137afe82414cfb37305378d); dependency tracing and tests required. |
| `docs/native-oauth-fix.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 97e90444829c2f07b4b9b750e8473db9dda3e012); dependency tracing and tests required. |
| `docs/NEXT_PROGRAMMING_PHASE_PLAN_2026-10-30.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2a29aeada48ff429ddc723fe58a5d4d4b3bd11f2); dependency tracing and tests required. |
| `docs/OAUTH_FIX_NOTES.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 057f1dcbebccb7c6d4453503cf39722cf95dc772); dependency tracing and tests required. |
| `docs/OFFLINE_CONTENT_OPERATIONS.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 815a19b17c268c825c7c8248775926cd06dd7994); dependency tracing and tests required. |
| `docs/OFFLINE_SUPPORT.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 33b2be7f4d4061df74640beb5fd73aa4879d8a03); dependency tracing and tests required. |
| `docs/production-scheduling.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a262ef2b5dc59b8c9bde6574a37157c6656326c1); dependency tracing and tests required. |
| `docs/README_RELEASE.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 470251332160f67be5b0a4313b6b7869ec6e5a30); dependency tracing and tests required. |
| `docs/releases/1.1.1.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2c14acce0055dfe09b7adcc4e7bfe16645625933); dependency tracing and tests required. |
| `docs/releases/1.1.10.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2e1d117d8c04e59e64c0e1142871b325a6fd4d3d); dependency tracing and tests required. |
| `docs/releases/1.1.11.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 3b4a5c0f5e3f5e856c38e352495e491df0fef327); dependency tracing and tests required. |
| `docs/releases/1.1.12.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 469d3cec44ed65e36fa742183fd9369f9a969275); dependency tracing and tests required. |
| `docs/releases/1.1.13.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → dd721ac6c5a43eb4500f9042332a30c75ef4fee0); dependency tracing and tests required. |
| `docs/releases/1.1.14.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e28bc90b61aec1975d0302da2734237bfe2aa6cc); dependency tracing and tests required. |
| `docs/releases/1.1.2.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8a853d91334e78e8e95ac3cc466b3c2c434e0825); dependency tracing and tests required. |
| `docs/releases/1.1.3.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6971915517a6ae8e1eec968b93b9394d8abe88ac); dependency tracing and tests required. |
| `docs/releases/1.1.4.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 93e764c84ff85690683f05b2cd8072cf536a353b); dependency tracing and tests required. |
| `docs/releases/1.1.5.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 769611769e22168449fd08bd7087fdf00624ba97); dependency tracing and tests required. |
| `docs/releases/1.1.6.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 56644c6c9ae1324a44b999c3b94bbf36ccda79c7); dependency tracing and tests required. |
| `docs/releases/1.1.7.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8988206235550b72bc01f663cd029222b0be857a); dependency tracing and tests required. |
| `docs/releases/1.1.8.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 291ec048b5d3f5b803a7eaafbf46a754c371f97f); dependency tracing and tests required. |
| `docs/releases/1.1.9.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1996d016074d5e76e709f050ea89f5c6219b0ab9); dependency tracing and tests required. |
| `docs/releases/v1.1.0.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a4f712c4ed6e7edf6f521730e4c7f481604c9f20); dependency tracing and tests required. |
| `docs/secure-apk-release-protection-plan.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1d162ea320c363753d3e5e5ad73d5576aa618cc3); dependency tracing and tests required. |
| `docs/short-prophet-stories-inspection-2026-08-18.txt` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 472d612ca8cd253231466ec6fa3a95de943bbcab); dependency tracing and tests required. |
| `docs/skill-search-zikr-2026-08-18.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 291e9bdde25f93855da49619337320b428cf8459); dependency tracing and tests required. |
| `docs/SOURCE_OF_TRUTH.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 762c0e4e3ca343c1d58462d34855bd8d252daa4d); dependency tracing and tests required. |
| `docs/SUPABASE_FREE_MIGRATION_FINAL_2026-09-29.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0cff7cb3d8ebdc07f38ef9dc52cbecd10ed1f06f); dependency tracing and tests required. |
| `docs/supabase-remediation-evidence-2026-08-15.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b9e99ec8c7e58695a6f5963adc55150248625bbe); dependency tracing and tests required. |
| `docs/TROUBLESHOOTING.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8ba072032c4dfabe6f5a9e8669bde7322251deec); dependency tracing and tests required. |
| `docs/VERCEL_GIT_IDENTITY.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d634699d48e1e4381a5dcef9bc45b5c38a882edc); dependency tracing and tests required. |
| `docs/VIDEO_AUTOMATION_FIXES_2026_10_08.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b715c7b5516d66065aabf419a8e23c7e769c8b2b); dependency tracing and tests required. |
| `docs/VIDEO_PUBLISHING_GUIDE.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f4d7ff2f166b064e1afea728a9d469d4b30af530); dependency tracing and tests required. |
| `docs/YOUTUBE_TAKEOUT_NATIVE_BACKFILL.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 12cdc76312e9f6d3288b657638b0171474085f76); dependency tracing and tests required. |
| `docs/zikr-security-hardening-and-apk-plan.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → beecb669408ac6adb21c83929f3333062e635104); dependency tracing and tests required. |
| `DOCUMENTATION_INDEX.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e35e031001e2d2f53a5378f995332e39101de204); dependency tracing and tests required. |
| `eslint.config.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a65ed4fa26c1d54f2fd7c87416b111de46d91bbe); dependency tracing and tests required. |
| `ios/.gitignore` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f47029973b442a32c7ce8a83195f29d70661f124); dependency tracing and tests required. |
| `ios/App/App.xcodeproj/project.pbxproj` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c5f465f4bfefba38d4a9e615e83cd62ddb988ba3); dependency tracing and tests required. |
| `ios/App/App.xcworkspace/xcshareddata/IDEWorkspaceChecks.plist` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 18d981003d68d0546c4804ac2ff47dd97c6e7921); dependency tracing and tests required. |
| `ios/App/App/App.entitlements` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 59db7835a8c2dcf3a668696d01b31e246c5ef0ba); dependency tracing and tests required. |
| `ios/App/App/AppDelegate.swift` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c3cd83b5c0a62be3fc56a7909aedc70ccf6a92c0); dependency tracing and tests required. |
| `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → cffcfbf157970817ed72125f6c8848d5f951954d); dependency tracing and tests required. |
| `ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9b7d382dcecca887eac19d7f1c4c8dc57abe00e4); dependency tracing and tests required. |
| `ios/App/App/Assets.xcassets/Contents.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → da4a164c918651cdd1e11dca5cc62c333f097601); dependency tracing and tests required. |
| `ios/App/App/Assets.xcassets/Splash.imageset/Contents.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d7d96a67c0d764a2ddfc9545441c627e6d5fa1fc); dependency tracing and tests required. |
| `ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-1.png` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 33ea6c970f2df1db62a624a55e5bbcc4ee07bbdf); dependency tracing and tests required. |
| `ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-2.png` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 33ea6c970f2df1db62a624a55e5bbcc4ee07bbdf); dependency tracing and tests required. |
| `ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 33ea6c970f2df1db62a624a55e5bbcc4ee07bbdf); dependency tracing and tests required. |
| `ios/App/App/Base.lproj/LaunchScreen.storyboard` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e7ae5d7802c067edcd71596688fa7b059de8a262); dependency tracing and tests required. |
| `ios/App/App/Base.lproj/Main.storyboard` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b44df7be8f82acfcd747fd8d77fcd7a87b788f6f); dependency tracing and tests required. |
| `ios/App/App/Info.plist` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 829574e29719e04c4a056fe31bfddb82d3edb9a9); dependency tracing and tests required. |
| `ios/App/App/Resources/adhan_alt.mp3` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 84638c0f13d3c3d6b877f313d27c95b4e541a82e); dependency tracing and tests required. |
| `ios/App/App/Resources/adhan.wav` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → df4787311e1faaebe42514a9267b9afd456b4142); dependency tracing and tests required. |
| `ios/App/App/Resources/salawat.wav` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4d3bb47cbc7d1dc37530adf7e61b211854cf5e52); dependency tracing and tests required. |
| `ios/App/Podfile` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d8bed98d6f44266fcc0a295da764bb9535d371f5); dependency tracing and tests required. |
| `mobile/capacitor-dependencies.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ed44f885e54dc6a525ce1225f5256ff1507d5016); dependency tracing and tests required. |
| `mobile/README.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 00ad7d32e64b5ae20022856745abe2c567ec8305); dependency tracing and tests required. |
| `next-env.d.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a419cbe4e3a5e8d4b481b851dbf4ac767de069e6); dependency tracing and tests required. |
| `next.config.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b637b99fabd4b000424fce1b412da98cc72facf7); dependency tracing and tests required. |
| `package.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → fa5bf4cbd7db99dfe9cfb347453358da19846b24); dependency tracing and tests required. |
| `plan.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d5a28afe7be71d4ad235b5d8763168f96e0b087f); dependency tracing and tests required. |
| `pnpm-lock.yaml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e5a9cb30b4552a51311c969c8c8caafb999167b3); dependency tracing and tests required. |
| `pnpm-workspace.yaml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4e5c80185090ab33a7b76a82973a5370c8d81d07); dependency tracing and tests required. |
| `postcss.config.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a1515463cacd43bce00913a35e9b76dbb1d207ec); dependency tracing and tests required. |
| `PROJECT_STATUS.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2380def168d08be965cc79121c61fb866af01e92); dependency tracing and tests required. |
| `public/ads.txt` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 93f2e10f4bfbbe650a92b82149a02ed536501a12); dependency tracing and tests required. |
| `public/apple-touch-icon.png` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 30d73318f47f61d243a8786640ced43e6648bae2); dependency tracing and tests required. |
| `public/audio/adhan-01-charon.wav` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 692a59b5482915db6674790d0de1e43f9acbca47); dependency tracing and tests required. |
| `public/audio/adhan-02-algieba.wav` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6bbd73889e087387c93565546e4a14158883e1cd); dependency tracing and tests required. |
| `public/audio/adhan-03-enceladus.wav` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 17cf7ce400a2111d5a261c28bef8cd2d0298dd75); dependency tracing and tests required. |
| `public/audio/adhan-04-iapetus.wav` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2015e1931e22c762858f96c02d937c772208e79a); dependency tracing and tests required. |
| `public/audio/adhan-05-alnilam.wav` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d41d5d0c36ee04586ae0c524b893f652bfc0ea9e); dependency tracing and tests required. |
| `public/audio/adhan.mp3` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 84638c0f13d3c3d6b877f313d27c95b4e541a82e); dependency tracing and tests required. |
| `public/audio/adhan.wav` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → df4787311e1faaebe42514a9267b9afd456b4142); dependency tracing and tests required. |
| `public/audio/kids-adventure-theme.mp3` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d8b4ff37c5d2ddb22e2c796c1397ab52f85ea362); dependency tracing and tests required. |
| `public/audio/kids-learning-theme.mp3` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2898978fc47ea64b26455330e43965f2c540461b); dependency tracing and tests required. |
| `public/audio/kids-night-theme.mp3` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 46d38e7be48b2522a81ebd913de16891a577eaee); dependency tracing and tests required. |
| `public/audio/salawat.wav` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4d3bb47cbc7d1dc37530adf7e61b211854cf5e52); dependency tracing and tests required. |
| `public/banners/homepage/main-hero.svg` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 945ec81e1cf441b01b0cc7f66f898c565e92221c); dependency tracing and tests required. |
| `public/branding/brand-artwork.webp` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 57f3c3ca5809559bbd26be723ee7f4c3dca84550); dependency tracing and tests required. |
| `public/branding/logo-gold.webp` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9a814bf47435d85a7523284efd2d62a45413432f); dependency tracing and tests required. |
| `public/branding/og-image.jpg` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 552d9a72b2496c91dceef4dd11c1ef872f19ae75); dependency tracing and tests required. |
| `public/branding/pattern.svg` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 35dc9751ec40acc996a7e7905b3476972d77319a); dependency tracing and tests required. |
| `public/branding/zikr-brand-guidelines.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5d765dc38236d1b40c6640b2a14aa1c08240ebfd); dependency tracing and tests required. |
| `public/data-deletion.html` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1184ba58f0d4b5977b3e2dae25973f9e76d97acf); dependency tracing and tests required. |
| `public/favicon.ico` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → cd5567fdf74283fbde5d8f2a2cb142a2ecbcf024); dependency tracing and tests required. |
| `public/google3526c15e10fa1913.html` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 598beec4be9c896ab305f3335c65eee784aecca1); dependency tracing and tests required. |
| `public/google6f7827292f8e19bc.html` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9177016202cf3bede5a8fafa86479dbc5e1ba997); dependency tracing and tests required. |
| `public/icons/icon-192.png` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 821cbe5976295b27dcfa886decb5c03021e26c16); dependency tracing and tests required. |
| `public/icons/icon-192.svg` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e064331e30720edfd047556b5abc4bcb4c2aaad1); dependency tracing and tests required. |
| `public/icons/icon-512-maskable.png` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9ee0570ff700727ccb8e11c170f664e26c7c0f93); dependency tracing and tests required. |
| `public/icons/icon-512.png` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → bdc2232b8529f6e9a3dfce15bf272052e870cd6c); dependency tracing and tests required. |
| `public/icons/icon-512.svg` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 15bd1ebaba625576b49882e26d0f5465f1da794a); dependency tracing and tests required. |
| `public/kids/games/scene-moon-sky.webp` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 990153b5e06ac6bd69a639e6eee06ccc4c402f29); dependency tracing and tests required. |
| `public/kids/games/scene-mosque-courtyard.webp` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → dd15774e565a1f5a40b2d1b0f6a2ea821e3edc00); dependency tracing and tests required. |
| `public/kids/games/scene-night-garden.webp` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 000e7902ccf7f70e02f5ce09ef9dde76c4d3c9d5); dependency tracing and tests required. |
| `public/manus-routes.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 613dd32886e3bf9cbd35aa5d4c305470a5297124); dependency tracing and tests required. |
| `public/offline-content/v1/article_categories.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5b3e1c4611f1c5ceedf089a664b5eafc15743f46); dependency tracing and tests required. |
| `public/offline-content/v1/articles.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4036b50b325c7e0088d58e71daa8ed17f4a0d07c); dependency tracing and tests required. |
| `public/offline-content/v1/ayahs.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8862ea8ed1f0ea789fa84c749f70061d398e9161); dependency tracing and tests required. |
| `public/offline-content/v1/battle_events.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e398dd8bc773a9310d0d1874efbfd44dbd011752); dependency tracing and tests required. |
| `public/offline-content/v1/battles.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7f7487a7e3535767b9fe2e2a7c21acf999a16bea); dependency tracing and tests required. |
| `public/offline-content/v1/companion_stories.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 3633877a956e340a62222dd67d0190a29c99971d); dependency tracing and tests required. |
| `public/offline-content/v1/companions.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a2d9bdf609077bdbb9810bdc636f1ff1fc439955); dependency tracing and tests required. |
| `public/offline-content/v1/conquest_events.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 015e65e57912c895955ac77d26324b526c3194ba); dependency tracing and tests required. |
| `public/offline-content/v1/conquests.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8122c42b482f47b1d213efb81219a3081f4ae42a); dependency tracing and tests required. |
| `public/offline-content/v1/dua_categories.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 90c7f0fc1530c05de7c5476bf015885e4023c717); dependency tracing and tests required. |
| `public/offline-content/v1/duas.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 71090a02a20c4fec6464681ab496a60aff5064b0); dependency tracing and tests required. |
| `public/offline-content/v1/hadith_books.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b3a4641621ffee9efe825b0afc82c57c3a1002f3); dependency tracing and tests required. |
| `public/offline-content/v1/hadith.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a0a94b018b6d5da96f383e94abcf1a9ead80f6bf); dependency tracing and tests required. |
| `public/offline-content/v1/kids_game_levels.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 19a39cb295bcb52b1547325166dae0eddd9c2717); dependency tracing and tests required. |
| `public/offline-content/v1/kids_games.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4d49d875bbda2d5c3ca4afe7637d470e1b04e3de); dependency tracing and tests required. |
| `public/offline-content/v1/kids.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 19b0c9b94bdb8265d43a14d87fe9ae5f6524a5d8); dependency tracing and tests required. |
| `public/offline-content/v1/manifest.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f2e29112e46588d9e50120a3d80e9390a3690e8c); dependency tracing and tests required. |
| `public/offline-content/v1/prophet_sections.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7fc224bb744df907f2cda1b9eb8dccd3d72c42e7); dependency tracing and tests required. |
| `public/offline-content/v1/prophets.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c9b0e8a59ebdc617bb605964a17902508ed12a92); dependency tracing and tests required. |
| `public/offline-content/v1/quran_audio.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9876a8f8dbd02b9aafe53a18025f4e0922c32866); dependency tracing and tests required. |
| `public/offline-content/v1/quran_reciters.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1da63a8b5e197be8388666df451223c6a834b6ac); dependency tracing and tests required. |
| `public/offline-content/v1/scholars.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 58e3314773a3168850d456c486e157133ba62b7e); dependency tracing and tests required. |
| `public/offline-content/v1/stories.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e4573131467641bf6ecf9b97bc4dc35519867f85); dependency tracing and tests required. |
| `public/offline-content/v1/surahs.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4d92ad6c32b55901000a4679deec2bd3de611962); dependency tracing and tests required. |
| `public/offline-content/v1/tafsir.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 906ddd3eb9dfdbb30f267043256c75e6300ab0b8); dependency tracing and tests required. |
| `public/offline-content/v1/tawasheeh.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d7db77bb6573a234a2e8aeda192e8e7fb6266889); dependency tracing and tests required. |
| `public/offline-content/v2/routes.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 3a9c74a235cd794eeacbf5905809b31fe34e9c4b); dependency tracing and tests required. |
| `public/offline.html` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 54c789d38abf5ffe674b45086b030613c4133f87); dependency tracing and tests required. |
| `public/quran/manifest.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 44aa4d6a9368925036de1e82ffd6e4d93afe18e1); dependency tracing and tests required. |
| `public/quran/mushaf-hafs.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c381f7dd330bcf055ac1b85772d4468081a4b3aa); dependency tracing and tests required. |
| `public/quran/NOTICE.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 724198a3a77195de503333715c058ae4282f481c); dependency tracing and tests required. |
| `public/sw.js` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a3f450fac681e0356fefe919d0d46a26d43bdeb6); dependency tracing and tests required. |
| `public/video/templates/calm.svg` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → af7e2013042155c0b97742f8b594eadaa1733a2f); dependency tracing and tests required. |
| `public/video/templates/dawn.svg` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b8ea5dbb0746a8ef8b171f84513ee90d0779db4d); dependency tracing and tests required. |
| `public/video/templates/emerald.svg` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7ee94659a843d025ca57d45d52bd2ab46968bf22); dependency tracing and tests required. |
| `public/video/templates/gold.svg` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2bd271e1d155f964835b9eb436bab93e0745b790); dependency tracing and tests required. |
| `public/video/templates/kids-garden.svg` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e1cbac899ccf73171521ab4af9590843ee237a24); dependency tracing and tests required. |
| `public/video/templates/kids-nature.svg` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2a76d097d1c37c08f1e210d260410574e2331ad2); dependency tracing and tests required. |
| `public/video/templates/kids-neighborhood.svg` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7bc89fa5127f815eb96a6da602accc94d78659b8); dependency tracing and tests required. |
| `public/video/templates/kids-workshop.svg` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 67935893c2dc7f8d14bf2a4c9b22d63dd4fb8dba); dependency tracing and tests required. |
| `public/video/templates/night.svg` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6c36312bb51736bed33644df164afecb7ef1b282); dependency tracing and tests required. |
| `public/video/templates/paper.svg` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e64d12fd855cb59d7b1095d8f01d711538409506); dependency tracing and tests required. |
| `public/video/templates/rose.svg` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d7a38daf4f6b540656435500715840fc94e567d7); dependency tracing and tests required. |
| `README.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 22c44102811e0e7246857ca4b983b0241c4181eb); dependency tracing and tests required. |
| `RELEASE_STATUS.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → eb55791949000356a7723e993123b7fb92c71b40); dependency tracing and tests required. |
| `scripts/cleanup-supabase-storage.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d961f6a975771184681698618abba9f705252ec6); dependency tracing and tests required. |
| `scripts/ensure-ffmpeg.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0130b13b09fa88090f66435698f7623eed84ecdd); dependency tracing and tests required. |
| `scripts/export-offline-content.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 22cf34315d840b92ada7b57898a83e50949c506e); dependency tracing and tests required. |
| `scripts/generate-arabic-voice.py` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → cad5ab33cb41a0cd5179bdda400e486771547c52); dependency tracing and tests required. |
| `scripts/generate-ci-build-report.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 205ed64e450de5816ce8f9d73e74767210ee7af1); dependency tracing and tests required. |
| `scripts/import-youtube-takeout-native-facebook.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → dfd272f7fb43a0fc323755901821d78ead2493e8); dependency tracing and tests required. |
| `scripts/jobs/admin-queue-alerts.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9276adf01706033e256fc35150f6be27fbb58d79); dependency tracing and tests required. |
| `scripts/jobs/audit-video-media.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → fca75457ab30cfa03de818ea7ef257976484a90d); dependency tracing and tests required. |
| `scripts/jobs/backfill-legacy-video-qa.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 92a06788f701b8ba04cc5bb7cd719382a1357eb7); dependency tracing and tests required. |
| `scripts/jobs/content-publishing.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7927e0cd9aaf38b852e7415e2b09d32960f31127); dependency tracing and tests required. |
| `scripts/jobs/hf-space-video.py` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b7a39a1f362fa8e629d7534a7eb3d16942a20ad8); dependency tracing and tests required. |
| `scripts/jobs/social-publishing.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0dc93ad17b2dc0edca8d34acda974f6ea901a3d3); dependency tracing and tests required. |
| `scripts/jobs/template-video-automation.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ace90ad404583016cdb1c29d438a16d9067be155); dependency tracing and tests required. |
| `scripts/jobs/written-content-automation.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 18d0ddd89d6217f648c6bbb3ca96afa689144e5a); dependency tracing and tests required. |
| `scripts/platform-route-baseline.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6b4154bde4021d8de483431c97cae5b1948956b4); dependency tracing and tests required. |
| `scripts/prepare-mobile-assets.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → fa6645b4db4299cfe4e9d931363d4e0403d8babc); dependency tracing and tests required. |
| `scripts/reconcile-supabase-migration-history.sh` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 011dbb9aa20f68dc56f6232fa703138829356e63); dependency tracing and tests required. |
| `scripts/restore-quran-tafsir.sh` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4854757f40e1d756b408efc0e79799cf9ac2afac); dependency tracing and tests required. |
| `scripts/run-background-jobs.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ac887a0b6c11d7a8ccf40f6f56ad5beb8b2554c0); dependency tracing and tests required. |
| `scripts/sync-hadith-english.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 65dfff951e811a2ca9fb5aff9d8221c7419a4f7d); dependency tracing and tests required. |
| `scripts/tests/admin-rbac-rls.test.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 42a79e6e2299de19b034b4dc1d76145c024a9e9a); dependency tracing and tests required. |
| `scripts/tests/admin-role-update.integration-setup.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 65c06e199feb825c087dd0053dca59de5cdefc30); dependency tracing and tests required. |
| `scripts/tests/admin-role-update.integration.sh` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 30f2f9ba7e93b23be788e15d39f39747f8de279e); dependency tracing and tests required. |
| `scripts/tests/admin-role-update.integration.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ef02540db36d52d2665832cc1f90d2a6dec3225a); dependency tracing and tests required. |
| `scripts/tests/app-update-download.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 22780ac087802583ccc175dfe1880e56dc010963); dependency tracing and tests required. |
| `scripts/tests/arabic-search-normalization.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7cf16cb932a0dd5815cc30e23f39c710216eeab1); dependency tracing and tests required. |
| `scripts/tests/auth-password-security.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f84902513aff7714e768958bbfb2dba1644bdfc9); dependency tracing and tests required. |
| `scripts/tests/background-job-outcome.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f0f1a1af5c491f50f8b36ae1bfaf6e756f79eb39); dependency tracing and tests required. |
| `scripts/tests/contact-validation.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 745b37c03a34ff717131daf07750a248e4bd37d4); dependency tracing and tests required. |
| `scripts/tests/detail-route-streaming-fallback.test.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c14ce36410d093eb68d87c0b39253bd546f850dd); dependency tracing and tests required. |
| `scripts/tests/facebook-reels-insights.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 18a236603a67f84331fcc3aa2a16939e8efa1769); dependency tracing and tests required. |
| `scripts/tests/facebook-reels-rate-limit.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 67adf4019dc5256bf86c179d2b43dbf139f8e007); dependency tracing and tests required. |
| `scripts/tests/ga4-analytics-contract.test.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b109a234e234f1773d686130248f4177a27ba2fd); dependency tracing and tests required. |
| `scripts/tests/hadith-localization.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0242f4c041eea7959bb599ec5cdc739145d807dd); dependency tracing and tests required. |
| `scripts/tests/kids-action-games-localization.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 88f974c8a73465d6842006ad4754134194fcf598); dependency tracing and tests required. |
| `scripts/tests/kids-asset-manifest.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6590c12d9e551b0ee29f2ebe828df3f5f0235bb5); dependency tracing and tests required. |
| `scripts/tests/kids-content-manifest.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 67656de7b0bfe2cf9922287b8ad42380d856351a); dependency tracing and tests required. |
| `scripts/tests/kids-game-db-trigger.integration-setup.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → fc26b87084e81d4406957e08d25d7b810990142e); dependency tracing and tests required. |
| `scripts/tests/kids-game-db-trigger.integration.sh` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 61b2cd4a98ba1a873c2c4770bb137d12b0a445e3); dependency tracing and tests required. |
| `scripts/tests/kids-game-db-trigger.integration.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6f9141fbcdd155869ece60986808b3cf7cf8b4d1); dependency tracing and tests required. |
| `scripts/tests/kids-game-result-validation.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2a2bbc78e1d39120688111856990d2fe5f39629d); dependency tracing and tests required. |
| `scripts/tests/kids-game-runtime-contract.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b2662b018addf2614c9f277869b1a9622df77bd1); dependency tracing and tests required. |
| `scripts/tests/kids-gameplay-difficulty.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 819f6bae32a2811cc4f1b1bd66b7e63e0dd36913); dependency tracing and tests required. |
| `scripts/tests/kids-navigation.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → bd36605bfb8f6bd094aee65e95a63bee9589ebbd); dependency tracing and tests required. |
| `scripts/tests/kids-timeout-safety.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 3ad90432b284524d6e2b54154cfa1d9c7b0180ed); dependency tracing and tests required. |
| `scripts/tests/kids-video-series.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0e67cf715ec5cdd274772af60cf08e9df6a72c60); dependency tracing and tests required. |
| `scripts/tests/kids-visual-contract.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 775d4f48b89d1151103633f5e04a846ce195d274); dependency tracing and tests required. |
| `scripts/tests/loading-fallback-server-component.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ff462f63105cf47e3de6874aa5ba401ac99ef020); dependency tracing and tests required. |
| `scripts/tests/native-google-oauth-contract.test.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9be9a8d7e2cd2061f4b6703726304b96d954491d); dependency tracing and tests required. |
| `scripts/tests/performance-index-contract.test.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 79af5a20183a9b496794e8736f4627814cffca03); dependency tracing and tests required. |
| `scripts/tests/phase21-games.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8e7dc563bd1569e1d72bef8a333cfc233020107b); dependency tracing and tests required. |
| `scripts/tests/prayer-times.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 3785d64b84b558e01222bd88f1d45c322179ba87); dependency tracing and tests required. |
| `scripts/tests/production-smoke-contract.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b4326b03a175ff58066ce39564b61370d501a413); dependency tracing and tests required. |
| `scripts/tests/release-documentation.test.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → de00f97d7951906d0941cacb33cb1f54f071e13d); dependency tracing and tests required. |
| `scripts/tests/schema-contract.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → cbc7e6ca09c89eece4572cc3c87d3ed52bc6bcde); dependency tracing and tests required. |
| `scripts/tests/search-index-contract.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b888afad421d8567cd62c298f17ecd1c6e0c0071); dependency tracing and tests required. |
| `scripts/tests/social-deletion.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 353ead97b02efafa7cbfbb8d8a0e76cc0db6ed1f); dependency tracing and tests required. |
| `scripts/tests/social-platform-isolation.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 69c7566975e6b2d81321fb15f82574b3034f4416); dependency tracing and tests required. |
| `scripts/tests/social-post-insights-storage.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9e502922987c980b2905a28304d14fb8ecedb897); dependency tracing and tests required. |
| `scripts/tests/social-published-video-cleanup.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 418c869ccf371c8304198a9ef1d834135d67db05); dependency tracing and tests required. |
| `scripts/tests/social-queue-selection.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → aafffca182378573f05c8dd764da6d26f9e97ebc); dependency tracing and tests required. |
| `scripts/tests/storage-retention.test.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7152f91cced856a36ea7d2f5f6a806b0bfa27d3c); dependency tracing and tests required. |
| `scripts/tests/traffic-revenue-contract.test.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ccc5f2c623f8b2795d15f3214d012eac9d1a4e18); dependency tracing and tests required. |
| `scripts/tests/traffic-revenue-observability.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ca21742db822eac30dec1a1f2678a6bd27dc39ee); dependency tracing and tests required. |
| `scripts/tests/video-composition.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 15a44c294f8202c50811c8e33c28e5b548933f2e); dependency tracing and tests required. |
| `scripts/tests/video-contract.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a581e4750213ecd0e52fa430f55f8dc2062e7b8d); dependency tracing and tests required. |
| `scripts/tests/video-creative-variation.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6fac6d6ad293469c2b5251c8382a384521683122); dependency tracing and tests required. |
| `scripts/tests/video-custom-provider-registry.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → da0c36b55c9a7bf1d3195c8289509a26e8a82275); dependency tracing and tests required. |
| `scripts/tests/video-publish-approval.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f19d36b22aa81cd682c387e13b22cda21fdf3815); dependency tracing and tests required. |
| `scripts/tests/video-purge-contract.test.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 80df151dd0d953be1504134abb659bf1af56b8d6); dependency tracing and tests required. |
| `scripts/tests/video-route-cache.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 52b3cc54e43942deb94aec32e27ad92199422dc9); dependency tracing and tests required. |
| `scripts/tests/video-template-studio.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a8a524ef6d1ffd2f9a36e945cd9bb60de5167e44); dependency tracing and tests required. |
| `scripts/tests/written-content-automation.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8ee57c72c339617dc1995c8d3f546bbde083662e); dependency tracing and tests required. |
| `scripts/tests/youtube-analytics-contract.test.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 873eb52abb542b8449aad4103f457f38aab1d10e); dependency tracing and tests required. |
| `scripts/tests/youtube-oauth-credentials.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 874ce273f0f17b21a712cba8ec4a127bf4df8580); dependency tracing and tests required. |
| `scripts/tests/youtube-publishing-health.test.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 87000d586353803f367a97aaebd73c3f63f8d462); dependency tracing and tests required. |
| `scripts/translate-published-articles-en.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0a8e1c2ee0cad5cbbeed7515f1fb715c4e1a45f8); dependency tracing and tests required. |
| `scripts/validate-deployment-env.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 013c9872ad2f144f4d888c7c03b8e97c40114782); dependency tracing and tests required. |
| `scripts/validate-migrations.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 10c510ad49a48b2ef58adbf43ae4a96fdabdd37d); dependency tracing and tests required. |
| `scripts/verify-admin-api-guards.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f67c338406aa0cfeed4d8ea57cfdac97cad6f669); dependency tracing and tests required. |
| `scripts/verify-admin-architecture.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0ded020e4b4fb676eab23a35a3281e6ff3712635); dependency tracing and tests required. |
| `scripts/verify-admin-governance.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → beb435797d48dcae68a457e9cfce32af7bc27b5f); dependency tracing and tests required. |
| `scripts/verify-admin-health.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → be2f18620b05a512e829ad4c05f7ebb2c71f4775); dependency tracing and tests required. |
| `scripts/verify-admin-module-registry.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 59783953964497de48ca60b996b4db039cd6cfe9); dependency tracing and tests required. |
| `scripts/verify-admin-pages.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 12b7162a601e6e8990635fc3e0a533ae5da1c68c); dependency tracing and tests required. |
| `scripts/verify-admin-video-factory.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f33f6b007334b99977ff4d3d277eed5409421b6f); dependency tracing and tests required. |
| `scripts/verify-adsense-readiness.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 3a55a33ba127d327eef1aba7364f53247dc299f1); dependency tracing and tests required. |
| `scripts/verify-ai-visual-factory.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c4767e23f437cb24b0cbbfdbe5529623ea208d68); dependency tracing and tests required. |
| `scripts/verify-arabic-search.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6904d030aecbe15927ee526739acd9fe904fe62b); dependency tracing and tests required. |
| `scripts/verify-auth-config.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ac788fef566da7052e515da13139d21d0ba53d71); dependency tracing and tests required. |
| `scripts/verify-canonical-config.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 49a0200282643c27fadcbca2689199e872938678); dependency tracing and tests required. |
| `scripts/verify-ci-architecture.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 74d0abc04101064d7f01db471b7d179dcfdb626f); dependency tracing and tests required. |
| `scripts/verify-consent-mode.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d4501aaee6d3fa7db40bebc3c8b6489d37b6eebb); dependency tracing and tests required. |
| `scripts/verify-content-canonicalization.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e8004a318d4e30874a2bcf903454a927181818ce); dependency tracing and tests required. |
| `scripts/verify-content-integrity.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b3ac203367907b9fa48716cda87bf95a0b4958e4); dependency tracing and tests required. |
| `scripts/verify-data-lifecycle.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5a49ee796c5bd804a84634a10fb8923b69fbe92a); dependency tracing and tests required. |
| `scripts/verify-error-boundaries.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2b3e1ae30f26fa5e2ed32b474022accdc459e426); dependency tracing and tests required. |
| `scripts/verify-gemini-audio.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 23ede7278358b2ac244661ea95722e6bc5e8bb8b); dependency tracing and tests required. |
| `scripts/verify-generated-supabase-types.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7082aaf11ba34e01ad731cb575445b01220993ae); dependency tracing and tests required. |
| `scripts/verify-google-search-console.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6ccbd2db8ef00e62d9a038d4516dd644fcbf25eb); dependency tracing and tests required. |
| `scripts/verify-hygiene.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f8d5e0291a10bcfaa10760d7f4943e2d7759a410); dependency tracing and tests required. |
| `scripts/verify-image-assets.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → bddbe9b578fca7044ab352c3ea45ecefaf8cc771); dependency tracing and tests required. |
| `scripts/verify-information-architecture.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7b5dca9efeacd3629e01f9926a4100fc9d54bb36); dependency tracing and tests required. |
| `scripts/verify-kids-analytics.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 13c19cfc5463701fbbc86d50b09f41db83193929); dependency tracing and tests required. |
| `scripts/verify-kids-games-final.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e7b1a2b173c7a857fd8e81e106d1bbcda507a624); dependency tracing and tests required. |
| `scripts/verify-kids-hilal-fly.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 31fd8604a161df99e7aab91ca1f8d86c59004d17); dependency tracing and tests required. |
| `scripts/verify-kids-memory.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → be7052f18210c813d02f574332761908cc908e3a); dependency tracing and tests required. |
| `scripts/verify-kids-mosque-adventure.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f4d4b1dbecc16499079451abbc6dbc2da9062a75); dependency tracing and tests required. |
| `scripts/verify-kids-production.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f875744dc8b4721761b4931a674dc6e17d353a0d); dependency tracing and tests required. |
| `scripts/verify-kids-quiz.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → dea51b42e7f1c40fad22552de607f875e5649fcf); dependency tracing and tests required. |
| `scripts/verify-kids-verse.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7bc7f2855bb929467950aaff058160a8ec84f3ec); dependency tracing and tests required. |
| `scripts/verify-kids-video-factory.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b7929905b2a1216e217064eb14885264eb73d56b); dependency tracing and tests required. |
| `scripts/verify-kids-wudu.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5c1c271c1185f2c7f0c528993b1c9f0bb756f776); dependency tracing and tests required. |
| `scripts/verify-kids-zikr-jump.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b4d8a3cc0cb469afd1368a061772c79b94b3593b); dependency tracing and tests required. |
| `scripts/verify-kids-zikr-road.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4e864c83f0e581261e14ce8af237fbfa54ab62c4); dependency tracing and tests required. |
| `scripts/verify-local-imports.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9209b24d7aee4320e6d678f9682784e835783d81); dependency tracing and tests required. |
| `scripts/verify-local-quran.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 32ce2db07e7f12fd62d3821b83b3d79813c299c2); dependency tracing and tests required. |
| `scripts/verify-migration-duplicates.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 63d2ea185b6f26a3e388c3df9a19bcca09672213); dependency tracing and tests required. |
| `scripts/verify-mobile-navigation.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d87825069ff937d5eeb827f3d0b48218276072d1); dependency tracing and tests required. |
| `scripts/verify-mobile-readiness.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → bf1b648334ea02dab63925394cdff297a2c856b5); dependency tracing and tests required. |
| `scripts/verify-offline-content.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c191b354970b170a17bdd861ed37bd0aea4a4c74); dependency tracing and tests required. |
| `scripts/verify-placeholder-media.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 36c974fe275f4abe1fed8157e304b8bccf4c8769); dependency tracing and tests required. |
| `scripts/verify-platform-routes.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f2963dcb8ff3c51c29a1655000f41ce4cf4190ff); dependency tracing and tests required. |
| `scripts/verify-private-table-grants.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 401bd1d87a944d0d4eb0333c053e341defa6e8db); dependency tracing and tests required. |
| `scripts/verify-production-smoke.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 11612184e8cc842a4c783f695640a2f96723f590); dependency tracing and tests required. |
| `scripts/verify-project-integrity.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e561784007c576ec9a5d6c8cd4aa652619d6fcc7); dependency tracing and tests required. |
| `scripts/verify-quran-canonicalization.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → bb1b8c077c216587cc59d3a8a3188acdd3fbfd09); dependency tracing and tests required. |
| `scripts/verify-quran-offline.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4c020e61392bf694e338251b67d3dc34162393ea); dependency tracing and tests required. |
| `scripts/verify-quran-tafsir-backfill.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8b56523cb7036c1c80c58fe7a7eb8f60d4e29da1); dependency tracing and tests required. |
| `scripts/verify-release-contract.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5bfce0e758961e90c742d661cd1c68daf9801b0d); dependency tracing and tests required. |
| `scripts/verify-release-metadata.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ee429174ad92f52a98b82e52c8dd3d0c522085b1); dependency tracing and tests required. |
| `scripts/verify-scheduler.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 98947c58a072cd7259dc8fda4226b013fbc43dd0); dependency tracing and tests required. |
| `scripts/verify-security-hardening.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 90c0d1ac9a9ae5f427e12289283a40d06ee40b68); dependency tracing and tests required. |
| `scripts/verify-social-publishing.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5a3a15d9daa3de1bba952dad9e207c1443be12cd); dependency tracing and tests required. |
| `scripts/verify-supabase-db-url.py` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → de77f36443abfa526a871569ee8f4bc5960273f0); dependency tracing and tests required. |
| `scripts/verify-supabase-production.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 416ffa9e35c73a5aacf317c3fe3509dd853ec31f); dependency tracing and tests required. |
| `scripts/verify-video-factory.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a597ff8c8d18234e69ddf513d428d8ac719685cc); dependency tracing and tests required. |
| `scripts/verify-video-media-audit.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 34c818eaf89bb0b7d24a8af41f574a3758e75c7a); dependency tracing and tests required. |
| `scripts/verify-video-qa-backfill.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2045b063d38979f2f61dbe6434b31407a0a66d5f); dependency tracing and tests required. |
| `scripts/verify-video-qa.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7c8f718a1c07918a585c926d6170b8020198b9df); dependency tracing and tests required. |
| `scripts/verify-video-queue-priority.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → cf285009886a22b3efbb4ce782e8f01678eb2422); dependency tracing and tests required. |
| `scripts/verify-voice-factory.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c8ed24a9e914b99cc575b286a3975a5f698e22eb); dependency tracing and tests required. |
| `scripts/video-engine-check.mjs` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c7dc9156901847f4b7666ead969b0f1c4aee2040); dependency tracing and tests required. |
| `SECURITY.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 76b48b3cf1291ed25b069840586979de649c255b); dependency tracing and tests required. |
| `src/app/.well-known/apple-app-site-association/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → bcfba9e3bce9eda5958e9d8d76dae231528385d3); dependency tracing and tests required. |
| `src/app/.well-known/assetlinks.json/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2cf8455fe6f3f150b07d95066bf3b5ff717ca354); dependency tracing and tests required. |
| `src/app/about/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → bb114e9d2b72c6daabc038c781644111af0d5c3e); dependency tracing and tests required. |
| `src/app/about/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → fea42fab8caa6161db72b07600d4255cfbfed58a); dependency tracing and tests required. |
| `src/app/adhkar/error.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f02d39a77c120a15d79b0bd1206692a032f528a8); dependency tracing and tests required. |
| `src/app/adhkar/layout.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → bf8396dc9c29de8bcfe8a6db3e5fe52be92f1c4c); dependency tracing and tests required. |
| `src/app/adhkar/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 11534ee1374e7ffda03003ac098857aec3d9013f); dependency tracing and tests required. |
| `src/app/adhkar/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 37a1deb5ecd41c2e530ac2f711f8a4e3e7799804); dependency tracing and tests required. |
| `src/app/admin/ai-video/curated/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → bde5df5b88293820393c536db022fda5a6460caf); dependency tracing and tests required. |
| `src/app/admin/ai-video/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 00cd354dae6ada7ea77fa72b5a7265b945a52033); dependency tracing and tests required. |
| `src/app/admin/alerts/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 96b928075422645eabd0ea74e2d11616b11e2565); dependency tracing and tests required. |
| `src/app/admin/analytics/analytics-dashboard.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4afd770b661d675a400f85afdcf06d3c50e4bb5d); dependency tracing and tests required. |
| `src/app/admin/analytics/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 440d15008c742a1681f5160bf8e8baeef9688a40); dependency tracing and tests required. |
| `src/app/admin/android/actions.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4cd3b3a27441777d8172d6254e748c0280efb693); dependency tracing and tests required. |
| `src/app/admin/android/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b410f1105e0a42fca665b7589930018d892f7648); dependency tracing and tests required. |
| `src/app/admin/audio/adhan/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a656a99eeccbfedab60833d8311177cb8f38f4bb); dependency tracing and tests required. |
| `src/app/admin/audio/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f7b950c8670a499726b36e1e40e42b06d145f120); dependency tracing and tests required. |
| `src/app/admin/audio/quran/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e600c14143a376d3fc86f6b586ac2f177a8f1fdb); dependency tracing and tests required. |
| `src/app/admin/audio/site-audio/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1dcad06f6a1bef6cac9d8c4ee38e4f4c2ed72c40); dependency tracing and tests required. |
| `src/app/admin/audio/tts/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f171629b7b3b20fadf78d2cdf390492bec4b4199); dependency tracing and tests required. |
| `src/app/admin/audit/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d96053a4441c31b046f8d389df6bfb49b92a2d47); dependency tracing and tests required. |
| `src/app/admin/automation/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7325b5e39399525698309ef328d86396bf500a3c); dependency tracing and tests required. |
| `src/app/admin/battles/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 98eaaff3bd04a4e6b4352ac0cba8edeb1eb95f20); dependency tracing and tests required. |
| `src/app/admin/categories/actions.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ccc3151223ab4614d61df0021896052ebec74808); dependency tracing and tests required. |
| `src/app/admin/categories/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 80cc2bf26438e0d0a23b85bef9822eea727785f9); dependency tracing and tests required. |
| `src/app/admin/content-actions.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0a2ab5c8dccef35bccf2f4991362400e6eaf2cf6); dependency tracing and tests required. |
| `src/app/admin/content/content-console.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ecacd0e3705c0ec692886d7ea35d1efda6fe17b5); dependency tracing and tests required. |
| `src/app/admin/content/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 06b8ad4b712a46f135742bcc2395f50ff0fd2c58); dependency tracing and tests required. |
| `src/app/admin/control/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 95f9fe6aed561844a94fc60944c9e0e0d185c10b); dependency tracing and tests required. |
| `src/app/admin/editorial-actions.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → cf13f4fc9d56471fcb14e9b9a51e291f000e7c69); dependency tracing and tests required. |
| `src/app/admin/editorial/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6999a48f970afae670a853ac1cb54213485e6153); dependency tracing and tests required. |
| `src/app/admin/error.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6869c2c5002b1de60bf7596a3655ccebea98b30e); dependency tracing and tests required. |
| `src/app/admin/health/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 03631257fe29f89da93e8162235b1a3c5d4a0e70); dependency tracing and tests required. |
| `src/app/admin/kids/actions.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a806028beae860d3f4fe2e4802ba32b15e757134); dependency tracing and tests required. |
| `src/app/admin/kids/analytics/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 87719401fd66a512b6e36eda5fb9a935e46c90ee); dependency tracing and tests required. |
| `src/app/admin/kids/assets/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 71a33f113961da5c827836a567caede3c6894e46); dependency tracing and tests required. |
| `src/app/admin/kids/content/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9de3fed78d63bf33313a7045cb95ed63386a4785); dependency tracing and tests required. |
| `src/app/admin/kids/games/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5a864ea37790a312b2430546aff2052460f4ea93); dependency tracing and tests required. |
| `src/app/admin/kids/levels/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d8430aac906c5046cc433ed505293fde334ec606); dependency tracing and tests required. |
| `src/app/admin/kids/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → bc1fbc1187da59296159cd2175352f47a42fe54c); dependency tracing and tests required. |
| `src/app/admin/knowledge/actions.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6f02a030ea4767996346960b29d507cd2a35fee1); dependency tracing and tests required. |
| `src/app/admin/knowledge/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8e1242efa7b3c0260e8144d3945b18706945adde); dependency tracing and tests required. |
| `src/app/admin/layout.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 90f8f216396cab88de8e3cdae6402117b04906d7); dependency tracing and tests required. |
| `src/app/admin/library/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ee0a8a38608d550267b4d628d7ca7a48f7ebd263); dependency tracing and tests required. |
| `src/app/admin/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → eaceb778c0cba3d885cddc2c26337e0d4012e74c); dependency tracing and tests required. |
| `src/app/admin/media/media-client.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 77c20af1f853388b955395dfaa122127aa51a5fc); dependency tracing and tests required. |
| `src/app/admin/media/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f50e73fd09cb353ab4cb53608ce81248880a8776); dependency tracing and tests required. |
| `src/app/admin/memory/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e2ee32e743f55d7098b5bba5af06260e809d9451); dependency tracing and tests required. |
| `src/app/admin/not-found.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 65389d3bb4bb26e6439ce6c1389b9ca7d183d370); dependency tracing and tests required. |
| `src/app/admin/notifications/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 894d84c8ed9c1e26451a48c582d68ac3937c267e); dependency tracing and tests required. |
| `src/app/admin/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 207f45c0f3a9ae9fec33c2283a5262a62df309f8); dependency tracing and tests required. |
| `src/app/admin/prophets/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 731cf13e5f7c38c333bebbb079748514b3a8b247); dependency tracing and tests required. |
| `src/app/admin/queues/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 098c21ac3c46b37b05dc50b5ffdd4ba3a8c2707a); dependency tracing and tests required. |
| `src/app/admin/release/actions.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1bbe02ba878563a41a8920643d0cf315b56b2798); dependency tracing and tests required. |
| `src/app/admin/release/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 109ba2fd5be1da5e3752ead0b048fcf719e98fff); dependency tracing and tests required. |
| `src/app/admin/search/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1baf59124c945b383f887f8e568e809f0581b5f4); dependency tracing and tests required. |
| `src/app/admin/sections/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ad6fb5372ec682a30e0ceaff244cd0cf22cd7404); dependency tracing and tests required. |
| `src/app/admin/sections/sections-client.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d8014ecc35177b82aa09e6026b0730018c04ff15); dependency tracing and tests required. |
| `src/app/admin/security/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2cdb61aa2b8e497ef8b89053f3a1f62cc1786075); dependency tracing and tests required. |
| `src/app/admin/security/step-up/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4cbd0107e51600a5d33c4da2be0255ba40ca8c47); dependency tracing and tests required. |
| `src/app/admin/seo/actions.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ad09fe08e2f7479b9bf28b57407a349450997d39); dependency tracing and tests required. |
| `src/app/admin/seo/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7abd2de62e641a87ceaa6a8fdb9f63a8bdb4a04b); dependency tracing and tests required. |
| `src/app/admin/settings/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → bed57d98d14bac87e55885ae4b2b2b931e50bc54); dependency tracing and tests required. |
| `src/app/admin/site-audio/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 553f11fddc72a4a9f04b400cf374e9fb736d3a18); dependency tracing and tests required. |
| `src/app/admin/social/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5eea0e4bbaa91294ea3a31dbdf2b54f01a2d7d17); dependency tracing and tests required. |
| `src/app/admin/social/social-client.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 202884bc0f0065802c2f9b161d5193c5fc91528e); dependency tracing and tests required. |
| `src/app/admin/social/written-studio/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b20163eb56a4b5c352df928426e03243ab2a34a2); dependency tracing and tests required. |
| `src/app/admin/social/written-studio/written-studio-client.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → be039fbb618ed5ef3af704191a8439153c0b23f4); dependency tracing and tests required. |
| `src/app/admin/social/youtube-import/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e516d2e38bffd3b68020276fdd59392311ab5116); dependency tracing and tests required. |
| `src/app/admin/sources/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f0193177781c22f141065f115d62e271f2d165e4); dependency tracing and tests required. |
| `src/app/admin/system-actions.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 84a9ced3d4e7afd74f67ef7ee6ec554c97b73fbe); dependency tracing and tests required. |
| `src/app/admin/users/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → db33450ad9a0bcc9af0576823dc51d765248c2c1); dependency tracing and tests required. |
| `src/app/admin/video-factory/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 47f0dce7a31adba009e92fd47ad43161cbe893f0); dependency tracing and tests required. |
| `src/app/admin/video-factory/publishing/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 016ce0dc36edeef7c49f2211ec9bee631c0a4744); dependency tracing and tests required. |
| `src/app/admin/video-factory/qa/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1afead64ee6efad2e69a3932fbdff7979ebf94f8); dependency tracing and tests required. |
| `src/app/admin/video-factory/queue/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7e36ae1aecd3364db2d7e6ecb71f18447070f2dc); dependency tracing and tests required. |
| `src/app/admin/video-factory/scheduler/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7cdb28535efec11fc6590b352be302d4b42eb631); dependency tracing and tests required. |
| `src/app/admin/video-factory/scripts/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 3e292c1f7aff087e00707817ddb24f8bff3c3302); dependency tracing and tests required. |
| `src/app/admin/video-factory/sources/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a1e9b20cc81e9fc24017d88b1f75af1f4ffd6abc); dependency tracing and tests required. |
| `src/app/admin/video-factory/templates/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2d5807dd2d735508b29a8abfb80d4b23cf54a7ff); dependency tracing and tests required. |
| `src/app/admin/video-factory/visuals/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b33d83f8474c92713e190e14779e55c92bdf81c4); dependency tracing and tests required. |
| `src/app/admin/video-factory/voices/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2ed0823ec50c74fd9441a956199082b595847549); dependency tracing and tests required. |
| `src/app/admin/video/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 07908f283b69c5298d652d35652a29488666e1f6); dependency tracing and tests required. |
| `src/app/admin/video/qa/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4d2dcccde4cfe0fe328f1884c44355e4e1dbd8bd); dependency tracing and tests required. |
| `src/app/admin/video/requests/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ccc4e79e967a24b7cd966799677eb08602160f9e); dependency tracing and tests required. |
| `src/app/admin/video/scripts/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2c052215e247b5c7c604e5f8a73426dd1a41f9a0); dependency tracing and tests required. |
| `src/app/admin/video/sources/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a577c01828164d73dcaf728f9355a354e107d973); dependency tracing and tests required. |
| `src/app/admin/video/studio/curated/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7c439d257a158823de62573fddc75cf1443e8a42); dependency tracing and tests required. |
| `src/app/admin/video/studio/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 3622362e4d59e7bdbe28fc84709ad1a0c6d3832c); dependency tracing and tests required. |
| `src/app/admin/video/templates/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f4be0e07a3a781ce4b29038f701a7187eb7747a7); dependency tracing and tests required. |
| `src/app/admin/video/visuals/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0b8f97441ff1a208c2e4a84d14525a1c6ef5a33c); dependency tracing and tests required. |
| `src/app/admin/video/voices/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c96c8538d23e6980adf904b7edbf0fb4afd66741); dependency tracing and tests required. |
| `src/app/admin/videos/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 56b26cd15a2f3f9b7cc6a6b9c48d5a875b31db08); dependency tracing and tests required. |
| `src/app/api/admin/analytics/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e0978b9c87a25868caf3aebf481596f52fa994a1); dependency tracing and tests required. |
| `src/app/api/admin/cloudinary/image/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → da5c378938431a07080c3a51bef5c9463bd8f977); dependency tracing and tests required. |
| `src/app/api/admin/content/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f86bade38eac14acdce7e436c64cb5d83122e00d); dependency tracing and tests required. |
| `src/app/api/admin/media/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e8782436dfcaf0ebf5d6413a9c506e3bccfa691d); dependency tracing and tests required. |
| `src/app/api/admin/overview/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 822ea6a6b916ac1029177c94870997350266c17c); dependency tracing and tests required. |
| `src/app/api/admin/page-view/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a7a7598a5c859c967480197c98b33969c251d290); dependency tracing and tests required. |
| `src/app/api/admin/sections/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 633a62f2e4fb442ec10951ab13e24b47c3c26634); dependency tracing and tests required. |
| `src/app/api/admin/site-audio/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0268fcbfbbdb73fa710f70dca0bdb94ca6932561); dependency tracing and tests required. |
| `src/app/api/admin/site-audio/upload/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f9cabf833a21f88ad45982dedb8596a67dc4873c); dependency tracing and tests required. |
| `src/app/api/admin/social/facebook/callback/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → cbf4bdb07869e1c2e6095daf535f1ecae368966b); dependency tracing and tests required. |
| `src/app/api/admin/social/facebook/connect/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0cbd3aa71de0fe1c32ac150aeb3a2690a711501c); dependency tracing and tests required. |
| `src/app/api/admin/social/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d4b28359635180f19c4422d36d9296c400982aee); dependency tracing and tests required. |
| `src/app/api/admin/social/written/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 3e2df5077b3537f2a5f096803b8ecfe65231f6cc); dependency tracing and tests required. |
| `src/app/api/admin/social/youtube/callback/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d7ea3581900a1153c739a25c369672e4dcb84d9e); dependency tracing and tests required. |
| `src/app/api/admin/social/youtube/connect/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 96ff826a4850267ff80e804616fe0f9339e902c0); dependency tracing and tests required. |
| `src/app/api/admin/video-generation/narration-upload/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1121259939ce84b7efb31fcfae265e0f496832fd); dependency tracing and tests required. |
| `src/app/api/admin/video-generation/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 024348645056b9902b7ad121ffa01332632448a3); dependency tracing and tests required. |
| `src/app/api/admin/video-generation/sources/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d12c2b63cfd0c4dc09a0dcd457a360bc90fb3176); dependency tracing and tests required. |
| `src/app/api/admin/video-purge/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5f074ed7cd02794d9942381783e7baef82b66e2c); dependency tracing and tests required. |
| `src/app/api/admin/video/templates/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 24fdc5749bc6500307abc8b2da5061768bfb1f15); dependency tracing and tests required. |
| `src/app/api/admin/videos/[id]/retry/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b5540ca786f9d3ee84be47218416b32b252e227c); dependency tracing and tests required. |
| `src/app/api/admin/videos/[id]/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 763c14d2c73fe27fbb890367499728b1f9814ecd); dependency tracing and tests required. |
| `src/app/api/admin/videos/create/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 76708508ed6d73076daef2af0a2ec7d1ca1375dc); dependency tracing and tests required. |
| `src/app/api/admin/videos/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8f340c497bfb67b8b511d794d887766f84bb20ba); dependency tracing and tests required. |
| `src/app/api/admin/videos/upload/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 21db1ef07f2b34c31287ab2bbd5951eef0c14ceb); dependency tracing and tests required. |
| `src/app/api/admin/youtube-facebook/register-media/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → fee44261f8d26efa8d83b4e2e46a423c6fb2d816); dependency tracing and tests required. |
| `src/app/api/admin/youtube-facebook/upload-url/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → fee44261f8d26efa8d83b4e2e46a423c6fb2d816); dependency tracing and tests required. |
| `src/app/api/app-version/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d118182eabe96dbe764b971627aa2f9621081656); dependency tracing and tests required. |
| `src/app/api/auth/profile-sync/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 99381ab824a23dec5d5010b377848f4c7aaae1f8); dependency tracing and tests required. |
| `src/app/api/contact/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 079808fb1b7c0113b9f210a6ec648711337e65b2); dependency tracing and tests required. |
| `src/app/api/content/articles/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9415cbeb176e1351845d3d59454bc94b5f1193ab); dependency tracing and tests required. |
| `src/app/api/content/companions/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 05a693593c369e87382fbfce524f87f7c72d2f17); dependency tracing and tests required. |
| `src/app/api/content/prophets/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → dadeb60e8057bce6d89a0ecbf72c3cad3f550c58); dependency tracing and tests required. |
| `src/app/api/content/stats/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f12094e572ef180551407ca7ba8cea1548c0bfd4); dependency tracing and tests required. |
| `src/app/api/content/stories/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1f712079e6e6ccfea8ae9ac3129e29c9a0d15ed6); dependency tracing and tests required. |
| `src/app/api/content/videos/[slug]/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f90c2a750e3a7f22b1b00df5f09fb141e783914b); dependency tracing and tests required. |
| `src/app/api/download/android/aab/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4ff2dc7f917839f181ffd3c47ca386ec28777b0b); dependency tracing and tests required. |
| `src/app/api/download/android/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f24e44d4f2c75fb406f18ac5ba09ce5316d23845); dependency tracing and tests required. |
| `src/app/api/duas/categories/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → abc51f700b7365916db1203c37bb9b54304ba5f4); dependency tracing and tests required. |
| `src/app/api/duas/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 069c85d31c710986820fb7cfa89e5c82b76dd9c6); dependency tracing and tests required. |
| `src/app/api/geocode/reverse/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ea04a42a6a36d12ea844b45aff1df5a5fb4f7446); dependency tracing and tests required. |
| `src/app/api/hadith/books/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 511bc9b7713446fc7e15913e2cab4f7211189e32); dependency tracing and tests required. |
| `src/app/api/health/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 94411332c3ebe8736dbaf59f56ecb1a76d1ca6a4); dependency tracing and tests required. |
| `src/app/api/internal/youtube-facebook/cleanup-media/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → bc7ce7912cefdb21e9af3e9d67291d8357135e81); dependency tracing and tests required. |
| `src/app/api/kids/content/[slug]/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f77791e73e0aa0bb4c43d263781410b9275edf96); dependency tracing and tests required. |
| `src/app/api/kids/content/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6423406c7bb17c20b36f7d8e4e84ac1f8bb053e9); dependency tracing and tests required. |
| `src/app/api/kids/games/achievements/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4e909812422ac6ebf16cbde7a9e305f009099902); dependency tracing and tests required. |
| `src/app/api/kids/games/progress/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 82f5977b9235af1d9a25d553867883a85f01152b); dependency tracing and tests required. |
| `src/app/api/kids/games/score/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4a2ac30fbcf13b92272227856224294621e295eb); dependency tracing and tests required. |
| `src/app/api/kids/games/submit-result/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 86d5ff2cdf31984c4d8912c448c877c78cdb60af); dependency tracing and tests required. |
| `src/app/api/kids/games/validate/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5e5ae18dafdb6e44310427b353984d6421648784); dependency tracing and tests required. |
| `src/app/api/kids/games/verse/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4235ccc54b9d5a4dd226ba007048cc4cb26ab9c5); dependency tracing and tests required. |
| `src/app/api/kids/track-share/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 33c5a14eef0217558f709d089cf8b9b88424f98e); dependency tracing and tests required. |
| `src/app/api/kids/videos/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ea747de73e0b5a15cd1d5bd996d2e88a10f63465); dependency tracing and tests required. |
| `src/app/api/poetry-insight/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 91fd2ff40eb079822f8f10094a03a58dc44e72f4); dependency tracing and tests required. |
| `src/app/api/prayer-location/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4ad2f87f932fb096d3cf95fce21e7b97dd03cc97); dependency tracing and tests required. |
| `src/app/api/prayer-times/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 30e1c0eae8c53d69f6f7255c3e19e3d1d5374e44); dependency tracing and tests required. |
| `src/app/api/push/public-key/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d84a25ccef96899506a992d6d63ba24ecab9295b); dependency tracing and tests required. |
| `src/app/api/push/subscription/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7ed990ad45b0d4d0816901c8af3925a5660df70c); dependency tracing and tests required. |
| `src/app/api/quran/audio/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 631890aeff643b2a343521afb1f2d34085e6877d); dependency tracing and tests required. |
| `src/app/api/quran/reciters/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1c8a90cf737d6fd022eacf74959402db7146e93b); dependency tracing and tests required. |
| `src/app/api/quran/surahs/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d166bf350d55260be5acd243dc7b0de4e8e3a35b); dependency tracing and tests required. |
| `src/app/api/reminders/background/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f906042cda9faf39dfa47492199a81570b8b86eb); dependency tracing and tests required. |
| `src/app/api/search/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0167701f3bab2af743517f7f030f4ce06bc1803e); dependency tracing and tests required. |
| `src/app/api/site-audio/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 13e55808dabd8e5960d52eac4cc45fe0dca10d8f); dependency tracing and tests required. |
| `src/app/api/site-settings/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 3b0581489eae19f968bd140283237189462ddeb1); dependency tracing and tests required. |
| `src/app/api/storage/presign/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 587d906e56da07164cb677d3c07d4bf9a8d17aac); dependency tracing and tests required. |
| `src/app/api/tawasheeh/categories/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 618ef2fb968d632fa95260cdced987f031a48870); dependency tracing and tests required. |
| `src/app/api/tawasheeh/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b6588fcf278fadd4d13b687bdeaa3583d2068658); dependency tracing and tests required. |
| `src/app/api/user/favorites/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 01d003065a112924ea64d8c06576ef5a0b24ef1f); dependency tracing and tests required. |
| `src/app/api/user/notifications/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 790a9f207fd83ce673b0bcd816161b0108524e83); dependency tracing and tests required. |
| `src/app/api/user/profile/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 73715d7b28a55c087e9b64e66ec2e52759c546b4); dependency tracing and tests required. |
| `src/app/api/videos/[videoId]/like/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ab8681830ca8946bc769773e3c301a8a52b7f214); dependency tracing and tests required. |
| `src/app/articles/[slug]/layout.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e4cc72d28a8569f339cf2da9d3dc0b831ed370de); dependency tracing and tests required. |
| `src/app/articles/[slug]/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a5a94ac3a7a699c76d50d53dddd2336cd7175a7d); dependency tracing and tests required. |
| `src/app/articles/error.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b767785d1b8a00352f62cee8e5848ca84d2a99b1); dependency tracing and tests required. |
| `src/app/articles/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 964d738d0636b9a380d323c8c9a3b45d26f3acd2); dependency tracing and tests required. |
| `src/app/articles/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 225b1d42e982ebaec93ac817c134a0be06c370c4); dependency tracing and tests required. |
| `src/app/audio/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0eb6a47847b0a1df69d137341c9bd8aa2bf9229b); dependency tracing and tests required. |
| `src/app/auth/actions.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c0a43807ee4a288923247689bebb4040c2b990df); dependency tracing and tests required. |
| `src/app/auth/callback/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 037d5b8b041254f3b5639065f64336b9a62d5370); dependency tracing and tests required. |
| `src/app/auth/forgot/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1457dc3b79dab92c1bb57240ef095f46437629c4); dependency tracing and tests required. |
| `src/app/auth/google/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0bb69bb65250de9cec84ef4aa811c4e154ce7957); dependency tracing and tests required. |
| `src/app/auth/layout.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → fcb9c8ce43597d87c48ce51e04ae6097a18f03ca); dependency tracing and tests required. |
| `src/app/auth/login/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 3ea14ffef127bc69dfed86a472e0567c3c723f9d); dependency tracing and tests required. |
| `src/app/auth/register/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6d4f0de36dd384695c70f9d5200dba9b99c0fe1b); dependency tracing and tests required. |
| `src/app/auth/reset/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5f89c0c9cb2037aa8f26c80aebdbbad92b5522e7); dependency tracing and tests required. |
| `src/app/battles/[slug]/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8128f271d3e0d46cb3e8d8f291940b609a0f076e); dependency tracing and tests required. |
| `src/app/battles/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 267f2b03d3e650cd2b41020f233a1606bb6c7ac4); dependency tracing and tests required. |
| `src/app/battles/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2cf9528e1bcd1e97cee3b67f6945ba7e34c09980); dependency tracing and tests required. |
| `src/app/companions/[slug]/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ad37acd70f1c0114db79cbba315eb995b640d3de); dependency tracing and tests required. |
| `src/app/companions/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → dd6ca2e04361e7770db1bb7706270ce222166359); dependency tracing and tests required. |
| `src/app/companions/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → caf32a86e501ea9fd21123b462ff9f73ce940de4); dependency tracing and tests required. |
| `src/app/competitions/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d9ed600c4bb104c1f6e40f7458c3582dd5333bf9); dependency tracing and tests required. |
| `src/app/competitions/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ab8e4010edb9adacf4d513fdd65a852a78ae63fe); dependency tracing and tests required. |
| `src/app/conquests/[slug]/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → de4aec62a12a6816e3513b893c52730b361e78ba); dependency tracing and tests required. |
| `src/app/conquests/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a012327ae7d589028658d37774129ea929a0b109); dependency tracing and tests required. |
| `src/app/conquests/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7f19c90ebe370b9815bbdd8f56c48c940065f17d); dependency tracing and tests required. |
| `src/app/contact/layout.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e0b82ac67ba456e12ff20a57819485f291ce6e41); dependency tracing and tests required. |
| `src/app/contact/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8b47c30145ba19169bd46536b1cacc085c3abd79); dependency tracing and tests required. |
| `src/app/contact/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → bb61cce62653f742f76b877ece2bf6676a556231); dependency tracing and tests required. |
| `src/app/content/[slug]/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 3a42d37265bdff474bf2eb02a8951d9f44ec74b8); dependency tracing and tests required. |
| `src/app/data-deletion/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d11f18f3563c31730c404c04d902901dd5e24b0f); dependency tracing and tests required. |
| `src/app/dua/[slug]/layout.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f15b343232140e523764d14236134cb7f1d71088); dependency tracing and tests required. |
| `src/app/dua/[slug]/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 97af35e60bb9e9d3202a9e21635a47291a98faee); dependency tracing and tests required. |
| `src/app/dua/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e893050e4cd9e893a4466401c73c001aa54c88fd); dependency tracing and tests required. |
| `src/app/dua/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → acfcb525618d6acb9d22533592b6f5ae446492d5); dependency tracing and tests required. |
| `src/app/duas/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b1672ff2e4d15068a9e0d075591a10845a2c681d); dependency tracing and tests required. |
| `src/app/editorial-policy/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 449556fa4d30d289fee572eccbc55e242ff9d044); dependency tracing and tests required. |
| `src/app/error.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 74e580faa07cfcda1a5eb21ca1a0f0ff2eec6eb4); dependency tracing and tests required. |
| `src/app/faq/layout.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → eebc9faf27353025663193a828948180bb012cac); dependency tracing and tests required. |
| `src/app/faq/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 36b4e85370b74ea26924201af42d8e1e7e10c14b); dependency tracing and tests required. |
| `src/app/faq/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f01c82ac50e36c6c9320de9e841d9c168f46f89f); dependency tracing and tests required. |
| `src/app/favorites/actions.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e3240fc7d3cfe9ffd526ffc65d5d210332965221); dependency tracing and tests required. |
| `src/app/favorites/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0b1c63e9e9d42c17bdad8cd13ff7f5e35b78d4ed); dependency tracing and tests required. |
| `src/app/favorites/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b59ecc1afe42d38f55a47e5c44e2e53fa55538ce); dependency tracing and tests required. |
| `src/app/global-error.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8591638c91c4065b3f4a267c67c12de55e48adf2); dependency tracing and tests required. |
| `src/app/globals.css` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4f250f90b0a2ede58dffa910b9a6789f46948398); dependency tracing and tests required. |
| `src/app/hadith/[book]/[id]/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9aaac3b6a600b3715ee56583f1ca01adf3d78dc4); dependency tracing and tests required. |
| `src/app/hadith/[book]/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8d8d35fc6f8c4f51775e6d446f77a788ad18c2bd); dependency tracing and tests required. |
| `src/app/hadith/error.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 28a9cf7eb65664c4824941eedab325eea2dede22); dependency tracing and tests required. |
| `src/app/hadith/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d9cbf0c74ba298465bc209200172b712b9d5f366); dependency tracing and tests required. |
| `src/app/hadith/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 3f429a793eba5b3a755b09e32fc9dd12cc37cd5c); dependency tracing and tests required. |
| `src/app/kids/[slug]/layout.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e3dd114cbebdfdc3fbb05b859c4b2ed7a84577cf); dependency tracing and tests required. |
| `src/app/kids/[slug]/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 892a61e46cb1063cd91c9f7e506e584a58212462); dependency tracing and tests required. |
| `src/app/kids/achievements/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 41d772250dafb2036648134af8e334f013c06760); dependency tracing and tests required. |
| `src/app/kids/adventures/layout.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7a1f38218f61a096c326845ac917733383dc678b); dependency tracing and tests required. |
| `src/app/kids/adventures/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1e5157b15b050214a1d77e10ccdd2ef958447be6); dependency tracing and tests required. |
| `src/app/kids/audio/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 589f2e4fbb1757d94c42018b7b1eeab19be2510b); dependency tracing and tests required. |
| `src/app/kids/games/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a626d809da122db91daa5943baf7d5f38078094f); dependency tracing and tests required. |
| `src/app/kids/layout.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 97c6b14a038284c7b913c99b3b2882de7000542b); dependency tracing and tests required. |
| `src/app/kids/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0a643f2af074bf964ee76867dee0ef0223a690f9); dependency tracing and tests required. |
| `src/app/kids/parent-dashboard/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0d2d5a61dc1bc009a1be182a50c8de0ab629774a); dependency tracing and tests required. |
| `src/app/kids/progress/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 261a1e34c4c374bcd7dd15ad1816c5dd4295c99e); dependency tracing and tests required. |
| `src/app/kids/puzzle/layout.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1068f9ce9bb01b899c2aae67e161753aba105fb1); dependency tracing and tests required. |
| `src/app/kids/puzzle/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ab8787321a72ae3a7bbdff1c54b8c8a0de73beb6); dependency tracing and tests required. |
| `src/app/kids/videos/[slug]/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 709c4302436f8b10d27e932d9bd89d37daca4e15); dependency tracing and tests required. |
| `src/app/kids/videos/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b93f4587e1082e5c232a257e101320ccf74b61d8); dependency tracing and tests required. |
| `src/app/knowledge/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ce915754469d3b0d811a719e0ffbbafaea575800); dependency tracing and tests required. |
| `src/app/layout.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c02d4a04d54ce8c9ad8bf524e92329236e5c721e); dependency tracing and tests required. |
| `src/app/library/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 16f98e5a453a22df21f14ecb0e655b3450aaac89); dependency tracing and tests required. |
| `src/app/llms.txt/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1ad6d8225766b6a9bce79443920d186d31842e8c); dependency tracing and tests required. |
| `src/app/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5bc0c26c7782ec70732b9403f59f59ae59e8eb42); dependency tracing and tests required. |
| `src/app/manifest.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0f29bbbbed70c28c7dce7f6e961a9aacb78b1217); dependency tracing and tests required. |
| `src/app/memorization/actions.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ec514a57f22ecc394cbb2d8e722442060a87444c); dependency tracing and tests required. |
| `src/app/memorization/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 54bca4c1d0eca222068e1318c220b910a1c0edd6); dependency tracing and tests required. |
| `src/app/memorization/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d890a908223d82eea7cd0fa3939034b5be5990a6); dependency tracing and tests required. |
| `src/app/memorization/progress-tracker.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f76681d3730c331e8259caed77a2fd3be358e331); dependency tracing and tests required. |
| `src/app/memorization/voice-recorder.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 312110dc95bb8f4ab2784539d75659b96907ab5b); dependency tracing and tests required. |
| `src/app/mushaf/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 39b5b419ab68bdab977b34c6cbeb9d482e21e858); dependency tracing and tests required. |
| `src/app/not-found.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6e29ee874e3786a91cd1812f3fb9d95a3c7cef17); dependency tracing and tests required. |
| `src/app/offline-library/offline-library-client.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 066714efb04f976df77cfdf52a776ff6c78eefda); dependency tracing and tests required. |
| `src/app/offline-library/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2ea6cf272330bc41efac77f4a8638a185bed00c5); dependency tracing and tests required. |
| `src/app/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0a50155a7f7dd8ff2e3f693ff11ec2daf03f2a22); dependency tracing and tests required. |
| `src/app/platform/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c6965c705c8e5cc1ddb68cb900450c7c06bcba2a); dependency tracing and tests required. |
| `src/app/platform/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e180dd080384f556355d0a34ea9493c6495d585b); dependency tracing and tests required. |
| `src/app/poetry/layout.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 32f0e7446b9918e8c0c01d1ce51bde794be09243); dependency tracing and tests required. |
| `src/app/poetry/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 00350cb6ecc72fe109402df51d5f6817cfe26794); dependency tracing and tests required. |
| `src/app/poetry/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → eb8496d9d1e66ee2318ea480abf9a68d326725c5); dependency tracing and tests required. |
| `src/app/prayer-times/error.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 866a1f6c740f45180805c6e4ab315fa706e22dcf); dependency tracing and tests required. |
| `src/app/prayer-times/layout.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c0794e339b4258cb688a6598efcf052d48b55692); dependency tracing and tests required. |
| `src/app/prayer-times/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6539a7b78ad17f143785d5f5ed242e2126ac4d7a); dependency tracing and tests required. |
| `src/app/prayer-times/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c519e64dc49664e4bd3da5a52e4a6738e8eb6969); dependency tracing and tests required. |
| `src/app/privacy/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d08e5501f6dd28efdcaf0acae0728ddfee939cd5); dependency tracing and tests required. |
| `src/app/privacy/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 05071b3c46e8c82da2c0d3343cf66a7e27420a09); dependency tracing and tests required. |
| `src/app/profile/avatar-actions.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4b5a20c19d135d19ca1f14befd39fdd9283c3370); dependency tracing and tests required. |
| `src/app/profile/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b16d31d019d26e5a0c0a61404f0ddc9a039e34f6); dependency tracing and tests required. |
| `src/app/profile/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6edc246bb58ab4d70a7402653426ef8f74237084); dependency tracing and tests required. |
| `src/app/prophets/[slug]/layout.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 54768ce12762f8a4abfe32568b2395bbed56ec47); dependency tracing and tests required. |
| `src/app/prophets/[slug]/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 539c32457b3a7a77873145b4cad6b43c76969831); dependency tracing and tests required. |
| `src/app/prophets/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 54fd073e265d4f0032c18df26e485251b3e11985); dependency tracing and tests required. |
| `src/app/prophets/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0d2d72762ccf843b88152539ef297a6e1bdf2c85); dependency tracing and tests required. |
| `src/app/qibla/layout.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 97aef3b94e277b1e781d0c96e20920223a18fa1b); dependency tracing and tests required. |
| `src/app/qibla/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0927bd3947f741ccda98c5355eb0ee34274c9766); dependency tracing and tests required. |
| `src/app/qibla/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e84b6c93cd334d41538f21c98494042931394606); dependency tracing and tests required. |
| `src/app/quran/[surah]/[ayah]/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a3d3fc3439c4c180a638727d5affa60d34ec8f37); dependency tracing and tests required. |
| `src/app/quran/[surah]/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e44e050eddbefcae234acf0f2eb0190753759b4d); dependency tracing and tests required. |
| `src/app/quran/error.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b69459d3fff9f6f202cb3653da1e4efb15eaae3f); dependency tracing and tests required. |
| `src/app/quran/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d26fe721aea13fbd9c54427587bef011c2989f37); dependency tracing and tests required. |
| `src/app/quran/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 885e5bc33130c008814ec654f706fad562f4e03f); dependency tracing and tests required. |
| `src/app/radio/layout.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 09e2903968547c07fdb59e141542adb44b28bbbc); dependency tracing and tests required. |
| `src/app/radio/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6cc5803775920dcf17a47085ff427e7c1a8b4424); dependency tracing and tests required. |
| `src/app/radio/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → eb4a736b9621c5b1e12d030abb187acb6fa014c4); dependency tracing and tests required. |
| `src/app/reciters/[slug]/layout.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 97afe275d4993af4f9a0d20949f2788d10ff1e86); dependency tracing and tests required. |
| `src/app/reciters/[slug]/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a611e4850618f150f0db0a2654140f9849af8c1b); dependency tracing and tests required. |
| `src/app/reciters/layout.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 622d82e0bafa9104fb9e218c73526ce181e584b8); dependency tracing and tests required. |
| `src/app/reciters/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 164f8aaef6c44ffbd1532a3cd5852d0b4428c102); dependency tracing and tests required. |
| `src/app/reciters/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 842a3279e278613c1dae116c3fa4f9ce4d5444fb); dependency tracing and tests required. |
| `src/app/robots.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a5d8f796270e63eab289cb9a3a98f4a260b585e0); dependency tracing and tests required. |
| `src/app/scholars/[slug]/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f076c560b60606b714b10e7a7444a2a8b9993a10); dependency tracing and tests required. |
| `src/app/scholars/layout.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a80dd42a91250a77385da073d84b9616c045fade); dependency tracing and tests required. |
| `src/app/scholars/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f9aba224a4cd6ad5db830bea0dd69903e64b61d3); dependency tracing and tests required. |
| `src/app/scholars/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 25fbd8531d23cbbe26c31d0b2bb246b4cb6ac46e); dependency tracing and tests required. |
| `src/app/search/layout.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e9724b15ae1753923c260c7a1a2b0725d4a93186); dependency tracing and tests required. |
| `src/app/search/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c88c652ba33185d61f2ffeb2b28f7d28f003fa1b); dependency tracing and tests required. |
| `src/app/search/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 48b60c9bf701eb766ae359b28eba625409285ae1); dependency tracing and tests required. |
| `src/app/sections/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6c87d83d7f19873674df8b49a1e10125259fd028); dependency tracing and tests required. |
| `src/app/settings/layout.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 970c3fe39b91e781377e50ac99db8d4c747fab38); dependency tracing and tests required. |
| `src/app/settings/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a2b9e32755486f0439f147664bd0af5d7237faa6); dependency tracing and tests required. |
| `src/app/sitemap-content/[id]/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e8204fcd8a74b148b5f0f6c60bebebdd2edd47e0); dependency tracing and tests required. |
| `src/app/sitemap-index.xml/route.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8dc21db4e982e82aeb93307dbf0de8aa36f1bac2); dependency tracing and tests required. |
| `src/app/sitemap.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → aaeb13a09169e96584d651de84d8a784a02cf30a); dependency tracing and tests required. |
| `src/app/spiritual-ai/actions.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 636cafd39c360427a69b12a9357d4bb6a4b28c5c); dependency tracing and tests required. |
| `src/app/spiritual-ai/layout.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a3ca38a5d97be6bed4b52e6ae337eca7faae9aad); dependency tracing and tests required. |
| `src/app/spiritual-ai/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 43651a961bc1acaf911dab948b18d1cc61f0a508); dependency tracing and tests required. |
| `src/app/spiritual-ai/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8f2879a8af0d596dc58bcf8a10484421966cc281); dependency tracing and tests required. |
| `src/app/stories/[slug]/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ca44742b1ff4b5df0d51a5bfc325f284602cdc7b); dependency tracing and tests required. |
| `src/app/stories/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5f32752bcaf1a65f3ebf4995ed7b7814d84d4ff7); dependency tracing and tests required. |
| `src/app/stories/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8962cc80660edb118b74350419eec5f7b5370fd2); dependency tracing and tests required. |
| `src/app/tafsir/layout.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7284531b923d685fb5a9cb9b17a74148f49767f6); dependency tracing and tests required. |
| `src/app/tafsir/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 99529c1e0c4f56e90b4a053c174d5a073bacf2e1); dependency tracing and tests required. |
| `src/app/tafsir/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c77ec2f55762b72ba70983ecd06c0cd932aebcbe); dependency tracing and tests required. |
| `src/app/tasbeeh/layout.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 334bb0296282746cd2e6abfd8fb7f8eb2a2ea44a); dependency tracing and tests required. |
| `src/app/tasbeeh/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0960e5204c43f126bdfc530bd0142f2949bf343a); dependency tracing and tests required. |
| `src/app/tasbeeh/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 38dcabb30c449c6fad2cc8720f6233d972fa0033); dependency tracing and tests required. |
| `src/app/tawasheeh/layout.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 18e9468258052f21261f86d4387cef5b495880f2); dependency tracing and tests required. |
| `src/app/tawasheeh/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5a924cfd2a548428c421230edb72f28b1b587be1); dependency tracing and tests required. |
| `src/app/tawasheeh/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 22c1c6d6f3eab1d9b78ab3dc74ac14baa982f178); dependency tracing and tests required. |
| `src/app/terms/layout.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 69f4d9904f8947a756ee981f5b72d2a76896c200); dependency tracing and tests required. |
| `src/app/terms/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4b82251d4ed64d96ea8357eaeec9daec21efdc2a); dependency tracing and tests required. |
| `src/app/terms/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f2067faf3f5f35f736b4d78017e42211e3689aa3); dependency tracing and tests required. |
| `src/app/videos/[slug]/layout.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 48dab7ba44964cdd55587fa6a94cede965640bb9); dependency tracing and tests required. |
| `src/app/videos/[slug]/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 28685465188ec63d0b15b0c306fe0e31fc552659); dependency tracing and tests required. |
| `src/app/videos/error.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6de605f337e75e0c9241c6f97dea54951b031404); dependency tracing and tests required. |
| `src/app/videos/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 09a8331abbbb1c77df8eab3f347cf05e076c6e55); dependency tracing and tests required. |
| `src/app/videos/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 30646509c4697907b096fadc43a457180aab9462); dependency tracing and tests required. |
| `src/app/wird/actions.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6a0d188719a726501253ab8337ef298bb7313abb); dependency tracing and tests required. |
| `src/app/wird/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 14c23855d7d810303b6d5f51eee2dfcdd6f0a23b); dependency tracing and tests required. |
| `src/app/youtube/loading.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7e069727ec503c2611c20d782fc50469ebf8b11e); dependency tracing and tests required. |
| `src/app/youtube/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 75385a12f4a1f69a9485c645c467a707492c0a09); dependency tracing and tests required. |
| `src/app/zakat/page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → cc749ebbff99da7a4e07d16345155bb4800f9f5c); dependency tracing and tests required. |
| `src/components/audio/audio-library.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4ceccb9c9786773222fc22b4dae530101ae4a03f); dependency tracing and tests required. |
| `src/components/content/content-guide.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0262e7f85ce50deaa55ca0f8571d1136622fe986); dependency tracing and tests required. |
| `src/components/content/content-references.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 332e77b3c3289c031d85489e0c061fa395b919a9); dependency tracing and tests required. |
| `src/components/content/editorial-depth.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c89c87a8ab8933236fa168aaaed82606e8ed591a); dependency tracing and tests required. |
| `src/components/content/editorial-utility-depth.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4a4da1c3ce4b5558bcde47c54a97568811e577b6); dependency tracing and tests required. |
| `src/components/layout/adsense-slot.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 68525fb27325c7363c791d9caaebe33153aed7a4); dependency tracing and tests required. |
| `src/components/layout/adsense.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f706b388ce50fb66e549907263fbd2dd99d0351c); dependency tracing and tests required. |
| `src/components/layout/analytics.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 08c097892db0afff55cf9731a3a3ae8622383b92); dependency tracing and tests required. |
| `src/components/layout/app-update-checker.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 98856477ae04324db00d8058b919a91f019dcd8c); dependency tracing and tests required. |
| `src/components/layout/auth-nav-actions.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → aaa8dccc9b40e397ebc390b212a04b3f59291e06); dependency tracing and tests required. |
| `src/components/layout/deferred-analytics.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 073ec059458214972525495e7957338ee52ced81); dependency tracing and tests required. |
| `src/components/layout/deferred-runtime.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6bd0aeae36df7386e71082f696c8ce3cd9ee1255); dependency tracing and tests required. |
| `src/components/layout/footer.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → bc8b66a6908ba1beefc8b8b5512d9a09d5aca548); dependency tracing and tests required. |
| `src/components/layout/install-prompt.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9b136f4f8906620108759932a1dca633c60d1b8a); dependency tracing and tests required. |
| `src/components/layout/language-aware-nav.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 558a2bc1f9243b92fbfcd6c00590a45ac0f65613); dependency tracing and tests required. |
| `src/components/layout/language-provider.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → cf77d4119b9f69cc81d06e4843221efc553d8c42); dependency tracing and tests required. |
| `src/components/layout/language-toggle.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6842abe53b7f434dfa1b23a67ae8e2adabf667d2); dependency tracing and tests required. |
| `src/components/layout/mobile-nav.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2538e696b8f0ea49b22de37f45f78287d7f936ae); dependency tracing and tests required. |
| `src/components/layout/native-capacitor-bridge-loader.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e6402a72a21ff6350e96ae65fe5ee01fa1d1c4d3); dependency tracing and tests required. |
| `src/components/layout/native-capacitor-bridge.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9cf0a4cb88c4f3828ce5a2b392e2e694accfeece); dependency tracing and tests required. |
| `src/components/layout/native-google-oauth-handler.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9bccac40451c930d1bc16473b6f6a9f29ce06b56); dependency tracing and tests required. |
| `src/components/layout/navbar.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a0d8c01420b2ad0bfbf31d858723c12fdc296d9f); dependency tracing and tests required. |
| `src/components/layout/notification-permission-banner.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 14cfb3eef282c3dcfa626a7bfe434e6f57e2c904); dependency tracing and tests required. |
| `src/components/layout/offline-navigation-guard.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9234b9d2bb79cf5baaa52ee0dd46d36fe2c55f39); dependency tracing and tests required. |
| `src/components/layout/prayer-alert-provider.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → cbd7ed07b632ec9fc214f6c4925389f57919e6b7); dependency tracing and tests required. |
| `src/components/layout/runtime-effects.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2082eed43ff49b4e8f0d50106bcd0be5b32a2cb0); dependency tracing and tests required. |
| `src/components/layout/service-worker-register.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a3c52d671e7baf70cf5c77ed78e3825d2857db9a); dependency tracing and tests required. |
| `src/components/layout/site-shell.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f3dd02effb61f9d00aa73ae74ccf3da8402de6fa); dependency tracing and tests required. |
| `src/components/media/resilient-profile-image.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e645282e1a19ce2afcedb3450ea82e172ba29644); dependency tracing and tests required. |
| `src/components/platform/android-release-card.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → fa6abef1e3541ba3e04c12de4b51de262ebc1f1f); dependency tracing and tests required. |
| `src/components/smartlink-promo.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5a861d3fe093b524277264d345c3959efe4b18a7); dependency tracing and tests required. |
| `src/components/ui/badge.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 099558bd3087fab9a55700ed538a7475c31cbaa8); dependency tracing and tests required. |
| `src/components/ui/button.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 691cf5b5b888b2f227636b62087f5d23aeeae517); dependency tracing and tests required. |
| `src/components/ui/card.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 83589921103941ddaefd9cfddd3a2a8e9d535367); dependency tracing and tests required. |
| `src/components/ui/container.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b1683c46755bb77016537ddf87ffe8a0aba36d7a); dependency tracing and tests required. |
| `src/components/ui/input.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2639e995c6598bedda40ba017de6d644c563691a); dependency tracing and tests required. |
| `src/components/ui/Logo.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → da2a32155b35cb709a691be2ea9fc018aee9a1b6); dependency tracing and tests required. |
| `src/components/ui/page-error.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 174499ed7f45c850f7e98e4e3239cc6ffb490426); dependency tracing and tests required. |
| `src/components/ui/page-skeleton.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1f535f376c2dbbae1de3a1342cdcf6de7dcb552e); dependency tracing and tests required. |
| `src/components/ui/progress.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2a1686870e0ee7322df746927bd29a1fffbb2671); dependency tracing and tests required. |
| `src/components/ui/section-header.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 14e6cfd227d14c275b95de09d967f58bbdfb5f97); dependency tracing and tests required. |
| `src/features/adhkar/components/adhkar-page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c20b2c0866d4d3ff32d13951fc9d0a3f717f2cfa); dependency tracing and tests required. |
| `src/features/admin/actions/users.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 091f75355d3716b36b23dfcbb757a32fa8b7abb8); dependency tracing and tests required. |
| `src/features/admin/actions/video.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f6ffceed332c177ae4ce08b9f00ce674e3599e41); dependency tracing and tests required. |
| `src/features/admin/components/admin-breadcrumbs.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7f5b14edf6bed1e91708aaaa5d28de0fbb69590d); dependency tracing and tests required. |
| `src/features/admin/components/admin-command-palette.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d5867b486d59f67dc3f40187daec8aebf4451b51); dependency tracing and tests required. |
| `src/features/admin/components/admin-live-queue-dashboard.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 98f28d67ca2f6a282522ebdad43946fffb224f34); dependency tracing and tests required. |
| `src/features/admin/components/admin-module-directory.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → fb0d4f59ac7446988974ba4fb44af16edaf69ce0); dependency tracing and tests required. |
| `src/features/admin/components/admin-page-view-tracker.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 438e1fa5a25480de8ccae11e61f406891a9cfd6a); dependency tracing and tests required. |
| `src/features/admin/components/admin-platform-command-center.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 98038c784db498c1d8dcadccf423a0cfc4c04c88); dependency tracing and tests required. |
| `src/features/admin/components/admin-section-hub.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a00039f598a4aa25915b68a1c4bff137b6cd39f0); dependency tracing and tests required. |
| `src/features/admin/components/admin-sidebar.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0eb626138b952b0e0c36f715d78cc5068aa15dfd); dependency tracing and tests required. |
| `src/features/admin/components/admin-step-up.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 66215e75b119b4aa8c9bed337c6b34096ceba9c2); dependency tracing and tests required. |
| `src/features/admin/components/audio-choice-field.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 31aac8509d703b492ddef24ef88f785e4a1899c4); dependency tracing and tests required. |
| `src/features/admin/components/cloudinary-image-upload-field.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0ef0f2a7c1986b1dfaa3647fd4ba99c55e78fa29); dependency tracing and tests required. |
| `src/features/admin/components/kids-content-manager.tsx` | REVIEW_REQUIRED | New path at baseline bb22f511281ea83b4c64e97f391f6ff1fcb07208 (blob 59d69d4533bf99ad74ee4137b66ca783706c6ce1); usage/dependency review pending. |
| `src/features/admin/components/purge-generated-videos-control.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e2c615d1a63a64bd9cca95f5b982f1eff1919ce5); dependency tracing and tests required. |
| `src/features/admin/components/role-permissions-matrix.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6ded5845ea81584526d93320c6123f9f29a26cd0); dependency tracing and tests required. |
| `src/features/admin/components/site-audio-manager.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 44b6e08181195f551ae66e55675510529ee817ab); dependency tracing and tests required. |
| `src/features/admin/components/traffic-revenue-panel.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7012a0d7ddd481010e33234b87e6c1a1e82fe7a5); dependency tracing and tests required. |
| `src/features/admin/components/users-table.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 775357e7c779ba9a7b63b6bcd495ab0550d9030a); dependency tracing and tests required. |
| `src/features/admin/components/video-upload-field.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 863de84265895edaefef3eddac2a6db7bd358525); dependency tracing and tests required. |
| `src/features/admin/config/modules.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 34cb4b1479fa067d3ea8d2170a35c1060aad8aed); dependency tracing and tests required. |
| `src/features/admin/config/navigation.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1c9c983e9afee47618c28f52f5a7dabb745efcb9); dependency tracing and tests required. |
| `src/features/admin/services/admin.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8757305137581e9660c21547e3113325faee1e53); dependency tracing and tests required. |
| `src/features/admin/services/analytics.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1fa86f92d3cff30983a42545458e5f13b3288087); dependency tracing and tests required. |
| `src/features/admin/services/audit.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a56e928d6a76bade18af6ac1bd80378179bfc9c7); dependency tracing and tests required. |
| `src/features/admin/services/battles.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e0628481324ee422f819e3bce5e57dadf0dfd035); dependency tracing and tests required. |
| `src/features/admin/services/content.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 99c6061351538e70baae3cbfea054597e53f90fa); dependency tracing and tests required. |
| `src/features/admin/services/knowledge.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4882498fb1c46748f488a71444391377af468403); dependency tracing and tests required. |
| `src/features/admin/services/permissions.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0560c490dbdef1ab194b33b5690eba965035ba02); dependency tracing and tests required. |
| `src/features/admin/services/platform.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ba942ea2452818a8793429ca04eba2da084e5acc); dependency tracing and tests required. |
| `src/features/admin/services/prophets.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → faeaacb281e267517406e5d009e4de3cd916cc65); dependency tracing and tests required. |
| `src/features/admin/services/rate-limit.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 70b06497c38c9f62c8b7853d2ee0cf9277e12eec); dependency tracing and tests required. |
| `src/features/admin/services/safe-read.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 34bb925595acd814380ff8142882d45d8ae61ac9); dependency tracing and tests required. |
| `src/features/admin/services/security.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → af018ba7578ba7152215b9086514a890ffd32595); dependency tracing and tests required. |
| `src/features/admin/services/traffic-revenue-metrics.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 82ef1a644067766709679f44085741027e8650f2); dependency tracing and tests required. |
| `src/features/admin/services/traffic-revenue.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 19aaa17ec9ff1ec44fc6698ee27cf4abde865ed1); dependency tracing and tests required. |
| `src/features/admin/services/youtube.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 34261e2f17181cbe8b207aa674a374901e43d445); dependency tracing and tests required. |
| `src/features/admin/video-requests/components/admin-video-requests-client.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c022f13120035fc7eed5d128fbed0a0e98593972); dependency tracing and tests required. |
| `src/features/admin/video-studio/components/admin-video-studio-client.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 216f7e13681d019ea9c53b0c1c86ea6157fb58ca); dependency tracing and tests required. |
| `src/features/admin/video-templates/components/template-studio-client.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 57f63436f363f6568537cceafa1f199c50886616); dependency tracing and tests required. |
| `src/features/articles/data/adsense-editorial.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f259dcb47fe0b320564ae5e711881c4abc6bb57f); dependency tracing and tests required. |
| `src/features/articles/data/articles.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8bb92021318dd262a58c50ba737571e18c9a823f); dependency tracing and tests required. |
| `src/features/articles/data/extended-editorial.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 364227a0fe8ff36c4f043fd83843862b7ff32c40); dependency tracing and tests required. |
| `src/features/articles/data/fallback.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 62c255b2caa3d41efe15d5151a54e7f8504c341a); dependency tracing and tests required. |
| `src/features/articles/data/longform-editorial.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 43caad51d4e935e38efa8aaed9106fb4a2114394); dependency tracing and tests required. |
| `src/features/articles/services/articles.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1c7476b37921fea4aea150a6d804dce16f9b733c); dependency tracing and tests required. |
| `src/features/articles/types/articles.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 290c4dbd1c3f0efc722e923872ef12b92e475e54); dependency tracing and tests required. |
| `src/features/audio/data/tawasheeh-fallback.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 05605da7c5959f650e9f43991e5cee5672c7d888); dependency tracing and tests required. |
| `src/features/audio/services/radio.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 41e849635bbd6ee6edcfc7545b897c63d8e29b8a); dependency tracing and tests required. |
| `src/features/audio/services/site-audio.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a3d5311606585b71869f89ea1e4d0fb09232d5e0); dependency tracing and tests required. |
| `src/features/audio/services/tawasheeh.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2a0025714f4ca2ab160306b91b2bfeb2aade32a9); dependency tracing and tests required. |
| `src/features/auth/actions.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6c996dc6ea714fb8195df7eabdefd5efeb1d0dd8); dependency tracing and tests required. |
| `src/features/auth/components/forgot-password-page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 238ad77a1ccd513730ff5dbef6da0925aa90d77e); dependency tracing and tests required. |
| `src/features/auth/components/google-oauth-button.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 806659759aa3d7662962dcdcfe3762280ce9978d); dependency tracing and tests required. |
| `src/features/auth/components/login-page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c4ac4e944acc2a92f5d9598e1125b635d1beda36); dependency tracing and tests required. |
| `src/features/auth/components/register-page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 332d80dacac29f2a478c5d5bd9a9ac74d4c68503); dependency tracing and tests required. |
| `src/features/auth/components/reset-password-page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c7e4a73d1159d5cc00d4a9952afd49b5e2e821f9); dependency tracing and tests required. |
| `src/features/auth/integrations/google-oauth.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 855277f07ebd40c69455691944bb76acd61bfabd); dependency tracing and tests required. |
| `src/features/battles/services/battles.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 538bb1fe14eab819569e27abbd8daece1dfa3421); dependency tracing and tests required. |
| `src/features/battles/types/battles.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c249bf397b423e246367b2b7274a13ae2ef6da79); dependency tracing and tests required. |
| `src/features/companions/data/fallback.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 42955db2ad4759ea901dc411a73538472468c5dd); dependency tracing and tests required. |
| `src/features/companions/services/companions.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 55fb555275dc7ec20397df1ddddc1e864090ae09); dependency tracing and tests required. |
| `src/features/companions/types/companions.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b9bbf4f8173b799833e9256d93c233a586fe0d10); dependency tracing and tests required. |
| `src/features/companions/utils/companions.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1f95a65ae305daab080d0333c5fa0586af0636a5); dependency tracing and tests required. |
| `src/features/competitions/data/fallback.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ec0527575d56f4bf37e1791350ea85045e2060de); dependency tracing and tests required. |
| `src/features/competitions/types.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 865e04820db0dc2875178c67fe5b9640a516bed4); dependency tracing and tests required. |
| `src/features/conquests/data/conquests-detail-fallback-extended.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4d898d104443bd2308a1a580bb8d18b5e8321f7b); dependency tracing and tests required. |
| `src/features/conquests/data/conquests-detail-fallback.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 79079f69cadd6527830bf97e2a32c49986c42965); dependency tracing and tests required. |
| `src/features/conquests/data/conquests-fallback.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 11c90004e32cc7e5a4dc59eaa037356c3ebc405d); dependency tracing and tests required. |
| `src/features/conquests/services/conquests.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → de74228dc5250ed09a16ffe05575286ef3d8a2cf); dependency tracing and tests required. |
| `src/features/contact/rate-limit-identity.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0d131d7b47433652f3cbcb73580ac29f4c10fa2a); dependency tracing and tests required. |
| `src/features/contact/services/contact.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → eafac0e95a26c2e00746a104a837b00e27541f50); dependency tracing and tests required. |
| `src/features/contact/services/rate-limit.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → eeb583757bc14ee42a2b6ddc73182d2862142dd3); dependency tracing and tests required. |
| `src/features/contact/validation.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0d77c1e07d07ddf02dfe6a2071bc8c81b6695459); dependency tracing and tests required. |
| `src/features/content-library/services/content-library.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8060b666fe92c46c16c917e98a839326deeb25ef); dependency tracing and tests required. |
| `src/features/content/services/stats.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 54fe9d9109d9ff40e306d8ad41b237df79b67c4c); dependency tracing and tests required. |
| `src/features/dua/data/fallback.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b55e77c564ded46bf0052b8cc63135c6d573e82e); dependency tracing and tests required. |
| `src/features/dua/services/dua.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6981627f0e43e9fb972e9fcc55dfed758c2ec240); dependency tracing and tests required. |
| `src/features/dua/types/dua.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9693ca7a48dd739bdde4d8473909571fe211ac15); dependency tracing and tests required. |
| `src/features/favorites/services/favorites.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 43cea9991f86bacee84e52a2236ebd2c4306ffca); dependency tracing and tests required. |
| `src/features/hadith/data/fallback.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f430b399ee8dd8c561c553fcc8ccefaf7e450140); dependency tracing and tests required. |
| `src/features/hadith/services/hadith.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8b4c7e5d33cebdc69329f0ff9efaaa410894bc31); dependency tracing and tests required. |
| `src/features/hadith/types/hadith.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 3cacfadf0b1e4389b632087084125b9ec9b9566d); dependency tracing and tests required. |
| `src/features/home/components/home-interactive.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1a4bd1c46e52bed3013b3006892a39bde4fbc27c); dependency tracing and tests required. |
| `src/features/kids/components/games/game-shell.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 379e009868651946eb1096cc1043264f4cdce92d); dependency tracing and tests required. |
| `src/features/kids/components/games/games-index.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 222ca7e26bf90cedfb7c9079b07217345c5a550d); dependency tracing and tests required. |
| `src/features/kids/components/games/kids-action-adventure.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → fbd7bc9402a0f7dadfa6ccc3bda2f5e207303dc9); dependency tracing and tests required. |
| `src/features/kids/components/games/kids-action-runner-road.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 15bf4be72a5ce072a6318cc907ddd0f39b6869a2); dependency tracing and tests required. |
| `src/features/kids/components/games/kids-game-art.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1f23a40f23eb35fdd77dcd0adc118d80adabd597); dependency tracing and tests required. |
| `src/features/kids/components/games/kids-game-kit.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b75707c0d48bd81ab181af1f9acceaa70d6bc2b7); dependency tracing and tests required. |
| `src/features/kids/components/games/kids-game-motion.css` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1765810bbc1ce8a8d153f3cf4d5b0c25977eb1c8); dependency tracing and tests required. |
| `src/features/kids/components/games/kids-game-visuals.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → dcc7e197bc75e2472100a52f80d6233ce48fbb60); dependency tracing and tests required. |
| `src/features/kids/components/games/kids-learning-games.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 832cf9e092c097b3d22802b1365166fb3b57961a); dependency tracing and tests required. |
| `src/features/kids/components/games/kids-letter-lab.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ce8e9045b800966d15704bbf8673e4da3843cc7b); dependency tracing and tests required. |
| `src/features/kids/components/games/kids-values-coloring.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 63550f18244c0b76e584eca89262844ac8398781); dependency tracing and tests required. |
| `src/features/kids/components/games/progress-dashboard.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8177eb8d93d030af6afeb95b2cf1a09c072446ba); dependency tracing and tests required. |
| `src/features/kids/components/games/use-managed-timeouts.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 371c3b561768863e967d9985c7f7e3210839e576); dependency tracing and tests required. |
| `src/features/kids/components/games/world-game-stage.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 63ee24a233636c53927201347d7f92db1259e9e9); dependency tracing and tests required. |
| `src/features/kids/components/kids-achievements-board.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c93110fbcd29a2bf379af065ba3c974abbc6b96d); dependency tracing and tests required. |
| `src/features/kids/components/kids-audio-hub.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0c87a8d088d767ce2a92d455726333919e73f781); dependency tracing and tests required. |
| `src/features/kids/components/kids-quiz.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 744b64cc986514f53467d879ddcc738038ef3eb5); dependency tracing and tests required. |
| `src/features/kids/components/kids-section-navigation.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 75b5cde4dc64228be223e4125a3939b02fc92783); dependency tracing and tests required. |
| `src/features/kids/components/kids-share.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e9797926cef9c1a16cd33667edb5f13eadc8d522); dependency tracing and tests required. |
| `src/features/kids/data/audio-client.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → dd3b44cf9c47a4445d80225f9603ff69f8dc9f26); dependency tracing and tests required. |
| `src/features/kids/data/audio.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e18298c9c29c441014ce1cf89e30a9c82a0494ba); dependency tracing and tests required. |
| `src/features/kids/data/content.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1a93a702badc1f66242c81789b9dde912ee08ef2); dependency tracing and tests required. |
| `src/features/kids/data/games-enhanced.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → bc6308dbd8118319bd352c2749da472441aac042); dependency tracing and tests required. |
| `src/features/kids/data/games-index.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 91d8a011ebd7f0df7de35e306fe2731ea55e70c0); dependency tracing and tests required. |
| `src/features/kids/data/games-levels-enhanced.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 702a4781f3aae035bf70f5d568118c5d9b7653ba); dependency tracing and tests required. |
| `src/features/kids/data/navigation.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 375f5a40cfd99fc2838c841f236c63dcbd9cdcaa); dependency tracing and tests required. |
| `src/features/kids/data/stories.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4ce86f620c618c5b35f4fb16f78de9a09ef71121); dependency tracing and tests required. |
| `src/features/kids/services/games.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6f7a88d5daac31e252e99cc0812ad464738edad7); dependency tracing and tests required. |
| `src/features/kids/services/kids-content.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6c010f40ef9448151a92776aa99da88229be5342); dependency tracing and tests required. |
| `src/features/media/services/cloudinary-validation.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 55d80fb70dec0667b868833237ba7f803c0c43f8); dependency tracing and tests required. |
| `src/features/media/services/cloudinary.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b89a57101fce134a08d0df79c41c606a34923d10); dependency tracing and tests required. |
| `src/features/media/services/media-assets.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c7d9cef45b80734d02a054766c269bc9a2bf748f); dependency tracing and tests required. |
| `src/features/memorization/services/progress.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4d7ad534910578f47896ce27482273b4636c3eab); dependency tracing and tests required. |
| `src/features/notifications/services/notifications.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4b1467809fcd550366bde1a8963d18a4d9980c59); dependency tracing and tests required. |
| `src/features/notifications/services/quran-reminder.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → bbb199338e56ef61ae53a65caaaa12d0ce682c6b); dependency tracing and tests required. |
| `src/features/notifications/services/user-notifications.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4e01d382874a87f5aa5c9f650eafe96815444d12); dependency tracing and tests required. |
| `src/features/offline/components/offline-indicator.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6def91e6d35b810abc690ee095711fbcfa242ee6); dependency tracing and tests required. |
| `src/features/offline/hooks/use-offline-data.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 113b63b63d3b4f679152905ea126a018d038d0ed); dependency tracing and tests required. |
| `src/features/offline/hooks/use-offline-status.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 86aff83a329966f75bae58b08905c75aab690904); dependency tracing and tests required. |
| `src/features/poetry/data/fallback.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a7e9fd9e8eaa555567b1fbbcb47073c7882e87db); dependency tracing and tests required. |
| `src/features/poetry/services/poetry-insight.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 398464c9f981bbd815d44eff914fdb48f10b262e); dependency tracing and tests required. |
| `src/features/prayer/components/adhan-player.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 83c653553b0188181d8dcb02c108c3f99b725da5); dependency tracing and tests required. |
| `src/features/prayer/components/prayer-times-page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 545b6a6c4a88846796f8aa79803f7564ff4ddc53); dependency tracing and tests required. |
| `src/features/prayer/hooks/use-adhan-player.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → cbcc8e2705060141ba31a6e5065fc4f775d7c390); dependency tracing and tests required. |
| `src/features/prayer/hooks/use-prayer-alert.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d9eaae94ff78921b4a94acb860a2ef4b4aab2afe); dependency tracing and tests required. |
| `src/features/prayer/hooks/use-prayer-times.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0c44eb4591f765161685aa5a9ac39e7c69a99e1e); dependency tracing and tests required. |
| `src/features/prayer/services/prayer-times.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 90b4a36eb85bd032ae49f57bd2819769c2855386); dependency tracing and tests required. |
| `src/features/prayer/services/saved-prayer-location.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9b03305c7f5a2ce907db4643eb28c13b66decf9f); dependency tracing and tests required. |
| `src/features/profile/components/avatar-upload.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 25ff49d508dd663930d534a5e29c187f7d51c8d2); dependency tracing and tests required. |
| `src/features/profile/components/profile-local-settings.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2d8a44ff3e91b32fa5c1a7ed87584e9f02179b00); dependency tracing and tests required. |
| `src/features/profile/services/profile.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8c54c50e1f90419b734e21937c18a248bbeb72cd); dependency tracing and tests required. |
| `src/features/prophets/data/fallback.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → eb034d47ee6739405cadf534f087fa2e748dc6a9); dependency tracing and tests required. |
| `src/features/prophets/services/prophets.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 796f2d9c9f3265a5751bf146f1078c50112535c4); dependency tracing and tests required. |
| `src/features/prophets/types/prophets.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d20f9d50faa4dfbcc3e22d077f78df1b470a3d89); dependency tracing and tests required. |
| `src/features/qibla/components/qibla-page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5abafb9180f5e917e37feb4afd916badb8c77d42); dependency tracing and tests required. |
| `src/features/qibla/services/qibla.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 05e62950f370fc89262a94c55a8c28a202ea1daf); dependency tracing and tests required. |
| `src/features/quran/actions.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7ed3309cef025b8da685d86db3e18c906beb52d1); dependency tracing and tests required. |
| `src/features/quran/components/audio-player.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 66ddb284a4581d8369b9fbcebaf3429546c75974); dependency tracing and tests required. |
| `src/features/quran/components/bookmark-button.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f2427d6eb7f39a7c83ca4280d9b94b1cbe002c4a); dependency tracing and tests required. |
| `src/features/quran/components/continue-reading-banner.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2b503ebb9e2d697349774cb30fdab8b44b2db6a8); dependency tracing and tests required. |
| `src/features/quran/components/mark-surah-read.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → fb861f30eebbb05e7242f01a56126eac40aeb244); dependency tracing and tests required. |
| `src/features/quran/components/mushaf-bookmark.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 3631a7070b914d244986d1a9e182f5bce6858150); dependency tracing and tests required. |
| `src/features/quran/components/quran-auth-banner.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 967aa8f2fa98b1a75711a7d4e23433a721409ec4); dependency tracing and tests required. |
| `src/features/quran/components/quran-catalog-page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 41f5350e6c17a59e0ba70517a4b8649ec78d1caa); dependency tracing and tests required. |
| `src/features/quran/components/quran-page-header.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2a14bc05ce4d07df6a7dbc4797e8fd4f82930c3c); dependency tracing and tests required. |
| `src/features/quran/components/reading-progress-card.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b52af127b48b3fd100b729193f1cc4b256ec6cde); dependency tracing and tests required. |
| `src/features/quran/components/surah-search.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 901148948b59655780d00682adc21c5899d5691b); dependency tracing and tests required. |
| `src/features/quran/components/surah-skeleton.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 40513d20ee7daa3ccb7843abd49beb73cde8882e); dependency tracing and tests required. |
| `src/features/quran/components/tafsir-library.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8eeacca3eede63f4ac446504519c4948bfe04e74); dependency tracing and tests required. |
| `src/features/quran/components/wird-dashboard.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0afcec66114bf47e0e0d2c8cff22ceccb7146671); dependency tracing and tests required. |
| `src/features/quran/data/fallback.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 62af672175be5ecbec31f47275c47cffc1d8df34); dependency tracing and tests required. |
| `src/features/quran/hooks/use-quran-wird.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4d7293bd166839ea4b81eeed8ab6a00baded0993); dependency tracing and tests required. |
| `src/features/quran/services/offline-audio.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f549e7e4706844f2597b411fd2867132acdac0af); dependency tracing and tests required. |
| `src/features/quran/services/quran-client.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → efcd2a5240d0a048a0fa87e181bf74989c1ff147); dependency tracing and tests required. |
| `src/features/quran/services/quran-server.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4110f26762aa729348853ddaae53713f226a0c82); dependency tracing and tests required. |
| `src/features/quran/services/quran.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 34ede67c8cb1dcb665287cdcfa233dbf55bb684e); dependency tracing and tests required. |
| `src/features/quran/services/reading-progress.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 60a8b155f9bd4900cfc44cf6d99dc34776799605); dependency tracing and tests required. |
| `src/features/quran/types/quran.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 51afb69e6bdee9f83671fb7b5bf632cea0cf64be); dependency tracing and tests required. |
| `src/features/quran/utils/quran-progress.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 86d294f15610fa307151feec73108b70e3344b7f); dependency tracing and tests required. |
| `src/features/quran/utils/surah-mapping.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 501f8acd8a9315e0db04dba86eb2062d82711a97); dependency tracing and tests required. |
| `src/features/quran/utils/surah-names.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 723100b263588cf0954f77eb326549b408770e03); dependency tracing and tests required. |
| `src/features/releases/android-download-url.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5d193b0503adc370e652e5422267f446b8bc74a5); dependency tracing and tests required. |
| `src/features/releases/services/github-android-release.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8f18cd39b611ae22549feb26d604e058464ba233); dependency tracing and tests required. |
| `src/features/releases/services/github-release-manager.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 073fa98dae25c2e7d620b1076520a87137323229); dependency tracing and tests required. |
| `src/features/reminders/hooks/use-dhikr-reminder.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 27a8fa07c88e6299d7db477fd48320476a82a56e); dependency tracing and tests required. |
| `src/features/reminders/hooks/use-salawat-reminder.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → dc5109664a473435df4e919accd04bfbd6e0be00); dependency tracing and tests required. |
| `src/features/reminders/services/reminder-preferences.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5ab6768de251f16e43b4812aefc8749c9ef7ba6d); dependency tracing and tests required. |
| `src/features/scholars/components/scholars-page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f38efa0dbd5ef15dda5d0126d74bf2a6b80dca22); dependency tracing and tests required. |
| `src/features/scholars/data/fallback.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → bac2cbef93e0c604dd1b75cc9870e680643280e8); dependency tracing and tests required. |
| `src/features/scholars/services/scholars.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ec446621d9e8ab9788bf1a01757194fcafe9571b); dependency tracing and tests required. |
| `src/features/scholars/types/scholars.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6b79db1ecdf8bf2bffd6dc75165b296a0be0ee22); dependency tracing and tests required. |
| `src/features/search/services/search.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b2c38b1e43f27eb039df095b8f66245dfdbb4243); dependency tracing and tests required. |
| `src/features/site-content/services/site-content.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 04715d96c67acd09608ce687563320eb24a5b66c); dependency tracing and tests required. |
| `src/features/social/integrations/facebook.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f2b5f59b4f61952637188e1279ed08848943af3a); dependency tracing and tests required. |
| `src/features/social/services/facebook-credentials.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 601a19fba3d5ce777eae278435cf8795caea7e9c); dependency tracing and tests required. |
| `src/features/social/services/facebook-post-insights.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 27319668f3d73f5fe12a27b55bfbd131e57891ee); dependency tracing and tests required. |
| `src/features/social/services/facebook-reels-insights.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6eccb866b5133e45d6ef9783eacc153d79e4085f); dependency tracing and tests required. |
| `src/features/social/services/facebook-reels-rate-limit.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7a84a416789a1bd3bff54a9caff8edb3fa607a97); dependency tracing and tests required. |
| `src/features/social/services/native-social-sync.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 08ecbf232babec245d54753e56d96cf6b7c8906e); dependency tracing and tests required. |
| `src/features/social/services/platform-availability.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 93020681638e5a048f755e544b2e39225d6960d9); dependency tracing and tests required. |
| `src/features/social/services/published-video-cleanup.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 959e8b181cfb4070a25dfe6f770f346135eda374); dependency tracing and tests required. |
| `src/features/social/services/social-deletion.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ff7e6c55da6ab35d633b6cc957ef35034e7fcf08); dependency tracing and tests required. |
| `src/features/social/services/social-publishing.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 43bb2eee547e35680ca29f846c355172e5b60573); dependency tracing and tests required. |
| `src/features/social/services/social-queue-selection.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c83417f7c6c76c6f8d27ac19fa1df900f021bbef); dependency tracing and tests required. |
| `src/features/social/services/written-content.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c4d45f77a8f04d0c37a875acc41157a9f2431fec); dependency tracing and tests required. |
| `src/features/social/services/youtube-oauth-credentials.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 978e19a1d0b039d5715b667952ff810cb3979e79); dependency tracing and tests required. |
| `src/features/social/services/youtube-post-insights.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 63d0d856863e0c5e73429642d515512675f2e3d2); dependency tracing and tests required. |
| `src/features/social/services/youtube-publishing-health.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 64dbd15be3883d1e02c2ca762b89eac8c646cb0d); dependency tracing and tests required. |
| `src/features/spiritual-ai/services/ai.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 93ba4ea9f77aa4c2558797f9cada747631639760); dependency tracing and tests required. |
| `src/features/spiritual-ai/services/gemini-client.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a47b0491ae0c77a17264f610480684575cf7d2b4); dependency tracing and tests required. |
| `src/features/spiritual-ai/services/policy.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d6ac24bb9c39276623562a0533855e4a5dcc1616); dependency tracing and tests required. |
| `src/features/spiritual-ai/services/retriever.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 09d57581757944eb42d8da42dbc02f5c7eb92145); dependency tracing and tests required. |
| `src/features/stories/data/fallback.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 759bec46d63da783f5ba54d97b1c2382d922e7cc); dependency tracing and tests required. |
| `src/features/stories/services/stories.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ef275ba9781bbb90af35ddd1e3df08aa37768cb3); dependency tracing and tests required. |
| `src/features/stories/types/stories.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 00b052a147c31f586ac7b40451072181fced6a8a); dependency tracing and tests required. |
| `src/features/tasbeeh/components/tasbeeh-page.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → be11dafaf9c228be8e18395c37a2e51da14097c6); dependency tracing and tests required. |
| `src/features/tasbeeh/services/tasbeeh.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e7e14483826b254efb11462960972d46fc5b0aa1); dependency tracing and tests required. |
| `src/features/videos/components/video-like-button.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 294135860d7b3ba62b0fb63c46c613cd8a025011); dependency tracing and tests required. |
| `src/features/videos/components/youtube-feed-card.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a7eec230e47226d884e5e858987d8541690e92bc); dependency tracing and tests required. |
| `src/features/videos/data/curated-content.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d6f4a61c3f2e2bb9d4ad73f850019ae36aab27d5); dependency tracing and tests required. |
| `src/features/videos/data/fallback.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ba55c3a40c057499bdd7e615c04098b9965cf386); dependency tracing and tests required. |
| `src/features/videos/data/kids-story-factory.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 70bf25a4d521ceca7319e131514e55b92c652473); dependency tracing and tests required. |
| `src/features/videos/data/verified-content.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d865dfd37432470e01fff05d99b4020e063ca92d); dependency tracing and tests required. |
| `src/features/videos/integrations/youtube.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7a0e6e592e338f7154db50f783a85fbee51caee8); dependency tracing and tests required. |
| `src/features/videos/providers/ai-visual-policy.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → bdd0a5a3a4748126978a7521c82f8e62a0fb0843); dependency tracing and tests required. |
| `src/features/videos/providers/comfyui-provider.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5542ee75ca063fa9da964ad163ab45d0c30a6158); dependency tracing and tests required. |
| `src/features/videos/providers/content-hash.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8632ad5182211296d9c137d49eefc7bac64f4406); dependency tracing and tests required. |
| `src/features/videos/providers/free-api-provider.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d6629fe829921393c8c5bfc7965b96f557b8cf99); dependency tracing and tests required. |
| `src/features/videos/providers/hf-space-provider.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e985fcf5164830c8d59e5fd3adf329d994f4ca19); dependency tracing and tests required. |
| `src/features/videos/providers/provider-router.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → cbf315407489e5abcb7de2a3e23cd2a667a7586d); dependency tracing and tests required. |
| `src/features/videos/providers/template-provider.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b5744b740922375aec8e1d410557fc09eee977a8); dependency tracing and tests required. |
| `src/features/videos/providers/types.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9669fc97e08684962db9c143a6d522b276b2b784); dependency tracing and tests required. |
| `src/features/videos/services/background-job-outcome.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e91d6c76dd7ea2071f5366e1576760384dc42b6a); dependency tracing and tests required. |
| `src/features/videos/services/narration-quality.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d6ceea752928f0803b39263ef3785b81b8bd249b); dependency tracing and tests required. |
| `src/features/videos/services/render-duration.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 498feb6676300ac1a6a58ce5acd7639deb92f5a7); dependency tracing and tests required. |
| `src/features/videos/services/template-config.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a0b0dd0eb1b26b33cc12ea0b3cfc5849a4613b1e); dependency tracing and tests required. |
| `src/features/videos/services/video-automation.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4b1d21ce88d2cb42aed294f901c377b8f1781377); dependency tracing and tests required. |
| `src/features/videos/services/video-composition.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 255382f55a11edfd0fc684b82d5f126835ee23be); dependency tracing and tests required. |
| `src/features/videos/services/video-creative-variation.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 50ce96af56a4f058e2b68d657a0ea9178ce5fc68); dependency tracing and tests required. |
| `src/features/videos/services/video-publish-approval.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 981b34eba593330cce889f7038b11ed58abab4df); dependency tracing and tests required. |
| `src/features/videos/services/video-sources.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2d4d7e611e62e837836f8a0ffba6c1cfdab94af2); dependency tracing and tests required. |
| `src/features/videos/services/video-template-version.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 57d954843229dd63614ac5b867da93bd17d286a9); dependency tracing and tests required. |
| `src/features/videos/services/videos.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1db2279a6c0f0c8b263933357e37414b5d87bfbf); dependency tracing and tests required. |
| `src/features/videos/services/voice-profiles.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b93347aace369af1708511685dfefe1484c70fff); dependency tracing and tests required. |
| `src/features/videos/types/videos.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 50c0d841bb22547e53af9238b53126a349dc7b6f); dependency tracing and tests required. |
| `src/features/wird/services/progress.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7e7f2c2528bdd6fcb8f10db10d5d7695ed4467ce); dependency tracing and tests required. |
| `src/features/zakat/components/zakat-dashboard.tsx` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e2cfc145fdd08149b79591c24eb88fff7704c60d); dependency tracing and tests required. |
| `src/features/zakat/hooks/use-zakat-reminder.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7e7dd86e2ac77712c7217f595ad9b01a5e2ab615); dependency tracing and tests required. |
| `src/lib/analytics/kids-events.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 06de96ca6229d2a39f5c9aef63d7aeac1c668797); dependency tracing and tests required. |
| `src/lib/audio/config.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 745744ccad61dab051b37868bbe68048bc10e0e6); dependency tracing and tests required. |
| `src/lib/audio/curated-library.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 656c2ec053270464ccd319e029a0ecd1835271db); dependency tracing and tests required. |
| `src/lib/audio/spiritual-tones.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e7aeb7fbf75ca336d503c553a2f0c0ae60648d31); dependency tracing and tests required. |
| `src/lib/auth-enhanced.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 615a72ec8dfadadde99069f284821e8a712bfa3f); dependency tracing and tests required. |
| `src/lib/content-quality.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8144caf0c7f9fef1df04025a3d738e311ee2a5b8); dependency tracing and tests required. |
| `src/lib/data/content-merge.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9884ec828b1a95ab81fc3d2f3e30b49633c25467); dependency tracing and tests required. |
| `src/lib/env.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 3383b782df8db379548becc33255eb152e748030); dependency tracing and tests required. |
| `src/lib/games/asset-manifest.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → eb9185bf6f4251e5f059d91c560ae9f56b3ae344); dependency tracing and tests required. |
| `src/lib/games/content-manifest.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5dc4b3205669a81205e3fd5d03fd72712ebea18f); dependency tracing and tests required. |
| `src/lib/games/game-instructions.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → bafdc76e1e65b051fa7f716427f38554fd89ba21); dependency tracing and tests required. |
| `src/lib/games/game-missions.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 3e2060a413dd509659d32c6bd0c42528ff65c5cd); dependency tracing and tests required. |
| `src/lib/games/game-runner.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4996fe5880d219b92158d07788ec97c08f665f9e); dependency tracing and tests required. |
| `src/lib/games/gameplay-helpers.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f833e40d3a29810d90d73fe238bb461ea8929e40); dependency tracing and tests required. |
| `src/lib/games/good-deeds.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d9f863821bd2b85a3dfeebd9d098db1664aa6a3e); dependency tracing and tests required. |
| `src/lib/games/hilal-fly.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 45b7d8eb56277aca1af59cabe33adf52739d2ff7); dependency tracing and tests required. |
| `src/lib/games/kids-level-system.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ae2b6f014a1474af9b1f16907570cb93e021fdc8); dependency tracing and tests required. |
| `src/lib/games/mosque-adventure.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 24efb039e8359cefa848790d35d873a31fb5ed6d); dependency tracing and tests required. |
| `src/lib/games/mosque-cleanup.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c9fb680762df8ac1fdf748ead4bc93a6bc1bf927); dependency tracing and tests required. |
| `src/lib/games/offline-queue.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a31ed8bb35b808b358805da6e7b10ac3d6507ef8); dependency tracing and tests required. |
| `src/lib/games/registry.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 04178494a7141cfd36ea5ddec94076cc813e5c54); dependency tracing and tests required. |
| `src/lib/games/run-stats.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → eba8d13f26910eb99f98df586b95ef4402518ca9); dependency tracing and tests required. |
| `src/lib/games/search.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → fb98b237fdec87f9693097bcf9a6e7b9db1bbea6); dependency tracing and tests required. |
| `src/lib/games/tone-feedback.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4b39256ff4a0c3f6ebb31702951adf06f378f922); dependency tracing and tests required. |
| `src/lib/games/validation.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6ef06fe45f4a91441dec0d808fee4f1dfc387f1c); dependency tracing and tests required. |
| `src/lib/games/verified-content.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 67455a1a510a75722658bcf78d9f4e2401e1051a); dependency tracing and tests required. |
| `src/lib/games/verse-puzzle.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0cac1b3fc26bbcd04e10630f3af4774f274bf93e); dependency tracing and tests required. |
| `src/lib/games/zikr-coloring.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 95548dae40ca41b28ec11fb16123f4e896c68160); dependency tracing and tests required. |
| `src/lib/games/zikr-jump.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 92437cedaf0ca9823fd01b22d2b989df4e73e60a); dependency tracing and tests required. |
| `src/lib/games/zikr-road.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c7c528d4d3a201d682d317e75be7db3d3aaf19d7); dependency tracing and tests required. |
| `src/lib/games/zikr-runner.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8c12c4ccabdc021dcd8d2b64b5477357797b251d); dependency tracing and tests required. |
| `src/lib/github/dispatch-workflow.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 3ba1bf46952c39f3fd7a198d6b3d399833476cd3); dependency tracing and tests required. |
| `src/lib/i18n.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a758eff6f213b60900832499381e43458171ff3a); dependency tracing and tests required. |
| `src/lib/i18n/server.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → cc8bd476fb40260a04dcdb9aea66b880a7c017be); dependency tracing and tests required. |
| `src/lib/location/reverse-geocode.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1361587b201b7cff18ee1f7e0d05813d92dc7bdc); dependency tracing and tests required. |
| `src/lib/navigation/catalog.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → da8beab3738e0b21daa9e3ba87f7dd98892a8d35); dependency tracing and tests required. |
| `src/lib/offline-db.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b9aec5f020a716f60ca45be2b4ef0eaa664a8929); dependency tracing and tests required. |
| `src/lib/offline-pack.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5b75aa0e5acd113a6eac49eb4677ecd3250b9c30); dependency tracing and tests required. |
| `src/lib/offline-settings.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 21094150256249b8710db2b64d3359af89aab2ba); dependency tracing and tests required. |
| `src/lib/push-subscription.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 571e9af69b966f100cbab1236f62d392b19cedea); dependency tracing and tests required. |
| `src/lib/search/arabic-normalization.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ea3be70e7eea4d9350858c4e3a416279ce8c80ab); dependency tracing and tests required. |
| `src/lib/security/pwned-password.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f6b2d5c600f6ade4ef49564821d89cc157c0dbc0); dependency tracing and tests required. |
| `src/lib/seo.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 46f67324e04addb45b1e8933987199b7d680e264); dependency tracing and tests required. |
| `src/lib/services/api-health.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 363ea4e047ff369bd3a21be74c011613d7e3cc2f); dependency tracing and tests required. |
| `src/lib/services/http.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7cbb28848b52871e368559d95dcc976a3d492a87); dependency tracing and tests required. |
| `src/lib/services/storage.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5b087960e10ca5717195f503265fe3ff4e04df85); dependency tracing and tests required. |
| `src/lib/site.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1a17ac0891c41af85b6099d8967e3c451b87320d); dependency tracing and tests required. |
| `src/lib/smartlink.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 424a45a320320f08fbfdf60eb3822db733862638); dependency tracing and tests required. |
| `src/lib/supabase/admin-rest.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 82a11ee9adfb2c748d6e6bc3b65f2283b4bd5b80); dependency tracing and tests required. |
| `src/lib/supabase/client.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1ababcb739823b3f859140ceec39f06271f5edc0); dependency tracing and tests required. |
| `src/lib/supabase/guard.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 928483eb32aa09996a679af394f40508ec8f20bb); dependency tracing and tests required. |
| `src/lib/supabase/middleware.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b1500990cad139074a8d04c63aa89ef611f40c8d); dependency tracing and tests required. |
| `src/lib/supabase/server.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ff70b87c80fc7b08ba72f6fbaddcd6362dc95054); dependency tracing and tests required. |
| `src/lib/types/common.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c5dde775a65fc3f515a9f0e781aa41538af9f332); dependency tracing and tests required. |
| `src/lib/types/prayer.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 061ddac3e4db6a0ff6d023c9ab6e4be5f0835fc1); dependency tracing and tests required. |
| `src/lib/types/supabase.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → bcaef7da96fa36146a103bbb9424e95cbdd6ac57); dependency tracing and tests required. |
| `src/lib/types/video.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a03d0ed723e620c07ea41f92ffdbae9662621ccf); dependency tracing and tests required. |
| `src/lib/utils.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 91bbff24394b392323fa4453b48a1a058ac6a64c); dependency tracing and tests required. |
| `src/lib/utils/companions.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 881d4ea1334a92a1391a46d54a9237f42ebb724b); dependency tracing and tests required. |
| `src/proxy.ts` | REVIEW_REQUIRED | New path at baseline bb22f511281ea83b4c64e97f391f6ff1fcb07208 (blob d736d5c493a445ffb667182404fa6bdd9c9e9bfe); usage/dependency review pending. |
| `src/styles/tokens.css` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f9fc69685b24f4b68db55c4e9540db627d0dc7ca); dependency tracing and tests required. |
| `src/types/google-generative-ai.d.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2d5ebb0892e545705089a6a66472ea0b3ca40ee6); dependency tracing and tests required. |
| `supabase/config.toml` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 15a6822eb0bad65fd52ff5a6dd14c3448668e491); dependency tracing and tests required. |
| `supabase/functions/_shared/auth.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 12bde6451e50ae53c891bd3e6adb608c987b1bab); dependency tracing and tests required. |
| `supabase/functions/_shared/cors.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 70afaf3e592032df48ee9f2ef60018849c588469); dependency tracing and tests required. |
| `supabase/functions/_shared/islamic-ai.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e8b631712b3c1275749a090614f6033bfee84b8d); dependency tracing and tests required. |
| `supabase/functions/health/index.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 63ba077a841a28f4d69c6fda1d44b7b31311072f); dependency tracing and tests required. |
| `supabase/functions/prayer-notification-worker/deno.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7ea69f477bf5d690084524cf9686f8315bc0c956); dependency tracing and tests required. |
| `supabase/functions/prayer-notification-worker/index.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 94aee46d005a185c0c40249c2ae2ed01ec453c60); dependency tracing and tests required. |
| `supabase/functions/source-verified-content-agent/index.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 91ece13922f94953bc57210a62774a0f16d72a7f); dependency tracing and tests required. |
| `supabase/functions/spiritual-ai/index.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f15bd6ca2723da6ece3a75273ca4dff9612eb4f2); dependency tracing and tests required. |
| `supabase/legacy_migrations/20260929_080000_kids_games_enhanced_content.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6e08b54a9eb70a2478b8e55b179f93f890011bf3); dependency tracing and tests required. |
| `supabase/migration-notes-0019-safety-fixes.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8cae16332f28232f5de96b0c2bac51fc5fdf1b29); dependency tracing and tests required. |
| `supabase/migrations_archive/20240705000001_create_category_type.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6b3d9fd189da43e55c4471a441d359608378def4); dependency tracing and tests required. |
| `supabase/migrations_archive/20240705000001_missing_tables.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 16434ffcbef3a8aa2674294f863d3b138a296638); dependency tracing and tests required. |
| `supabase/migrations_archive/20240705000002_seed_content.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 423e116d17acecc6ccd1d50b4724f1779e5394c5); dependency tracing and tests required. |
| `supabase/migrations_archive/20240705000003_fix_duplicate_migration.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 01a82876a9da4b2dba5e690010dd35039d0a0858); dependency tracing and tests required. |
| `supabase/migrations_archive/20240705000003_seed_stories_articles.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 79b927cd4e302b58379882d79fa0f07c310a49f2); dependency tracing and tests required. |
| `supabase/migrations_archive/20250705000001_initial_schema.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d0bdc54549a1df2ca3253bebd5cc1f50c35ffb67); dependency tracing and tests required. |
| `supabase/migrations_archive/20250705000002_rls_triggers_storage.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 380c34528733d0da51b5e836ce3f487a76fc5998); dependency tracing and tests required. |
| `supabase/migrations_archive/20260530000000_0000_young_rattler.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c98edfcd18a3ab8657bb91a289e2e72210761fea); dependency tracing and tests required. |
| `supabase/migrations_archive/20260530000100_0001_wakeful_stepford_cuckoos.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c29cb9ff1c866b2a9d6654d2d0ddb4e1453f0a12); dependency tracing and tests required. |
| `supabase/migrations_archive/20260530000200_0002_noisy_nocturne.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 29ac56c744848a0eaaa3e32695b46578ded8ff4f); dependency tracing and tests required. |
| `supabase/migrations_archive/20260530000300_0003_glorious_vanisher.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 532fe1de2cb50d22852a93ffcde6147887d25273); dependency tracing and tests required. |
| `supabase/migrations_archive/20260530000400_0004_phase2_auth_foundation.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1d9702ee78abbfa202e915fde8d9095d9150c56a); dependency tracing and tests required. |
| `supabase/migrations_archive/20260530000500_0005_phase3_content.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 967a21ab29d3f60d74d204c10115f16bde9306b2); dependency tracing and tests required. |
| `supabase/migrations_archive/20260530000600_0006_phase4_scholars_stories.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ba229e38d66ccdf173c7850e7b440fc95d69869c); dependency tracing and tests required. |
| `supabase/migrations_archive/20260530000700_0007_production_hardening.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 17d06fef84d664a08437f0cc2d669d48e01ff0af); dependency tracing and tests required. |
| `supabase/migrations_archive/20260530000800_0008_rls_hardening.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5857f0ca3143fbcd57fbbea49645a1a198360cb0); dependency tracing and tests required. |
| `supabase/migrations_archive/20260530000900_0009_admin_memorization_youtube.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2223c433b1126e11e1aa5ec07a22fe9ad04518ce); dependency tracing and tests required. |
| `supabase/migrations_archive/20260605000010_0010_missing_content_modules.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1fe88f247f23e07d1aaec3464b8ae206fff45874); dependency tracing and tests required. |
| `supabase/migrations_archive/20260607050808_0011_videos_and_categories.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f7a55d9e534f376faf5677bfc80f4c2e0112652e); dependency tracing and tests required. |
| `supabase/migrations_archive/20260610000012_0012_prayer_times_system.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a9e486d038d3eccbd2c9a881383114dbc6d5cd10); dependency tracing and tests required. |
| `supabase/migrations_archive/20260610000013_0013_tawasheeh_and_reciters.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 3c6ef94d5ce5515f16320781a9022f0c4e7b6928); dependency tracing and tests required. |
| `supabase/migrations_archive/20260610000014_0014_content_modules.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 03cbb8afa6f76d4a78988bf4878316c2efae1b37); dependency tracing and tests required. |
| `supabase/migrations_archive/20260630000015_0015_comprehensive_rls.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 833651acba042c951620d6aa93f46994f5056cdd); dependency tracing and tests required. |
| `supabase/migrations_archive/20260630000017_0017_video_automation.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 57a60fb66e02e195c450a835ee5f6f4d1994218d); dependency tracing and tests required. |
| `supabase/migrations_archive/20260704000016_0016_auto_profile_creation.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 02adffdd83bc3021d0580f80daf486e24bb9a916); dependency tracing and tests required. |
| `supabase/migrations_archive/20260704000018_0018_complete_missing_tables.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c3e2328cb296627a8946236cb44738b19e838065); dependency tracing and tests required. |
| `supabase/migrations_archive/20260705000000_0019_safety_fixes.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 84f8dd2dfefb9a117a0361d82f0720b272bdace2); dependency tracing and tests required. |
| `supabase/migrations_archive/20260705000014_0014_tawasheeh_seed_data.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 83bc92ba94acdd00cc62ca1002101249eebf1568); dependency tracing and tests required. |
| `supabase/migrations_archive/20260705000019_0019_safe_guards.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 81b13bf41f09de341878d1ae4225ec5bf9d229ef); dependency tracing and tests required. |
| `supabase/migrations_archive/20260705070523_initial_schema.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f1bc014ea352547f4983f3854ab1d9543d0b5bbb); dependency tracing and tests required. |
| `supabase/migrations_archive/20260705070652_rls_triggers_storage.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2d0ca11a82b78286ddd0f85a8896f5c998abb03a); dependency tracing and tests required. |
| `supabase/migrations_archive/20260706000020_0020_fts_catchall.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → abc7356adbae4e1beb5476dc9fddd183fc04d8fe); dependency tracing and tests required. |
| `supabase/migrations_archive/20260710000001_video_error_columns.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2a3a6480532d9f84f423b8c6a29a421590f89f2d); dependency tracing and tests required. |
| `supabase/migrations_archive/20260710000002_0021_drizzle_sync.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6552164e6ea7b177cce15408c41698e8e7aa2f22); dependency tracing and tests required. |
| `supabase/migrations_archive/README.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 69a708fe7419595427721d0b9d3d23fe8b185079); dependency tracing and tests required. |
| `supabase/migrations/20240705000001_archived_legacy.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f1be240b11158dc76ba73b66b74ac9674ca9edcc); dependency tracing and tests required. |
| `supabase/migrations/20240705000002_archived_legacy.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 3be1a1c1769f5f7ae85f034f66b64a0c2cd4a6ac); dependency tracing and tests required. |
| `supabase/migrations/20240705000003_archived_legacy.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 43ff8100115deea3b71118edc7574a6299e1e1f7); dependency tracing and tests required. |
| `supabase/migrations/20250705000001_archived_legacy.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c7c5b2d531b5fd6cc77c8b3189a291ff16d0963d); dependency tracing and tests required. |
| `supabase/migrations/20250705000002_rls_triggers_storage.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5a370a0a5d77afd59d16fbb3f2fa2abbbada8021); dependency tracing and tests required. |
| `supabase/migrations/20260530000000_0000_young_rattler.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c98edfcd18a3ab8657bb91a289e2e72210761fea); dependency tracing and tests required. |
| `supabase/migrations/20260530000100_0001_wakeful_stepford_cuckoos.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c29cb9ff1c866b2a9d6654d2d0ddb4e1453f0a12); dependency tracing and tests required. |
| `supabase/migrations/20260530000200_0002_noisy_nocturne.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 29ac56c744848a0eaaa3e32695b46578ded8ff4f); dependency tracing and tests required. |
| `supabase/migrations/20260530000300_0003_glorious_vanisher.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 532fe1de2cb50d22852a93ffcde6147887d25273); dependency tracing and tests required. |
| `supabase/migrations/20260530000400_0004_phase2_auth_foundation.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1d9702ee78abbfa202e915fde8d9095d9150c56a); dependency tracing and tests required. |
| `supabase/migrations/20260530000500_0005_phase3_content.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 967a21ab29d3f60d74d204c10115f16bde9306b2); dependency tracing and tests required. |
| `supabase/migrations/20260530000600_0006_phase4_scholars_stories.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ba229e38d66ccdf173c7850e7b440fc95d69869c); dependency tracing and tests required. |
| `supabase/migrations/20260530000700_0007_production_hardening.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9cf74b50765b8278771fe35135fd989f964a6f22); dependency tracing and tests required. |
| `supabase/migrations/20260530000800_0008_rls_hardening.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ce2205a16132baad66c17cb0b72ef3023bef1690); dependency tracing and tests required. |
| `supabase/migrations/20260530000900_0009_admin_memorization_youtube.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2223c433b1126e11e1aa5ec07a22fe9ad04518ce); dependency tracing and tests required. |
| `supabase/migrations/20260605000010_0010_missing_content_modules.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1fe88f247f23e07d1aaec3464b8ae206fff45874); dependency tracing and tests required. |
| `supabase/migrations/20260607050808_0011_videos_and_categories.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f7a55d9e534f376faf5677bfc80f4c2e0112652e); dependency tracing and tests required. |
| `supabase/migrations/20260610000012_0012_prayer_times_system.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a9e486d038d3eccbd2c9a881383114dbc6d5cd10); dependency tracing and tests required. |
| `supabase/migrations/20260610000013_0013_tawasheeh_and_reciters.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 3c6ef94d5ce5515f16320781a9022f0c4e7b6928); dependency tracing and tests required. |
| `supabase/migrations/20260610000014_0014_content_modules.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 03cbb8afa6f76d4a78988bf4878316c2efae1b37); dependency tracing and tests required. |
| `supabase/migrations/20260630000015_0015_comprehensive_rls.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6f91056c0edd64e0b7b2fba9f2f83fbb6b4dadb2); dependency tracing and tests required. |
| `supabase/migrations/20260630000017_0017_video_automation.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 212f9860cad024ec4639d2f94c3073898a5c825a); dependency tracing and tests required. |
| `supabase/migrations/20260704000016_0016_auto_profile_creation.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 02adffdd83bc3021d0580f80daf486e24bb9a916); dependency tracing and tests required. |
| `supabase/migrations/20260704000018_0018_complete_missing_tables.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 738e5153de58eb6749d1d82add94738bb8a3259f); dependency tracing and tests required. |
| `supabase/migrations/20260705000000_0019_safety_fixes.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 95c6cb29b857d4007369691f2f336770f8869d93); dependency tracing and tests required. |
| `supabase/migrations/20260705000014_0014_tawasheeh_seed_data.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 83bc92ba94acdd00cc62ca1002101249eebf1568); dependency tracing and tests required. |
| `supabase/migrations/20260705000019_0019_safe_guards.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4a86b9d45df39adba006f4df4004a7a8d21b4e50); dependency tracing and tests required. |
| `supabase/migrations/20260705070523_archived_initial_schema.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a092f8cce13e86ffc1af598c7ea7580cfe33b54a); dependency tracing and tests required. |
| `supabase/migrations/20260705070652_archived_rls_triggers_storage.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → eddfde3eeb1685708e55751701310f4a1e539e31); dependency tracing and tests required. |
| `supabase/migrations/20260706000020_0020_fts_catchall.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → abc7356adbae4e1beb5476dc9fddd183fc04d8fe); dependency tracing and tests required. |
| `supabase/migrations/20260710000001_video_error_columns.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2a3a6480532d9f84f423b8c6a29a421590f89f2d); dependency tracing and tests required. |
| `supabase/migrations/20260710000002_0021_drizzle_sync.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6552164e6ea7b177cce15408c41698e8e7aa2f22); dependency tracing and tests required. |
| `supabase/migrations/20260807000001_google_oauth_profile_sync.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d3f844280073082047016c9e1c05e2aea19760dd); dependency tracing and tests required. |
| `supabase/migrations/20260807002000_0020_cancel_billing.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 658e4aa095043258392ce14f840d9e0d043be638); dependency tracing and tests required. |
| `supabase/migrations/20260807080425_20260807_fix_security_findings.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 898fce852e33045c092d7fba3a1d427420981ea0); dependency tracing and tests required. |
| `supabase/migrations/20260807080459_20260807_revoke_explicit_execute_grants.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a8207ba0ff91ddb1fac1d917970f04053c8058b4); dependency tracing and tests required. |
| `supabase/migrations/20260807090000_20260807_restore_runtime_tables.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 379d7a23c0e01ba559ae8d2f2f9ee7e09a1998a4); dependency tracing and tests required. |
| `supabase/migrations/20260807131440_revoke_execute_on_profile_trigger_functions.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0867c772e71b909bcd7780fd41e2cc77a766331d); dependency tracing and tests required. |
| `supabase/migrations/20260807131504_revoke_explicit_execute_on_profile_trigger_functions.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1eeaa45ec42e70871ab352f3a5297743ad5505c8); dependency tracing and tests required. |
| `supabase/migrations/20260814120000_0033_atomic_kids_share_counter.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0f38aab538a9a393b5595e71194bdf8bf5803f63); dependency tracing and tests required. |
| `supabase/migrations/20260814121000_0034_lock_down_kids_share_rpc.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 235ed2b8e21848de64782e5c497773aec7cfe346); dependency tracing and tests required. |
| `supabase/migrations/20260814122000_0035_reconcile_contacts_notification_column.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b807416ef100dfe3a046c5777d6686765f500db4); dependency tracing and tests required. |
| `supabase/migrations/20260814123000_0036_harden_admin_rls_predicate.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 262256a5b3e3f60b23c413cb80e4bd64ca20dc3f); dependency tracing and tests required. |
| `supabase/migrations/20260814130000_0037_durable_heygen_jobs.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → cf431094b80ae425fa830cadb634e99765a36dbf); dependency tracing and tests required. |
| `supabase/migrations/20260814140000_0038_harden_profiles_auth_integrity.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → bb4fc1bb16c327bf1057fd0dbddd50e6fd5fe8bc); dependency tracing and tests required. |
| `supabase/migrations/20260814141000_0039_restrict_profile_guard_execution.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d3f8033218da65fe2f91f163e63f613bbd79d7b6); dependency tracing and tests required. |
| `supabase/migrations/20260814143626_add_missing_foreign_key_indexes.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 73c511db7e96bc52a635ac7f307476db82ecfd19); dependency tracing and tests required. |
| `supabase/migrations/20260814143804_optimize_rls_auth_initplans.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 64212e7ec5b6a67df8474b7b7704c1e28f540fab); dependency tracing and tests required. |
| `supabase/migrations/20260814143905_optimize_rls_jwt_initplans.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a23aa9ff98fd04d9cdd79a05c066a79433e860df); dependency tracing and tests required. |
| `supabase/migrations/20260814153000_0040_restore_login_profile_timestamp.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a32c454d3c810e56712ce8451d04e4a4ff2bdf34); dependency tracing and tests required. |
| `supabase/migrations/20260814160000_prayer_push_scheduler.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e0e294b5538ad1c18d7e3315d31a0f7e9cea3623); dependency tracing and tests required. |
| `supabase/migrations/20260814170000_0042_cleanup_duplicate_foreign_keys.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ddbc9ce4f84f144b8b8204e3a1e0c74eecfb4a23); dependency tracing and tests required. |
| `supabase/migrations/20260814180000_0043_scope_admin_policies.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → effe93dee9cc1fdc9548d5007b41d35c1982ea36); dependency tracing and tests required. |
| `supabase/migrations/20260814182908_cleanup_supabase_duplicates.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 44031768dbb7d25f3079f8dc666babeb952dbbe2); dependency tracing and tests required. |
| `supabase/migrations/20260814183000_0044_explicit_internal_table_denies.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 28876d7ceb980fec2a428ad7dba83b665a2fc122); dependency tracing and tests required. |
| `supabase/migrations/20260814190000_0045_background_dhikr_reminders.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ca8dc97645af357199eec1b136ec4a94ddfe7567); dependency tracing and tests required. |
| `supabase/migrations/20260814191947_cleanup_duplicate_content_policies.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5eed6c8fbcb47d504c57936161497a515080e5be); dependency tracing and tests required. |
| `supabase/migrations/20260814193230_video_processing_scheduler.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 39a85de268292141802c94b45b907e91bdcff23a); dependency tracing and tests required. |
| `supabase/migrations/20260814214330_0046_video_assets_storage.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 3accca7b6c8f606205b4b588517201bb113fec6e); dependency tracing and tests required. |
| `supabase/migrations/20260814215000_0047_hadith_metadata_columns.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f850a622cc897f56fbae1fe48d448f236f54bb7e); dependency tracing and tests required. |
| `supabase/migrations/20260814220001_seed_open_hadith_library.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a5d195786f98c313707a86e1c792d8bbfc94916b); dependency tracing and tests required. |
| `supabase/migrations/20260814220002_seed_open_hadith_library.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 92f6abf85a983ec8967a8f3d4947a88352720918); dependency tracing and tests required. |
| `supabase/migrations/20260814220003_seed_open_hadith_library.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2e0bb079624c92df95ddf686723deb9c48e0ae86); dependency tracing and tests required. |
| `supabase/migrations/20260814220004_seed_open_hadith_library.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0a5f257200a357558230b34c1bdd755710b27012); dependency tracing and tests required. |
| `supabase/migrations/20260814220005_seed_open_hadith_library.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5852e1d13450919d655022bb0e090d2c0d2dd342); dependency tracing and tests required. |
| `supabase/migrations/20260814220006_seed_open_hadith_library.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 347c77723b5fecc978130785de0920fa9fbe6b9f); dependency tracing and tests required. |
| `supabase/migrations/20260814220007_seed_open_hadith_library.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0091b342313869f556c9eb444983171cd5c27cfd); dependency tracing and tests required. |
| `supabase/migrations/20260814220008_seed_open_hadith_library.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 3bcf990d5485983713ffa9a7ab77080faafef20c); dependency tracing and tests required. |
| `supabase/migrations/20260814220009_seed_open_hadith_library.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 82ba662cb59c00b78fc7ba5bba577a3ecf521e68); dependency tracing and tests required. |
| `supabase/migrations/20260814220010_seed_open_hadith_library.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7bc47a049b722f74d781a72c3d7c80472393aeba); dependency tracing and tests required. |
| `supabase/migrations/20260814220450_seed_open_hadith_library_01.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 63bfb649d7e69ffef6aa6fc8965aaccb8df6ef2e); dependency tracing and tests required. |
| `supabase/migrations/20260814220507_seed_open_hadith_library_02.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 76883fa68030070314c2c4d16c7f5717a85d5636); dependency tracing and tests required. |
| `supabase/migrations/20260814220522_seed_open_hadith_library_03.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 52ce3f55ad014e3272bd6b9fb37e0c0a12b664be); dependency tracing and tests required. |
| `supabase/migrations/20260814220538_seed_open_hadith_library_04.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 645be772dacdf3a51cfcf601f5b158328304827a); dependency tracing and tests required. |
| `supabase/migrations/20260814220555_seed_open_hadith_library_05.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f08352558bf2e5d204f673c32be680e6d5dbaa85); dependency tracing and tests required. |
| `supabase/migrations/20260814220612_seed_open_hadith_library_06.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 58db6abded2b609a7ba018de313cef40464f2840); dependency tracing and tests required. |
| `supabase/migrations/20260814220631_seed_open_hadith_library_07.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 955b95db23b40199a4dbf75193fbf31d8643c03c); dependency tracing and tests required. |
| `supabase/migrations/20260814220647_seed_open_hadith_library_08.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9aa586875d997d257957eaf5f5da3688b0b5ee41); dependency tracing and tests required. |
| `supabase/migrations/20260814220703_seed_open_hadith_library_09.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f94538db8e1fe4a74c01b0d90e215f1e023ac579); dependency tracing and tests required. |
| `supabase/migrations/20260814220720_seed_open_hadith_library_10.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 150230f087430e283890fe36c1c7050975cd8aae); dependency tracing and tests required. |
| `supabase/migrations/20260814221000_seed_content_library.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 84bc5b892e81924066eb289ade58e2ab531b24bb); dependency tracing and tests required. |
| `supabase/migrations/20260814221014_seed_zikr_content_library.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e7e07d0b728e881e2f95100fe93d6d9a2faa5369); dependency tracing and tests required. |
| `supabase/migrations/20260814221746_0047_hadith_metadata_columns.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2e0840d08a46943e943e6bc92c365a8c27d395ef); dependency tracing and tests required. |
| `supabase/migrations/20260814221931_seed_zikr_content_library.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → bc2cbe8e0f1dd5bd59249cbf388a00fa8f1f2725); dependency tracing and tests required. |
| `supabase/migrations/20260814222022_seed_zikr_content_library.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4be8f2a0d22f0f41c65d9839c849974e2b166d8e); dependency tracing and tests required. |
| `supabase/migrations/20260814222316_seed_zikr_content_library.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 42a01023e57e5b95f4466541d7f8d24ac601ccf8); dependency tracing and tests required. |
| `supabase/migrations/20260814222836_seed_open_hadith_library_01.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a642b321e00ea560908c9b88069a32d7d40dffad); dependency tracing and tests required. |
| `supabase/migrations/20260814222853_seed_open_hadith_library_02.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 15f814442bf4945c74a57c3ee8cb69b5a4b88e3d); dependency tracing and tests required. |
| `supabase/migrations/20260814222910_seed_open_hadith_library_03.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → df91f971847a58ada8d3aecdf9ddea5b00e5a420); dependency tracing and tests required. |
| `supabase/migrations/20260814222927_seed_open_hadith_library_04.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e92f9020034d4773b29aa3c9f1f1f31b23169a9e); dependency tracing and tests required. |
| `supabase/migrations/20260814222946_seed_open_hadith_library_05.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 943e0c08da08a769a3835d748d725d12e6e65518); dependency tracing and tests required. |
| `supabase/migrations/20260814223005_seed_open_hadith_library_06.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → dcd78edd28645ac0d6634fc566cfdfc43119b263); dependency tracing and tests required. |
| `supabase/migrations/20260814223026_seed_open_hadith_library_07.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 800677de65b2a9e66a3b115da3060a797c37bc4d); dependency tracing and tests required. |
| `supabase/migrations/20260814223050_seed_open_hadith_library_08.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ba34878362d1408b268f92ae71b9f3023ff4cfea); dependency tracing and tests required. |
| `supabase/migrations/20260814223152_seed_open_hadith_library_09.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9f8b2b54d51a08599d5f325194ef218d11a6026a); dependency tracing and tests required. |
| `supabase/migrations/20260814223211_seed_open_hadith_library_10.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a23db3bf9d86a0ad7c129099e762eb94e5de6864); dependency tracing and tests required. |
| `supabase/migrations/20260814224131_campaign_content_expansion_20260815.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 431fcb1e64e1f648cf3a137b655641cb26049ea2); dependency tracing and tests required. |
| `supabase/migrations/20260814224329_general_content_expansion_20260815.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 3bd485a6c27973b200f0cb610cb515865d261f48); dependency tracing and tests required. |
| `supabase/migrations/20260814224432_general_content_schema_compat_20260815.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6f7987a9f13fc9b5da0e7c2eb48ef9be94e792a0); dependency tracing and tests required. |
| `supabase/migrations/20260814224556_companion_stories_expansion_20260815.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2dd5d6186c1629ad6aaf0957bb88c160dbc00a37); dependency tracing and tests required. |
| `supabase/migrations/20260814224800_companion_stories_expansion_20260815.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6c57adeece81cd45e3f0b462155ddbdc349738c1); dependency tracing and tests required. |
| `supabase/migrations/20260814224845_companion_schema_compat_20260815.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → fef09a5bc2478a1d307a34101289e87caea786ce); dependency tracing and tests required. |
| `supabase/migrations/20260814230001_seed_hadith_expansion_01.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ba18fe24501e0448edcfcd1ff0dbb5f70d39d220); dependency tracing and tests required. |
| `supabase/migrations/20260814230002_seed_hadith_expansion_02.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0e649fd052dd4a618480292536385cb1f4461639); dependency tracing and tests required. |
| `supabase/migrations/20260814230003_seed_hadith_expansion_03.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e704a3104f0f9052b3fa1937105a5b2c43bdf3da); dependency tracing and tests required. |
| `supabase/migrations/20260814230004_seed_hadith_expansion_04.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 91b97dfdd6fcb27471554aa253e9ca534a581854); dependency tracing and tests required. |
| `supabase/migrations/20260814230005_seed_hadith_expansion_05.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6dc676fe599e3293e99934287d1433ca6d1eaf26); dependency tracing and tests required. |
| `supabase/migrations/20260814230006_seed_hadith_expansion_06.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d7cb753c7b5a2f7e6947e591b662b24530cb1dfa); dependency tracing and tests required. |
| `supabase/migrations/20260814230007_seed_hadith_expansion_07.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e6e2ca0e59b9257e11206b7ea19f2ed07f78f220); dependency tracing and tests required. |
| `supabase/migrations/20260814230008_seed_hadith_expansion_08.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b6f8d0fdde2750d68005c45a529b428e22d7533a); dependency tracing and tests required. |
| `supabase/migrations/20260814230009_seed_hadith_expansion_09.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b1e498d55d73d6e49bdc50f8dd5f1f486bee374e); dependency tracing and tests required. |
| `supabase/migrations/20260814230010_seed_hadith_expansion_10.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 91c1a6606a75a77a03e411192c6f6f828a3915b2); dependency tracing and tests required. |
| `supabase/migrations/20260814235407_harden_legacy_admin_rpc.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6534e256bace8cdeb5f34c246f4b919c275a40a6); dependency tracing and tests required. |
| `supabase/migrations/20260815004709_kids_adventure_library.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4cccfde3817bf426dd28673f3c9d1dce46a08312); dependency tracing and tests required. |
| `supabase/migrations/20260815104409_harden_prayer_times_cache_rls.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0bf916ef45d6585465ee28a22ec06ee47ea10f55); dependency tracing and tests required. |
| `supabase/migrations/20260815104455_deduplicate_prayer_times_cache_policy.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7843a157c0dd725f9c7e7d65d2782a55c9cce014); dependency tracing and tests required. |
| `supabase/migrations/20260815113852_index_content_references.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ee88a0d2a0bd94070be80b52a8ea9441684db754); dependency tracing and tests required. |
| `supabase/migrations/20260815114042_expand_companion_biographies.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 027deb257aeebe509ed8472edbc645a06e7855fd); dependency tracing and tests required. |
| `supabase/migrations/20260815115851_cleanup_multiple_permissive_policies.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 3d1d9cd9f3b4543af26b3aabc3cb956306bedf74); dependency tracing and tests required. |
| `supabase/migrations/20260815120950_remove_video_categories_policy_overlap.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → cba2519cc381c9bac76c3573d4389c2e3c15b3ae); dependency tracing and tests required. |
| `supabase/migrations/20260815220000_campaign_content_expansion.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 640287f88c145ba283d195bb4fcbadfe6bdacd6a); dependency tracing and tests required. |
| `supabase/migrations/20260815220500_general_content_schema_compat.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0e441e008c87bf25689a86e80eeb42534e2d7e11); dependency tracing and tests required. |
| `supabase/migrations/20260815221000_general_content_expansion.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4331b6ea48fc5208a1e210b3786164b1c9dfda64); dependency tracing and tests required. |
| `supabase/migrations/20260815221500_companion_schema_compat.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5a06a8fc66663408ceb645cd377f0b633992be5f); dependency tracing and tests required. |
| `supabase/migrations/20260815222000_companion_stories_expansion.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → fb4c242d44f002e7fe12888ae8691317f709aa06); dependency tracing and tests required. |
| `supabase/migrations/20260815223000_harden_legacy_admin_rpc.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4021fc10ad6fc1d3be7a23d953c4eedc6c1830a0); dependency tracing and tests required. |
| `supabase/migrations/20260815235000_kids_adventure_library.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → eb0dddbe304cbc2c2bba08b7de4c4e2825e85f0f); dependency tracing and tests required. |
| `supabase/migrations/20260817074018_quran_expansion_schema.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f21a5b8fec45091e37d9f0f002231d347bec7ba3); dependency tracing and tests required. |
| `supabase/migrations/20260817074038_quran_tafsir_expansion_01.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6b0a1bab2b0d78571c75a6393b0ff4ce329cce5d); dependency tracing and tests required. |
| `supabase/migrations/20260817074103_quran_tafsir_expansion_02.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 27f4eaa05804401bdda96240554f7f474dbc0b14); dependency tracing and tests required. |
| `supabase/migrations/20260817074131_quran_tafsir_expansion_03.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c0b26ed36e0e6d9455d641d0693e1591c657ee82); dependency tracing and tests required. |
| `supabase/migrations/20260817074153_quran_tafsir_expansion_04.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ccec23e4018cd5e51dd3f6482e4c1d67f9eadafd); dependency tracing and tests required. |
| `supabase/migrations/20260817074216_quran_tafsir_expansion_05.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 12aec5e2bf2d47f58d0c649f3382628e5627a3a8); dependency tracing and tests required. |
| `supabase/migrations/20260817074237_quran_tafsir_expansion_06.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → df5c95adb07ff197187af9cd8355d584f41d240b); dependency tracing and tests required. |
| `supabase/migrations/20260817074304_quran_tafsir_expansion_07.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1cee5972d1b6bcd6cffaf2a40cf57a15037b3eb6); dependency tracing and tests required. |
| `supabase/migrations/20260817074324_quran_tafsir_expansion_08.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 932d3076686c05369b1129e2a069a1700fe03c51); dependency tracing and tests required. |
| `supabase/migrations/20260817074342_quran_tafsir_expansion_09.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 81080cf477c291f3d97c54b9f4d3e50c5f529dcf); dependency tracing and tests required. |
| `supabase/migrations/20260817074401_quran_audio_expansion.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8fa2e9db3d6c5b35cd9d07db84b30a90fa326405); dependency tracing and tests required. |
| `supabase/migrations/20260817075255_quranic_duas_expansion.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1a330e0a81b511aa727a0dbd7404656ecfc4cf00); dependency tracing and tests required. |
| `supabase/migrations/20260817075724_articles_expansion.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 916bf3e6e14d4155212b3c3900b4cba6529c7e13); dependency tracing and tests required. |
| `supabase/migrations/20260817081135_hide_unverified_media.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 603d6d8b17f9b7e2ad82001c97dfb0ab01560a46); dependency tracing and tests required. |
| `supabase/migrations/20260817113003_dhikr_quran_articles.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 68ec04f90d1aeaf0b302dfad39939b9975a4c44a); dependency tracing and tests required. |
| `supabase/migrations/20260817114548_reconcile_companion_biographies.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → daad2f415dee2063e92d0501b54d5cfddec8780c); dependency tracing and tests required. |
| `supabase/migrations/20260817114822_index_scholar_biography_sources.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e6557f05d0c5a0f1d011e522d57ebf9c31ed5fdc); dependency tracing and tests required. |
| `supabase/migrations/20260817210802_expand_prophet_stories_from_quran.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 11b824e2380346da694f595258e0b89555c7696b); dependency tracing and tests required. |
| `supabase/migrations/20260817210929_deduplicate_prophet_story_references.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 90bb4ed305267aa98f103923f94e4da119691831); dependency tracing and tests required. |
| `supabase/migrations/20260817211606_index_article_source_urls.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9108252c515f7eee99edd216ab08dd34e621257d); dependency tracing and tests required. |
| `supabase/migrations/20260817213201_fix_prophet_story_newlines.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ddb5d72d01d98a2ab10bbc815c7f4fca24a4a00b); dependency tracing and tests required. |
| `supabase/migrations/20260817213758_replace_literal_newlines.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0dddaa51cb0ca1d97a32e6a6ea48082a3f05abd8); dependency tracing and tests required. |
| `supabase/migrations/20260817220127_add_automation_dedup_keys.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a8471f621a92645338b7da139d3a3f9f071e64c3); dependency tracing and tests required. |
| `supabase/migrations/20260817222000_index_prophet_story_completeness.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2f688723d16835e4a992d104fe4fd421a5fa58c6); dependency tracing and tests required. |
| `supabase/migrations/20260821175629_source_verified_content_agent.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → db4633567516f079e639c90adfcc0917f5970c7a); dependency tracing and tests required. |
| `supabase/migrations/20260821175933_schedule_source_verified_content_agent.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4c49e04a74e65e10a8409c69340f9ac03d8bb4a7); dependency tracing and tests required. |
| `supabase/migrations/20260821192434_tawasheeh_verified_audio_expansion.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 19b3f162d1965d4e8ea26663f1b3e3ea9d271da6); dependency tracing and tests required. |
| `supabase/migrations/20260822080822_verified_companions_scholars_content_pack_20260822.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4c88f5ab788d46064770c84e7b1b12d7ee4a174c); dependency tracing and tests required. |
| `supabase/migrations/20260822081012_fix_verified_content_reference_shape_20260822.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1d14e4e36d511e574abc852660b5820134059469); dependency tracing and tests required. |
| `supabase/migrations/20260822081106_normalize_companion_reference_types_20260822.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e572f2a0735be4b0e9d125a91fab9c04f29c0ed8); dependency tracing and tests required. |
| `supabase/migrations/20260822200947_grant_profiles_authenticated_table_privileges.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 70399e3bc163e5dfcb25c81eb630b3a38dcd4c3d); dependency tracing and tests required. |
| `supabase/migrations/20260827175416_kids_game_results.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7934c5597b84e2c5b91d7cde175fb5bbe97be224); dependency tracing and tests required. |
| `supabase/migrations/20260827175605_optimize_kids_game_results_rls.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ace6389b9aaab2c891f2f4e6ad92554018ee38cd); dependency tracing and tests required. |
| `supabase/migrations/20260827182800_kids_world_progress.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2f4778f30150b48f8426e02784442a557a0bf6ae); dependency tracing and tests required. |
| `supabase/migrations/20260827182831_seed_kids_world_games.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8768c6a4833f20cd4032319f20471f5213e90d71); dependency tracing and tests required. |
| `supabase/migrations/20260827184319_kids_world_function_security.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1f436c8ca9ec5649b8c448e0164d8286499aeb61); dependency tracing and tests required. |
| `supabase/migrations/20260827184749_index_kids_achievement_fk.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 29bab6ed45db3d8b0254db4cecc1825f07b55595); dependency tracing and tests required. |
| `supabase/migrations/20260827185900_kids_world_secure_result_processor.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5cfc11c496c1121f43f5d50eb7509a1dbeb3d7c4); dependency tracing and tests required. |
| `supabase/migrations/20260828000000_site_audio_assets.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a323a24606d2c9d9549ddcc566cc16f41f8658de); dependency tracing and tests required. |
| `supabase/migrations/20260828000001_youtube_feed_cache_history.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ad734c7b9eb4b32375d99efa316e60c22f1041bb); dependency tracing and tests required. |
| `supabase/migrations/20260828000002_site_audio_assets.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e9964951a5cbf2719d0ba9c9c5f29e486d42965d); dependency tracing and tests required. |
| `supabase/migrations/20260828000003_youtube_feed_cache.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 036761c629b34bb2c8bc549ec5f68d09e26cdb5b); dependency tracing and tests required. |
| `supabase/migrations/20260828075228_harden_youtube_trigger_search_path.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → cc2b6f72420afc2f0a8c93ceed485720cb206acc); dependency tracing and tests required. |
| `supabase/migrations/20260828111711_harden_youtube_trigger_search_path.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 718e0a238fd9430bca18897bc45d042b4ede49e1); dependency tracing and tests required. |
| `supabase/migrations/20260901012050_harden_youtube_trigger_search_path_final.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 3b26db4d8b73b3f0b36837c3c8365925bdbebe17); dependency tracing and tests required. |
| `supabase/migrations/20260901034914_youtube_facebook_native_sync_phase2.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 95008589c605eda84d136326c7d92e45897bbef9); dependency tracing and tests required. |
| `supabase/migrations/20260901035110_youtube_facebook_sync_scheduler_auth.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5af5a2d39446acdf87f18ccb40f64544d7a186a9); dependency tracing and tests required. |
| `supabase/migrations/20260901035139_youtube_facebook_sync_state_seed.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e1c854d79d89c92bd55782455c04c0ba35122d02); dependency tracing and tests required. |
| `supabase/migrations/20260901041737_allow_direct_native_publish_without_storage.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c2e7e6e07ef290015525ebd11819d51c72a04873); dependency tracing and tests required. |
| `supabase/migrations/20260901043149_20260901090000_create_admin_actions_audit.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0296afa4337e7ccaf521da68dc2131bc2a7fc414); dependency tracing and tests required. |
| `supabase/migrations/20260901051927_youtube_facebook_backfill_cursor_and_retry.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 87527bd11abf050e58b9dd2dee221963dd61981c); dependency tracing and tests required. |
| `supabase/migrations/20260901051946_youtube_facebook_backfill_cursor_v2.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2b02d64305efb29d7809e5082e7fa91a8c08dade); dependency tracing and tests required. |
| `supabase/migrations/20260901051951_youtube_facebook_sync_retry_safety.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6e1e9ba7d90db9aa4f14fce4dc3e5a4e9badb7e8); dependency tracing and tests required. |
| `supabase/migrations/20260901052054_protect_social_sync_publication_state.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 38325d1970728290717026a2ebce03489e1c05d8); dependency tracing and tests required. |
| `supabase/migrations/20260901053058_add_youtube_facebook_media_import.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4062ec35786a1ccb6228c77fae665cdf6148a3ca); dependency tracing and tests required. |
| `supabase/migrations/20260901053451_add_youtube_facebook_media_cleanup_tracking.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 83f09b5a910f7cddbca6cfb0340092e8ce74b2d9); dependency tracing and tests required. |
| `supabase/migrations/20260901053510_schedule_youtube_facebook_media_cleanup.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 88fdb4441c96cd7237d1cc31f9fb1da32c043d0c); dependency tracing and tests required. |
| `supabase/migrations/20260901053559_schedule_youtube_facebook_media_cleanup.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 32d7c448ab50ef173c42afe5e8dd807768e41a11); dependency tracing and tests required. |
| `supabase/migrations/20260901055136_harden_admin_audit_rls_and_audio_fk_index.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1c06e668c0eece1f6e9322a36c0e4748f3f99882); dependency tracing and tests required. |
| `supabase/migrations/20260901055404_document_current_hardening_state.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b727754a4f29cbc5d92d428095213f237a7c9ad5); dependency tracing and tests required. |
| `supabase/migrations/20260901090000_create_admin_actions_audit.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1b50775b127459174d6d538aba844dc67f379aa8); dependency tracing and tests required. |
| `supabase/migrations/20260901103753_content_hub_admin_library_20260901.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → fe3bf7e33bcd625f6e5aa762860fb69494e9e211); dependency tracing and tests required. |
| `supabase/migrations/20260901105000_rebuild_content_hub_schema.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 573398f36166394b706b6e8391b0793d326c94d2); dependency tracing and tests required. |
| `supabase/migrations/20260901105107_security_performance_hardening_20260901.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 56eb78c61e5183e25e8d8db157c096d10f4c1306); dependency tracing and tests required. |
| `supabase/migrations/20260901105124_dedupe_library_rls_select_policies_20260901.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 326ec36d7923b850dcbd54da94745ae9c10bfb1c); dependency tracing and tests required. |
| `supabase/migrations/20260901120955_compatibility_media_assets.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 561f0573eee8416180719af0833d2a01f829fd20); dependency tracing and tests required. |
| `supabase/migrations/20260901123902_final_rls_security_cleanup.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 65060d8a2b36c6ba9b96874bb04b151ec94815bd); dependency tracing and tests required. |
| `supabase/migrations/20260901124136_lock_admin_snapshot_rpc.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c85030a8203f2292ace6b13aa696478646d01fdd); dependency tracing and tests required. |
| `supabase/migrations/20260901124303_remove_remaining_content_hub_policy_duplicates.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8597d10aaa7d918f31d73d5dec2e3e6b77dd9929); dependency tracing and tests required. |
| `supabase/migrations/20260901155000_remove_remaining_content_hub_policy_duplicates.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → cc360c9cf28c1dda38f7ed9f87cb1e9139c268b9); dependency tracing and tests required. |
| `supabase/migrations/20260901160256_relax_social_sync_processing_recovery_safely.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a2c8483eb3ba5640f45927e7388bac2d9de759f8); dependency tracing and tests required. |
| `supabase/migrations/20260901160713_social_sync_state_processing_guard_v2.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4cfd176dc54c66641a6e41599792c53dea1cfdfd); dependency tracing and tests required. |
| `supabase/migrations/20260901162000_move_pg_net_out_of_public.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 89bd3e50b12771a9ce4af090dd4884fdcf21e552); dependency tracing and tests required. |
| `supabase/migrations/20260901162535_document_pg_net_public_schema_limit.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → fc34ee521f2abdf3082abf10afbc8e3e76371201); dependency tracing and tests required. |
| `supabase/migrations/20260901162840_document_pg_net_public_schema_limit_v2.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 36711e233847763d2f3dbd4e082dcd41afe2e7b0); dependency tracing and tests required. |
| `supabase/migrations/20260901165051_reconcile_remote_migration_history_20260901.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 61d1b901928f25b1df57694e1e7ea649a4662a4a); dependency tracing and tests required. |
| `supabase/migrations/20260901194900_reconcile_remote_migration_history_20260901.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → bc080b00b5ee7c331ca22061ec4a01340bae11f8); dependency tracing and tests required. |
| `supabase/migrations/20260904174702_restore_admin_actions_audit_table_20260904.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 93006adc0cbb4c01067542d8b99efd39d473799a); dependency tracing and tests required. |
| `supabase/migrations/20260905000000_reconcile_remote_migration_history_final.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ecce46b09e482d3267d623fea71bba6e4a90504a); dependency tracing and tests required. |
| `supabase/migrations/20260905013955_adsense_content_quality_hotfix_2026_09_05.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 42ad2b88fa94e2d303cd0f39221d47d4d2f96cf8); dependency tracing and tests required. |
| `supabase/migrations/20260905014003_adsense_content_depth_hotfix_2026_09_05.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 56f69891cf9b35fed4d2c20850adc792386382f3); dependency tracing and tests required. |
| `supabase/migrations/20260905190421_unified_admin_audit_immutable.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 44ca8bd335b44cdc17ffde1246a52704d2331119); dependency tracing and tests required. |
| `supabase/migrations/20260905193000_unified_admin_audit_immutable.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 3659502cf0a9c9e5b169a635522eeb9f3cb344e2); dependency tracing and tests required. |
| `supabase/migrations/20260905195702_admin_platform_foundation_20260905.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f5c638034c01883470d132a69152042ff0f32579); dependency tracing and tests required. |
| `supabase/migrations/20260905201128_admin_security_controls_20260905.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 57bdba580a97f42eee1f552c70d461e3361c63d9); dependency tracing and tests required. |
| `supabase/migrations/20260906164530_security_hardening_20260906.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 353520248fb4d435284f562840ced559bf21b73f); dependency tracing and tests required. |
| `supabase/migrations/20260907022407_backfill_published_article_english_20260907.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b04f4c23054f4610c5d8e3ba3399bb37a99e72ce); dependency tracing and tests required. |
| `supabase/migrations/20260907050000_backfill_published_article_english_20260907.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 31037e5b0869af71a494efc8998510bbba1d1599); dependency tracing and tests required. |
| `supabase/migrations/20260911021025_harden_social_video_reels_and_cleanup.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5653d5f7aa1140023b3d2ab0d13b00af51e86113); dependency tracing and tests required. |
| `supabase/migrations/20260911030000_harden_social_video_reels_and_cleanup_reconciliation.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → bc9da596265c5e680509dc55c0d8dc9382a7288f); dependency tracing and tests required. |
| `supabase/migrations/20260911031229_harden_social_video_reels_and_cleanup_reconciliation.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5d8d9a1535688ea5b0fe9e0b395c1158e53c1246); dependency tracing and tests required. |
| `supabase/migrations/20260911040038_harden_rls_policies_and_deduplicate_fts_indexes.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 434ba22fca02ef9e359df75e34d3df73ad3f9442); dependency tracing and tests required. |
| `supabase/migrations/20260911040944_relocate_pg_net_to_extensions.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e3ae5a747f90539c4b34610412e8f8568519cfaf); dependency tracing and tests required. |
| `supabase/migrations/20260911150920_admin_rbac_assignments_v1.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4f9cb9a03a3f5b2a3037aea9110327adf73dd81e); dependency tracing and tests required. |
| `supabase/migrations/20260911154207_harden_admin_rls_and_indexes.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 139e4074ab60909131512efe0617cbee9241f0b8); dependency tracing and tests required. |
| `supabase/migrations/20260911181500_admin_rbac_assignments_v1.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 482355448ddce685d9824468cac310fbf202998d); dependency tracing and tests required. |
| `supabase/migrations/20260911181501_harden_admin_rls_and_indexes.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6ef62211255d04f5c0f23c96fb32cbf4e3cf88f7); dependency tracing and tests required. |
| `supabase/migrations/20260914065256_audit_indexes_20260914.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 079c5b4c5a43c5b3c648e546eb71f2a26a7e28be); dependency tracing and tests required. |
| `supabase/migrations/20260914065331_repair_video_queue_indexes_20260914.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 30d89e5a3247c7a577a10deaf57fae258d697144); dependency tracing and tests required. |
| `supabase/migrations/20260914065344_repair_video_queue_heygen_index_20260914.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 596147e6d6e2c7e319193932e08f0abd954b1c8d); dependency tracing and tests required. |
| `supabase/migrations/20260914065607_repair_rest_request_defaults_20260914.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5ed8d0e0f58a7257708a8aadb71f05a1b59001d4); dependency tracing and tests required. |
| `supabase/migrations/20260914070033_reconcile_remote_migration_history_checkpoint_20260914.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8ab75b495e22ca0a47b61c9331d2fa085b1b0a01); dependency tracing and tests required. |
| `supabase/migrations/20260915004110_retire_vercel_video_processing_cron.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d8ab7c42ad9332daf5b22b7cef48287d98206b20); dependency tracing and tests required. |
| `supabase/migrations/20260919012921_cleanup_content_library_scaffolding.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 143121fab1c86a13a66b7c0958fd2617d53417aa); dependency tracing and tests required. |
| `supabase/migrations/20260919012923_cleanup_quran_catalog_agent_queue.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2a27b6f853a78e19a8248dc871f44c8e19a3300d); dependency tracing and tests required. |
| `supabase/migrations/20260919013530_editorial_expansion_articles_20260919.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 216133840dccb63ac2148abed7dae859d1d0e3b9); dependency tracing and tests required. |
| `supabase/migrations/20260919013633_editorial_expansion_stories_20260919.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ed759a0cf6859b539bfe6a433bb3ab6a3e4bd0ce); dependency tracing and tests required. |
| `supabase/migrations/20260919020218_reconcile_remote_content_expansion_phase1.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f0d746e1badbf8b79a83a7c3d08a30ad4739098e); dependency tracing and tests required. |
| `supabase/migrations/20260919020228_reconcile_remote_content_expansion_deterministic.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 57439c150e01a8ee25bd21d5e90108cccd026795); dependency tracing and tests required. |
| `supabase/migrations/20260919021149_reconcile_remote_content_catalog_phase2.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 06caf871a9f40eeb13e50cbedaf1bf6da9fe7cc4); dependency tracing and tests required. |
| `supabase/migrations/20260919021225_reconcile_remote_editorial_expansion_phase2b.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 66c012215f408276b304ae67e061b9001400471a); dependency tracing and tests required. |
| `supabase/migrations/20260919021236_reconcile_remote_story_expansion_phase2.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b488aa5c537e1bfccab931592f41eca8642200d4); dependency tracing and tests required. |
| `supabase/migrations/20260919021330_reconcile_remote_kids_content_expansion_phase2d.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 519455be72866e3e36e12be62d9576bdf7d6a745); dependency tracing and tests required. |
| `supabase/migrations/20260919021452_reconcile_remote_cleanup_subscription_legacy_column.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8c7c48fca3d8868ed0a90a1033a98d224cee7b0f); dependency tracing and tests required. |
| `supabase/migrations/20260919044739_reconcile_remote_retire_orphaned_legacy_tables.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1c670669b615326fbcbe9ef43069db8438d8ead5); dependency tracing and tests required. |
| `supabase/migrations/20260919045742_retire_orphaned_legacy_tables.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c1bcb0e8cd21aadcaf4f2eddf496282916f10588); dependency tracing and tests required. |
| `supabase/migrations/20260919050000_content_expansion_phase1.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → db030780e5bf2b54e1a79bb652efa079f892b89d); dependency tracing and tests required. |
| `supabase/migrations/20260919050125_remove_redundant_nonunique_indexes.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5323f3ab2d6d4e4ec07f48216b4327956b88e162); dependency tracing and tests required. |
| `supabase/migrations/20260919050332_remove_redundant_prefix_indexes.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8120d48df9c2f131bf77eb5d150d261804f7b069); dependency tracing and tests required. |
| `supabase/migrations/20260919051000_fix_content_expansion_deterministic_and_publish_approved_stories.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e87f42f79289cb679e26a21d1fdd94c168d9831c); dependency tracing and tests required. |
| `supabase/migrations/20260919053408_canonical_quran_surah_counts_20260919.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 54401ca60645dc1597901b1096187e212c1ba585); dependency tracing and tests required. |
| `supabase/migrations/20260919060000_retire_orphaned_legacy_tables.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 11282d6cbcb222aab6aa71b95a783a3e881e8f39); dependency tracing and tests required. |
| `supabase/migrations/20260919065535_quran_supabase_storage_20260919100000.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0ec08367b136aef9cfb438126831c4d05728bfa0); dependency tracing and tests required. |
| `supabase/migrations/20260929000000_quran_audio_external_source_status.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 340efa1f12495feef0da1c1c2b99fd1ae7569d39); dependency tracing and tests required. |
| `supabase/migrations/20260929010000_seed_canonical_quran_catalog.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 801573bc0d7fec39c417a2d4ca53df635b571e42); dependency tracing and tests required. |
| `supabase/migrations/20260929025052_quran_schema_compatibility_20260929.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → cc6dc3421b25249fb055e58f0ba2ec4cdf9ac66f); dependency tracing and tests required. |
| `supabase/migrations/20260929035722_security_performance_hardening_20260929.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2dafc58416a0ecf282c9a6c2090b09013048052b); dependency tracing and tests required. |
| `supabase/migrations/20260929035746_tighten_video_category_public_read_20260929.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 87e48e7c56c45b9418b08ff9262d5774aa54fb89); dependency tracing and tests required. |
| `supabase/migrations/20260929035802_deduplicate_video_admin_policies_20260929.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 339a1c20250f5d8d698f94bb4a17ff4d0ab6311e); dependency tracing and tests required. |
| `supabase/migrations/20260929035817_revoke_public_profile_trigger_rpc_20260929.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b830c4968105e9239c0a9d5d0669ab447c124376); dependency tracing and tests required. |
| `supabase/migrations/20260929035845_dedupe_exact_public_read_policies_20260929.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9f7f305b94c55d651bf552883bdc969785892636); dependency tracing and tests required. |
| `supabase/migrations/20260929041121_scholars_catalog_expansion_20260929.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 936006d100c0150f7200783194775774cba00d39); dependency tracing and tests required. |
| `supabase/migrations/20260929041133_normalize_scholar_categories_20260929.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a493f657d05731abbfe1fc294f7cf55070e91ca1); dependency tracing and tests required. |
| `supabase/migrations/20260929042104_content_sources_articles_20260929.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6f79d8c6ac6194ffc1a7aa40a22985f3ebeac341); dependency tracing and tests required. |
| `supabase/migrations/20260929042122_expand_fictional_story_records_20260929.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 09321062822279a510911708c83283e727a48c92); dependency tracing and tests required. |
| `supabase/migrations/20260929042147_expand_prophet_bios_and_references_20260929.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 3e1f82481abf91ec2211fee61f1d054bb2e03110); dependency tracing and tests required. |
| `supabase/migrations/20260929042156_expand_scholar_bios_20260929.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 565cfb1a9f68852ee9235200c44173e67be66f1d); dependency tracing and tests required. |
| `supabase/migrations/20260929042215_expand_companion_profiles_20260929.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 337a7a4e0d9899264f9539b622acea441b160b8a); dependency tracing and tests required. |
| `supabase/migrations/20260929042234_content_source_quality_hardening_20260929.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 59dd7d5cc5d008a51b009e11d8494f3b736ecc44); dependency tracing and tests required. |
| `supabase/migrations/20260929042337_prophet_profile_depth_pass_20260929.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b324d09ba3a333a99a5380f7221676cc92463132); dependency tracing and tests required. |
| `supabase/migrations/20260929042442_prophet_short_profile_depth_20260929.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b9a1d40801e10a0f47ef0f6fda5869cd211dcf35); dependency tracing and tests required. |
| `supabase/migrations/20260929042450_companion_scholar_depth_followup_20260929.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c8b42fbdcc742b4e745fe8199cad65dfb5cb876f); dependency tracing and tests required. |
| `supabase/migrations/20260929042509_annotate_missing_hadith_grades_20260929.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 79d261555c4956142bbe1980a951e29daa10f98f); dependency tracing and tests required. |
| `supabase/migrations/20260929044232_add_video_url_to_video_generation_requests_20260929.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 88b33236eff9d4a2337bf10f7bd602fb49062cbc); dependency tracing and tests required. |
| `supabase/migrations/20260929045633_create_social_publish_queue_20260929.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1d84a3492b0bdb4903cdc308f05e223eba18e4e0); dependency tracing and tests required. |
| `supabase/migrations/20260929062722_security_seo_hardening_20260929.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7f33f02be820e23dcc8965feee44d799c24e47fa); dependency tracing and tests required. |
| `supabase/migrations/20260929063916_revert_internal_table_policies_20260929.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 23e6cd2944572eaacf923c0d4e3b44b8335b4732); dependency tracing and tests required. |
| `supabase/migrations/20260929070000_070000_kids_games_modernization.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 246660b0588c4a6f0372bcc750c99c18e07e48d6); dependency tracing and tests required. |
| `supabase/migrations/20261001212603_video_pipeline_hardening_20261002.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8467f67683f7f85eec281e208665e97b96b64b0c); dependency tracing and tests required. |
| `supabase/migrations/20261001214711_kids_games_schema_reconciliation_20261002.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9b95bd990d8147822d86a53f4d9359e596354a8e); dependency tracing and tests required. |
| `supabase/migrations/20261001221622_kids_games_history_repair.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 81dedc72f5adb43c054e0d24e920e86a07e3aa81); dependency tracing and tests required. |
| `supabase/migrations/20261001230711_media_assets_legacy_compat.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → fd1b31615b3eed9b59e636e738acc052a06b33c3); dependency tracing and tests required. |
| `supabase/migrations/20261002000001_video_pipeline_hardening.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8467f67683f7f85eec281e208665e97b96b64b0c); dependency tracing and tests required. |
| `supabase/migrations/20261002042321_expand_audio_kinds_and_repair_duplicate_kids_index.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 17b7564420ff394b190c26ad30b38cd87c7f2d2b); dependency tracing and tests required. |
| `supabase/migrations/20261002042816_optimize_rls_auth_initplans_20261002.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8d3e06fed4cf97647ea033ce283bd6402f7490d3); dependency tracing and tests required. |
| `supabase/migrations/20261002042835_optimize_remaining_video_narrations_rls_20261002.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 54324afea9fe8f0566770933ffabb04390099f1f); dependency tracing and tests required. |
| `supabase/migrations/20261002042917_editorial_content_expansion_20261002.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → cdf661050453abaa57af734a0e03929c2f4bc7d0); dependency tracing and tests required. |
| `supabase/migrations/20261002044747_harden_free_tier_view_and_function_search_path_20261002.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 06e176653dffbceae4abdc665889655d2fccdf64); dependency tracing and tests required. |
| `supabase/migrations/20261002050101_verified_video_content_pack.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d3b7d3b46482e7392b1b63eb72612bde1488c9bc); dependency tracing and tests required. |
| `supabase/migrations/20261002054010_finish_rls_overlap_cleanup_20261002.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6a58ead3672e0b855c4ccda98f25243718fdf951); dependency tracing and tests required. |
| `supabase/migrations/20261002054042_finish_admin_public_policy_merge_20261002.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 193bb356c114721bb4aca228cf492aaa5261d40b); dependency tracing and tests required. |
| `supabase/migrations/20261002065000_unified_videos_social_sync.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4d7e53c2e4acf28eddde298b491dd7b114414a80); dependency tracing and tests required. |
| `supabase/migrations/20261002073929_phase6_security_hardening_20261002.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4d6387d5a556fb7c5d9230d7515ae3281ef48540); dependency tracing and tests required. |
| `supabase/migrations/20261002090000_verified_video_content_pack.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → bc12ecd7f7dd44512efd0608e025a01a7c5432b4); dependency tracing and tests required. |
| `supabase/migrations/20261002092943_retire_coordinated_legacy_subsystems_20261002.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9fc843e0b13f15e55d8c0077db5caffaec6168b4); dependency tracing and tests required. |
| `supabase/migrations/20261002093637_govern_retired_indexes_20261002.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0eec2638476424095085611bc64a52282d3da487); dependency tracing and tests required. |
| `supabase/migrations/20261002100000_multi_provider_free_video_engine.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → aa3c1d5f8132e39bfa1efdf34d4d4232af3f62e5); dependency tracing and tests required. |
| `supabase/migrations/20261002110000_consolidate_rls_policy_overlaps_20261002.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 398997cc6bedea40296b53ca22fa18695e5ed2ee); dependency tracing and tests required. |
| `supabase/migrations/20261002113000_scheduler_hardening_20261002.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c63c49e0679216781f520b366511625161bbf64c); dependency tracing and tests required. |
| `supabase/migrations/20261002114000_retire_dead_media_cleanup_cron_20261002.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d4cf34b854f0f0b8f83bdf534e64c7488ce0c9c6); dependency tracing and tests required. |
| `supabase/migrations/20261002125440_remote_history_marker_video_automation.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e9f63db14a702896c2f7c9480715b6174b66fcdc); dependency tracing and tests required. |
| `supabase/migrations/20261002125451_remote_history_marker_video_automation.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e9f63db14a702896c2f7c9480715b6174b66fcdc); dependency tracing and tests required. |
| `supabase/migrations/20261002130000_retire_coordinated_legacy_subsystems_20261002.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2b67676da7772d4feed9261249c5575c326d2bf0); dependency tracing and tests required. |
| `supabase/migrations/20261002133000_govern_retired_indexes_20261002.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4b6edbca97ebfded201526fa54977cb43d53b6c3); dependency tracing and tests required. |
| `supabase/migrations/20261002155139_android_release_control_seed.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e47282dbd87f23a30becf92e75cc2a05b07a1418); dependency tracing and tests required. |
| `supabase/migrations/20261002155316_unified_videos_social_sync_20261002.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7ff1915f4600685629a9f84661798e7e33db0721); dependency tracing and tests required. |
| `supabase/migrations/20261002160000_video_automation_queue_defaults.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1a8c50662d1d9400da240e488db88ca3026d4ca0); dependency tracing and tests required. |
| `supabase/migrations/20261002160440_human_audio_library_20261002.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b4d50e6d5772abaa0d085473e200487400a9a1ee); dependency tracing and tests required. |
| `supabase/migrations/20261002170000_android_release_control_seed.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2b2b98a5bb97eee2c10f34a8ff2265aed35dc0c7); dependency tracing and tests required. |
| `supabase/migrations/20261002171223_offline_quran_profile_daily_reminders.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f5794a3adf43cdc7541b3c151be9f356504ef1f4); dependency tracing and tests required. |
| `supabase/migrations/20261002171549_content_hub_audio_cloudinary_seed_20261002.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6cda19733e1245b21c9c8b9b2108d59b0fbd1518); dependency tracing and tests required. |
| `supabase/migrations/20261002172804_human_audio_library_expansion_20261002.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c9ee7b8f20374fe828e07f9a00a3f380b82d2935); dependency tracing and tests required. |
| `supabase/migrations/20261002172917_server_only_deny_policies_20261002.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 91594c172473200d7d289622ad474130ca6b5712); dependency tracing and tests required. |
| `supabase/migrations/20261002172946_index_unindexed_foreign_keys_20261002.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ce79f86aab323ab0ef749a468a7b151c3471aef8); dependency tracing and tests required. |
| `supabase/migrations/20261002173000_content_hub_audio_cloudinary_seed_20261002.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5952f9b1ce927424c6b7f124735bdf3069263e5f); dependency tracing and tests required. |
| `supabase/migrations/20261002174500_human_audio_library_expansion_20261002.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6c3ffa17b7565073b107f3505eee7b8fcc9264e4); dependency tracing and tests required. |
| `supabase/migrations/20261002211738_20261003010000_kids_games_level_catalog.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0018b4810b3a0668924a41d3ee411765bad0cf6b); dependency tracing and tests required. |
| `supabase/migrations/20261002212922_20261003030000_kids_games_gameplay_visual_catalog.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e98c8c83f3668c5f908ae0ed63bd81c82e0eddf0); dependency tracing and tests required. |
| `supabase/migrations/20261003082439_content_translation_queue.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 31f86f42db0cfcac26d34d032e94eadcfcaa86e4); dependency tracing and tests required. |
| `supabase/migrations/20261003090000_content_translation_queue.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ae9aef2a15379c25573003caf9caf0fe84c7273b); dependency tracing and tests required. |
| `supabase/migrations/20261004180228_reconcile_content_library_summary_en.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 65db065fb9c8d74215ccca4fc75b111b447355a9); dependency tracing and tests required. |
| `supabase/migrations/20261004190000_content_library_summary_en.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b66ae67de99a7d6fd331958753a41f784cc46736); dependency tracing and tests required. |
| `supabase/migrations/20261008014118_repoint_production_cron_to_current_project_v2.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9c6392135cf8b936c260eb5ed2ccf74ed70ed7c8); dependency tracing and tests required. |
| `supabase/migrations/20261008015328_retire_obsolete_cleanup_cron.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → deba0971730d95850e7231d9c9d82bc532003aa7); dependency tracing and tests required. |
| `supabase/migrations/20261008015449_content_translation_queue.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6fbb18d9d8b2e84ccad9fe4e3e2dfac342a1fc74); dependency tracing and tests required. |
| `supabase/migrations/20261008015452_content_library_summary_en.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7c84aaa5b57d8897952abc397fbce87361a18b27); dependency tracing and tests required. |
| `supabase/migrations/20261008015534_harden_translation_queue_and_kids_timestamp_helpers.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 498ec2f3fb9e9bfaa84c5fd759dd309707b15ef0); dependency tracing and tests required. |
| `supabase/migrations/20261008030000_pause_unavailable_scheduler_workers.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → bf948a48c425f4f632c8e4dfd6617e3be7d0e8cb); dependency tracing and tests required. |
| `supabase/migrations/20261008050000_repoint_production_cron_to_current_project.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9015afac4667bf8e8ac1a73a33778def1ad49ed1); dependency tracing and tests required. |
| `supabase/migrations/20261008060000_retire_obsolete_cleanup_cron.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6bbcee7092c447f60b64a06b0428c3d9b61fcc4a); dependency tracing and tests required. |
| `supabase/migrations/20261008070000_harden_translation_queue_and_kids_timestamp_helpers.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2623b501144615be46b9b6e0222b88fd83fd3291); dependency tracing and tests required. |
| `supabase/migrations/20261008074605_reconcile_social_sync_cron_and_child_rls.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4dd110f0467794071167e947ffe416a4f3971d4b); dependency tracing and tests required. |
| `supabase/migrations/20261008080000_set_primary_admin_mohamed_alaa.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1e742fc33afb221f1142ba362946cdb5c3f42880); dependency tracing and tests required. |
| `supabase/migrations/20261008082029_20261008110000_restore_admin_rate_limit_contract.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5f286417d4a55681c87d9d70b5a344354f6b30fe); dependency tracing and tests required. |
| `supabase/migrations/20261008082203_20261008120000_consolidate_duplicate_public_read_policies.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e56b6047d0ea0fd4c8a8dbb90cb01d21455c89f0); dependency tracing and tests required. |
| `supabase/migrations/20261008085309_20261008090000_tighten_rls_policy_role_scope_20261008.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 74ba2f0a9325084ad0b9994e030b35b2cca9482c); dependency tracing and tests required. |
| `supabase/migrations/20261008085550_20261008091000_remove_articles_admin_policy_overlap.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 3395f9c6f48375f42cda6e115cb655d1e68c0fcf); dependency tracing and tests required. |
| `supabase/migrations/20261009054919_kids_games_client_write_hardening_20261009.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 84002c5490e5379567720f394d15e0557aa24289); dependency tracing and tests required. |
| `supabase/migrations/20261009145051_android_releases_storage_bucket.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 9ae9039aa16a74e58b7e710fe1d976f229f59ded); dependency tracing and tests required. |
| `supabase/migrations/20261009160001_quran_ayahs_seed_chunk_02.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5c9a66fc53e1654d6892c92a461d1de5c7e64316); dependency tracing and tests required. |
| `supabase/migrations/20261009160002_quran_ayahs_seed_chunk_03.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4edb74861cdd63229c3611e85b220c5a895bdfcb); dependency tracing and tests required. |
| `supabase/migrations/20261009160003_quran_ayahs_seed_chunk_04.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 65332d573a92958f56d4b7af7366328c0c2bf748); dependency tracing and tests required. |
| `supabase/migrations/20261009160004_quran_ayahs_seed_chunk_05.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → af2b443324c509a8cc2dad09fce3ec719dfde49e); dependency tracing and tests required. |
| `supabase/migrations/20261009160005_quran_ayahs_seed_chunk_06.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1c01ae1e8082ebff3aeaef59e1b4267deaf66862); dependency tracing and tests required. |
| `supabase/migrations/20261009160006_quran_ayahs_seed_chunk_07.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → aa3882cce201853617dba24d8f393ae37046249f); dependency tracing and tests required. |
| `supabase/migrations/20261009160007_quran_ayahs_seed_chunk_08.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8d96a4605e27c8742d6d3fafebe71324f3268a2c); dependency tracing and tests required. |
| `supabase/migrations/20261009160008_quran_ayahs_seed_chunk_09.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 388c5471b120707e7d719ab1ea748f1e4863a9c4); dependency tracing and tests required. |
| `supabase/migrations/20261009160009_quran_ayahs_seed_chunk_10.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 92da263a6704f98ecb1303b01d8ca4a127541efa); dependency tracing and tests required. |
| `supabase/migrations/20261009160010_quran_ayahs_seed_chunk_11.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → bb13ac7498371277aba5f65c4471d7018e0a293f); dependency tracing and tests required. |
| `supabase/migrations/20261009160011_quran_ayahs_seed_chunk_12.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8f23d4b8067314e16d98fe324c68294ba7138c7a); dependency tracing and tests required. |
| `supabase/migrations/20261009160012_quran_ayahs_seed_chunk_13.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8c562a73190ec2303d3c93c6524b447343a2c3a5); dependency tracing and tests required. |
| `supabase/migrations/20261009160013_quran_ayahs_seed_chunk_14.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c93f597d63e755494a61838ad6fcb1c2565739f1); dependency tracing and tests required. |
| `supabase/migrations/20261009180000_android_release_bucket_free_tier_limit.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f4429ef89b81cc9f96425dde4cb1ad39fc56eebd); dependency tracing and tests required. |
| `supabase/migrations/20261012200000_repoint_cron_to_zikrofficial_project.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1dc349dd4be00e144085c12fdbc3fe97e47c9928); dependency tracing and tests required. |
| `supabase/migrations/20261012210000_repoint_cron_to_connected_project.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b2dd4d5f12f38f7f42bbc2bed481d10b12233dd9); dependency tracing and tests required. |
| `supabase/migrations/20261012220000_free_plan_cron_efficiency.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6b89d1816c771a4a660e93beecc99fbf6efd320d); dependency tracing and tests required. |
| `supabase/migrations/20261014233233_retire_temporary_tafsir_seed_loader_access.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 24f13563360ab4e2365d2c07da2cac737ebe17f8); dependency tracing and tests required. |
| `supabase/migrations/20261015000001_reconcile_legacy_category_enum_labels.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8e8e7583742158101b322fa46ed07ecf4690b87d); dependency tracing and tests required. |
| `supabase/migrations/20261015020000_remove_duplicate_nonunique_indexes.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 97bc0dbff0caee222bcadb3072047fc9692dcc6a); dependency tracing and tests required. |
| `supabase/migrations/20261015023317_remove_duplicate_nonunique_indexes.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 97bc0dbff0caee222bcadb3072047fc9692dcc6a); dependency tracing and tests required. |
| `supabase/migrations/20261015024511_remove_redundant_prefix_indexes.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 20c73ae33d72c53a288657d01fc0f5cc173c69e2); dependency tracing and tests required. |
| `supabase/migrations/20261015030550_seed_site_homepage_seo_social_defaults.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 902aca130a4db70b0f6a3e52982f5e0328a1297f); dependency tracing and tests required. |
| `supabase/migrations/20261015050000_secure_contact_submission.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 86749b548b1ce78bc4c28c9c011bcff1d8b7b8e1); dependency tracing and tests required. |
| `supabase/migrations/20261017100000_link_legacy_memory_content_to_runtime.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b12fef0668c3ab9b4224183a1a41fc4b513e55b0); dependency tracing and tests required. |
| `supabase/migrations/20261017110000_sync_kids_game_metadata_versions.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → bd3b79c069a6668ab777ed2e6049d189de3a4525); dependency tracing and tests required. |
| `supabase/migrations/20261020224251_kids_games_level_catalog_extend_to_30.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 02a4bcda3a71071545291277b4d5aa4bd7b0687e); dependency tracing and tests required. |
| `supabase/migrations/20261020234239_social_facebook_oauth_credentials.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6860ad19f67cba2628ee2a75f08fc8f546d3e066); dependency tracing and tests required. |
| `supabase/migrations/20261021094431_social_facebook_reels_rate_limit_cooldown.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4c50360b1ca44986c7ff70cbaec866021fd4e7cd); dependency tracing and tests required. |
| `supabase/migrations/20261021200000_seed_letter_lab_kids_content.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ffa4d08601dd0dfc0f275f9e057b1e18f3109755); dependency tracing and tests required. |
| `supabase/migrations/20261021235117_admin_analytics_and_content_scheduler.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 11284fb15246a16f1f27dc87c64d6b1fbf1cda35); dependency tracing and tests required. |
| `supabase/migrations/20261022003101_add_missing_foreign_key_indexes.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6f4f5084c780a8939f5d0049babeb722be0284d9); dependency tracing and tests required. |
| `supabase/migrations/20261022090000_add_letter_lab_to_kids_game_catalog.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6ba256700f10950ac68d43247e4fff72de4bd51a); dependency tracing and tests required. |
| `supabase/migrations/20261027200748_video_render_metrics.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 892b5d7deab81d475ceb30b753cf86fd767bf5d2); dependency tracing and tests required. |
| `supabase/migrations/20261027212803_admin_queue_alert_deliveries.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → dd4a8c33561d255e6c514a2c177700d9057935f3); dependency tracing and tests required. |
| `supabase/migrations/20261028112016_optimize_admin_queue_alert_rls_initplan.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 78e9c9333091e399c49f0a65147d6bea5181d423); dependency tracing and tests required. |
| `supabase/migrations/20261028112823_social_credentials_explicit_deny_policies.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4b047934470e1b23f08a0fe44548cc4c5f4700ef); dependency tracing and tests required. |
| `supabase/migrations/20261028112833_social_credentials_explicit_deny_policies.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4b047934470e1b23f08a0fe44548cc4c5f4700ef); dependency tracing and tests required. |
| `supabase/migrations/20261030043335_arabic_full_text_search_v2.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 442cbd16714fbfd3839b00468fa2d0021c9897a0); dependency tracing and tests required. |
| `supabase/migrations/20261030044153_arabic_search_surahs_and_content_library.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 038a6e3101b506642c856c008dd1acdf832ff6f1); dependency tracing and tests required. |
| `supabase/migrations/20261030050000_admin_rbac_permission_scope.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ee955e2d4af1eed2bd88cdadf7d5cc6674815db7); dependency tracing and tests required. |
| `supabase/migrations/20261030070000_retire_runtime_optional_indexes.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c14cc9f0a368fbe75f47dbb3549ac4465d6d9002); dependency tracing and tests required. |
| `supabase/migrations/20261030071426_admin_queue_observability_indexes.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d2bcb5610efecd91401e848ace4353162df520c7); dependency tracing and tests required. |
| `supabase/migrations/20261030082626_expand_public_content_catalog_20261030.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → fe1c5b6c37dd285f9cbc6cc69f04d48f580bd2e8); dependency tracing and tests required. |
| `supabase/migrations/20261030090000_article_tags_and_english_search.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 55514076720c266564c528d21bbf18635904d31c); dependency tracing and tests required. |
| `supabase/migrations/20261030094823_content_depth_refresh_20261030.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4c4c2f2adb8e763fa9503440df875b2f88835c56); dependency tracing and tests required. |
| `supabase/migrations/20261030100000_admin_public_rpc_invoker.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c14538d8cc56190bf64d8fcd18ed02fa03d9d2cd); dependency tracing and tests required. |
| `supabase/migrations/20261030110000_foreign_key_supporting_indexes.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2ae1ac38e99a2f92925e28018af1c08a17ba2381); dependency tracing and tests required. |
| `supabase/migrations/20261030120000_remove_public_storage_listing_policies.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 4b9e04859b937ebb9fd1f4c4d0ad2c8a475295da); dependency tracing and tests required. |
| `supabase/migrations/20261030121229_video_storage_retention_rpc.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 0d76a0a471f155da6edf95a45d78b12fbd5c7e54); dependency tracing and tests required. |
| `supabase/migrations/20261030130000_video_storage_retention_rpc.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d8757eb12605a90c154bbf18b8a3c260db78865f); dependency tracing and tests required. |
| `supabase/migrations/20261101090000_harden_kids_game_result_insert_contract.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 1453ca2bde681791335c0499debaaac320cf965c); dependency tracing and tests required. |
| `supabase/migrations/20261101135000_revoke_anon_privileges_private_tables.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → af26670838364ab7a2c53f2334b031870071f11a); dependency tracing and tests required. |
| `supabase/migrations/20261101170000_admin_atomic_role_update.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e63f95826f828f8f6a5f06f16d82093078400893); dependency tracing and tests required. |
| `supabase/migrations/20261101183804_sync_video_automation_setting_descriptions.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d2f70e23c9a5c5f2c9888e9184869007d24795bd); dependency tracing and tests required. |
| `supabase/migrations/20261101190000_admin_atomic_site_audio_primary.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d9c3613b8c1bcc4083dbabe6f6a42664a3b47aae); dependency tracing and tests required. |
| `supabase/migrations/20261106010000_admin_video_template_studio.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 2836e8c9ae34ad907a5bc27d4615ac436ebb5a79); dependency tracing and tests required. |
| `supabase/migrations/20261106020000_video_template_version_fk_indexes.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a2a4545776589a277db79f7be114b81babb8759e); dependency tracing and tests required. |
| `supabase/migrations/20261106061131_video_template_version_fk_indexes_reconcile.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 53acd89c76aec48067f24a896791c45861efb334); dependency tracing and tests required. |
| `supabase/migrations/20261106083147_youtube_oauth_credentials.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → ad3b5c86cba79133e93df331d97c6a940ea57f45); dependency tracing and tests required. |
| `supabase/migrations/20261106090800_production_blockers_and_social_insights.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 5b9f5cee8f2b7353d5893dda6728f32a567a1948); dependency tracing and tests required. |
| `supabase/migrations/20261106160000_allow_internal_videos_in_content_publish_queue.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 14d5985dc3191f880f2228ac5809fe295fc11a8d); dependency tracing and tests required. |
| `supabase/migrations/20261106184415_allow_internal_videos_in_content_publish_queue.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 92ead3d018bb8a24ba27ab95c0a4d796fa61a898); dependency tracing and tests required. |
| `supabase/migrations/20261106184600_allow_internal_videos_in_content_publish_queue.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → a1b1e3123fb1d34fd2be050b68a2c5d250aa450c); dependency tracing and tests required. |
| `supabase/migrations/20261106205519_revoke_public_execution_on_rls_auto_enable.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → adf810ee87f2a51ca28d5b231e4d9ec963d2dc23); dependency tracing and tests required. |
| `supabase/migrations/20261106210440_repoint_active_cron_jobs_to_current_project.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 3a7c0111d8484e2c72abed8659de5e39df7e7bc9); dependency tracing and tests required. |
| `supabase/migrations/20261106210520_repoint_active_cron_jobs_to_current_project.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7f741dfc754b55cbb8f638a878ea8e469e43c073); dependency tracing and tests required. |
| `supabase/migrations/20261106213918_video_likes.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 8d6dce326f6ddf799bb0810ec635ef54f4de3190); dependency tracing and tests required. |
| `supabase/migrations/20261106214309_secure_video_like_count_summary.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b1d7d221b98c6274b99808493e77e3cb1d7207e8); dependency tracing and tests required. |
| `supabase/migrations/20261110013646_video_automation_runtime_defaults_20261110.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → e722e55bc035464b460b1ead5edcc6b08654cfa5); dependency tracing and tests required. |
| `supabase/migrations/20261110013832_restore_published_video_catalog_from_youtube_20261110.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → d8ab7ba0dc498fd13290cb76e7f95d437f77203d); dependency tracing and tests required. |
| `supabase/migrations/20261110014132_optimize_video_likes_rls_20261110.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 19209d60f3d996b2c7dd57d72e8e41e9f440f9be); dependency tracing and tests required. |
| `supabase/migrations/20261110021309_kids_video_library_and_thumbnail_recovery.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → fd8f7725447cb5f99a0837054f7cba29f5c616ec); dependency tracing and tests required. |
| `supabase/migrations/20261110021311_increase_video_ai_provider_attempt_budget.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → c383595a9022fb1003cc703ac1d9c4da52e0aecd); dependency tracing and tests required. |
| `supabase/migrations/20261110022756_set_kids_video_public_paths.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 161deaa428a040e25bb89e67605a892804fd489c); dependency tracing and tests required. |
| `supabase/migrations/20261110025303_reconcile_published_youtube_ids_to_video_catalog.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 87346d14069c169e9e04e11ba1744382e4255673); dependency tracing and tests required. |
| `supabase/migrations/20261110030705_isolate_legacy_kids_series_and_require_kids_qa.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 45f3742b2200a273eb55a5078c3e2c7cb2792175); dependency tracing and tests required. |
| `supabase/migrations/20261110031431_retry_false_blocked_legacy_qa_source_url_parity.sql` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → df4fae0eb9be825bc648367b9ea79d996acdf5a0); dependency tracing and tests required. |
| `supabase/REMOTE_MIGRATION_LEDGER.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → f440de3bb5072730b625f04021ee7505e287a63d); dependency tracing and tests required. |
| `tailwind.config.ts` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 6f87e37896a0c2b70fd01976564a5910292e09e4); dependency tracing and tests required. |
| `TODO.md` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 56ca8be84a2a855ba73a96f05b3126a0cd056299); dependency tracing and tests required. |
| `tsconfig.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → 7529525509a62ab7efe94916a37c5f436d5b9447); dependency tracing and tests required. |
| `vercel.json` | REVIEW_REQUIRED | Blob SHA changed since previous manifest (undefined → b982abf1314b065612b6c12a541bd1e390fe3ddd); dependency tracing and tests required. |


## Removed since previous manifest

- `proxy.ts` — absent from current main tree; retained in prior manifest for audit history. No destructive cleanup performed.

## Baseline delta

### Changed files

- `.circleci/config.yml` — undefined → e691af3687ddd96da337e1b0d5271178c2d5f444
- `.env.example` — undefined → 9cb7310c087c14bb6a439fe018810fc3ae4cc2b6
- `.github/CODEOWNERS` — undefined → e722fdd15fb7e5dc68ccd9ed96eb44380af7e1c5
- `.github/dependabot.yml` — undefined → dd530947831021bf02b472f6e0378cad3c97905a
- `.github/ops/run-published-video-cleanup.trigger` — undefined → 46e80bff8350d090b940b7dacdf35cd3e5243ba4
- `.github/workflows/android-native-login-test.yml` — undefined → 02183a6ec4a8af2703c6e5af9dcf6b54ab890832
- `.github/workflows/audit-video-media.yml` — undefined → 7008bf6bfc75cdd029a6adcf5e7f088a817a140e
- `.github/workflows/backfill-legacy-video-qa.yml` — undefined → ef4ff38aea10c648e80ddd46519e85c61933dbb2
- `.github/workflows/circleci-config-validation.yml` — undefined → 900255a62e7ae4af9e000e7191b9b17f48064225
- `.github/workflows/dispatch-android-release-recovery.yml` — undefined → dfc3c1b54703b2957f3616742e094cc754e77750
- `.github/workflows/english-content-sync.yml` — undefined → f5550424862f72cd3e1ccfaa2e08401d6071692b
- `.github/workflows/generate-ai-video.yml` — undefined → d73df5b9d454878ccb166428398ad97d826b3d85
- `.github/workflows/generate-written-content.yml` — undefined → ac83425059317e181f2041a3464c0e1e25bc8a00
- `.github/workflows/publish-android-release-assets.yml` — undefined → e948e363477a4cef222a255fd9114b3327eb74f3
- `.github/workflows/publish-social.yml` — undefined → 799346623e75dbfed76b5d11b0547159d0d1dfe1
- `.github/workflows/quality-gate.yml` — undefined → 705db58536db3a813e2484506181f2cab2190813
- `.github/workflows/reconcile-supabase-migration-history.yml` — undefined → 1d68dfaab901ec140535f0739e2b9992b0fb4128
- `.github/workflows/refresh-offline-content.yml` — undefined → 482d8fa9ef78650807815ecadd5062c5ab2fbddf
- `.github/workflows/release-finalization.yml` — undefined → c9ab2a3488498bddf1cb237bfc077a19f0388eb5
- `.github/workflows/release-vercel.yml` — undefined → 319e2b42695b7bdb11b050b2e11eebd7ee6d5184
- `.github/workflows/storage-retention.yml` — undefined → b0b467d03f126f6b61b1626269b1299a3f8620a9
- `.github/workflows/supabase-production-health.yml` — undefined → 5dd3ae8af7b75fd339a2f603540f40c588ae658d
- `.github/workflows/supabase-restore-seed-data.yml` — undefined → ebecc5743cfe4e961b09a2e34cf60668087433af
- `.github/workflows/sync-social-insights.yml` — undefined → cf1c70b970c07cca5d3057518dd1a639ca7e7ac8
- `.gitignore` — undefined → 8a3693451009b2c7945d696ce73da22bacc9c137
- `.prettierignore` — undefined → 72842592fd0b2d2e7e186e4beeeacada46dabed7
- `.prettierrc` — undefined → 67c0bc83c28a85bbcd4cb081fa91d30b4a79fcfd
- `.release-tag` — undefined → 6a99dbb7fd746dc01ec64d847f110bbb56119554
- `.vercelignore` — undefined → 9d0d2b77c5cddff416b5381879cad3f997b6c6fc
- `AGENTS.md` — undefined → af3b7c84114bafeee578bf1adff2ef74af2cc6a2
- `BRAND_ASSETS_README.md` — undefined → fff67672e91096054f469193ee3f1b34e98e9123
- `CLAUDE.md` — undefined → 43c994c2d3617f947bcb5adf1933e21dabe46bb5
- `DEPLOYMENT_CHECKLIST.md` — undefined → c7fb700b9f3750df36ba34609e812be3d58f0232
- `DOCUMENTATION_INDEX.md` — undefined → e35e031001e2d2f53a5378f995332e39101de204
- `PROJECT_STATUS.md` — undefined → 2380def168d08be965cc79121c61fb866af01e92
- `README.md` — undefined → 22c44102811e0e7246857ca4b983b0241c4181eb
- `RELEASE_STATUS.md` — undefined → eb55791949000356a7723e993123b7fb92c71b40
- `SECURITY.md` — undefined → 76b48b3cf1291ed25b069840586979de649c255b
- `TODO.md` — undefined → 56ca8be84a2a855ba73a96f05b3126a0cd056299
- `android/.gitignore` — undefined → d93032f878297e501b50f221731d97e42371d740
- `android/app/.gitignore` — undefined → 043df802a29f1f386a23cba600c84be8eee2a0c6
- `android/app/build.gradle` — undefined → 1ca32ce6abc138aca90ebe6e499622e9acdf51c7
- `android/app/capacitor.build.gradle` — undefined → d1d967c27e4f85d5689f79b829afa415bf0ec41f
- `android/app/proguard-rules.pro` — undefined → f1b424510da51fd82143bc74a0a801ae5a1e2fcd
- `android/app/src/main/AndroidManifest.xml` — undefined → 96822a3025b5e0d73046f55f8806c12f872a505b
- `android/app/src/main/java/com/zikr/app/MainActivity.java` — undefined → 305e9f860952b209f5a9da454e39611fb86e51ed
- `android/app/src/main/res/drawable-land-hdpi/splash.png` — undefined → e31573b4fc93e60d171f4046c0220e1463075d9e
- `android/app/src/main/res/drawable-land-mdpi/splash.png` — undefined → f7a64923ea1a0565d25fa139c176d6bf42184e48
- `android/app/src/main/res/drawable-land-xhdpi/splash.png` — undefined → 807725501bdd92e94e51e7b2b0006f69e0083a0b
- `android/app/src/main/res/drawable-land-xxhdpi/splash.png` — undefined → 14c6c8fe39fcd51a0414866ad28cbe8ff3acb060
- `android/app/src/main/res/drawable-land-xxxhdpi/splash.png` — undefined → 244ca2506dbe0fd8f6a05520ac7d1a629ea81438
- `android/app/src/main/res/drawable-port-hdpi/splash.png` — undefined → 74faaa583c8221c27a8cb822c3fbe218bafa3299
- `android/app/src/main/res/drawable-port-mdpi/splash.png` — undefined → e944f4ad4e1ca1c8cf9a87b366acc01c4e5c1616
- `android/app/src/main/res/drawable-port-xhdpi/splash.png` — undefined → 564a82ff954aec267492467c0169a270c4e8fea9
- `android/app/src/main/res/drawable-port-xxhdpi/splash.png` — undefined → bfabe6871a17a5e95b78fb30d49b7d2b4d2fe4c0
- `android/app/src/main/res/drawable-port-xxxhdpi/splash.png` — undefined → 6929071268eb03ee0f088142b6523566b78550e2
- `android/app/src/main/res/drawable/ic_launcher_background.xml` — undefined → d5fccc538c179838bfdce779c26eebb4fa0b5ce9
- `android/app/src/main/res/drawable/ic_launcher_foreground.png` — undefined → 8905acd71562c4e2b64db2f7dc00844e6a062dec
- `android/app/src/main/res/drawable/ic_stat_zikr.xml` — undefined → 9cbd1215e796c004e008df174182ef4385b20f36
- `android/app/src/main/res/drawable/splash.xml` — undefined → 4f369306b8a25f879775a7214dfecd3a9c4a23a8
- `android/app/src/main/res/layout/activity_main.xml` — undefined → b5ad1387011da0894cc1d91f44f3bd77f5403f5d
- `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` — undefined → 7353dbd1fd82487df2d06121f85f7994728f1070
- `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml` — undefined → 7353dbd1fd82487df2d06121f85f7994728f1070
- `android/app/src/main/res/mipmap-hdpi/ic_launcher.png` — undefined → 5faf0d388e21ddf4dad4046c67a0a274c6077d22
- `android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png` — undefined → d4a8d192de6ff08517a9bd25ff9cefcff3af66a3
- `android/app/src/main/res/mipmap-mdpi/ic_launcher.png` — undefined → b0b669a4e816d552a41319bd23db0c4d7f32f0b9
- `android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png` — undefined → b4a0bba4c0f1bcb92e5cdd2297c84a427a0ad7a6
- `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png` — undefined → 86df01da116d95dbe44d3791f6e12e570bf53903
- `android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png` — undefined → acbb08267a70a5ba9de4fe218bd722a8f6e4c660
- `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png` — undefined → 9be5b1140f4f3defa70740b328914b548aa67da2
- `android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png` — undefined → 002dfb140fc75c3055fb3ff4e4f5376a2cd178b0
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` — undefined → 7cc0bcbd826e3b910d8d09ff1e80a10e9cdc35d7
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png` — undefined → 06269e488cbcf37fc6cfb66612e1becabb52f430
- `android/app/src/main/res/raw/adhan.wav` — undefined → df4787311e1faaebe42514a9267b9afd456b4142
- `android/app/src/main/res/raw/adhan_01_charon.wav` — undefined → 692a59b5482915db6674790d0de1e43f9acbca47
- `android/app/src/main/res/raw/adhan_02_algieba.wav` — undefined → 6bbd73889e087387c93565546e4a14158883e1cd
- `android/app/src/main/res/raw/adhan_03_enceladus.wav` — undefined → 17cf7ce400a2111d5a261c28bef8cd2d0298dd75
- `android/app/src/main/res/raw/adhan_04_iapetus.wav` — undefined → 2015e1931e22c762858f96c02d937c772208e79a
- `android/app/src/main/res/raw/adhan_05_alnilam.wav` — undefined → d41d5d0c36ee04586ae0c524b893f652bfc0ea9e
- `android/app/src/main/res/raw/adhan_alt.mp3` — undefined → 84638c0f13d3c3d6b877f313d27c95b4e541a82e
- `android/app/src/main/res/raw/salawat.wav` — undefined → 4d3bb47cbc7d1dc37530adf7e61b211854cf5e52
- `android/app/src/main/res/values/colors.xml` — undefined → 8aae936a799cafa31ef56e94a47d725027519cc9
- `android/app/src/main/res/values/strings.xml` — undefined → 605c46aa798b82a10ab48391d40ba8b2c49fb613
- `android/app/src/main/res/values/styles.xml` — undefined → b03033286daa972a414ad308d21ac0a33bb6c4a6
- `android/app/src/main/res/xml/file_paths.xml` — undefined → bd0c4d80d0473953333d5adb0d38ac713d0d648b
- `android/app/src/main/res/xml/network_security_config.xml` — undefined → 34604acf62213a9f964fa2baf3a5a62824f13508
- `android/build.gradle` — undefined → d9fc81f35372be7c547b0d4672e0f34cc01e8294
- `android/capacitor.settings.gradle` — undefined → 6fb76f5e1771eed1aa59a9957966cba1aa983750
- `android/gradle.properties` — undefined → 0168a630994f822eda8d3269735e209a02540d49
- `android/gradle/wrapper/gradle-wrapper.jar` — undefined → a4b76b9530d66f5e68d973ea569d8e19de379189
- `android/gradle/wrapper/gradle-wrapper.properties` — undefined → ed4c299adbd58d353a07c24fbe4751791c5d4ee8
- `android/gradlew` — undefined → f5feea6d6b116baaca5a2642d4d9fa1f47d574a7
- `android/gradlew.bat` — undefined → 9b42019c7915b971238526075306ffba3b666dd5
- `android/settings.gradle` — undefined → 3b4431d7724bd82d1aeb2ce59e7a0504b8869f81
- `android/variables.gradle` — undefined → b9b046a22b8df5f01d325fe5e2cac7e7e1237134
- `capacitor.config.json` — undefined → 17ce2f556ce3bbfa82c57665b305f43be2a0ee85
- `components.json` — undefined → 723b14b8df19bab4c3696be5a96f8177783581f9
- `docs/ADMIN_REORGANIZATION_PLAN_2026-10-30.md` — undefined → f3f87e9dc72259020340d2059a951e95ae8ec7a3
- `docs/ADSENSE_REVIEW_2026-10-15.md` — undefined → 84536eb259159b16ffff837cee004f60ac86e186
- `docs/ADSENSE_SETUP.md` — undefined → 042a85eca8ca23c1d8dda98a364325241ecaabe8
- `docs/ARCHITECTURE.md` — undefined → b2776e342cd91a31c05f32a118d63b6eb222b047
- `docs/AUTH_SYSTEM_GUIDE.md` — undefined → de2c4753b040087938f2929c0e4a7c26494620fa
- `docs/AUTOMATION_OWNERSHIP_2026-10-08.md` — undefined → dde8ae199d317cb2b5725be6bffe4fe1000aa015
- `docs/CANONICAL_AUTH_CONFIG.md` — undefined → 6ae33bec06dc548e8efa10e200723925688bb811
- `docs/CI_CD_ARCHITECTURE_2026_10_08.md` — undefined → abc86b6e6b1e0b21f377fd46560b46457222cac1
- `docs/CI_CD_WORKFLOWS_REVIEW_2026_10_08.md` — undefined → 42eed72acb7a8c088ad5f2886d2010d04fc8a152
- `docs/DATABASE_SCHEMA_INDEX.md` — undefined → 3aec90c5c028481ce5cf03d8dc9ac969b8d848f2
- `docs/DEPLOYMENT_GUIDE.md` — undefined → 047f9c45c031a27e271851e7e7c24bb04dfc41cc
- `docs/ENABLE_GOOGLE_OAUTH.md` — undefined → 55dab4dfcc3e5475223c3a36f212863d4b7c6e92
- `docs/ENVIRONMENT_GOVERNANCE_2026-10-08.md` — undefined → d7afa6d642f2ff2133b71faaf070ac926a60a941
- `docs/GITHUB_AI_VIDEO.md` — undefined → 5d80734970d088813938da2fc8a75c63189b1cc8
- `docs/GITHUB_AUTOMATION_AUDIT_2026-10.md` — undefined → 00102cd48204f2c775fa4366f7dbf8debe7b0c9a
- `docs/GITHUB_VERCEL_SUPABASE_SYNC.md` — undefined → 49cf2372d4b83d36fee2ae5c6717c029404cd9e6
- `docs/INFRASTRUCTURE_AUDIT_2026-10-30.md` — undefined → d3c14e0822ed2e8d3772f4fed935a0b0b137092c
- `docs/KIDS_GAME_ASSETS.md` — undefined → 67c3006c8c3aa2dd716cafd0a80848b15462d268
- `docs/LAUNCH_CHECKLIST.md` — undefined → b1ea54ee20362684169ec1ee418794b4ad810964
- `docs/LOCAL_NATIVE_BACKFILL.md` — undefined → 454164f1973543ef6a211ffb759c041d2d81b9d9
- `docs/MASTER_GROWTH_RENEWAL_PLAN_2026-10-20.md` — undefined → 8dc42058a82a5f1e0b0cfaf55d6523cfa007b309
- `docs/MIGRATION_DUPLICATE_POLICY.md` — undefined → f15e0fe0613cbe3ba93493a4b5471c61873c2934
- `docs/MONETAG_SMARTLINK_PLACEMENT.md` — undefined → 753d054a4362121bc1e2915ed73d0cfa75e8e164
- `docs/NATIVE_BACKFILL_STATUS.md` — undefined → 256d17a1e7fb3d2a4137afe82414cfb37305378d
- `docs/NEXT_PROGRAMMING_PHASE_PLAN_2026-10-30.md` — undefined → 2a29aeada48ff429ddc723fe58a5d4d4b3bd11f2
- `docs/OAUTH_FIX_NOTES.md` — undefined → 057f1dcbebccb7c6d4453503cf39722cf95dc772
- `docs/OFFLINE_CONTENT_OPERATIONS.md` — undefined → 815a19b17c268c825c7c8248775926cd06dd7994
- `docs/OFFLINE_SUPPORT.md` — undefined → 33b2be7f4d4061df74640beb5fd73aa4879d8a03
- `docs/README_RELEASE.md` — undefined → 470251332160f67be5b0a4313b6b7869ec6e5a30
- `docs/SOURCE_OF_TRUTH.md` — undefined → 762c0e4e3ca343c1d58462d34855bd8d252daa4d
- `docs/SUPABASE_FREE_MIGRATION_FINAL_2026-09-29.md` — undefined → 0cff7cb3d8ebdc07f38ef9dc52cbecd10ed1f06f
- `docs/TROUBLESHOOTING.md` — undefined → 8ba072032c4dfabe6f5a9e8669bde7322251deec
- `docs/VERCEL_GIT_IDENTITY.md` — undefined → d634699d48e1e4381a5dcef9bc45b5c38a882edc
- `docs/VIDEO_AUTOMATION_FIXES_2026_10_08.md` — undefined → b715c7b5516d66065aabf419a8e23c7e769c8b2b
- `docs/VIDEO_PUBLISHING_GUIDE.md` — undefined → f4d7ff2f166b064e1afea728a9d469d4b30af530
- `docs/YOUTUBE_TAKEOUT_NATIVE_BACKFILL.md` — undefined → 12cdc76312e9f6d3288b657638b0171474085f76
- `docs/admin/ADMIN_API_PERMISSION_MATRIX_2026-11-06.md` — undefined → ff99f964bd5d708b2d812c86acd51e5990f3bf7b
- `docs/admin/ADMIN_CONSOLE_GOVERNANCE.md` — undefined → 9a2a8a919817287f57238158ec56e355853ea1f6
- `docs/admin/ADMIN_ROLLOUT_CHECKLIST.md` — undefined → 6784c801657e37851f6bfc232b4868493aa62796
- `docs/admin/GA4_REPORTING_SETUP.md` — undefined → 56592541f01c6b17f5aaff1b62214a4ac44285d0
- `docs/admin/SOCIAL_PUBLISHING_OPERATIONS.md` — undefined → d51be3200e323eefb96b495a2b673434cb2a4d4f
- `docs/admin/ZIKR_TRAFFIC_REVENUE_ENGINE.md` — undefined → 0165a2e1b874cbf1664456c90ff509248fdc4186
- `docs/api/README.md` — undefined → dc2d11d6ce555ddcb8272b8fa8f195db29e440d9
- `docs/api/openapi.yaml` — undefined → 7deae43f200c46081626b2c10b4934435331a143
- `docs/api/postman_collection.json` — undefined → 11172c3e83105a040a8492c461f377ef1c123e45
- `docs/apk-github-release-plan.md` — undefined → 1e7cbe2bd028e3bac92e82496adb0f9215912aa3
- `docs/apply-verified-content-pack.json` — undefined → 124a8865336c9c0c1633c3b39742e0d096199d2a
- `docs/archive/AUDIT_2026_10_08_BASELINE.md` — undefined → 86ac7ef9b48efe88ffe83d3ba559f93649096634
- `docs/archive/CONTENT_AND_PAGES_AUDIT_20260929.md` — undefined → bf5db474b263f44277127d108df365be6b5a2bf2
- `docs/archive/CONTENT_DATABASE_AUDIT_20260929.md` — undefined → a24c43406fa403b48eaa82431148c92b42234171
- `docs/archive/DEPLOYMENT_READY_CHECKLIST.md` — undefined → 6a9435a595929c3aeb0cb3ddbdf5a1c11f6ccac8
- `docs/archive/FINAL_DELIVERY_SUMMARY_v1.1.0.md` — undefined → 5efde3e576a86059951f9bc5f0e81d08dade2937
- `docs/archive/IMPLEMENTATION_GUIDE_KIDS_ENHANCEMENT_v1.1.0.md` — undefined → 4f10e43ba76c833ec1dbd53f25738772e6dcd35f
- `docs/archive/KIDS_GAMES_3.0_AUDIT.md` — undefined → d1ee121b71e03666233416e13c212e38e1a4d533
- `docs/archive/KIDS_GAMES_COMPREHENSIVE_AUDIT.md` — undefined → 147ec3dfde73703ecb51d5ab48e697e440cc81d3
- `docs/archive/KIDS_GAMES_IMPLEMENTATION_v1.1.0.md` — undefined → c4068243873e6d6d69f18c33f1df3234c5814592
- `docs/archive/KIDS_SECTION_AUDIT_v1.1.0.md` — undefined → 9568c6171a1d478a015e3224e3c889e96d9ec928
- `docs/archive/KIDS_SECTION_ENHANCEMENT_SUMMARY.txt` — undefined → 44eecc3779d2135c0cd2dd3e48849dfcc830989d
- `docs/archive/MIGRATION_HANDOFF_20260920.md` — undefined → a828cce2dea8d4edc085a4a39a4bdd8fbd5742d1
- `docs/archive/NATIVE_YOUTUBE_FACEBOOK_PHASE1.md` — undefined → 2598a8607977a84e33553f7c0759d3b84b4e2297
- `docs/archive/PROJECT_AUDIT_REPORT.md` — undefined → b00f5ecffab0c5343be2d9d532b70d89d4893424
- `docs/archive/PROJECT_STATUS_v1.1.0_FINAL.md` — undefined → e2f2d9744672dc900d18adb55407313a62370539
- `docs/archive/README.md` — undefined → 6eb8b68984a7000e2e1486298d1d39f14aaf6594
- `docs/archive/SUPABASE_MIGRATION_AUDIT_OLD_2026-09-29.md` — undefined → 2538b736a9c3cedda2c6176410ba8ab793e7320b
- `docs/archive/migration-parity-2026-09-01.md` — undefined → 16d896708d300a84a5c1c7dbafa546cc904c7906
- `docs/archive/release-ci-fix-v1.3.2.md` — undefined → e4e8e50ee0fb926ee682d6caec4d939d102606dc
- `docs/archive/release-status-1.4.2.md` — undefined → 9b8dd82eecde0e23e94152df24f4f0b39adb2c11
- `docs/assets-guide.md` — undefined → 496abc40539f922b9896298c53e698901b0ea1b9
- `docs/audio/HUMAN_AUDIO_LIBRARY_2026-10-02.md` — undefined → 2430ff9df2ee3bb081180d8fd9e41b4fe37c30b1
- `docs/audits/ADMIN_CONTROL_CENTER_2.0_AUDIT_PLAN_2026-11-06.md` — undefined → 7387af5d46907272037520b104f42b79b513ba48
- `docs/audits/ADMIN_CONTROL_CENTER_2.0_EXECUTION_2026-11-06.md` — undefined → 645787f9652f1f2368c54d127e798f2ad2da7c58
- `docs/audits/ADMIN_CONTROL_CENTER_CLOSEOUT_2026-11-06.md` — undefined → 400a77eab1cbb9db7f6f8ebfc5ac2e3f1794887f
- `docs/audits/ARCHITECTURE_MAP_2026-11-01.md` — undefined → b96835e6a1dc30d40568bbc9891d7d5278a4b2b0
- `docs/audits/FILE_STATUS_MATRIX_2026-11-01.md` — undefined → 3113e99e623f52335a8e27e6c0300f547baaaf4b
- `docs/audits/PG_CRON_RUNTIME_AUDIT_2026-11-01.md` — undefined → 5fc0a95e8227bf2f3c8608d26db6c204c937a03a
- `docs/audits/PLATFORM_READINESS_2026-11-01.md` — undefined → ed882af34988c81d7e7992758b1f0a511cb14eda
- `docs/audits/REMEDIATION_CLOSEOUT_2026-11-01.md` — undefined → 0e8b7cf04531894d1020821de299d1179c8074b4
- `docs/audits/VERCEL_ENV_AUDIT_2026-11-01.md` — undefined → f928a11e8877b439bf9b2c7b40145139f36a4aa7
- `docs/audits/VIDEO_FACTORY_STATUS_2026-11-01.md` — undefined → c7fed263652485791b03fc15eef348182e0e4669
- `docs/audits/production-snapshot-2026-11-01.md` — undefined → 2896e369263b5aa51b35b1ad74175369c621a9f8
- `docs/background-jobs.md` — undefined → 7de70c19fb3c737f403b11290a53cba21dbc5ff4
- `docs/branding/identity-rollout.md` — undefined → ccfc1a9502914e7e87c482c110798e2e29eb0a07
- `docs/circleci-supabase-environment.md` — undefined → 1b9cc7dd35cf3a6d88ff997d217ce888990bf081
- `docs/closeout/ZIKR_ALL_PLANS_CLOSEOUT_2026-10-30.md` — undefined → 6ba1e474b92cbaee52db3fc1cf0adca77e0a003e
- `docs/companion-scholar-source-notes-2026-08-22.md` — undefined → ee5a1f7cd2dce6dc6bd0b5217f1d37d10bbe4df0
- `docs/controlled-release.md` — undefined → f824bc3ea651b58be6da39bc12a50c8ab653b0c7
- `docs/daily-content-operations.md` — undefined → 9db2002ffb7b187f5737c3026d421de2e48769f3
- `docs/deployment-sync.md` — undefined → e9c9a29b36963343e7519813032d31a9565d3bbe
- `docs/e2e-test-report-2026-10-15.md` — undefined → 68e3d59da3720df84f0a6e16e4ce0828ecd68783
- `docs/environment-variables.md` — undefined → bdcb6ce02042be18a954991f5740222886caec0a
- `docs/facebook-oauth-reconnection.md` — undefined → bfc2e67a4603c7073feb686dfefce006473894ad
- `docs/facebook-page-verification-2026-08-22.md` — undefined → ed84ce32ab575c9755a75b74df4debe2faeec879
- `docs/finalization/ANDROID_RELEASE_RECOVERY.md` — undefined → efb8f874f2622e263b5bf5249985ae4bd43d579a
- `docs/finalization/DATA_LIFECYCLE_MANIFEST_2026-10-02.json` — undefined → 9977d1b1d39bc1ddb0364218369faf53b69df08b
- `docs/finalization/DEPRECATION_MATRIX_2026-10-02.md` — undefined → 195f57537496f37d9a3ae9531acd5e0746ae8b6c
- `docs/finalization/PHASE_0_1_BASELINE_2026-10-02.md` — undefined → 4197d5f80a0b40cb4840e357b3300f7cdc1cec4b
- `docs/finalization/PHASE_0_1_FILE_INVENTORY_2026-10-02.md` — undefined → 836e0cf0f9d5cb3ba646035c08fd241d2fa80c70
- `docs/finalization/PHASE_10_CHECKPOINT_2026-10-02.md` — undefined → 39df6cb3672fdebf33bb95696da000d74c4da506
- `docs/finalization/PHASE_10_VIDEO_FACTORY_2026-10-02.md` — undefined → c30ef305b8f518fc25a5c99c4af40723dc8ba858
- `docs/finalization/PHASE_11_AI_VISUAL_FACTORY_2026-10-02.md` — undefined → 986e0635bbfa1e9fb7a95098fa7c0637aa0af95e
- `docs/finalization/PHASE_11_CHECKPOINT_2026-10-02.md` — undefined → a2e1613d2db9d869389f0101910579270abdceff
- `docs/finalization/PHASE_12_CHECKPOINT_2026-10-02.md` — undefined → 7611ac25f9f7eb0e11e8960725d3732a2f603230
- `docs/finalization/PHASE_12_VIDEO_QA_2026-10-02.md` — undefined → 149c420b707d95c0f2f35c01081e8696d4c7f3bd
- `docs/finalization/PHASE_13_CHECKPOINT_2026-10-02.md` — undefined → c87eb8764381a016efaab35b4a4c0ca70b247e10
- `docs/finalization/PHASE_13_SCHEDULER_2026-10-02.md` — undefined → 4c86c63f880c076d7efa02006dec82039e1e2c50
- `docs/finalization/PHASE_14_CHECKPOINT_2026-10-02.md` — undefined → 313e7b456972225e1e4a5e73e3d1110448af0ad9
- `docs/finalization/PHASE_14_SOCIAL_PUBLISHING_2026-10-02.md` — undefined → 1e9705b6ee44ebf2cf42314e7490902c60433889
- `docs/finalization/PHASE_15_ADMIN_VIDEO_FACTORY_2026-10-02.md` — undefined → 16297da2cc673bfb5787dc2ddacbed218ff752bf
- `docs/finalization/PHASE_15_CHECKPOINT_2026-10-02.md` — undefined → 65d745bb47186c84a471a68456a0731c4a777b13
- `docs/finalization/PHASE_15_KIDS_PRODUCTION_2026-10-02.md` — undefined → eeced9c5307702181797b06a7820db3512d2fc5e
- `docs/finalization/PHASE_16_23_MASTER_PLAN_2026-10-02.md` — undefined → 1ce5c6080fa7a9c7e105d09c97461b04f9ab77a4
- `docs/finalization/PHASE_16_ADMIN_ROUTE_HARDENING_2026-10-02.md` — undefined → 891d7f7c4980df74a410db3d69439a5abf904f0f
- `docs/finalization/PHASE_17_DATA_LIFECYCLE_2026-10-02.md` — undefined → 5e73b0013fcdc240634139fdc992e2acfa3e2b7c
- `docs/finalization/PHASE_18_DB_RETIREMENT_2026-10-02.md` — undefined → 78868ffc2ffac139fe73a2225621e6c333404aa0
- `docs/finalization/PHASE_19_INDEX_GOVERNANCE_2026-10-02.md` — undefined → a8c2f181559c0a745619a3699ab1ff7fda3001a0
- `docs/finalization/PHASE_20_ASSET_HYGIENE_2026-10-02.md` — undefined → 22fb90d360e1e925b0879306cf24a3f792788a15
- `docs/finalization/PHASE_21_TEST_QA_2026-10-02.md` — undefined → 07f58308f4e647c13ef7826c85602338bad2d064
- `docs/finalization/PHASE_22_RELEASE_CLOSURE_2026-10-02.md` — undefined → 08be578d4ae8bb0844b38c84e0d3df8f8a2c6003
- `docs/finalization/PHASE_2_ARCHITECTURE_MAP_2026-10-02.md` — undefined → 1a23d41ef3db11124ec15945f427e7d41fa95024
- `docs/finalization/PHASE_2_CHECKPOINT_2026-10-02.md` — undefined → cc7ca79ccea9a96aa7baf1789810d93790d02983
- `docs/finalization/PHASE_3_CHECKPOINT_2026-10-02.md` — undefined → 775c72a0721948747369eadee71189f3c16eaf73
- `docs/finalization/PHASE_3_DATABASE_CANONICALIZATION_2026-10-02.md` — undefined → 375d6e47b19fca2aaeedaf1c07c3656c14899843
- `docs/finalization/PHASE_4_CHECKPOINT_2026-10-02.md` — undefined → fac83e360b54fb59ae38580d92ed3c5f2908921f
- `docs/finalization/PHASE_4_MIGRATION_RECONCILIATION_2026-10-02.md` — undefined → 55a9d1db83ab2460834e15514402d3908d530ed7
- `docs/finalization/PHASE_5_CHECKPOINT_2026-10-02.md` — undefined → c9a4fc8ba61d05d9958a9314ec9b0d807d2af13d
- `docs/finalization/PHASE_5_ENVIRONMENT_RECONCILIATION_2026-10-02.md` — undefined → 1b96f8db813a0ab368b41026abd63735549b11e6
- `docs/finalization/PHASE_6_CHECKPOINT_2026-10-02.md` — undefined → ac65a6779725e1ac192927ba0243854f30395457
- `docs/finalization/PHASE_6_SECURITY_HARDENING_2026-10-02.md` — undefined → d6ed72b8519f78c30c232ed4dff7f2a8e1dc1ef1
- `docs/finalization/PHASE_7_CHECKPOINT_2026-10-02.md` — undefined → 32a864828971a4e52b760c52e2c78245b01d8356
- `docs/finalization/PHASE_7_CONTENT_CANONICALIZATION_2026-10-02.md` — undefined → f06749a4b1ae45be604bb56d70281b30351bff3c
- `docs/finalization/PHASE_8_CHECKPOINT_2026-10-02.md` — undefined → 08c00d63ee432c91ef45b0df9d5daf51eb93ac56
- `docs/finalization/PHASE_8_QURAN_CANONICALIZATION_2026-10-02.md` — undefined → 5b58090ad26289b1f2ec077024953b8ab099046d
- `docs/finalization/PHASE_9_CHECKPOINT_2026-10-02.md` — undefined → 4da8a0e7ca06a14c1b8e846454260a9fe01a424d
- `docs/finalization/PHASE_9_VOICE_FACTORY_2026-10-02.md` — undefined → bfc0f56bcf2df7bc3770356ba80b3abc2e1d26ce
- `docs/finalization/PRODUCTION_HARDENING_2026-10-04.md` — undefined → 999913a32c4f19de8b178e1008e78fb29fb7cae7
- `docs/finalization/PRODUCTION_RELEASE.flag` — undefined → a661bae75ca521f5d947b7e9b0a511d85f6d1c25
- `docs/finalization/RELEASE_RETRY.flag` — undefined → 7ad0c7a6c16b2d73e43ed1094a62d6a4e3a66b64
- `docs/finalization/ZIKR_ALL_PLANS_CLOSEOUT_2026-10-30.md` — undefined → 08ce0e10a1c81483cf9c3ab36f0ed8eff4cadd73
- `docs/finalization/android-release-recovery-run-v1.1.3.md` — undefined → 652125defbe8dea7e930cbf8f50ee43642f8815e
- `docs/finalization/preview-payload-and-ci-fallback-20261009.md` — undefined → 6c5f2955b7c16ea8c1c795a5e2d0306940dc6574
- `docs/google-search-console-verification.md` — undefined → 073ab49e17219becbb2d3f103c1d5e9379f781d8
- `docs/kids-content-editorial-audit-2026-10-21.md` — undefined → 0bb35908f2de4dd2393c80d64c1cf7bd4f56b5b2
- `docs/kids-video-series-free-factory.md` — undefined → d57e0b46dc96419227807eefeeb39d29acbd826d
- `docs/kids-world-evolution-roadmap.md` — undefined → 74482bf670fc9453e05631ca8960cb8b9b4b9cb0
- `docs/kids-world.md` — undefined → 332b16f6815ca9d10ceaf2db8a764958d539b156
- `docs/native-oauth-fix.md` — undefined → 97e90444829c2f07b4b9b750e8473db9dda3e012
- `docs/production-scheduling.md` — undefined → a262ef2b5dc59b8c9bde6574a37157c6656326c1
- `docs/releases/1.1.1.md` — undefined → 2c14acce0055dfe09b7adcc4e7bfe16645625933
- `docs/releases/1.1.10.md` — undefined → 2e1d117d8c04e59e64c0e1142871b325a6fd4d3d
- `docs/releases/1.1.11.md` — undefined → 3b4a5c0f5e3f5e856c38e352495e491df0fef327
- `docs/releases/1.1.12.md` — undefined → 469d3cec44ed65e36fa742183fd9369f9a969275
- `docs/releases/1.1.13.md` — undefined → dd721ac6c5a43eb4500f9042332a30c75ef4fee0
- `docs/releases/1.1.14.md` — undefined → e28bc90b61aec1975d0302da2734237bfe2aa6cc
- `docs/releases/1.1.2.md` — undefined → 8a853d91334e78e8e95ac3cc466b3c2c434e0825
- `docs/releases/1.1.3.md` — undefined → 6971915517a6ae8e1eec968b93b9394d8abe88ac
- `docs/releases/1.1.4.md` — undefined → 93e764c84ff85690683f05b2cd8072cf536a353b
- `docs/releases/1.1.5.md` — undefined → 769611769e22168449fd08bd7087fdf00624ba97
- `docs/releases/1.1.6.md` — undefined → 56644c6c9ae1324a44b999c3b94bbf36ccda79c7
- `docs/releases/1.1.7.md` — undefined → 8988206235550b72bc01f663cd029222b0be857a
- `docs/releases/1.1.8.md` — undefined → 291ec048b5d3f5b803a7eaafbf46a754c371f97f
- `docs/releases/1.1.9.md` — undefined → 1996d016074d5e76e709f050ea89f5c6219b0ab9
- `docs/releases/v1.1.0.md` — undefined → a4f712c4ed6e7edf6f521730e4c7f481604c9f20
- `docs/secure-apk-release-protection-plan.md` — undefined → 1d162ea320c363753d3e5e5ad73d5576aa618cc3
- `docs/short-prophet-stories-inspection-2026-08-18.txt` — undefined → 472d612ca8cd253231466ec6fa3a95de943bbcab
- `docs/skill-search-zikr-2026-08-18.json` — undefined → 291e9bdde25f93855da49619337320b428cf8459
- `docs/supabase-remediation-evidence-2026-08-15.md` — undefined → b9e99ec8c7e58695a6f5963adc55150248625bbe
- `docs/zikr-security-hardening-and-apk-plan.md` — undefined → beecb669408ac6adb21c83929f3333062e635104
- `eslint.config.mjs` — undefined → a65ed4fa26c1d54f2fd7c87416b111de46d91bbe
- `ios/.gitignore` — undefined → f47029973b442a32c7ce8a83195f29d70661f124
- `ios/App/App.xcodeproj/project.pbxproj` — undefined → c5f465f4bfefba38d4a9e615e83cd62ddb988ba3
- `ios/App/App.xcworkspace/xcshareddata/IDEWorkspaceChecks.plist` — undefined → 18d981003d68d0546c4804ac2ff47dd97c6e7921
- `ios/App/App/App.entitlements` — undefined → 59db7835a8c2dcf3a668696d01b31e246c5ef0ba
- `ios/App/App/AppDelegate.swift` — undefined → c3cd83b5c0a62be3fc56a7909aedc70ccf6a92c0
- `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` — undefined → cffcfbf157970817ed72125f6c8848d5f951954d
- `ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json` — undefined → 9b7d382dcecca887eac19d7f1c4c8dc57abe00e4
- `ios/App/App/Assets.xcassets/Contents.json` — undefined → da4a164c918651cdd1e11dca5cc62c333f097601
- `ios/App/App/Assets.xcassets/Splash.imageset/Contents.json` — undefined → d7d96a67c0d764a2ddfc9545441c627e6d5fa1fc
- `ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-1.png` — undefined → 33ea6c970f2df1db62a624a55e5bbcc4ee07bbdf
- `ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-2.png` — undefined → 33ea6c970f2df1db62a624a55e5bbcc4ee07bbdf
- `ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png` — undefined → 33ea6c970f2df1db62a624a55e5bbcc4ee07bbdf
- `ios/App/App/Base.lproj/LaunchScreen.storyboard` — undefined → e7ae5d7802c067edcd71596688fa7b059de8a262
- `ios/App/App/Base.lproj/Main.storyboard` — undefined → b44df7be8f82acfcd747fd8d77fcd7a87b788f6f
- `ios/App/App/Info.plist` — undefined → 829574e29719e04c4a056fe31bfddb82d3edb9a9
- `ios/App/App/Resources/adhan.wav` — undefined → df4787311e1faaebe42514a9267b9afd456b4142
- `ios/App/App/Resources/adhan_alt.mp3` — undefined → 84638c0f13d3c3d6b877f313d27c95b4e541a82e
- `ios/App/App/Resources/salawat.wav` — undefined → 4d3bb47cbc7d1dc37530adf7e61b211854cf5e52
- `ios/App/Podfile` — undefined → d8bed98d6f44266fcc0a295da764bb9535d371f5
- `mobile/README.md` — undefined → 00ad7d32e64b5ae20022856745abe2c567ec8305
- `mobile/capacitor-dependencies.json` — undefined → ed44f885e54dc6a525ce1225f5256ff1507d5016
- `next-env.d.ts` — undefined → a419cbe4e3a5e8d4b481b851dbf4ac767de069e6
- `next.config.ts` — undefined → b637b99fabd4b000424fce1b412da98cc72facf7
- `package.json` — undefined → fa5bf4cbd7db99dfe9cfb347453358da19846b24
- `plan.md` — undefined → d5a28afe7be71d4ad235b5d8763168f96e0b087f
- `pnpm-lock.yaml` — undefined → e5a9cb30b4552a51311c969c8c8caafb999167b3
- `pnpm-workspace.yaml` — undefined → 4e5c80185090ab33a7b76a82973a5370c8d81d07
- `postcss.config.mjs` — undefined → a1515463cacd43bce00913a35e9b76dbb1d207ec
- `public/ads.txt` — undefined → 93f2e10f4bfbbe650a92b82149a02ed536501a12
- `public/apple-touch-icon.png` — undefined → 30d73318f47f61d243a8786640ced43e6648bae2
- `public/audio/adhan-01-charon.wav` — undefined → 692a59b5482915db6674790d0de1e43f9acbca47
- `public/audio/adhan-02-algieba.wav` — undefined → 6bbd73889e087387c93565546e4a14158883e1cd
- `public/audio/adhan-03-enceladus.wav` — undefined → 17cf7ce400a2111d5a261c28bef8cd2d0298dd75
- `public/audio/adhan-04-iapetus.wav` — undefined → 2015e1931e22c762858f96c02d937c772208e79a
- `public/audio/adhan-05-alnilam.wav` — undefined → d41d5d0c36ee04586ae0c524b893f652bfc0ea9e
- `public/audio/adhan.mp3` — undefined → 84638c0f13d3c3d6b877f313d27c95b4e541a82e
- `public/audio/adhan.wav` — undefined → df4787311e1faaebe42514a9267b9afd456b4142
- `public/audio/kids-adventure-theme.mp3` — undefined → d8b4ff37c5d2ddb22e2c796c1397ab52f85ea362
- `public/audio/kids-learning-theme.mp3` — undefined → 2898978fc47ea64b26455330e43965f2c540461b
- `public/audio/kids-night-theme.mp3` — undefined → 46d38e7be48b2522a81ebd913de16891a577eaee
- `public/audio/salawat.wav` — undefined → 4d3bb47cbc7d1dc37530adf7e61b211854cf5e52
- `public/banners/homepage/main-hero.svg` — undefined → 945ec81e1cf441b01b0cc7f66f898c565e92221c
- `public/branding/brand-artwork.webp` — undefined → 57f3c3ca5809559bbd26be723ee7f4c3dca84550
- `public/branding/logo-gold.webp` — undefined → 9a814bf47435d85a7523284efd2d62a45413432f
- `public/branding/og-image.jpg` — undefined → 552d9a72b2496c91dceef4dd11c1ef872f19ae75
- `public/branding/pattern.svg` — undefined → 35dc9751ec40acc996a7e7905b3476972d77319a
- `public/branding/zikr-brand-guidelines.md` — undefined → 5d765dc38236d1b40c6640b2a14aa1c08240ebfd
- `public/data-deletion.html` — undefined → 1184ba58f0d4b5977b3e2dae25973f9e76d97acf
- `public/favicon.ico` — undefined → cd5567fdf74283fbde5d8f2a2cb142a2ecbcf024
- `public/google3526c15e10fa1913.html` — undefined → 598beec4be9c896ab305f3335c65eee784aecca1
- `public/google6f7827292f8e19bc.html` — undefined → 9177016202cf3bede5a8fafa86479dbc5e1ba997
- `public/icons/icon-192.png` — undefined → 821cbe5976295b27dcfa886decb5c03021e26c16
- `public/icons/icon-192.svg` — undefined → e064331e30720edfd047556b5abc4bcb4c2aaad1
- `public/icons/icon-512-maskable.png` — undefined → 9ee0570ff700727ccb8e11c170f664e26c7c0f93
- `public/icons/icon-512.png` — undefined → bdc2232b8529f6e9a3dfce15bf272052e870cd6c
- `public/icons/icon-512.svg` — undefined → 15bd1ebaba625576b49882e26d0f5465f1da794a
- `public/kids/games/scene-moon-sky.webp` — undefined → 990153b5e06ac6bd69a639e6eee06ccc4c402f29
- `public/kids/games/scene-mosque-courtyard.webp` — undefined → dd15774e565a1f5a40b2d1b0f6a2ea821e3edc00
- `public/kids/games/scene-night-garden.webp` — undefined → 000e7902ccf7f70e02f5ce09ef9dde76c4d3c9d5
- `public/manus-routes.json` — undefined → 613dd32886e3bf9cbd35aa5d4c305470a5297124
- `public/offline-content/v1/article_categories.json` — undefined → 5b3e1c4611f1c5ceedf089a664b5eafc15743f46
- `public/offline-content/v1/articles.json` — undefined → 4036b50b325c7e0088d58e71daa8ed17f4a0d07c
- `public/offline-content/v1/ayahs.json` — undefined → 8862ea8ed1f0ea789fa84c749f70061d398e9161
- `public/offline-content/v1/battle_events.json` — undefined → e398dd8bc773a9310d0d1874efbfd44dbd011752
- `public/offline-content/v1/battles.json` — undefined → 7f7487a7e3535767b9fe2e2a7c21acf999a16bea
- `public/offline-content/v1/companion_stories.json` — undefined → 3633877a956e340a62222dd67d0190a29c99971d
- `public/offline-content/v1/companions.json` — undefined → a2d9bdf609077bdbb9810bdc636f1ff1fc439955
- `public/offline-content/v1/conquest_events.json` — undefined → 015e65e57912c895955ac77d26324b526c3194ba
- `public/offline-content/v1/conquests.json` — undefined → 8122c42b482f47b1d213efb81219a3081f4ae42a
- `public/offline-content/v1/dua_categories.json` — undefined → 90c7f0fc1530c05de7c5476bf015885e4023c717
- `public/offline-content/v1/duas.json` — undefined → 71090a02a20c4fec6464681ab496a60aff5064b0
- `public/offline-content/v1/hadith.json` — undefined → a0a94b018b6d5da96f383e94abcf1a9ead80f6bf
- `public/offline-content/v1/hadith_books.json` — undefined → b3a4641621ffee9efe825b0afc82c57c3a1002f3
- `public/offline-content/v1/kids.json` — undefined → 19b0c9b94bdb8265d43a14d87fe9ae5f6524a5d8
- `public/offline-content/v1/kids_game_levels.json` — undefined → 19a39cb295bcb52b1547325166dae0eddd9c2717
- `public/offline-content/v1/kids_games.json` — undefined → 4d49d875bbda2d5c3ca4afe7637d470e1b04e3de
- `public/offline-content/v1/manifest.json` — undefined → f2e29112e46588d9e50120a3d80e9390a3690e8c
- `public/offline-content/v1/prophet_sections.json` — undefined → 7fc224bb744df907f2cda1b9eb8dccd3d72c42e7
- `public/offline-content/v1/prophets.json` — undefined → c9b0e8a59ebdc617bb605964a17902508ed12a92
- `public/offline-content/v1/quran_audio.json` — undefined → 9876a8f8dbd02b9aafe53a18025f4e0922c32866
- `public/offline-content/v1/quran_reciters.json` — undefined → 1da63a8b5e197be8388666df451223c6a834b6ac
- `public/offline-content/v1/scholars.json` — undefined → 58e3314773a3168850d456c486e157133ba62b7e
- `public/offline-content/v1/stories.json` — undefined → e4573131467641bf6ecf9b97bc4dc35519867f85
- `public/offline-content/v1/surahs.json` — undefined → 4d92ad6c32b55901000a4679deec2bd3de611962
- `public/offline-content/v1/tafsir.json` — undefined → 906ddd3eb9dfdbb30f267043256c75e6300ab0b8
- `public/offline-content/v1/tawasheeh.json` — undefined → d7db77bb6573a234a2e8aeda192e8e7fb6266889
- `public/offline-content/v2/routes.json` — undefined → 3a9c74a235cd794eeacbf5905809b31fe34e9c4b
- `public/offline.html` — undefined → 54c789d38abf5ffe674b45086b030613c4133f87
- `public/quran/NOTICE.md` — undefined → 724198a3a77195de503333715c058ae4282f481c
- `public/quran/manifest.json` — undefined → 44aa4d6a9368925036de1e82ffd6e4d93afe18e1
- `public/quran/mushaf-hafs.json` — undefined → c381f7dd330bcf055ac1b85772d4468081a4b3aa
- `public/sw.js` — undefined → a3f450fac681e0356fefe919d0d46a26d43bdeb6
- `public/video/templates/calm.svg` — undefined → af7e2013042155c0b97742f8b594eadaa1733a2f
- `public/video/templates/dawn.svg` — undefined → b8ea5dbb0746a8ef8b171f84513ee90d0779db4d
- `public/video/templates/emerald.svg` — undefined → 7ee94659a843d025ca57d45d52bd2ab46968bf22
- `public/video/templates/gold.svg` — undefined → 2bd271e1d155f964835b9eb436bab93e0745b790
- `public/video/templates/kids-garden.svg` — undefined → e1cbac899ccf73171521ab4af9590843ee237a24
- `public/video/templates/kids-nature.svg` — undefined → 2a76d097d1c37c08f1e210d260410574e2331ad2
- `public/video/templates/kids-neighborhood.svg` — undefined → 7bc89fa5127f815eb96a6da602accc94d78659b8
- `public/video/templates/kids-workshop.svg` — undefined → 67935893c2dc7f8d14bf2a4c9b22d63dd4fb8dba
- `public/video/templates/night.svg` — undefined → 6c36312bb51736bed33644df164afecb7ef1b282
- `public/video/templates/paper.svg` — undefined → e64d12fd855cb59d7b1095d8f01d711538409506
- `public/video/templates/rose.svg` — undefined → d7a38daf4f6b540656435500715840fc94e567d7
- `scripts/cleanup-supabase-storage.mjs` — undefined → d961f6a975771184681698618abba9f705252ec6
- `scripts/ensure-ffmpeg.mjs` — undefined → 0130b13b09fa88090f66435698f7623eed84ecdd
- `scripts/export-offline-content.mjs` — undefined → 22cf34315d840b92ada7b57898a83e50949c506e
- `scripts/generate-arabic-voice.py` — undefined → cad5ab33cb41a0cd5179bdda400e486771547c52
- `scripts/generate-ci-build-report.mjs` — undefined → 205ed64e450de5816ce8f9d73e74767210ee7af1
- `scripts/import-youtube-takeout-native-facebook.mjs` — undefined → dfd272f7fb43a0fc323755901821d78ead2493e8
- `scripts/jobs/admin-queue-alerts.ts` — undefined → 9276adf01706033e256fc35150f6be27fbb58d79
- `scripts/jobs/audit-video-media.ts` — undefined → fca75457ab30cfa03de818ea7ef257976484a90d
- `scripts/jobs/backfill-legacy-video-qa.ts` — undefined → 92a06788f701b8ba04cc5bb7cd719382a1357eb7
- `scripts/jobs/content-publishing.ts` — undefined → 7927e0cd9aaf38b852e7415e2b09d32960f31127
- `scripts/jobs/hf-space-video.py` — undefined → b7a39a1f362fa8e629d7534a7eb3d16942a20ad8
- `scripts/jobs/social-publishing.ts` — undefined → 0dc93ad17b2dc0edca8d34acda974f6ea901a3d3
- `scripts/jobs/template-video-automation.ts` — undefined → ace90ad404583016cdb1c29d438a16d9067be155
- `scripts/jobs/written-content-automation.ts` — undefined → 18d0ddd89d6217f648c6bbb3ca96afa689144e5a
- `scripts/platform-route-baseline.mjs` — undefined → 6b4154bde4021d8de483431c97cae5b1948956b4
- `scripts/prepare-mobile-assets.mjs` — undefined → fa6645b4db4299cfe4e9d931363d4e0403d8babc
- `scripts/reconcile-supabase-migration-history.sh` — undefined → 011dbb9aa20f68dc56f6232fa703138829356e63
- `scripts/restore-quran-tafsir.sh` — undefined → 4854757f40e1d756b408efc0e79799cf9ac2afac
- `scripts/run-background-jobs.ts` — undefined → ac887a0b6c11d7a8ccf40f6f56ad5beb8b2554c0
- `scripts/sync-hadith-english.ts` — undefined → 65dfff951e811a2ca9fb5aff9d8221c7419a4f7d
- `scripts/tests/admin-rbac-rls.test.mjs` — undefined → 42a79e6e2299de19b034b4dc1d76145c024a9e9a
- `scripts/tests/admin-role-update.integration-setup.sql` — undefined → 65c06e199feb825c087dd0053dca59de5cdefc30
- `scripts/tests/admin-role-update.integration.sh` — undefined → 30f2f9ba7e93b23be788e15d39f39747f8de279e
- `scripts/tests/admin-role-update.integration.sql` — undefined → ef02540db36d52d2665832cc1f90d2a6dec3225a
- `scripts/tests/app-update-download.test.ts` — undefined → 22780ac087802583ccc175dfe1880e56dc010963
- `scripts/tests/arabic-search-normalization.test.ts` — undefined → 7cf16cb932a0dd5815cc30e23f39c710216eeab1
- `scripts/tests/auth-password-security.test.ts` — undefined → f84902513aff7714e768958bbfb2dba1644bdfc9
- `scripts/tests/background-job-outcome.test.ts` — undefined → f0f1a1af5c491f50f8b36ae1bfaf6e756f79eb39
- `scripts/tests/contact-validation.test.ts` — undefined → 745b37c03a34ff717131daf07750a248e4bd37d4
- `scripts/tests/detail-route-streaming-fallback.test.mjs` — undefined → c14ce36410d093eb68d87c0b39253bd546f850dd
- `scripts/tests/facebook-reels-insights.test.ts` — undefined → 18a236603a67f84331fcc3aa2a16939e8efa1769
- `scripts/tests/facebook-reels-rate-limit.test.ts` — undefined → 67adf4019dc5256bf86c179d2b43dbf139f8e007
- `scripts/tests/ga4-analytics-contract.test.mjs` — undefined → b109a234e234f1773d686130248f4177a27ba2fd
- `scripts/tests/hadith-localization.test.ts` — undefined → 0242f4c041eea7959bb599ec5cdc739145d807dd
- `scripts/tests/kids-action-games-localization.test.ts` — undefined → 88f974c8a73465d6842006ad4754134194fcf598
- `scripts/tests/kids-asset-manifest.test.ts` — undefined → 6590c12d9e551b0ee29f2ebe828df3f5f0235bb5
- `scripts/tests/kids-content-manifest.test.ts` — undefined → 67656de7b0bfe2cf9922287b8ad42380d856351a
- `scripts/tests/kids-game-db-trigger.integration-setup.sql` — undefined → fc26b87084e81d4406957e08d25d7b810990142e
- `scripts/tests/kids-game-db-trigger.integration.sh` — undefined → 61b2cd4a98ba1a873c2c4770bb137d12b0a445e3
- `scripts/tests/kids-game-db-trigger.integration.sql` — undefined → 6f9141fbcdd155869ece60986808b3cf7cf8b4d1
- `scripts/tests/kids-game-result-validation.test.ts` — undefined → 2a2bbc78e1d39120688111856990d2fe5f39629d
- `scripts/tests/kids-game-runtime-contract.test.ts` — undefined → b2662b018addf2614c9f277869b1a9622df77bd1
- `scripts/tests/kids-gameplay-difficulty.test.ts` — undefined → 819f6bae32a2811cc4f1b1bd66b7e63e0dd36913
- `scripts/tests/kids-navigation.test.ts` — undefined → bd36605bfb8f6bd094aee65e95a63bee9589ebbd
- `scripts/tests/kids-timeout-safety.test.ts` — undefined → 3ad90432b284524d6e2b54154cfa1d9c7b0180ed
- `scripts/tests/kids-video-series.test.ts` — undefined → 0e67cf715ec5cdd274772af60cf08e9df6a72c60
- `scripts/tests/kids-visual-contract.test.ts` — undefined → 775d4f48b89d1151103633f5e04a846ce195d274
- `scripts/tests/loading-fallback-server-component.test.ts` — undefined → ff462f63105cf47e3de6874aa5ba401ac99ef020
- `scripts/tests/native-google-oauth-contract.test.mjs` — undefined → 9be9a8d7e2cd2061f4b6703726304b96d954491d
- `scripts/tests/performance-index-contract.test.mjs` — undefined → 79af5a20183a9b496794e8736f4627814cffca03
- `scripts/tests/phase21-games.test.ts` — undefined → 8e7dc563bd1569e1d72bef8a333cfc233020107b
- `scripts/tests/prayer-times.test.ts` — undefined → 3785d64b84b558e01222bd88f1d45c322179ba87
- `scripts/tests/production-smoke-contract.test.ts` — undefined → b4326b03a175ff58066ce39564b61370d501a413
- `scripts/tests/release-documentation.test.mjs` — undefined → de00f97d7951906d0941cacb33cb1f54f071e13d
- `scripts/tests/schema-contract.test.ts` — undefined → cbc7e6ca09c89eece4572cc3c87d3ed52bc6bcde
- `scripts/tests/search-index-contract.test.ts` — undefined → b888afad421d8567cd62c298f17ecd1c6e0c0071
- `scripts/tests/social-deletion.test.ts` — undefined → 353ead97b02efafa7cbfbb8d8a0e76cc0db6ed1f
- `scripts/tests/social-platform-isolation.test.ts` — undefined → 69c7566975e6b2d81321fb15f82574b3034f4416
- `scripts/tests/social-post-insights-storage.test.ts` — undefined → 9e502922987c980b2905a28304d14fb8ecedb897
- `scripts/tests/social-published-video-cleanup.test.ts` — undefined → 418c869ccf371c8304198a9ef1d834135d67db05
- `scripts/tests/social-queue-selection.test.ts` — undefined → aafffca182378573f05c8dd764da6d26f9e97ebc
- `scripts/tests/storage-retention.test.mjs` — undefined → 7152f91cced856a36ea7d2f5f6a806b0bfa27d3c
- `scripts/tests/traffic-revenue-contract.test.mjs` — undefined → ccc5f2c623f8b2795d15f3214d012eac9d1a4e18
- `scripts/tests/traffic-revenue-observability.test.ts` — undefined → ca21742db822eac30dec1a1f2678a6bd27dc39ee
- `scripts/tests/video-composition.test.ts` — undefined → 15a44c294f8202c50811c8e33c28e5b548933f2e
- `scripts/tests/video-contract.test.ts` — undefined → a581e4750213ecd0e52fa430f55f8dc2062e7b8d
- `scripts/tests/video-creative-variation.test.ts` — undefined → 6fac6d6ad293469c2b5251c8382a384521683122
- `scripts/tests/video-custom-provider-registry.test.ts` — undefined → da0c36b55c9a7bf1d3195c8289509a26e8a82275
- `scripts/tests/video-publish-approval.test.ts` — undefined → f19d36b22aa81cd682c387e13b22cda21fdf3815
- `scripts/tests/video-purge-contract.test.mjs` — undefined → 80df151dd0d953be1504134abb659bf1af56b8d6
- `scripts/tests/video-route-cache.test.ts` — undefined → 52b3cc54e43942deb94aec32e27ad92199422dc9
- `scripts/tests/video-template-studio.test.ts` — undefined → a8a524ef6d1ffd2f9a36e945cd9bb60de5167e44
- `scripts/tests/written-content-automation.test.ts` — undefined → 8ee57c72c339617dc1995c8d3f546bbde083662e
- `scripts/tests/youtube-analytics-contract.test.mjs` — undefined → 873eb52abb542b8449aad4103f457f38aab1d10e
- `scripts/tests/youtube-oauth-credentials.test.ts` — undefined → 874ce273f0f17b21a712cba8ec4a127bf4df8580
- `scripts/tests/youtube-publishing-health.test.ts` — undefined → 87000d586353803f367a97aaebd73c3f63f8d462
- `scripts/translate-published-articles-en.ts` — undefined → 0a8e1c2ee0cad5cbbeed7515f1fb715c4e1a45f8
- `scripts/validate-deployment-env.mjs` — undefined → 013c9872ad2f144f4d888c7c03b8e97c40114782
- `scripts/validate-migrations.mjs` — undefined → 10c510ad49a48b2ef58adbf43ae4a96fdabdd37d
- `scripts/verify-admin-api-guards.mjs` — undefined → f67c338406aa0cfeed4d8ea57cfdac97cad6f669
- `scripts/verify-admin-architecture.mjs` — undefined → 0ded020e4b4fb676eab23a35a3281e6ff3712635
- `scripts/verify-admin-governance.mjs` — undefined → beb435797d48dcae68a457e9cfce32af7bc27b5f
- `scripts/verify-admin-health.mjs` — undefined → be2f18620b05a512e829ad4c05f7ebb2c71f4775
- `scripts/verify-admin-module-registry.ts` — undefined → 59783953964497de48ca60b996b4db039cd6cfe9
- `scripts/verify-admin-pages.mjs` — undefined → 12b7162a601e6e8990635fc3e0a533ae5da1c68c
- `scripts/verify-admin-video-factory.mjs` — undefined → f33f6b007334b99977ff4d3d277eed5409421b6f
- `scripts/verify-adsense-readiness.mjs` — undefined → 3a55a33ba127d327eef1aba7364f53247dc299f1
- `scripts/verify-ai-visual-factory.mjs` — undefined → c4767e23f437cb24b0cbbfdbe5529623ea208d68
- `scripts/verify-arabic-search.mjs` — undefined → 6904d030aecbe15927ee526739acd9fe904fe62b
- `scripts/verify-auth-config.mjs` — undefined → ac788fef566da7052e515da13139d21d0ba53d71
- `scripts/verify-canonical-config.mjs` — undefined → 49a0200282643c27fadcbca2689199e872938678
- `scripts/verify-ci-architecture.mjs` — undefined → 74d0abc04101064d7f01db471b7d179dcfdb626f
- `scripts/verify-consent-mode.mjs` — undefined → d4501aaee6d3fa7db40bebc3c8b6489d37b6eebb
- `scripts/verify-content-canonicalization.mjs` — undefined → e8004a318d4e30874a2bcf903454a927181818ce
- `scripts/verify-content-integrity.mjs` — undefined → b3ac203367907b9fa48716cda87bf95a0b4958e4
- `scripts/verify-data-lifecycle.mjs` — undefined → 5a49ee796c5bd804a84634a10fb8923b69fbe92a
- `scripts/verify-error-boundaries.mjs` — undefined → 2b3e1ae30f26fa5e2ed32b474022accdc459e426
- `scripts/verify-gemini-audio.ts` — undefined → 23ede7278358b2ac244661ea95722e6bc5e8bb8b
- `scripts/verify-generated-supabase-types.mjs` — undefined → 7082aaf11ba34e01ad731cb575445b01220993ae
- `scripts/verify-google-search-console.mjs` — undefined → 6ccbd2db8ef00e62d9a038d4516dd644fcbf25eb
- `scripts/verify-hygiene.mjs` — undefined → f8d5e0291a10bcfaa10760d7f4943e2d7759a410
- `scripts/verify-image-assets.mjs` — undefined → bddbe9b578fca7044ab352c3ea45ecefaf8cc771
- `scripts/verify-information-architecture.mjs` — undefined → 7b5dca9efeacd3629e01f9926a4100fc9d54bb36
- `scripts/verify-kids-analytics.mjs` — undefined → 13c19cfc5463701fbbc86d50b09f41db83193929
- `scripts/verify-kids-games-final.ts` — undefined → e7b1a2b173c7a857fd8e81e106d1bbcda507a624
- `scripts/verify-kids-hilal-fly.ts` — undefined → 31fd8604a161df99e7aab91ca1f8d86c59004d17
- `scripts/verify-kids-memory.ts` — undefined → be7052f18210c813d02f574332761908cc908e3a
- `scripts/verify-kids-mosque-adventure.ts` — undefined → f4d4b1dbecc16499079451abbc6dbc2da9062a75
- `scripts/verify-kids-production.mjs` — undefined → f875744dc8b4721761b4931a674dc6e17d353a0d
- `scripts/verify-kids-quiz.ts` — undefined → dea51b42e7f1c40fad22552de607f875e5649fcf
- `scripts/verify-kids-verse.ts` — undefined → 7bc7f2855bb929467950aaff058160a8ec84f3ec
- `scripts/verify-kids-video-factory.mjs` — undefined → b7929905b2a1216e217064eb14885264eb73d56b
- `scripts/verify-kids-wudu.ts` — undefined → 5c1c271c1185f2c7f0c528993b1c9f0bb756f776
- `scripts/verify-kids-zikr-jump.ts` — undefined → b4d8a3cc0cb469afd1368a061772c79b94b3593b
- `scripts/verify-kids-zikr-road.ts` — undefined → 4e864c83f0e581261e14ce8af237fbfa54ab62c4
- `scripts/verify-local-imports.mjs` — undefined → 9209b24d7aee4320e6d678f9682784e835783d81
- `scripts/verify-local-quran.mjs` — undefined → 32ce2db07e7f12fd62d3821b83b3d79813c299c2
- `scripts/verify-migration-duplicates.mjs` — undefined → 63d2ea185b6f26a3e388c3df9a19bcca09672213
- `scripts/verify-mobile-navigation.mjs` — undefined → d87825069ff937d5eeb827f3d0b48218276072d1
- `scripts/verify-mobile-readiness.mjs` — undefined → bf1b648334ea02dab63925394cdff297a2c856b5
- `scripts/verify-offline-content.mjs` — undefined → c191b354970b170a17bdd861ed37bd0aea4a4c74
- `scripts/verify-placeholder-media.mjs` — undefined → 36c974fe275f4abe1fed8157e304b8bccf4c8769
- `scripts/verify-platform-routes.mjs` — undefined → f2963dcb8ff3c51c29a1655000f41ce4cf4190ff
- `scripts/verify-private-table-grants.mjs` — undefined → 401bd1d87a944d0d4eb0333c053e341defa6e8db
- `scripts/verify-production-smoke.mjs` — undefined → 11612184e8cc842a4c783f695640a2f96723f590
- `scripts/verify-project-integrity.mjs` — undefined → e561784007c576ec9a5d6c8cd4aa652619d6fcc7
- `scripts/verify-quran-canonicalization.mjs` — undefined → bb1b8c077c216587cc59d3a8a3188acdd3fbfd09
- `scripts/verify-quran-offline.mjs` — undefined → 4c020e61392bf694e338251b67d3dc34162393ea
- `scripts/verify-quran-tafsir-backfill.mjs` — undefined → 8b56523cb7036c1c80c58fe7a7eb8f60d4e29da1
- `scripts/verify-release-contract.mjs` — undefined → 5bfce0e758961e90c742d661cd1c68daf9801b0d
- `scripts/verify-release-metadata.mjs` — undefined → ee429174ad92f52a98b82e52c8dd3d0c522085b1
- `scripts/verify-scheduler.mjs` — undefined → 98947c58a072cd7259dc8fda4226b013fbc43dd0
- `scripts/verify-security-hardening.mjs` — undefined → 90c0d1ac9a9ae5f427e12289283a40d06ee40b68
- `scripts/verify-social-publishing.mjs` — undefined → 5a3a15d9daa3de1bba952dad9e207c1443be12cd
- `scripts/verify-supabase-db-url.py` — undefined → de77f36443abfa526a871569ee8f4bc5960273f0
- `scripts/verify-supabase-production.mjs` — undefined → 416ffa9e35c73a5aacf317c3fe3509dd853ec31f
- `scripts/verify-video-factory.mjs` — undefined → a597ff8c8d18234e69ddf513d428d8ac719685cc
- `scripts/verify-video-media-audit.mjs` — undefined → 34c818eaf89bb0b7d24a8af41f574a3758e75c7a
- `scripts/verify-video-qa-backfill.mjs` — undefined → 2045b063d38979f2f61dbe6434b31407a0a66d5f
- `scripts/verify-video-qa.mjs` — undefined → 7c8f718a1c07918a585c926d6170b8020198b9df
- `scripts/verify-video-queue-priority.mjs` — undefined → cf285009886a22b3efbb4ce782e8f01678eb2422
- `scripts/verify-voice-factory.mjs` — undefined → c8ed24a9e914b99cc575b286a3975a5f698e22eb
- `scripts/video-engine-check.mjs` — undefined → c7dc9156901847f4b7666ead969b0f1c4aee2040
- `src/app/.well-known/apple-app-site-association/route.ts` — undefined → bcfba9e3bce9eda5958e9d8d76dae231528385d3
- `src/app/.well-known/assetlinks.json/route.ts` — undefined → 2cf8455fe6f3f150b07d95066bf3b5ff717ca354
- `src/app/about/loading.tsx` — undefined → bb114e9d2b72c6daabc038c781644111af0d5c3e
- `src/app/about/page.tsx` — undefined → fea42fab8caa6161db72b07600d4255cfbfed58a
- `src/app/adhkar/error.tsx` — undefined → f02d39a77c120a15d79b0bd1206692a032f528a8
- `src/app/adhkar/layout.tsx` — undefined → bf8396dc9c29de8bcfe8a6db3e5fe52be92f1c4c
- `src/app/adhkar/loading.tsx` — undefined → 11534ee1374e7ffda03003ac098857aec3d9013f
- `src/app/adhkar/page.tsx` — undefined → 37a1deb5ecd41c2e530ac2f711f8a4e3e7799804
- `src/app/admin/ai-video/curated/page.tsx` — undefined → bde5df5b88293820393c536db022fda5a6460caf
- `src/app/admin/ai-video/page.tsx` — undefined → 00cd354dae6ada7ea77fa72b5a7265b945a52033
- `src/app/admin/alerts/page.tsx` — undefined → 96b928075422645eabd0ea74e2d11616b11e2565
- `src/app/admin/analytics/analytics-dashboard.tsx` — undefined → 4afd770b661d675a400f85afdcf06d3c50e4bb5d
- `src/app/admin/analytics/page.tsx` — undefined → 440d15008c742a1681f5160bf8e8baeef9688a40
- `src/app/admin/android/actions.ts` — undefined → 4cd3b3a27441777d8172d6254e748c0280efb693
- `src/app/admin/android/page.tsx` — undefined → b410f1105e0a42fca665b7589930018d892f7648
- `src/app/admin/audio/adhan/page.tsx` — undefined → a656a99eeccbfedab60833d8311177cb8f38f4bb
- `src/app/admin/audio/page.tsx` — undefined → f7b950c8670a499726b36e1e40e42b06d145f120
- `src/app/admin/audio/quran/page.tsx` — undefined → e600c14143a376d3fc86f6b586ac2f177a8f1fdb
- `src/app/admin/audio/site-audio/page.tsx` — undefined → 1dcad06f6a1bef6cac9d8c4ee38e4f4c2ed72c40
- `src/app/admin/audio/tts/page.tsx` — undefined → f171629b7b3b20fadf78d2cdf390492bec4b4199
- `src/app/admin/audit/page.tsx` — undefined → d96053a4441c31b046f8d389df6bfb49b92a2d47
- `src/app/admin/automation/page.tsx` — undefined → 7325b5e39399525698309ef328d86396bf500a3c
- `src/app/admin/battles/page.tsx` — undefined → 98eaaff3bd04a4e6b4352ac0cba8edeb1eb95f20
- `src/app/admin/categories/actions.ts` — undefined → ccc3151223ab4614d61df0021896052ebec74808
- `src/app/admin/categories/page.tsx` — undefined → 80cc2bf26438e0d0a23b85bef9822eea727785f9
- `src/app/admin/content-actions.ts` — undefined → 0a2ab5c8dccef35bccf2f4991362400e6eaf2cf6
- `src/app/admin/content/content-console.tsx` — undefined → ecacd0e3705c0ec692886d7ea35d1efda6fe17b5
- `src/app/admin/content/page.tsx` — undefined → 06b8ad4b712a46f135742bcc2395f50ff0fd2c58
- `src/app/admin/control/page.tsx` — undefined → 95f9fe6aed561844a94fc60944c9e0e0d185c10b
- `src/app/admin/editorial-actions.ts` — undefined → cf13f4fc9d56471fcb14e9b9a51e291f000e7c69
- `src/app/admin/editorial/page.tsx` — undefined → 6999a48f970afae670a853ac1cb54213485e6153
- `src/app/admin/error.tsx` — undefined → 6869c2c5002b1de60bf7596a3655ccebea98b30e
- `src/app/admin/health/page.tsx` — undefined → 03631257fe29f89da93e8162235b1a3c5d4a0e70
- `src/app/admin/kids/actions.ts` — undefined → a806028beae860d3f4fe2e4802ba32b15e757134
- `src/app/admin/kids/analytics/page.tsx` — undefined → 87719401fd66a512b6e36eda5fb9a935e46c90ee
- `src/app/admin/kids/assets/page.tsx` — undefined → 71a33f113961da5c827836a567caede3c6894e46
- `src/app/admin/kids/content/page.tsx` — undefined → 9de3fed78d63bf33313a7045cb95ed63386a4785
- `src/app/admin/kids/games/page.tsx` — undefined → 5a864ea37790a312b2430546aff2052460f4ea93
- `src/app/admin/kids/levels/page.tsx` — undefined → d8430aac906c5046cc433ed505293fde334ec606
- `src/app/admin/kids/page.tsx` — undefined → bc1fbc1187da59296159cd2175352f47a42fe54c
- `src/app/admin/knowledge/actions.ts` — undefined → 6f02a030ea4767996346960b29d507cd2a35fee1
- `src/app/admin/knowledge/page.tsx` — undefined → 8e1242efa7b3c0260e8144d3945b18706945adde
- `src/app/admin/layout.tsx` — undefined → 90f8f216396cab88de8e3cdae6402117b04906d7
- `src/app/admin/library/page.tsx` — undefined → ee0a8a38608d550267b4d628d7ca7a48f7ebd263
- `src/app/admin/loading.tsx` — undefined → eaceb778c0cba3d885cddc2c26337e0d4012e74c
- `src/app/admin/media/media-client.tsx` — undefined → 77c20af1f853388b955395dfaa122127aa51a5fc
- `src/app/admin/media/page.tsx` — undefined → f50e73fd09cb353ab4cb53608ce81248880a8776
- `src/app/admin/memory/page.tsx` — undefined → e2ee32e743f55d7098b5bba5af06260e809d9451
- `src/app/admin/not-found.tsx` — undefined → 65389d3bb4bb26e6439ce6c1389b9ca7d183d370
- `src/app/admin/notifications/page.tsx` — undefined → 894d84c8ed9c1e26451a48c582d68ac3937c267e
- `src/app/admin/page.tsx` — undefined → 207f45c0f3a9ae9fec33c2283a5262a62df309f8
- `src/app/admin/prophets/page.tsx` — undefined → 731cf13e5f7c38c333bebbb079748514b3a8b247
- `src/app/admin/queues/page.tsx` — undefined → 098c21ac3c46b37b05dc50b5ffdd4ba3a8c2707a
- `src/app/admin/release/actions.ts` — undefined → 1bbe02ba878563a41a8920643d0cf315b56b2798
- `src/app/admin/release/page.tsx` — undefined → 109ba2fd5be1da5e3752ead0b048fcf719e98fff
- `src/app/admin/search/page.tsx` — undefined → 1baf59124c945b383f887f8e568e809f0581b5f4
- `src/app/admin/sections/page.tsx` — undefined → ad6fb5372ec682a30e0ceaff244cd0cf22cd7404
- `src/app/admin/sections/sections-client.tsx` — undefined → d8014ecc35177b82aa09e6026b0730018c04ff15
- `src/app/admin/security/page.tsx` — undefined → 2cdb61aa2b8e497ef8b89053f3a1f62cc1786075
- `src/app/admin/security/step-up/page.tsx` — undefined → 4cbd0107e51600a5d33c4da2be0255ba40ca8c47
- `src/app/admin/seo/actions.ts` — undefined → ad09fe08e2f7479b9bf28b57407a349450997d39
- `src/app/admin/seo/page.tsx` — undefined → 7abd2de62e641a87ceaa6a8fdb9f63a8bdb4a04b
- `src/app/admin/settings/page.tsx` — undefined → bed57d98d14bac87e55885ae4b2b2b931e50bc54
- `src/app/admin/site-audio/page.tsx` — undefined → 553f11fddc72a4a9f04b400cf374e9fb736d3a18
- `src/app/admin/social/page.tsx` — undefined → 5eea0e4bbaa91294ea3a31dbdf2b54f01a2d7d17
- `src/app/admin/social/social-client.tsx` — undefined → 202884bc0f0065802c2f9b161d5193c5fc91528e
- `src/app/admin/social/written-studio/page.tsx` — undefined → b20163eb56a4b5c352df928426e03243ab2a34a2
- `src/app/admin/social/written-studio/written-studio-client.tsx` — undefined → be039fbb618ed5ef3af704191a8439153c0b23f4
- `src/app/admin/social/youtube-import/page.tsx` — undefined → e516d2e38bffd3b68020276fdd59392311ab5116
- `src/app/admin/sources/page.tsx` — undefined → f0193177781c22f141065f115d62e271f2d165e4
- `src/app/admin/system-actions.ts` — undefined → 84a9ced3d4e7afd74f67ef7ee6ec554c97b73fbe
- `src/app/admin/users/page.tsx` — undefined → db33450ad9a0bcc9af0576823dc51d765248c2c1
- `src/app/admin/video-factory/page.tsx` — undefined → 47f0dce7a31adba009e92fd47ad43161cbe893f0
- `src/app/admin/video-factory/publishing/page.tsx` — undefined → 016ce0dc36edeef7c49f2211ec9bee631c0a4744
- `src/app/admin/video-factory/qa/page.tsx` — undefined → 1afead64ee6efad2e69a3932fbdff7979ebf94f8
- `src/app/admin/video-factory/queue/page.tsx` — undefined → 7e36ae1aecd3364db2d7e6ecb71f18447070f2dc
- `src/app/admin/video-factory/scheduler/page.tsx` — undefined → 7cdb28535efec11fc6590b352be302d4b42eb631
- `src/app/admin/video-factory/scripts/page.tsx` — undefined → 3e292c1f7aff087e00707817ddb24f8bff3c3302
- `src/app/admin/video-factory/sources/page.tsx` — undefined → a1e9b20cc81e9fc24017d88b1f75af1f4ffd6abc
- `src/app/admin/video-factory/templates/page.tsx` — undefined → 2d5807dd2d735508b29a8abfb80d4b23cf54a7ff
- `src/app/admin/video-factory/visuals/page.tsx` — undefined → b33d83f8474c92713e190e14779e55c92bdf81c4
- `src/app/admin/video-factory/voices/page.tsx` — undefined → 2ed0823ec50c74fd9441a956199082b595847549
- `src/app/admin/video/page.tsx` — undefined → 07908f283b69c5298d652d35652a29488666e1f6
- `src/app/admin/video/qa/page.tsx` — undefined → 4d2dcccde4cfe0fe328f1884c44355e4e1dbd8bd
- `src/app/admin/video/requests/page.tsx` — undefined → ccc4e79e967a24b7cd966799677eb08602160f9e
- `src/app/admin/video/scripts/page.tsx` — undefined → 2c052215e247b5c7c604e5f8a73426dd1a41f9a0
- `src/app/admin/video/sources/page.tsx` — undefined → a577c01828164d73dcaf728f9355a354e107d973
- `src/app/admin/video/studio/curated/page.tsx` — undefined → 7c439d257a158823de62573fddc75cf1443e8a42
- `src/app/admin/video/studio/page.tsx` — undefined → 3622362e4d59e7bdbe28fc84709ad1a0c6d3832c
- `src/app/admin/video/templates/page.tsx` — undefined → f4be0e07a3a781ce4b29038f701a7187eb7747a7
- `src/app/admin/video/visuals/page.tsx` — undefined → 0b8f97441ff1a208c2e4a84d14525a1c6ef5a33c
- `src/app/admin/video/voices/page.tsx` — undefined → c96c8538d23e6980adf904b7edbf0fb4afd66741
- `src/app/admin/videos/page.tsx` — undefined → 56b26cd15a2f3f9b7cc6a6b9c48d5a875b31db08
- `src/app/api/admin/analytics/route.ts` — undefined → e0978b9c87a25868caf3aebf481596f52fa994a1
- `src/app/api/admin/cloudinary/image/route.ts` — undefined → da5c378938431a07080c3a51bef5c9463bd8f977
- `src/app/api/admin/content/route.ts` — undefined → f86bade38eac14acdce7e436c64cb5d83122e00d
- `src/app/api/admin/media/route.ts` — undefined → e8782436dfcaf0ebf5d6413a9c506e3bccfa691d
- `src/app/api/admin/overview/route.ts` — undefined → 822ea6a6b916ac1029177c94870997350266c17c
- `src/app/api/admin/page-view/route.ts` — undefined → a7a7598a5c859c967480197c98b33969c251d290
- `src/app/api/admin/sections/route.ts` — undefined → 633a62f2e4fb442ec10951ab13e24b47c3c26634
- `src/app/api/admin/site-audio/route.ts` — undefined → 0268fcbfbbdb73fa710f70dca0bdb94ca6932561
- `src/app/api/admin/site-audio/upload/route.ts` — undefined → f9cabf833a21f88ad45982dedb8596a67dc4873c
- `src/app/api/admin/social/facebook/callback/route.ts` — undefined → cbf4bdb07869e1c2e6095daf535f1ecae368966b
- `src/app/api/admin/social/facebook/connect/route.ts` — undefined → 0cbd3aa71de0fe1c32ac150aeb3a2690a711501c
- `src/app/api/admin/social/route.ts` — undefined → d4b28359635180f19c4422d36d9296c400982aee
- `src/app/api/admin/social/written/route.ts` — undefined → 3e2df5077b3537f2a5f096803b8ecfe65231f6cc
- `src/app/api/admin/social/youtube/callback/route.ts` — undefined → d7ea3581900a1153c739a25c369672e4dcb84d9e
- `src/app/api/admin/social/youtube/connect/route.ts` — undefined → 96ff826a4850267ff80e804616fe0f9339e902c0
- `src/app/api/admin/video-generation/narration-upload/route.ts` — undefined → 1121259939ce84b7efb31fcfae265e0f496832fd
- `src/app/api/admin/video-generation/route.ts` — undefined → 024348645056b9902b7ad121ffa01332632448a3
- `src/app/api/admin/video-generation/sources/route.ts` — undefined → d12c2b63cfd0c4dc09a0dcd457a360bc90fb3176
- `src/app/api/admin/video-purge/route.ts` — undefined → 5f074ed7cd02794d9942381783e7baef82b66e2c
- `src/app/api/admin/video/templates/route.ts` — undefined → 24fdc5749bc6500307abc8b2da5061768bfb1f15
- `src/app/api/admin/videos/[id]/retry/route.ts` — undefined → b5540ca786f9d3ee84be47218416b32b252e227c
- `src/app/api/admin/videos/[id]/route.ts` — undefined → 763c14d2c73fe27fbb890367499728b1f9814ecd
- `src/app/api/admin/videos/create/route.ts` — undefined → 76708508ed6d73076daef2af0a2ec7d1ca1375dc
- `src/app/api/admin/videos/route.ts` — undefined → 8f340c497bfb67b8b511d794d887766f84bb20ba
- `src/app/api/admin/videos/upload/route.ts` — undefined → 21db1ef07f2b34c31287ab2bbd5951eef0c14ceb
- `src/app/api/admin/youtube-facebook/register-media/route.ts` — undefined → fee44261f8d26efa8d83b4e2e46a423c6fb2d816
- `src/app/api/admin/youtube-facebook/upload-url/route.ts` — undefined → fee44261f8d26efa8d83b4e2e46a423c6fb2d816
- `src/app/api/app-version/route.ts` — undefined → d118182eabe96dbe764b971627aa2f9621081656
- `src/app/api/auth/profile-sync/route.ts` — undefined → 99381ab824a23dec5d5010b377848f4c7aaae1f8
- `src/app/api/contact/route.ts` — undefined → 079808fb1b7c0113b9f210a6ec648711337e65b2
- `src/app/api/content/articles/route.ts` — undefined → 9415cbeb176e1351845d3d59454bc94b5f1193ab
- `src/app/api/content/companions/route.ts` — undefined → 05a693593c369e87382fbfce524f87f7c72d2f17
- `src/app/api/content/prophets/route.ts` — undefined → dadeb60e8057bce6d89a0ecbf72c3cad3f550c58
- `src/app/api/content/stats/route.ts` — undefined → f12094e572ef180551407ca7ba8cea1548c0bfd4
- `src/app/api/content/stories/route.ts` — undefined → 1f712079e6e6ccfea8ae9ac3129e29c9a0d15ed6
- `src/app/api/content/videos/[slug]/route.ts` — undefined → f90c2a750e3a7f22b1b00df5f09fb141e783914b
- `src/app/api/download/android/aab/route.ts` — undefined → 4ff2dc7f917839f181ffd3c47ca386ec28777b0b
- `src/app/api/download/android/route.ts` — undefined → f24e44d4f2c75fb406f18ac5ba09ce5316d23845
- `src/app/api/duas/categories/route.ts` — undefined → abc51f700b7365916db1203c37bb9b54304ba5f4
- `src/app/api/duas/route.ts` — undefined → 069c85d31c710986820fb7cfa89e5c82b76dd9c6
- `src/app/api/geocode/reverse/route.ts` — undefined → ea04a42a6a36d12ea844b45aff1df5a5fb4f7446
- `src/app/api/hadith/books/route.ts` — undefined → 511bc9b7713446fc7e15913e2cab4f7211189e32
- `src/app/api/health/route.ts` — undefined → 94411332c3ebe8736dbaf59f56ecb1a76d1ca6a4
- `src/app/api/internal/youtube-facebook/cleanup-media/route.ts` — undefined → bc7ce7912cefdb21e9af3e9d67291d8357135e81
- `src/app/api/kids/content/[slug]/route.ts` — undefined → f77791e73e0aa0bb4c43d263781410b9275edf96
- `src/app/api/kids/content/route.ts` — undefined → 6423406c7bb17c20b36f7d8e4e84ac1f8bb053e9
- `src/app/api/kids/games/achievements/route.ts` — undefined → 4e909812422ac6ebf16cbde7a9e305f009099902
- `src/app/api/kids/games/progress/route.ts` — undefined → 82f5977b9235af1d9a25d553867883a85f01152b
- `src/app/api/kids/games/score/route.ts` — undefined → 4a2ac30fbcf13b92272227856224294621e295eb
- `src/app/api/kids/games/submit-result/route.ts` — undefined → 86d5ff2cdf31984c4d8912c448c877c78cdb60af
- `src/app/api/kids/games/validate/route.ts` — undefined → 5e5ae18dafdb6e44310427b353984d6421648784
- `src/app/api/kids/games/verse/route.ts` — undefined → 4235ccc54b9d5a4dd226ba007048cc4cb26ab9c5
- `src/app/api/kids/track-share/route.ts` — undefined → 33c5a14eef0217558f709d089cf8b9b88424f98e
- `src/app/api/kids/videos/route.ts` — undefined → ea747de73e0b5a15cd1d5bd996d2e88a10f63465
- `src/app/api/poetry-insight/route.ts` — undefined → 91fd2ff40eb079822f8f10094a03a58dc44e72f4
- `src/app/api/prayer-location/route.ts` — undefined → 4ad2f87f932fb096d3cf95fce21e7b97dd03cc97
- `src/app/api/prayer-times/route.ts` — undefined → 30e1c0eae8c53d69f6f7255c3e19e3d1d5374e44
- `src/app/api/push/public-key/route.ts` — undefined → d84a25ccef96899506a992d6d63ba24ecab9295b
- `src/app/api/push/subscription/route.ts` — undefined → 7ed990ad45b0d4d0816901c8af3925a5660df70c
- `src/app/api/quran/audio/route.ts` — undefined → 631890aeff643b2a343521afb1f2d34085e6877d
- `src/app/api/quran/reciters/route.ts` — undefined → 1c8a90cf737d6fd022eacf74959402db7146e93b
- `src/app/api/quran/surahs/route.ts` — undefined → d166bf350d55260be5acd243dc7b0de4e8e3a35b
- `src/app/api/reminders/background/route.ts` — undefined → f906042cda9faf39dfa47492199a81570b8b86eb
- `src/app/api/search/route.ts` — undefined → 0167701f3bab2af743517f7f030f4ce06bc1803e
- `src/app/api/site-audio/route.ts` — undefined → 13e55808dabd8e5960d52eac4cc45fe0dca10d8f
- `src/app/api/site-settings/route.ts` — undefined → 3b0581489eae19f968bd140283237189462ddeb1
- `src/app/api/storage/presign/route.ts` — undefined → 587d906e56da07164cb677d3c07d4bf9a8d17aac
- `src/app/api/tawasheeh/categories/route.ts` — undefined → 618ef2fb968d632fa95260cdced987f031a48870
- `src/app/api/tawasheeh/route.ts` — undefined → b6588fcf278fadd4d13b687bdeaa3583d2068658
- `src/app/api/user/favorites/route.ts` — undefined → 01d003065a112924ea64d8c06576ef5a0b24ef1f
- `src/app/api/user/notifications/route.ts` — undefined → 790a9f207fd83ce673b0bcd816161b0108524e83
- `src/app/api/user/profile/route.ts` — undefined → 73715d7b28a55c087e9b64e66ec2e52759c546b4
- `src/app/api/videos/[videoId]/like/route.ts` — undefined → ab8681830ca8946bc769773e3c301a8a52b7f214
- `src/app/articles/[slug]/layout.tsx` — undefined → e4cc72d28a8569f339cf2da9d3dc0b831ed370de
- `src/app/articles/[slug]/page.tsx` — undefined → a5a94ac3a7a699c76d50d53dddd2336cd7175a7d
- `src/app/articles/error.tsx` — undefined → b767785d1b8a00352f62cee8e5848ca84d2a99b1
- `src/app/articles/loading.tsx` — undefined → 964d738d0636b9a380d323c8c9a3b45d26f3acd2
- `src/app/articles/page.tsx` — undefined → 225b1d42e982ebaec93ac817c134a0be06c370c4
- `src/app/audio/page.tsx` — undefined → 0eb6a47847b0a1df69d137341c9bd8aa2bf9229b
- `src/app/auth/actions.ts` — undefined → c0a43807ee4a288923247689bebb4040c2b990df
- `src/app/auth/callback/route.ts` — undefined → 037d5b8b041254f3b5639065f64336b9a62d5370
- `src/app/auth/forgot/page.tsx` — undefined → 1457dc3b79dab92c1bb57240ef095f46437629c4
- `src/app/auth/google/route.ts` — undefined → 0bb69bb65250de9cec84ef4aa811c4e154ce7957
- `src/app/auth/layout.tsx` — undefined → fcb9c8ce43597d87c48ce51e04ae6097a18f03ca
- `src/app/auth/login/page.tsx` — undefined → 3ea14ffef127bc69dfed86a472e0567c3c723f9d
- `src/app/auth/register/page.tsx` — undefined → 6d4f0de36dd384695c70f9d5200dba9b99c0fe1b
- `src/app/auth/reset/page.tsx` — undefined → 5f89c0c9cb2037aa8f26c80aebdbbad92b5522e7
- `src/app/battles/[slug]/page.tsx` — undefined → 8128f271d3e0d46cb3e8d8f291940b609a0f076e
- `src/app/battles/loading.tsx` — undefined → 267f2b03d3e650cd2b41020f233a1606bb6c7ac4
- `src/app/battles/page.tsx` — undefined → 2cf9528e1bcd1e97cee3b67f6945ba7e34c09980
- `src/app/companions/[slug]/page.tsx` — undefined → ad37acd70f1c0114db79cbba315eb995b640d3de
- `src/app/companions/loading.tsx` — undefined → dd6ca2e04361e7770db1bb7706270ce222166359
- `src/app/companions/page.tsx` — undefined → caf32a86e501ea9fd21123b462ff9f73ce940de4
- `src/app/competitions/loading.tsx` — undefined → d9ed600c4bb104c1f6e40f7458c3582dd5333bf9
- `src/app/competitions/page.tsx` — undefined → ab8e4010edb9adacf4d513fdd65a852a78ae63fe
- `src/app/conquests/[slug]/page.tsx` — undefined → de4aec62a12a6816e3513b893c52730b361e78ba
- `src/app/conquests/loading.tsx` — undefined → a012327ae7d589028658d37774129ea929a0b109
- `src/app/conquests/page.tsx` — undefined → 7f19c90ebe370b9815bbdd8f56c48c940065f17d
- `src/app/contact/layout.tsx` — undefined → e0b82ac67ba456e12ff20a57819485f291ce6e41
- `src/app/contact/loading.tsx` — undefined → 8b47c30145ba19169bd46536b1cacc085c3abd79
- `src/app/contact/page.tsx` — undefined → bb61cce62653f742f76b877ece2bf6676a556231
- `src/app/content/[slug]/page.tsx` — undefined → 3a42d37265bdff474bf2eb02a8951d9f44ec74b8
- `src/app/data-deletion/page.tsx` — undefined → d11f18f3563c31730c404c04d902901dd5e24b0f
- `src/app/dua/[slug]/layout.tsx` — undefined → f15b343232140e523764d14236134cb7f1d71088
- `src/app/dua/[slug]/page.tsx` — undefined → 97af35e60bb9e9d3202a9e21635a47291a98faee
- `src/app/dua/loading.tsx` — undefined → e893050e4cd9e893a4466401c73c001aa54c88fd
- `src/app/dua/page.tsx` — undefined → acfcb525618d6acb9d22533592b6f5ae446492d5
- `src/app/duas/page.tsx` — undefined → b1672ff2e4d15068a9e0d075591a10845a2c681d
- `src/app/editorial-policy/page.tsx` — undefined → 449556fa4d30d289fee572eccbc55e242ff9d044
- `src/app/error.tsx` — undefined → 74e580faa07cfcda1a5eb21ca1a0f0ff2eec6eb4
- `src/app/faq/layout.tsx` — undefined → eebc9faf27353025663193a828948180bb012cac
- `src/app/faq/loading.tsx` — undefined → 36b4e85370b74ea26924201af42d8e1e7e10c14b
- `src/app/faq/page.tsx` — undefined → f01c82ac50e36c6c9320de9e841d9c168f46f89f
- `src/app/favorites/actions.ts` — undefined → e3240fc7d3cfe9ffd526ffc65d5d210332965221
- `src/app/favorites/loading.tsx` — undefined → 0b1c63e9e9d42c17bdad8cd13ff7f5e35b78d4ed
- `src/app/favorites/page.tsx` — undefined → b59ecc1afe42d38f55a47e5c44e2e53fa55538ce
- `src/app/global-error.tsx` — undefined → 8591638c91c4065b3f4a267c67c12de55e48adf2
- `src/app/globals.css` — undefined → 4f250f90b0a2ede58dffa910b9a6789f46948398
- `src/app/hadith/[book]/[id]/page.tsx` — undefined → 9aaac3b6a600b3715ee56583f1ca01adf3d78dc4
- `src/app/hadith/[book]/page.tsx` — undefined → 8d8d35fc6f8c4f51775e6d446f77a788ad18c2bd
- `src/app/hadith/error.tsx` — undefined → 28a9cf7eb65664c4824941eedab325eea2dede22
- `src/app/hadith/loading.tsx` — undefined → d9cbf0c74ba298465bc209200172b712b9d5f366
- `src/app/hadith/page.tsx` — undefined → 3f429a793eba5b3a755b09e32fc9dd12cc37cd5c
- `src/app/kids/[slug]/layout.tsx` — undefined → e3dd114cbebdfdc3fbb05b859c4b2ed7a84577cf
- `src/app/kids/[slug]/page.tsx` — undefined → 892a61e46cb1063cd91c9f7e506e584a58212462
- `src/app/kids/achievements/page.tsx` — undefined → 41d772250dafb2036648134af8e334f013c06760
- `src/app/kids/adventures/layout.tsx` — undefined → 7a1f38218f61a096c326845ac917733383dc678b
- `src/app/kids/adventures/page.tsx` — undefined → 1e5157b15b050214a1d77e10ccdd2ef958447be6
- `src/app/kids/audio/page.tsx` — undefined → 589f2e4fbb1757d94c42018b7b1eeab19be2510b
- `src/app/kids/games/page.tsx` — undefined → a626d809da122db91daa5943baf7d5f38078094f
- `src/app/kids/layout.tsx` — undefined → 97c6b14a038284c7b913c99b3b2882de7000542b
- `src/app/kids/page.tsx` — undefined → 0a643f2af074bf964ee76867dee0ef0223a690f9
- `src/app/kids/parent-dashboard/page.tsx` — undefined → 0d2d5a61dc1bc009a1be182a50c8de0ab629774a
- `src/app/kids/progress/page.tsx` — undefined → 261a1e34c4c374bcd7dd15ad1816c5dd4295c99e
- `src/app/kids/puzzle/layout.tsx` — undefined → 1068f9ce9bb01b899c2aae67e161753aba105fb1
- `src/app/kids/puzzle/page.tsx` — undefined → ab8787321a72ae3a7bbdff1c54b8c8a0de73beb6
- `src/app/kids/videos/[slug]/page.tsx` — undefined → 709c4302436f8b10d27e932d9bd89d37daca4e15
- `src/app/kids/videos/page.tsx` — undefined → b93f4587e1082e5c232a257e101320ccf74b61d8
- `src/app/knowledge/page.tsx` — undefined → ce915754469d3b0d811a719e0ffbbafaea575800
- `src/app/layout.tsx` — undefined → c02d4a04d54ce8c9ad8bf524e92329236e5c721e
- `src/app/library/page.tsx` — undefined → 16f98e5a453a22df21f14ecb0e655b3450aaac89
- `src/app/llms.txt/route.ts` — undefined → 1ad6d8225766b6a9bce79443920d186d31842e8c
- `src/app/loading.tsx` — undefined → 5bc0c26c7782ec70732b9403f59f59ae59e8eb42
- `src/app/manifest.ts` — undefined → 0f29bbbbed70c28c7dce7f6e961a9aacb78b1217
- `src/app/memorization/actions.ts` — undefined → ec514a57f22ecc394cbb2d8e722442060a87444c
- `src/app/memorization/loading.tsx` — undefined → 54bca4c1d0eca222068e1318c220b910a1c0edd6
- `src/app/memorization/page.tsx` — undefined → d890a908223d82eea7cd0fa3939034b5be5990a6
- `src/app/memorization/progress-tracker.tsx` — undefined → f76681d3730c331e8259caed77a2fd3be358e331
- `src/app/memorization/voice-recorder.tsx` — undefined → 312110dc95bb8f4ab2784539d75659b96907ab5b
- `src/app/mushaf/page.tsx` — undefined → 39b5b419ab68bdab977b34c6cbeb9d482e21e858
- `src/app/not-found.tsx` — undefined → 6e29ee874e3786a91cd1812f3fb9d95a3c7cef17
- `src/app/offline-library/offline-library-client.tsx` — undefined → 066714efb04f976df77cfdf52a776ff6c78eefda
- `src/app/offline-library/page.tsx` — undefined → 2ea6cf272330bc41efac77f4a8638a185bed00c5
- `src/app/page.tsx` — undefined → 0a50155a7f7dd8ff2e3f693ff11ec2daf03f2a22
- `src/app/platform/loading.tsx` — undefined → c6965c705c8e5cc1ddb68cb900450c7c06bcba2a
- `src/app/platform/page.tsx` — undefined → e180dd080384f556355d0a34ea9493c6495d585b
- `src/app/poetry/layout.tsx` — undefined → 32f0e7446b9918e8c0c01d1ce51bde794be09243
- `src/app/poetry/loading.tsx` — undefined → 00350cb6ecc72fe109402df51d5f6817cfe26794
- `src/app/poetry/page.tsx` — undefined → eb8496d9d1e66ee2318ea480abf9a68d326725c5
- `src/app/prayer-times/error.tsx` — undefined → 866a1f6c740f45180805c6e4ab315fa706e22dcf
- `src/app/prayer-times/layout.tsx` — undefined → c0794e339b4258cb688a6598efcf052d48b55692
- `src/app/prayer-times/loading.tsx` — undefined → 6539a7b78ad17f143785d5f5ed242e2126ac4d7a
- `src/app/prayer-times/page.tsx` — undefined → c519e64dc49664e4bd3da5a52e4a6738e8eb6969
- `src/app/privacy/loading.tsx` — undefined → d08e5501f6dd28efdcaf0acae0728ddfee939cd5
- `src/app/privacy/page.tsx` — undefined → 05071b3c46e8c82da2c0d3343cf66a7e27420a09
- `src/app/profile/avatar-actions.ts` — undefined → 4b5a20c19d135d19ca1f14befd39fdd9283c3370
- `src/app/profile/loading.tsx` — undefined → b16d31d019d26e5a0c0a61404f0ddc9a039e34f6
- `src/app/profile/page.tsx` — undefined → 6edc246bb58ab4d70a7402653426ef8f74237084
- `src/app/prophets/[slug]/layout.tsx` — undefined → 54768ce12762f8a4abfe32568b2395bbed56ec47
- `src/app/prophets/[slug]/page.tsx` — undefined → 539c32457b3a7a77873145b4cad6b43c76969831
- `src/app/prophets/loading.tsx` — undefined → 54fd073e265d4f0032c18df26e485251b3e11985
- `src/app/prophets/page.tsx` — undefined → 0d2d72762ccf843b88152539ef297a6e1bdf2c85
- `src/app/qibla/layout.tsx` — undefined → 97aef3b94e277b1e781d0c96e20920223a18fa1b
- `src/app/qibla/loading.tsx` — undefined → 0927bd3947f741ccda98c5355eb0ee34274c9766
- `src/app/qibla/page.tsx` — undefined → e84b6c93cd334d41538f21c98494042931394606
- `src/app/quran/[surah]/[ayah]/page.tsx` — undefined → a3d3fc3439c4c180a638727d5affa60d34ec8f37
- `src/app/quran/[surah]/page.tsx` — undefined → e44e050eddbefcae234acf0f2eb0190753759b4d
- `src/app/quran/error.tsx` — undefined → b69459d3fff9f6f202cb3653da1e4efb15eaae3f
- `src/app/quran/loading.tsx` — undefined → d26fe721aea13fbd9c54427587bef011c2989f37
- `src/app/quran/page.tsx` — undefined → 885e5bc33130c008814ec654f706fad562f4e03f
- `src/app/radio/layout.tsx` — undefined → 09e2903968547c07fdb59e141542adb44b28bbbc
- `src/app/radio/loading.tsx` — undefined → 6cc5803775920dcf17a47085ff427e7c1a8b4424
- `src/app/radio/page.tsx` — undefined → eb4a736b9621c5b1e12d030abb187acb6fa014c4
- `src/app/reciters/[slug]/layout.tsx` — undefined → 97afe275d4993af4f9a0d20949f2788d10ff1e86
- `src/app/reciters/[slug]/page.tsx` — undefined → a611e4850618f150f0db0a2654140f9849af8c1b
- `src/app/reciters/layout.tsx` — undefined → 622d82e0bafa9104fb9e218c73526ce181e584b8
- `src/app/reciters/loading.tsx` — undefined → 164f8aaef6c44ffbd1532a3cd5852d0b4428c102
- `src/app/reciters/page.tsx` — undefined → 842a3279e278613c1dae116c3fa4f9ce4d5444fb
- `src/app/robots.ts` — undefined → a5d8f796270e63eab289cb9a3a98f4a260b585e0
- `src/app/scholars/[slug]/page.tsx` — undefined → f076c560b60606b714b10e7a7444a2a8b9993a10
- `src/app/scholars/layout.tsx` — undefined → a80dd42a91250a77385da073d84b9616c045fade
- `src/app/scholars/loading.tsx` — undefined → f9aba224a4cd6ad5db830bea0dd69903e64b61d3
- `src/app/scholars/page.tsx` — undefined → 25fbd8531d23cbbe26c31d0b2bb246b4cb6ac46e
- `src/app/search/layout.tsx` — undefined → e9724b15ae1753923c260c7a1a2b0725d4a93186
- `src/app/search/loading.tsx` — undefined → c88c652ba33185d61f2ffeb2b28f7d28f003fa1b
- `src/app/search/page.tsx` — undefined → 48b60c9bf701eb766ae359b28eba625409285ae1
- `src/app/sections/page.tsx` — undefined → 6c87d83d7f19873674df8b49a1e10125259fd028
- `src/app/settings/layout.tsx` — undefined → 970c3fe39b91e781377e50ac99db8d4c747fab38
- `src/app/settings/page.tsx` — undefined → a2b9e32755486f0439f147664bd0af5d7237faa6
- `src/app/sitemap-content/[id]/route.ts` — undefined → e8204fcd8a74b148b5f0f6c60bebebdd2edd47e0
- `src/app/sitemap-index.xml/route.ts` — undefined → 8dc21db4e982e82aeb93307dbf0de8aa36f1bac2
- `src/app/sitemap.ts` — undefined → aaeb13a09169e96584d651de84d8a784a02cf30a
- `src/app/spiritual-ai/actions.ts` — undefined → 636cafd39c360427a69b12a9357d4bb6a4b28c5c
- `src/app/spiritual-ai/layout.tsx` — undefined → a3ca38a5d97be6bed4b52e6ae337eca7faae9aad
- `src/app/spiritual-ai/loading.tsx` — undefined → 43651a961bc1acaf911dab948b18d1cc61f0a508
- `src/app/spiritual-ai/page.tsx` — undefined → 8f2879a8af0d596dc58bcf8a10484421966cc281
- `src/app/stories/[slug]/page.tsx` — undefined → ca44742b1ff4b5df0d51a5bfc325f284602cdc7b
- `src/app/stories/loading.tsx` — undefined → 5f32752bcaf1a65f3ebf4995ed7b7814d84d4ff7
- `src/app/stories/page.tsx` — undefined → 8962cc80660edb118b74350419eec5f7b5370fd2
- `src/app/tafsir/layout.tsx` — undefined → 7284531b923d685fb5a9cb9b17a74148f49767f6
- `src/app/tafsir/loading.tsx` — undefined → 99529c1e0c4f56e90b4a053c174d5a073bacf2e1
- `src/app/tafsir/page.tsx` — undefined → c77ec2f55762b72ba70983ecd06c0cd932aebcbe
- `src/app/tasbeeh/layout.tsx` — undefined → 334bb0296282746cd2e6abfd8fb7f8eb2a2ea44a
- `src/app/tasbeeh/loading.tsx` — undefined → 0960e5204c43f126bdfc530bd0142f2949bf343a
- `src/app/tasbeeh/page.tsx` — undefined → 38dcabb30c449c6fad2cc8720f6233d972fa0033
- `src/app/tawasheeh/layout.tsx` — undefined → 18e9468258052f21261f86d4387cef5b495880f2
- `src/app/tawasheeh/loading.tsx` — undefined → 5a924cfd2a548428c421230edb72f28b1b587be1
- `src/app/tawasheeh/page.tsx` — undefined → 22c1c6d6f3eab1d9b78ab3dc74ac14baa982f178
- `src/app/terms/layout.tsx` — undefined → 69f4d9904f8947a756ee981f5b72d2a76896c200
- `src/app/terms/loading.tsx` — undefined → 4b82251d4ed64d96ea8357eaeec9daec21efdc2a
- `src/app/terms/page.tsx` — undefined → f2067faf3f5f35f736b4d78017e42211e3689aa3
- `src/app/videos/[slug]/layout.tsx` — undefined → 48dab7ba44964cdd55587fa6a94cede965640bb9
- `src/app/videos/[slug]/page.tsx` — undefined → 28685465188ec63d0b15b0c306fe0e31fc552659
- `src/app/videos/error.tsx` — undefined → 6de605f337e75e0c9241c6f97dea54951b031404
- `src/app/videos/loading.tsx` — undefined → 09a8331abbbb1c77df8eab3f347cf05e076c6e55
- `src/app/videos/page.tsx` — undefined → 30646509c4697907b096fadc43a457180aab9462
- `src/app/wird/actions.ts` — undefined → 6a0d188719a726501253ab8337ef298bb7313abb
- `src/app/wird/page.tsx` — undefined → 14c23855d7d810303b6d5f51eee2dfcdd6f0a23b
- `src/app/youtube/loading.tsx` — undefined → 7e069727ec503c2611c20d782fc50469ebf8b11e
- `src/app/youtube/page.tsx` — undefined → 75385a12f4a1f69a9485c645c467a707492c0a09
- `src/app/zakat/page.tsx` — undefined → cc749ebbff99da7a4e07d16345155bb4800f9f5c
- `src/components/audio/audio-library.tsx` — undefined → 4ceccb9c9786773222fc22b4dae530101ae4a03f
- `src/components/content/content-guide.tsx` — undefined → 0262e7f85ce50deaa55ca0f8571d1136622fe986
- `src/components/content/content-references.tsx` — undefined → 332e77b3c3289c031d85489e0c061fa395b919a9
- `src/components/content/editorial-depth.tsx` — undefined → c89c87a8ab8933236fa168aaaed82606e8ed591a
- `src/components/content/editorial-utility-depth.tsx` — undefined → 4a4da1c3ce4b5558bcde47c54a97568811e577b6
- `src/components/layout/adsense-slot.tsx` — undefined → 68525fb27325c7363c791d9caaebe33153aed7a4
- `src/components/layout/adsense.tsx` — undefined → f706b388ce50fb66e549907263fbd2dd99d0351c
- `src/components/layout/analytics.tsx` — undefined → 08c097892db0afff55cf9731a3a3ae8622383b92
- `src/components/layout/app-update-checker.tsx` — undefined → 98856477ae04324db00d8058b919a91f019dcd8c
- `src/components/layout/auth-nav-actions.tsx` — undefined → aaa8dccc9b40e397ebc390b212a04b3f59291e06
- `src/components/layout/deferred-analytics.tsx` — undefined → 073ec059458214972525495e7957338ee52ced81
- `src/components/layout/deferred-runtime.tsx` — undefined → 6bd0aeae36df7386e71082f696c8ce3cd9ee1255
- `src/components/layout/footer.tsx` — undefined → bc8b66a6908ba1beefc8b8b5512d9a09d5aca548
- `src/components/layout/install-prompt.tsx` — undefined → 9b136f4f8906620108759932a1dca633c60d1b8a
- `src/components/layout/language-aware-nav.tsx` — undefined → 558a2bc1f9243b92fbfcd6c00590a45ac0f65613
- `src/components/layout/language-provider.tsx` — undefined → cf77d4119b9f69cc81d06e4843221efc553d8c42
- `src/components/layout/language-toggle.tsx` — undefined → 6842abe53b7f434dfa1b23a67ae8e2adabf667d2
- `src/components/layout/mobile-nav.tsx` — undefined → 2538e696b8f0ea49b22de37f45f78287d7f936ae
- `src/components/layout/native-capacitor-bridge-loader.tsx` — undefined → e6402a72a21ff6350e96ae65fe5ee01fa1d1c4d3
- `src/components/layout/native-capacitor-bridge.tsx` — undefined → 9cf0a4cb88c4f3828ce5a2b392e2e694accfeece
- `src/components/layout/native-google-oauth-handler.tsx` — undefined → 9bccac40451c930d1bc16473b6f6a9f29ce06b56
- `src/components/layout/navbar.tsx` — undefined → a0d8c01420b2ad0bfbf31d858723c12fdc296d9f
- `src/components/layout/notification-permission-banner.tsx` — undefined → 14cfb3eef282c3dcfa626a7bfe434e6f57e2c904
- `src/components/layout/offline-navigation-guard.tsx` — undefined → 9234b9d2bb79cf5baaa52ee0dd46d36fe2c55f39
- `src/components/layout/prayer-alert-provider.tsx` — undefined → cbd7ed07b632ec9fc214f6c4925389f57919e6b7
- `src/components/layout/runtime-effects.tsx` — undefined → 2082eed43ff49b4e8f0d50106bcd0be5b32a2cb0
- `src/components/layout/service-worker-register.tsx` — undefined → a3c52d671e7baf70cf5c77ed78e3825d2857db9a
- `src/components/layout/site-shell.tsx` — undefined → f3dd02effb61f9d00aa73ae74ccf3da8402de6fa
- `src/components/media/resilient-profile-image.tsx` — undefined → e645282e1a19ce2afcedb3450ea82e172ba29644
- `src/components/platform/android-release-card.tsx` — undefined → fa6abef1e3541ba3e04c12de4b51de262ebc1f1f
- `src/components/smartlink-promo.tsx` — undefined → 5a861d3fe093b524277264d345c3959efe4b18a7
- `src/components/ui/Logo.tsx` — undefined → da2a32155b35cb709a691be2ea9fc018aee9a1b6
- `src/components/ui/badge.tsx` — undefined → 099558bd3087fab9a55700ed538a7475c31cbaa8
- `src/components/ui/button.tsx` — undefined → 691cf5b5b888b2f227636b62087f5d23aeeae517
- `src/components/ui/card.tsx` — undefined → 83589921103941ddaefd9cfddd3a2a8e9d535367
- `src/components/ui/container.tsx` — undefined → b1683c46755bb77016537ddf87ffe8a0aba36d7a
- `src/components/ui/input.tsx` — undefined → 2639e995c6598bedda40ba017de6d644c563691a
- `src/components/ui/page-error.tsx` — undefined → 174499ed7f45c850f7e98e4e3239cc6ffb490426
- `src/components/ui/page-skeleton.tsx` — undefined → 1f535f376c2dbbae1de3a1342cdcf6de7dcb552e
- `src/components/ui/progress.tsx` — undefined → 2a1686870e0ee7322df746927bd29a1fffbb2671
- `src/components/ui/section-header.tsx` — undefined → 14e6cfd227d14c275b95de09d967f58bbdfb5f97
- `src/features/adhkar/components/adhkar-page.tsx` — undefined → c20b2c0866d4d3ff32d13951fc9d0a3f717f2cfa
- `src/features/admin/actions/users.ts` — undefined → 091f75355d3716b36b23dfcbb757a32fa8b7abb8
- `src/features/admin/actions/video.ts` — undefined → f6ffceed332c177ae4ce08b9f00ce674e3599e41
- `src/features/admin/components/admin-breadcrumbs.tsx` — undefined → 7f5b14edf6bed1e91708aaaa5d28de0fbb69590d
- `src/features/admin/components/admin-command-palette.tsx` — undefined → d5867b486d59f67dc3f40187daec8aebf4451b51
- `src/features/admin/components/admin-live-queue-dashboard.tsx` — undefined → 98f28d67ca2f6a282522ebdad43946fffb224f34
- `src/features/admin/components/admin-module-directory.tsx` — undefined → fb0d4f59ac7446988974ba4fb44af16edaf69ce0
- `src/features/admin/components/admin-page-view-tracker.tsx` — undefined → 438e1fa5a25480de8ccae11e61f406891a9cfd6a
- `src/features/admin/components/admin-platform-command-center.tsx` — undefined → 98038c784db498c1d8dcadccf423a0cfc4c04c88
- `src/features/admin/components/admin-section-hub.tsx` — undefined → a00039f598a4aa25915b68a1c4bff137b6cd39f0
- `src/features/admin/components/admin-sidebar.tsx` — undefined → 0eb626138b952b0e0c36f715d78cc5068aa15dfd
- `src/features/admin/components/admin-step-up.tsx` — undefined → 66215e75b119b4aa8c9bed337c6b34096ceba9c2
- `src/features/admin/components/audio-choice-field.tsx` — undefined → 31aac8509d703b492ddef24ef88f785e4a1899c4
- `src/features/admin/components/cloudinary-image-upload-field.tsx` — undefined → 0ef0f2a7c1986b1dfaa3647fd4ba99c55e78fa29
- `src/features/admin/components/purge-generated-videos-control.tsx` — undefined → e2c615d1a63a64bd9cca95f5b982f1eff1919ce5
- `src/features/admin/components/role-permissions-matrix.tsx` — undefined → 6ded5845ea81584526d93320c6123f9f29a26cd0
- `src/features/admin/components/site-audio-manager.tsx` — undefined → 44b6e08181195f551ae66e55675510529ee817ab
- `src/features/admin/components/traffic-revenue-panel.tsx` — undefined → 7012a0d7ddd481010e33234b87e6c1a1e82fe7a5
- `src/features/admin/components/users-table.tsx` — undefined → 775357e7c779ba9a7b63b6bcd495ab0550d9030a
- `src/features/admin/components/video-upload-field.tsx` — undefined → 863de84265895edaefef3eddac2a6db7bd358525
- `src/features/admin/config/modules.ts` — undefined → 34cb4b1479fa067d3ea8d2170a35c1060aad8aed
- `src/features/admin/config/navigation.ts` — undefined → 1c9c983e9afee47618c28f52f5a7dabb745efcb9
- `src/features/admin/services/admin.ts` — undefined → 8757305137581e9660c21547e3113325faee1e53
- `src/features/admin/services/analytics.ts` — undefined → 1fa86f92d3cff30983a42545458e5f13b3288087
- `src/features/admin/services/audit.ts` — undefined → a56e928d6a76bade18af6ac1bd80378179bfc9c7
- `src/features/admin/services/battles.ts` — undefined → e0628481324ee422f819e3bce5e57dadf0dfd035
- `src/features/admin/services/content.ts` — undefined → 99c6061351538e70baae3cbfea054597e53f90fa
- `src/features/admin/services/knowledge.ts` — undefined → 4882498fb1c46748f488a71444391377af468403
- `src/features/admin/services/permissions.ts` — undefined → 0560c490dbdef1ab194b33b5690eba965035ba02
- `src/features/admin/services/platform.ts` — undefined → ba942ea2452818a8793429ca04eba2da084e5acc
- `src/features/admin/services/prophets.ts` — undefined → faeaacb281e267517406e5d009e4de3cd916cc65
- `src/features/admin/services/rate-limit.ts` — undefined → 70b06497c38c9f62c8b7853d2ee0cf9277e12eec
- `src/features/admin/services/safe-read.ts` — undefined → 34bb925595acd814380ff8142882d45d8ae61ac9
- `src/features/admin/services/security.ts` — undefined → af018ba7578ba7152215b9086514a890ffd32595
- `src/features/admin/services/traffic-revenue-metrics.ts` — undefined → 82ef1a644067766709679f44085741027e8650f2
- `src/features/admin/services/traffic-revenue.ts` — undefined → 19aaa17ec9ff1ec44fc6698ee27cf4abde865ed1
- `src/features/admin/services/youtube.ts` — undefined → 34261e2f17181cbe8b207aa674a374901e43d445
- `src/features/admin/video-requests/components/admin-video-requests-client.tsx` — undefined → c022f13120035fc7eed5d128fbed0a0e98593972
- `src/features/admin/video-studio/components/admin-video-studio-client.tsx` — undefined → 216f7e13681d019ea9c53b0c1c86ea6157fb58ca
- `src/features/admin/video-templates/components/template-studio-client.tsx` — undefined → 57f63436f363f6568537cceafa1f199c50886616
- `src/features/articles/data/adsense-editorial.ts` — undefined → f259dcb47fe0b320564ae5e711881c4abc6bb57f
- `src/features/articles/data/articles.ts` — undefined → 8bb92021318dd262a58c50ba737571e18c9a823f
- `src/features/articles/data/extended-editorial.ts` — undefined → 364227a0fe8ff36c4f043fd83843862b7ff32c40
- `src/features/articles/data/fallback.ts` — undefined → 62c255b2caa3d41efe15d5151a54e7f8504c341a
- `src/features/articles/data/longform-editorial.ts` — undefined → 43caad51d4e935e38efa8aaed9106fb4a2114394
- `src/features/articles/services/articles.ts` — undefined → 1c7476b37921fea4aea150a6d804dce16f9b733c
- `src/features/articles/types/articles.ts` — undefined → 290c4dbd1c3f0efc722e923872ef12b92e475e54
- `src/features/audio/data/tawasheeh-fallback.ts` — undefined → 05605da7c5959f650e9f43991e5cee5672c7d888
- `src/features/audio/services/radio.ts` — undefined → 41e849635bbd6ee6edcfc7545b897c63d8e29b8a
- `src/features/audio/services/site-audio.ts` — undefined → a3d5311606585b71869f89ea1e4d0fb09232d5e0
- `src/features/audio/services/tawasheeh.ts` — undefined → 2a0025714f4ca2ab160306b91b2bfeb2aade32a9
- `src/features/auth/actions.ts` — undefined → 6c996dc6ea714fb8195df7eabdefd5efeb1d0dd8
- `src/features/auth/components/forgot-password-page.tsx` — undefined → 238ad77a1ccd513730ff5dbef6da0925aa90d77e
- `src/features/auth/components/google-oauth-button.tsx` — undefined → 806659759aa3d7662962dcdcfe3762280ce9978d
- `src/features/auth/components/login-page.tsx` — undefined → c4ac4e944acc2a92f5d9598e1125b635d1beda36
- `src/features/auth/components/register-page.tsx` — undefined → 332d80dacac29f2a478c5d5bd9a9ac74d4c68503
- `src/features/auth/components/reset-password-page.tsx` — undefined → c7e4a73d1159d5cc00d4a9952afd49b5e2e821f9
- `src/features/auth/integrations/google-oauth.ts` — undefined → 855277f07ebd40c69455691944bb76acd61bfabd
- `src/features/battles/services/battles.ts` — undefined → 538bb1fe14eab819569e27abbd8daece1dfa3421
- `src/features/battles/types/battles.ts` — undefined → c249bf397b423e246367b2b7274a13ae2ef6da79
- `src/features/companions/data/fallback.ts` — undefined → 42955db2ad4759ea901dc411a73538472468c5dd
- `src/features/companions/services/companions.ts` — undefined → 55fb555275dc7ec20397df1ddddc1e864090ae09
- `src/features/companions/types/companions.ts` — undefined → b9bbf4f8173b799833e9256d93c233a586fe0d10
- `src/features/companions/utils/companions.ts` — undefined → 1f95a65ae305daab080d0333c5fa0586af0636a5
- `src/features/competitions/data/fallback.ts` — undefined → ec0527575d56f4bf37e1791350ea85045e2060de
- `src/features/competitions/types.ts` — undefined → 865e04820db0dc2875178c67fe5b9640a516bed4
- `src/features/conquests/data/conquests-detail-fallback-extended.ts` — undefined → 4d898d104443bd2308a1a580bb8d18b5e8321f7b
- `src/features/conquests/data/conquests-detail-fallback.ts` — undefined → 79079f69cadd6527830bf97e2a32c49986c42965
- `src/features/conquests/data/conquests-fallback.ts` — undefined → 11c90004e32cc7e5a4dc59eaa037356c3ebc405d
- `src/features/conquests/services/conquests.ts` — undefined → de74228dc5250ed09a16ffe05575286ef3d8a2cf
- `src/features/contact/rate-limit-identity.ts` — undefined → 0d131d7b47433652f3cbcb73580ac29f4c10fa2a
- `src/features/contact/services/contact.ts` — undefined → eafac0e95a26c2e00746a104a837b00e27541f50
- `src/features/contact/services/rate-limit.ts` — undefined → eeb583757bc14ee42a2b6ddc73182d2862142dd3
- `src/features/contact/validation.ts` — undefined → 0d77c1e07d07ddf02dfe6a2071bc8c81b6695459
- `src/features/content-library/services/content-library.ts` — undefined → 8060b666fe92c46c16c917e98a839326deeb25ef
- `src/features/content/services/stats.ts` — undefined → 54fe9d9109d9ff40e306d8ad41b237df79b67c4c
- `src/features/dua/data/fallback.ts` — undefined → b55e77c564ded46bf0052b8cc63135c6d573e82e
- `src/features/dua/services/dua.ts` — undefined → 6981627f0e43e9fb972e9fcc55dfed758c2ec240
- `src/features/dua/types/dua.ts` — undefined → 9693ca7a48dd739bdde4d8473909571fe211ac15
- `src/features/favorites/services/favorites.ts` — undefined → 43cea9991f86bacee84e52a2236ebd2c4306ffca
- `src/features/hadith/data/fallback.ts` — undefined → f430b399ee8dd8c561c553fcc8ccefaf7e450140
- `src/features/hadith/services/hadith.ts` — undefined → 8b4c7e5d33cebdc69329f0ff9efaaa410894bc31
- `src/features/hadith/types/hadith.ts` — undefined → 3cacfadf0b1e4389b632087084125b9ec9b9566d
- `src/features/home/components/home-interactive.tsx` — undefined → 1a4bd1c46e52bed3013b3006892a39bde4fbc27c
- `src/features/kids/components/games/game-shell.tsx` — undefined → 379e009868651946eb1096cc1043264f4cdce92d
- `src/features/kids/components/games/games-index.tsx` — undefined → 222ca7e26bf90cedfb7c9079b07217345c5a550d
- `src/features/kids/components/games/kids-action-adventure.tsx` — undefined → fbd7bc9402a0f7dadfa6ccc3bda2f5e207303dc9
- `src/features/kids/components/games/kids-action-runner-road.tsx` — undefined → 15bf4be72a5ce072a6318cc907ddd0f39b6869a2
- `src/features/kids/components/games/kids-game-art.tsx` — undefined → 1f23a40f23eb35fdd77dcd0adc118d80adabd597
- `src/features/kids/components/games/kids-game-kit.tsx` — undefined → b75707c0d48bd81ab181af1f9acceaa70d6bc2b7
- `src/features/kids/components/games/kids-game-motion.css` — undefined → 1765810bbc1ce8a8d153f3cf4d5b0c25977eb1c8
- `src/features/kids/components/games/kids-game-visuals.tsx` — undefined → dcc7e197bc75e2472100a52f80d6233ce48fbb60
- `src/features/kids/components/games/kids-learning-games.tsx` — undefined → 832cf9e092c097b3d22802b1365166fb3b57961a
- `src/features/kids/components/games/kids-letter-lab.tsx` — undefined → ce8e9045b800966d15704bbf8673e4da3843cc7b
- `src/features/kids/components/games/kids-values-coloring.tsx` — undefined → 63550f18244c0b76e584eca89262844ac8398781
- `src/features/kids/components/games/progress-dashboard.tsx` — undefined → 8177eb8d93d030af6afeb95b2cf1a09c072446ba
- `src/features/kids/components/games/use-managed-timeouts.ts` — undefined → 371c3b561768863e967d9985c7f7e3210839e576
- `src/features/kids/components/games/world-game-stage.tsx` — undefined → 63ee24a233636c53927201347d7f92db1259e9e9
- `src/features/kids/components/kids-achievements-board.tsx` — undefined → c93110fbcd29a2bf379af065ba3c974abbc6b96d
- `src/features/kids/components/kids-audio-hub.tsx` — undefined → 0c87a8d088d767ce2a92d455726333919e73f781
- `src/features/kids/components/kids-quiz.tsx` — undefined → 744b64cc986514f53467d879ddcc738038ef3eb5
- `src/features/kids/components/kids-section-navigation.tsx` — undefined → 75b5cde4dc64228be223e4125a3939b02fc92783
- `src/features/kids/components/kids-share.tsx` — undefined → e9797926cef9c1a16cd33667edb5f13eadc8d522
- `src/features/kids/data/audio-client.ts` — undefined → dd3b44cf9c47a4445d80225f9603ff69f8dc9f26
- `src/features/kids/data/audio.ts` — undefined → e18298c9c29c441014ce1cf89e30a9c82a0494ba
- `src/features/kids/data/content.ts` — undefined → 1a93a702badc1f66242c81789b9dde912ee08ef2
- `src/features/kids/data/games-enhanced.ts` — undefined → bc6308dbd8118319bd352c2749da472441aac042
- `src/features/kids/data/games-index.ts` — undefined → 91d8a011ebd7f0df7de35e306fe2731ea55e70c0
- `src/features/kids/data/games-levels-enhanced.ts` — undefined → 702a4781f3aae035bf70f5d568118c5d9b7653ba
- `src/features/kids/data/navigation.ts` — undefined → 375f5a40cfd99fc2838c841f236c63dcbd9cdcaa
- `src/features/kids/data/stories.ts` — undefined → 4ce86f620c618c5b35f4fb16f78de9a09ef71121
- `src/features/kids/services/games.ts` — undefined → 6f7a88d5daac31e252e99cc0812ad464738edad7
- `src/features/kids/services/kids-content.ts` — undefined → 6c010f40ef9448151a92776aa99da88229be5342
- `src/features/media/services/cloudinary-validation.ts` — undefined → 55d80fb70dec0667b868833237ba7f803c0c43f8
- `src/features/media/services/cloudinary.ts` — undefined → b89a57101fce134a08d0df79c41c606a34923d10
- `src/features/media/services/media-assets.ts` — undefined → c7d9cef45b80734d02a054766c269bc9a2bf748f
- `src/features/memorization/services/progress.ts` — undefined → 4d7ad534910578f47896ce27482273b4636c3eab
- `src/features/notifications/services/notifications.ts` — undefined → 4b1467809fcd550366bde1a8963d18a4d9980c59
- `src/features/notifications/services/quran-reminder.ts` — undefined → bbb199338e56ef61ae53a65caaaa12d0ce682c6b
- `src/features/notifications/services/user-notifications.ts` — undefined → 4e01d382874a87f5aa5c9f650eafe96815444d12
- `src/features/offline/components/offline-indicator.tsx` — undefined → 6def91e6d35b810abc690ee095711fbcfa242ee6
- `src/features/offline/hooks/use-offline-data.ts` — undefined → 113b63b63d3b4f679152905ea126a018d038d0ed
- `src/features/offline/hooks/use-offline-status.ts` — undefined → 86aff83a329966f75bae58b08905c75aab690904
- `src/features/poetry/data/fallback.ts` — undefined → a7e9fd9e8eaa555567b1fbbcb47073c7882e87db
- `src/features/poetry/services/poetry-insight.ts` — undefined → 398464c9f981bbd815d44eff914fdb48f10b262e
- `src/features/prayer/components/adhan-player.tsx` — undefined → 83c653553b0188181d8dcb02c108c3f99b725da5
- `src/features/prayer/components/prayer-times-page.tsx` — undefined → 545b6a6c4a88846796f8aa79803f7564ff4ddc53
- `src/features/prayer/hooks/use-adhan-player.ts` — undefined → cbcc8e2705060141ba31a6e5065fc4f775d7c390
- `src/features/prayer/hooks/use-prayer-alert.ts` — undefined → d9eaae94ff78921b4a94acb860a2ef4b4aab2afe
- `src/features/prayer/hooks/use-prayer-times.ts` — undefined → 0c44eb4591f765161685aa5a9ac39e7c69a99e1e
- `src/features/prayer/services/prayer-times.ts` — undefined → 90b4a36eb85bd032ae49f57bd2819769c2855386
- `src/features/prayer/services/saved-prayer-location.ts` — undefined → 9b03305c7f5a2ce907db4643eb28c13b66decf9f
- `src/features/profile/components/avatar-upload.tsx` — undefined → 25ff49d508dd663930d534a5e29c187f7d51c8d2
- `src/features/profile/components/profile-local-settings.tsx` — undefined → 2d8a44ff3e91b32fa5c1a7ed87584e9f02179b00
- `src/features/profile/services/profile.ts` — undefined → 8c54c50e1f90419b734e21937c18a248bbeb72cd
- `src/features/prophets/data/fallback.ts` — undefined → eb034d47ee6739405cadf534f087fa2e748dc6a9
- `src/features/prophets/services/prophets.ts` — undefined → 796f2d9c9f3265a5751bf146f1078c50112535c4
- `src/features/prophets/types/prophets.ts` — undefined → d20f9d50faa4dfbcc3e22d077f78df1b470a3d89
- `src/features/qibla/components/qibla-page.tsx` — undefined → 5abafb9180f5e917e37feb4afd916badb8c77d42
- `src/features/qibla/services/qibla.ts` — undefined → 05e62950f370fc89262a94c55a8c28a202ea1daf
- `src/features/quran/actions.ts` — undefined → 7ed3309cef025b8da685d86db3e18c906beb52d1
- `src/features/quran/components/audio-player.tsx` — undefined → 66ddb284a4581d8369b9fbcebaf3429546c75974
- `src/features/quran/components/bookmark-button.tsx` — undefined → f2427d6eb7f39a7c83ca4280d9b94b1cbe002c4a
- `src/features/quran/components/continue-reading-banner.tsx` — undefined → 2b503ebb9e2d697349774cb30fdab8b44b2db6a8
- `src/features/quran/components/mark-surah-read.tsx` — undefined → fb861f30eebbb05e7242f01a56126eac40aeb244
- `src/features/quran/components/mushaf-bookmark.tsx` — undefined → 3631a7070b914d244986d1a9e182f5bce6858150
- `src/features/quran/components/quran-auth-banner.tsx` — undefined → 967aa8f2fa98b1a75711a7d4e23433a721409ec4
- `src/features/quran/components/quran-catalog-page.tsx` — undefined → 41f5350e6c17a59e0ba70517a4b8649ec78d1caa
- `src/features/quran/components/quran-page-header.tsx` — undefined → 2a14bc05ce4d07df6a7dbc4797e8fd4f82930c3c
- `src/features/quran/components/reading-progress-card.tsx` — undefined → b52af127b48b3fd100b729193f1cc4b256ec6cde
- `src/features/quran/components/surah-search.tsx` — undefined → 901148948b59655780d00682adc21c5899d5691b
- `src/features/quran/components/surah-skeleton.tsx` — undefined → 40513d20ee7daa3ccb7843abd49beb73cde8882e
- `src/features/quran/components/tafsir-library.tsx` — undefined → 8eeacca3eede63f4ac446504519c4948bfe04e74
- `src/features/quran/components/wird-dashboard.tsx` — undefined → 0afcec66114bf47e0e0d2c8cff22ceccb7146671
- `src/features/quran/data/fallback.ts` — undefined → 62af672175be5ecbec31f47275c47cffc1d8df34
- `src/features/quran/hooks/use-quran-wird.ts` — undefined → 4d7293bd166839ea4b81eeed8ab6a00baded0993
- `src/features/quran/services/offline-audio.ts` — undefined → f549e7e4706844f2597b411fd2867132acdac0af
- `src/features/quran/services/quran-client.ts` — undefined → efcd2a5240d0a048a0fa87e181bf74989c1ff147
- `src/features/quran/services/quran-server.ts` — undefined → 4110f26762aa729348853ddaae53713f226a0c82
- `src/features/quran/services/quran.ts` — undefined → 34ede67c8cb1dcb665287cdcfa233dbf55bb684e
- `src/features/quran/services/reading-progress.ts` — undefined → 60a8b155f9bd4900cfc44cf6d99dc34776799605
- `src/features/quran/types/quran.ts` — undefined → 51afb69e6bdee9f83671fb7b5bf632cea0cf64be
- `src/features/quran/utils/quran-progress.ts` — undefined → 86d294f15610fa307151feec73108b70e3344b7f
- `src/features/quran/utils/surah-mapping.ts` — undefined → 501f8acd8a9315e0db04dba86eb2062d82711a97
- `src/features/quran/utils/surah-names.ts` — undefined → 723100b263588cf0954f77eb326549b408770e03
- `src/features/releases/android-download-url.ts` — undefined → 5d193b0503adc370e652e5422267f446b8bc74a5
- `src/features/releases/services/github-android-release.ts` — undefined → 8f18cd39b611ae22549feb26d604e058464ba233
- `src/features/releases/services/github-release-manager.ts` — undefined → 073fa98dae25c2e7d620b1076520a87137323229
- `src/features/reminders/hooks/use-dhikr-reminder.ts` — undefined → 27a8fa07c88e6299d7db477fd48320476a82a56e
- `src/features/reminders/hooks/use-salawat-reminder.ts` — undefined → dc5109664a473435df4e919accd04bfbd6e0be00
- `src/features/reminders/services/reminder-preferences.ts` — undefined → 5ab6768de251f16e43b4812aefc8749c9ef7ba6d
- `src/features/scholars/components/scholars-page.tsx` — undefined → f38efa0dbd5ef15dda5d0126d74bf2a6b80dca22
- `src/features/scholars/data/fallback.ts` — undefined → bac2cbef93e0c604dd1b75cc9870e680643280e8
- `src/features/scholars/services/scholars.ts` — undefined → ec446621d9e8ab9788bf1a01757194fcafe9571b
- `src/features/scholars/types/scholars.ts` — undefined → 6b79db1ecdf8bf2bffd6dc75165b296a0be0ee22
- `src/features/search/services/search.ts` — undefined → b2c38b1e43f27eb039df095b8f66245dfdbb4243
- `src/features/site-content/services/site-content.ts` — undefined → 04715d96c67acd09608ce687563320eb24a5b66c
- `src/features/social/integrations/facebook.ts` — undefined → f2b5f59b4f61952637188e1279ed08848943af3a
- `src/features/social/services/facebook-credentials.ts` — undefined → 601a19fba3d5ce777eae278435cf8795caea7e9c
- `src/features/social/services/facebook-post-insights.ts` — undefined → 27319668f3d73f5fe12a27b55bfbd131e57891ee
- `src/features/social/services/facebook-reels-insights.ts` — undefined → 6eccb866b5133e45d6ef9783eacc153d79e4085f
- `src/features/social/services/facebook-reels-rate-limit.ts` — undefined → 7a84a416789a1bd3bff54a9caff8edb3fa607a97
- `src/features/social/services/native-social-sync.ts` — undefined → 08ecbf232babec245d54753e56d96cf6b7c8906e
- `src/features/social/services/platform-availability.ts` — undefined → 93020681638e5a048f755e544b2e39225d6960d9
- `src/features/social/services/published-video-cleanup.ts` — undefined → 959e8b181cfb4070a25dfe6f770f346135eda374
- `src/features/social/services/social-deletion.ts` — undefined → ff7e6c55da6ab35d633b6cc957ef35034e7fcf08
- `src/features/social/services/social-publishing.ts` — undefined → 43bb2eee547e35680ca29f846c355172e5b60573
- `src/features/social/services/social-queue-selection.ts` — undefined → c83417f7c6c76c6f8d27ac19fa1df900f021bbef
- `src/features/social/services/written-content.ts` — undefined → c4d45f77a8f04d0c37a875acc41157a9f2431fec
- `src/features/social/services/youtube-oauth-credentials.ts` — undefined → 978e19a1d0b039d5715b667952ff810cb3979e79
- `src/features/social/services/youtube-post-insights.ts` — undefined → 63d0d856863e0c5e73429642d515512675f2e3d2
- `src/features/social/services/youtube-publishing-health.ts` — undefined → 64dbd15be3883d1e02c2ca762b89eac8c646cb0d
- `src/features/spiritual-ai/services/ai.ts` — undefined → 93ba4ea9f77aa4c2558797f9cada747631639760
- `src/features/spiritual-ai/services/gemini-client.ts` — undefined → a47b0491ae0c77a17264f610480684575cf7d2b4
- `src/features/spiritual-ai/services/policy.ts` — undefined → d6ac24bb9c39276623562a0533855e4a5dcc1616
- `src/features/spiritual-ai/services/retriever.ts` — undefined → 09d57581757944eb42d8da42dbc02f5c7eb92145
- `src/features/stories/data/fallback.ts` — undefined → 759bec46d63da783f5ba54d97b1c2382d922e7cc
- `src/features/stories/services/stories.ts` — undefined → ef275ba9781bbb90af35ddd1e3df08aa37768cb3
- `src/features/stories/types/stories.ts` — undefined → 00b052a147c31f586ac7b40451072181fced6a8a
- `src/features/tasbeeh/components/tasbeeh-page.tsx` — undefined → be11dafaf9c228be8e18395c37a2e51da14097c6
- `src/features/tasbeeh/services/tasbeeh.ts` — undefined → e7e14483826b254efb11462960972d46fc5b0aa1
- `src/features/videos/components/video-like-button.tsx` — undefined → 294135860d7b3ba62b0fb63c46c613cd8a025011
- `src/features/videos/components/youtube-feed-card.tsx` — undefined → a7eec230e47226d884e5e858987d8541690e92bc
- `src/features/videos/data/curated-content.ts` — undefined → d6f4a61c3f2e2bb9d4ad73f850019ae36aab27d5
- `src/features/videos/data/fallback.ts` — undefined → ba55c3a40c057499bdd7e615c04098b9965cf386
- `src/features/videos/data/kids-story-factory.ts` — undefined → 70bf25a4d521ceca7319e131514e55b92c652473
- `src/features/videos/data/verified-content.ts` — undefined → d865dfd37432470e01fff05d99b4020e063ca92d
- `src/features/videos/integrations/youtube.ts` — undefined → 7a0e6e592e338f7154db50f783a85fbee51caee8
- `src/features/videos/providers/ai-visual-policy.ts` — undefined → bdd0a5a3a4748126978a7521c82f8e62a0fb0843
- `src/features/videos/providers/comfyui-provider.ts` — undefined → 5542ee75ca063fa9da964ad163ab45d0c30a6158
- `src/features/videos/providers/content-hash.ts` — undefined → 8632ad5182211296d9c137d49eefc7bac64f4406
- `src/features/videos/providers/free-api-provider.ts` — undefined → d6629fe829921393c8c5bfc7965b96f557b8cf99
- `src/features/videos/providers/hf-space-provider.ts` — undefined → e985fcf5164830c8d59e5fd3adf329d994f4ca19
- `src/features/videos/providers/provider-router.ts` — undefined → cbf315407489e5abcb7de2a3e23cd2a667a7586d
- `src/features/videos/providers/template-provider.ts` — undefined → b5744b740922375aec8e1d410557fc09eee977a8
- `src/features/videos/providers/types.ts` — undefined → 9669fc97e08684962db9c143a6d522b276b2b784
- `src/features/videos/services/background-job-outcome.ts` — undefined → e91d6c76dd7ea2071f5366e1576760384dc42b6a
- `src/features/videos/services/narration-quality.ts` — undefined → d6ceea752928f0803b39263ef3785b81b8bd249b
- `src/features/videos/services/render-duration.ts` — undefined → 498feb6676300ac1a6a58ce5acd7639deb92f5a7
- `src/features/videos/services/template-config.ts` — undefined → a0b0dd0eb1b26b33cc12ea0b3cfc5849a4613b1e
- `src/features/videos/services/video-automation.ts` — undefined → 4b1d21ce88d2cb42aed294f901c377b8f1781377
- `src/features/videos/services/video-composition.ts` — undefined → 255382f55a11edfd0fc684b82d5f126835ee23be
- `src/features/videos/services/video-creative-variation.ts` — undefined → 50ce96af56a4f058e2b68d657a0ea9178ce5fc68
- `src/features/videos/services/video-publish-approval.ts` — undefined → 981b34eba593330cce889f7038b11ed58abab4df
- `src/features/videos/services/video-sources.ts` — undefined → 2d4d7e611e62e837836f8a0ffba6c1cfdab94af2
- `src/features/videos/services/video-template-version.ts` — undefined → 57d954843229dd63614ac5b867da93bd17d286a9
- `src/features/videos/services/videos.ts` — undefined → 1db2279a6c0f0c8b263933357e37414b5d87bfbf
- `src/features/videos/services/voice-profiles.ts` — undefined → b93347aace369af1708511685dfefe1484c70fff
- `src/features/videos/types/videos.ts` — undefined → 50c0d841bb22547e53af9238b53126a349dc7b6f
- `src/features/wird/services/progress.ts` — undefined → 7e7f2c2528bdd6fcb8f10db10d5d7695ed4467ce
- `src/features/zakat/components/zakat-dashboard.tsx` — undefined → e2cfc145fdd08149b79591c24eb88fff7704c60d
- `src/features/zakat/hooks/use-zakat-reminder.ts` — undefined → 7e7dd86e2ac77712c7217f595ad9b01a5e2ab615
- `src/lib/analytics/kids-events.ts` — undefined → 06de96ca6229d2a39f5c9aef63d7aeac1c668797
- `src/lib/audio/config.ts` — undefined → 745744ccad61dab051b37868bbe68048bc10e0e6
- `src/lib/audio/curated-library.ts` — undefined → 656c2ec053270464ccd319e029a0ecd1835271db
- `src/lib/audio/spiritual-tones.ts` — undefined → e7aeb7fbf75ca336d503c553a2f0c0ae60648d31
- `src/lib/auth-enhanced.ts` — undefined → 615a72ec8dfadadde99069f284821e8a712bfa3f
- `src/lib/content-quality.ts` — undefined → 8144caf0c7f9fef1df04025a3d738e311ee2a5b8
- `src/lib/data/content-merge.ts` — undefined → 9884ec828b1a95ab81fc3d2f3e30b49633c25467
- `src/lib/env.ts` — undefined → 3383b782df8db379548becc33255eb152e748030
- `src/lib/games/asset-manifest.ts` — undefined → eb9185bf6f4251e5f059d91c560ae9f56b3ae344
- `src/lib/games/content-manifest.ts` — undefined → 5dc4b3205669a81205e3fd5d03fd72712ebea18f
- `src/lib/games/game-instructions.ts` — undefined → bafdc76e1e65b051fa7f716427f38554fd89ba21
- `src/lib/games/game-missions.ts` — undefined → 3e2060a413dd509659d32c6bd0c42528ff65c5cd
- `src/lib/games/game-runner.ts` — undefined → 4996fe5880d219b92158d07788ec97c08f665f9e
- `src/lib/games/gameplay-helpers.ts` — undefined → f833e40d3a29810d90d73fe238bb461ea8929e40
- `src/lib/games/good-deeds.ts` — undefined → d9f863821bd2b85a3dfeebd9d098db1664aa6a3e
- `src/lib/games/hilal-fly.ts` — undefined → 45b7d8eb56277aca1af59cabe33adf52739d2ff7
- `src/lib/games/kids-level-system.ts` — undefined → ae2b6f014a1474af9b1f16907570cb93e021fdc8
- `src/lib/games/mosque-adventure.ts` — undefined → 24efb039e8359cefa848790d35d873a31fb5ed6d
- `src/lib/games/mosque-cleanup.ts` — undefined → c9fb680762df8ac1fdf748ead4bc93a6bc1bf927
- `src/lib/games/offline-queue.ts` — undefined → a31ed8bb35b808b358805da6e7b10ac3d6507ef8
- `src/lib/games/registry.ts` — undefined → 04178494a7141cfd36ea5ddec94076cc813e5c54
- `src/lib/games/run-stats.ts` — undefined → eba8d13f26910eb99f98df586b95ef4402518ca9
- `src/lib/games/search.ts` — undefined → fb98b237fdec87f9693097bcf9a6e7b9db1bbea6
- `src/lib/games/tone-feedback.ts` — undefined → 4b39256ff4a0c3f6ebb31702951adf06f378f922
- `src/lib/games/validation.ts` — undefined → 6ef06fe45f4a91441dec0d808fee4f1dfc387f1c
- `src/lib/games/verified-content.ts` — undefined → 67455a1a510a75722658bcf78d9f4e2401e1051a
- `src/lib/games/verse-puzzle.ts` — undefined → 0cac1b3fc26bbcd04e10630f3af4774f274bf93e
- `src/lib/games/zikr-coloring.ts` — undefined → 95548dae40ca41b28ec11fb16123f4e896c68160
- `src/lib/games/zikr-jump.ts` — undefined → 92437cedaf0ca9823fd01b22d2b989df4e73e60a
- `src/lib/games/zikr-road.ts` — undefined → c7c528d4d3a201d682d317e75be7db3d3aaf19d7
- `src/lib/games/zikr-runner.ts` — undefined → 8c12c4ccabdc021dcd8d2b64b5477357797b251d
- `src/lib/github/dispatch-workflow.ts` — undefined → 3ba1bf46952c39f3fd7a198d6b3d399833476cd3
- `src/lib/i18n.ts` — undefined → a758eff6f213b60900832499381e43458171ff3a
- `src/lib/i18n/server.ts` — undefined → cc8bd476fb40260a04dcdb9aea66b880a7c017be
- `src/lib/location/reverse-geocode.ts` — undefined → 1361587b201b7cff18ee1f7e0d05813d92dc7bdc
- `src/lib/navigation/catalog.ts` — undefined → da8beab3738e0b21daa9e3ba87f7dd98892a8d35
- `src/lib/offline-db.ts` — undefined → b9aec5f020a716f60ca45be2b4ef0eaa664a8929
- `src/lib/offline-pack.ts` — undefined → 5b75aa0e5acd113a6eac49eb4677ecd3250b9c30
- `src/lib/offline-settings.ts` — undefined → 21094150256249b8710db2b64d3359af89aab2ba
- `src/lib/push-subscription.ts` — undefined → 571e9af69b966f100cbab1236f62d392b19cedea
- `src/lib/search/arabic-normalization.ts` — undefined → ea3be70e7eea4d9350858c4e3a416279ce8c80ab
- `src/lib/security/pwned-password.ts` — undefined → f6b2d5c600f6ade4ef49564821d89cc157c0dbc0
- `src/lib/seo.ts` — undefined → 46f67324e04addb45b1e8933987199b7d680e264
- `src/lib/services/api-health.ts` — undefined → 363ea4e047ff369bd3a21be74c011613d7e3cc2f
- `src/lib/services/http.ts` — undefined → 7cbb28848b52871e368559d95dcc976a3d492a87
- `src/lib/services/storage.ts` — undefined → 5b087960e10ca5717195f503265fe3ff4e04df85
- `src/lib/site.ts` — undefined → 1a17ac0891c41af85b6099d8967e3c451b87320d
- `src/lib/smartlink.ts` — undefined → 424a45a320320f08fbfdf60eb3822db733862638
- `src/lib/supabase/admin-rest.ts` — undefined → 82a11ee9adfb2c748d6e6bc3b65f2283b4bd5b80
- `src/lib/supabase/client.ts` — undefined → 1ababcb739823b3f859140ceec39f06271f5edc0
- `src/lib/supabase/guard.ts` — undefined → 928483eb32aa09996a679af394f40508ec8f20bb
- `src/lib/supabase/middleware.ts` — undefined → b1500990cad139074a8d04c63aa89ef611f40c8d
- `src/lib/supabase/server.ts` — undefined → ff70b87c80fc7b08ba72f6fbaddcd6362dc95054
- `src/lib/types/common.ts` — undefined → c5dde775a65fc3f515a9f0e781aa41538af9f332
- `src/lib/types/prayer.ts` — undefined → 061ddac3e4db6a0ff6d023c9ab6e4be5f0835fc1
- `src/lib/types/supabase.ts` — undefined → bcaef7da96fa36146a103bbb9424e95cbdd6ac57
- `src/lib/types/video.ts` — undefined → a03d0ed723e620c07ea41f92ffdbae9662621ccf
- `src/lib/utils.ts` — undefined → 91bbff24394b392323fa4453b48a1a058ac6a64c
- `src/lib/utils/companions.ts` — undefined → 881d4ea1334a92a1391a46d54a9237f42ebb724b
- `src/styles/tokens.css` — undefined → f9fc69685b24f4b68db55c4e9540db627d0dc7ca
- `src/types/google-generative-ai.d.ts` — undefined → 2d5ebb0892e545705089a6a66472ea0b3ca40ee6
- `supabase/REMOTE_MIGRATION_LEDGER.md` — undefined → f440de3bb5072730b625f04021ee7505e287a63d
- `supabase/config.toml` — undefined → 15a6822eb0bad65fd52ff5a6dd14c3448668e491
- `supabase/functions/_shared/auth.ts` — undefined → 12bde6451e50ae53c891bd3e6adb608c987b1bab
- `supabase/functions/_shared/cors.ts` — undefined → 70afaf3e592032df48ee9f2ef60018849c588469
- `supabase/functions/_shared/islamic-ai.ts` — undefined → e8b631712b3c1275749a090614f6033bfee84b8d
- `supabase/functions/health/index.ts` — undefined → 63ba077a841a28f4d69c6fda1d44b7b31311072f
- `supabase/functions/prayer-notification-worker/deno.json` — undefined → 7ea69f477bf5d690084524cf9686f8315bc0c956
- `supabase/functions/prayer-notification-worker/index.ts` — undefined → 94aee46d005a185c0c40249c2ae2ed01ec453c60
- `supabase/functions/source-verified-content-agent/index.ts` — undefined → 91ece13922f94953bc57210a62774a0f16d72a7f
- `supabase/functions/spiritual-ai/index.ts` — undefined → f15bd6ca2723da6ece3a75273ca4dff9612eb4f2
- `supabase/legacy_migrations/20260929_080000_kids_games_enhanced_content.sql` — undefined → 6e08b54a9eb70a2478b8e55b179f93f890011bf3
- `supabase/migration-notes-0019-safety-fixes.md` — undefined → 8cae16332f28232f5de96b0c2bac51fc5fdf1b29
- `supabase/migrations/20240705000001_archived_legacy.sql` — undefined → f1be240b11158dc76ba73b66b74ac9674ca9edcc
- `supabase/migrations/20240705000002_archived_legacy.sql` — undefined → 3be1a1c1769f5f7ae85f034f66b64a0c2cd4a6ac
- `supabase/migrations/20240705000003_archived_legacy.sql` — undefined → 43ff8100115deea3b71118edc7574a6299e1e1f7
- `supabase/migrations/20250705000001_archived_legacy.sql` — undefined → c7c5b2d531b5fd6cc77c8b3189a291ff16d0963d
- `supabase/migrations/20250705000002_rls_triggers_storage.sql` — undefined → 5a370a0a5d77afd59d16fbb3f2fa2abbbada8021
- `supabase/migrations/20260530000000_0000_young_rattler.sql` — undefined → c98edfcd18a3ab8657bb91a289e2e72210761fea
- `supabase/migrations/20260530000100_0001_wakeful_stepford_cuckoos.sql` — undefined → c29cb9ff1c866b2a9d6654d2d0ddb4e1453f0a12
- `supabase/migrations/20260530000200_0002_noisy_nocturne.sql` — undefined → 29ac56c744848a0eaaa3e32695b46578ded8ff4f
- `supabase/migrations/20260530000300_0003_glorious_vanisher.sql` — undefined → 532fe1de2cb50d22852a93ffcde6147887d25273
- `supabase/migrations/20260530000400_0004_phase2_auth_foundation.sql` — undefined → 1d9702ee78abbfa202e915fde8d9095d9150c56a
- `supabase/migrations/20260530000500_0005_phase3_content.sql` — undefined → 967a21ab29d3f60d74d204c10115f16bde9306b2
- `supabase/migrations/20260530000600_0006_phase4_scholars_stories.sql` — undefined → ba229e38d66ccdf173c7850e7b440fc95d69869c
- `supabase/migrations/20260530000700_0007_production_hardening.sql` — undefined → 9cf74b50765b8278771fe35135fd989f964a6f22
- `supabase/migrations/20260530000800_0008_rls_hardening.sql` — undefined → ce2205a16132baad66c17cb0b72ef3023bef1690
- `supabase/migrations/20260530000900_0009_admin_memorization_youtube.sql` — undefined → 2223c433b1126e11e1aa5ec07a22fe9ad04518ce
- `supabase/migrations/20260605000010_0010_missing_content_modules.sql` — undefined → 1fe88f247f23e07d1aaec3464b8ae206fff45874
- `supabase/migrations/20260607050808_0011_videos_and_categories.sql` — undefined → f7a55d9e534f376faf5677bfc80f4c2e0112652e
- `supabase/migrations/20260610000012_0012_prayer_times_system.sql` — undefined → a9e486d038d3eccbd2c9a881383114dbc6d5cd10
- `supabase/migrations/20260610000013_0013_tawasheeh_and_reciters.sql` — undefined → 3c6ef94d5ce5515f16320781a9022f0c4e7b6928
- `supabase/migrations/20260610000014_0014_content_modules.sql` — undefined → 03cbb8afa6f76d4a78988bf4878316c2efae1b37
- `supabase/migrations/20260630000015_0015_comprehensive_rls.sql` — undefined → 6f91056c0edd64e0b7b2fba9f2f83fbb6b4dadb2
- `supabase/migrations/20260630000017_0017_video_automation.sql` — undefined → 212f9860cad024ec4639d2f94c3073898a5c825a
- `supabase/migrations/20260704000016_0016_auto_profile_creation.sql` — undefined → 02adffdd83bc3021d0580f80daf486e24bb9a916
- `supabase/migrations/20260704000018_0018_complete_missing_tables.sql` — undefined → 738e5153de58eb6749d1d82add94738bb8a3259f
- `supabase/migrations/20260705000000_0019_safety_fixes.sql` — undefined → 95c6cb29b857d4007369691f2f336770f8869d93
- `supabase/migrations/20260705000014_0014_tawasheeh_seed_data.sql` — undefined → 83bc92ba94acdd00cc62ca1002101249eebf1568
- `supabase/migrations/20260705000019_0019_safe_guards.sql` — undefined → 4a86b9d45df39adba006f4df4004a7a8d21b4e50
- `supabase/migrations/20260705070523_archived_initial_schema.sql` — undefined → a092f8cce13e86ffc1af598c7ea7580cfe33b54a
- `supabase/migrations/20260705070652_archived_rls_triggers_storage.sql` — undefined → eddfde3eeb1685708e55751701310f4a1e539e31
- `supabase/migrations/20260706000020_0020_fts_catchall.sql` — undefined → abc7356adbae4e1beb5476dc9fddd183fc04d8fe
- `supabase/migrations/20260710000001_video_error_columns.sql` — undefined → 2a3a6480532d9f84f423b8c6a29a421590f89f2d
- `supabase/migrations/20260710000002_0021_drizzle_sync.sql` — undefined → 6552164e6ea7b177cce15408c41698e8e7aa2f22
- `supabase/migrations/20260807000001_google_oauth_profile_sync.sql` — undefined → d3f844280073082047016c9e1c05e2aea19760dd
- `supabase/migrations/20260807002000_0020_cancel_billing.sql` — undefined → 658e4aa095043258392ce14f840d9e0d043be638
- `supabase/migrations/20260807080425_20260807_fix_security_findings.sql` — undefined → 898fce852e33045c092d7fba3a1d427420981ea0
- `supabase/migrations/20260807080459_20260807_revoke_explicit_execute_grants.sql` — undefined → a8207ba0ff91ddb1fac1d917970f04053c8058b4
- `supabase/migrations/20260807090000_20260807_restore_runtime_tables.sql` — undefined → 379d7a23c0e01ba559ae8d2f2f9ee7e09a1998a4
- `supabase/migrations/20260807131440_revoke_execute_on_profile_trigger_functions.sql` — undefined → 0867c772e71b909bcd7780fd41e2cc77a766331d
- `supabase/migrations/20260807131504_revoke_explicit_execute_on_profile_trigger_functions.sql` — undefined → 1eeaa45ec42e70871ab352f3a5297743ad5505c8
- `supabase/migrations/20260814120000_0033_atomic_kids_share_counter.sql` — undefined → 0f38aab538a9a393b5595e71194bdf8bf5803f63
- `supabase/migrations/20260814121000_0034_lock_down_kids_share_rpc.sql` — undefined → 235ed2b8e21848de64782e5c497773aec7cfe346
- `supabase/migrations/20260814122000_0035_reconcile_contacts_notification_column.sql` — undefined → b807416ef100dfe3a046c5777d6686765f500db4
- `supabase/migrations/20260814123000_0036_harden_admin_rls_predicate.sql` — undefined → 262256a5b3e3f60b23c413cb80e4bd64ca20dc3f
- `supabase/migrations/20260814130000_0037_durable_heygen_jobs.sql` — undefined → cf431094b80ae425fa830cadb634e99765a36dbf
- `supabase/migrations/20260814140000_0038_harden_profiles_auth_integrity.sql` — undefined → bb4fc1bb16c327bf1057fd0dbddd50e6fd5fe8bc
- `supabase/migrations/20260814141000_0039_restrict_profile_guard_execution.sql` — undefined → d3f8033218da65fe2f91f163e63f613bbd79d7b6
- `supabase/migrations/20260814143626_add_missing_foreign_key_indexes.sql` — undefined → 73c511db7e96bc52a635ac7f307476db82ecfd19
- `supabase/migrations/20260814143804_optimize_rls_auth_initplans.sql` — undefined → 64212e7ec5b6a67df8474b7b7704c1e28f540fab
- `supabase/migrations/20260814143905_optimize_rls_jwt_initplans.sql` — undefined → a23aa9ff98fd04d9cdd79a05c066a79433e860df
- `supabase/migrations/20260814153000_0040_restore_login_profile_timestamp.sql` — undefined → a32c454d3c810e56712ce8451d04e4a4ff2bdf34
- `supabase/migrations/20260814160000_prayer_push_scheduler.sql` — undefined → e0e294b5538ad1c18d7e3315d31a0f7e9cea3623
- `supabase/migrations/20260814170000_0042_cleanup_duplicate_foreign_keys.sql` — undefined → ddbc9ce4f84f144b8b8204e3a1e0c74eecfb4a23
- `supabase/migrations/20260814180000_0043_scope_admin_policies.sql` — undefined → effe93dee9cc1fdc9548d5007b41d35c1982ea36
- `supabase/migrations/20260814182908_cleanup_supabase_duplicates.sql` — undefined → 44031768dbb7d25f3079f8dc666babeb952dbbe2
- `supabase/migrations/20260814183000_0044_explicit_internal_table_denies.sql` — undefined → 28876d7ceb980fec2a428ad7dba83b665a2fc122
- `supabase/migrations/20260814190000_0045_background_dhikr_reminders.sql` — undefined → ca8dc97645af357199eec1b136ec4a94ddfe7567
- `supabase/migrations/20260814191947_cleanup_duplicate_content_policies.sql` — undefined → 5eed6c8fbcb47d504c57936161497a515080e5be
- `supabase/migrations/20260814193230_video_processing_scheduler.sql` — undefined → 39a85de268292141802c94b45b907e91bdcff23a
- `supabase/migrations/20260814214330_0046_video_assets_storage.sql` — undefined → 3accca7b6c8f606205b4b588517201bb113fec6e
- `supabase/migrations/20260814215000_0047_hadith_metadata_columns.sql` — undefined → f850a622cc897f56fbae1fe48d448f236f54bb7e
- `supabase/migrations/20260814220001_seed_open_hadith_library.sql` — undefined → a5d195786f98c313707a86e1c792d8bbfc94916b
- `supabase/migrations/20260814220002_seed_open_hadith_library.sql` — undefined → 92f6abf85a983ec8967a8f3d4947a88352720918
- `supabase/migrations/20260814220003_seed_open_hadith_library.sql` — undefined → 2e0bb079624c92df95ddf686723deb9c48e0ae86
- `supabase/migrations/20260814220004_seed_open_hadith_library.sql` — undefined → 0a5f257200a357558230b34c1bdd755710b27012
- `supabase/migrations/20260814220005_seed_open_hadith_library.sql` — undefined → 5852e1d13450919d655022bb0e090d2c0d2dd342
- `supabase/migrations/20260814220006_seed_open_hadith_library.sql` — undefined → 347c77723b5fecc978130785de0920fa9fbe6b9f
- `supabase/migrations/20260814220007_seed_open_hadith_library.sql` — undefined → 0091b342313869f556c9eb444983171cd5c27cfd
- `supabase/migrations/20260814220008_seed_open_hadith_library.sql` — undefined → 3bcf990d5485983713ffa9a7ab77080faafef20c
- `supabase/migrations/20260814220009_seed_open_hadith_library.sql` — undefined → 82ba662cb59c00b78fc7ba5bba577a3ecf521e68
- `supabase/migrations/20260814220010_seed_open_hadith_library.sql` — undefined → 7bc47a049b722f74d781a72c3d7c80472393aeba
- `supabase/migrations/20260814220450_seed_open_hadith_library_01.sql` — undefined → 63bfb649d7e69ffef6aa6fc8965aaccb8df6ef2e
- `supabase/migrations/20260814220507_seed_open_hadith_library_02.sql` — undefined → 76883fa68030070314c2c4d16c7f5717a85d5636
- `supabase/migrations/20260814220522_seed_open_hadith_library_03.sql` — undefined → 52ce3f55ad014e3272bd6b9fb37e0c0a12b664be
- `supabase/migrations/20260814220538_seed_open_hadith_library_04.sql` — undefined → 645be772dacdf3a51cfcf601f5b158328304827a
- `supabase/migrations/20260814220555_seed_open_hadith_library_05.sql` — undefined → f08352558bf2e5d204f673c32be680e6d5dbaa85
- `supabase/migrations/20260814220612_seed_open_hadith_library_06.sql` — undefined → 58db6abded2b609a7ba018de313cef40464f2840
- `supabase/migrations/20260814220631_seed_open_hadith_library_07.sql` — undefined → 955b95db23b40199a4dbf75193fbf31d8643c03c
- `supabase/migrations/20260814220647_seed_open_hadith_library_08.sql` — undefined → 9aa586875d997d257957eaf5f5da3688b0b5ee41
- `supabase/migrations/20260814220703_seed_open_hadith_library_09.sql` — undefined → f94538db8e1fe4a74c01b0d90e215f1e023ac579
- `supabase/migrations/20260814220720_seed_open_hadith_library_10.sql` — undefined → 150230f087430e283890fe36c1c7050975cd8aae
- `supabase/migrations/20260814221000_seed_content_library.sql` — undefined → 84bc5b892e81924066eb289ade58e2ab531b24bb
- `supabase/migrations/20260814221014_seed_zikr_content_library.sql` — undefined → e7e07d0b728e881e2f95100fe93d6d9a2faa5369
- `supabase/migrations/20260814221746_0047_hadith_metadata_columns.sql` — undefined → 2e0840d08a46943e943e6bc92c365a8c27d395ef
- `supabase/migrations/20260814221931_seed_zikr_content_library.sql` — undefined → bc2cbe8e0f1dd5bd59249cbf388a00fa8f1f2725
- `supabase/migrations/20260814222022_seed_zikr_content_library.sql` — undefined → 4be8f2a0d22f0f41c65d9839c849974e2b166d8e
- `supabase/migrations/20260814222316_seed_zikr_content_library.sql` — undefined → 42a01023e57e5b95f4466541d7f8d24ac601ccf8
- `supabase/migrations/20260814222836_seed_open_hadith_library_01.sql` — undefined → a642b321e00ea560908c9b88069a32d7d40dffad
- `supabase/migrations/20260814222853_seed_open_hadith_library_02.sql` — undefined → 15f814442bf4945c74a57c3ee8cb69b5a4b88e3d
- `supabase/migrations/20260814222910_seed_open_hadith_library_03.sql` — undefined → df91f971847a58ada8d3aecdf9ddea5b00e5a420
- `supabase/migrations/20260814222927_seed_open_hadith_library_04.sql` — undefined → e92f9020034d4773b29aa3c9f1f1f31b23169a9e
- `supabase/migrations/20260814222946_seed_open_hadith_library_05.sql` — undefined → 943e0c08da08a769a3835d748d725d12e6e65518
- `supabase/migrations/20260814223005_seed_open_hadith_library_06.sql` — undefined → dcd78edd28645ac0d6634fc566cfdfc43119b263
- `supabase/migrations/20260814223026_seed_open_hadith_library_07.sql` — undefined → 800677de65b2a9e66a3b115da3060a797c37bc4d
- `supabase/migrations/20260814223050_seed_open_hadith_library_08.sql` — undefined → ba34878362d1408b268f92ae71b9f3023ff4cfea
- `supabase/migrations/20260814223152_seed_open_hadith_library_09.sql` — undefined → 9f8b2b54d51a08599d5f325194ef218d11a6026a
- `supabase/migrations/20260814223211_seed_open_hadith_library_10.sql` — undefined → a23db3bf9d86a0ad7c129099e762eb94e5de6864
- `supabase/migrations/20260814224131_campaign_content_expansion_20260815.sql` — undefined → 431fcb1e64e1f648cf3a137b655641cb26049ea2
- `supabase/migrations/20260814224329_general_content_expansion_20260815.sql` — undefined → 3bd485a6c27973b200f0cb610cb515865d261f48
- `supabase/migrations/20260814224432_general_content_schema_compat_20260815.sql` — undefined → 6f7987a9f13fc9b5da0e7c2eb48ef9be94e792a0
- `supabase/migrations/20260814224556_companion_stories_expansion_20260815.sql` — undefined → 2dd5d6186c1629ad6aaf0957bb88c160dbc00a37
- `supabase/migrations/20260814224800_companion_stories_expansion_20260815.sql` — undefined → 6c57adeece81cd45e3f0b462155ddbdc349738c1
- `supabase/migrations/20260814224845_companion_schema_compat_20260815.sql` — undefined → fef09a5bc2478a1d307a34101289e87caea786ce
- `supabase/migrations/20260814230001_seed_hadith_expansion_01.sql` — undefined → ba18fe24501e0448edcfcd1ff0dbb5f70d39d220
- `supabase/migrations/20260814230002_seed_hadith_expansion_02.sql` — undefined → 0e649fd052dd4a618480292536385cb1f4461639
- `supabase/migrations/20260814230003_seed_hadith_expansion_03.sql` — undefined → e704a3104f0f9052b3fa1937105a5b2c43bdf3da
- `supabase/migrations/20260814230004_seed_hadith_expansion_04.sql` — undefined → 91b97dfdd6fcb27471554aa253e9ca534a581854
- `supabase/migrations/20260814230005_seed_hadith_expansion_05.sql` — undefined → 6dc676fe599e3293e99934287d1433ca6d1eaf26
- `supabase/migrations/20260814230006_seed_hadith_expansion_06.sql` — undefined → d7cb753c7b5a2f7e6947e591b662b24530cb1dfa
- `supabase/migrations/20260814230007_seed_hadith_expansion_07.sql` — undefined → e6e2ca0e59b9257e11206b7ea19f2ed07f78f220
- `supabase/migrations/20260814230008_seed_hadith_expansion_08.sql` — undefined → b6f8d0fdde2750d68005c45a529b428e22d7533a
- `supabase/migrations/20260814230009_seed_hadith_expansion_09.sql` — undefined → b1e498d55d73d6e49bdc50f8dd5f1f486bee374e
- `supabase/migrations/20260814230010_seed_hadith_expansion_10.sql` — undefined → 91c1a6606a75a77a03e411192c6f6f828a3915b2
- `supabase/migrations/20260814235407_harden_legacy_admin_rpc.sql` — undefined → 6534e256bace8cdeb5f34c246f4b919c275a40a6
- `supabase/migrations/20260815004709_kids_adventure_library.sql` — undefined → 4cccfde3817bf426dd28673f3c9d1dce46a08312
- `supabase/migrations/20260815104409_harden_prayer_times_cache_rls.sql` — undefined → 0bf916ef45d6585465ee28a22ec06ee47ea10f55
- `supabase/migrations/20260815104455_deduplicate_prayer_times_cache_policy.sql` — undefined → 7843a157c0dd725f9c7e7d65d2782a55c9cce014
- `supabase/migrations/20260815113852_index_content_references.sql` — undefined → ee88a0d2a0bd94070be80b52a8ea9441684db754
- `supabase/migrations/20260815114042_expand_companion_biographies.sql` — undefined → 027deb257aeebe509ed8472edbc645a06e7855fd
- `supabase/migrations/20260815115851_cleanup_multiple_permissive_policies.sql` — undefined → 3d1d9cd9f3b4543af26b3aabc3cb956306bedf74
- `supabase/migrations/20260815120950_remove_video_categories_policy_overlap.sql` — undefined → cba2519cc381c9bac76c3573d4389c2e3c15b3ae
- `supabase/migrations/20260815220000_campaign_content_expansion.sql` — undefined → 640287f88c145ba283d195bb4fcbadfe6bdacd6a
- `supabase/migrations/20260815220500_general_content_schema_compat.sql` — undefined → 0e441e008c87bf25689a86e80eeb42534e2d7e11
- `supabase/migrations/20260815221000_general_content_expansion.sql` — undefined → 4331b6ea48fc5208a1e210b3786164b1c9dfda64
- `supabase/migrations/20260815221500_companion_schema_compat.sql` — undefined → 5a06a8fc66663408ceb645cd377f0b633992be5f
- `supabase/migrations/20260815222000_companion_stories_expansion.sql` — undefined → fb4c242d44f002e7fe12888ae8691317f709aa06
- `supabase/migrations/20260815223000_harden_legacy_admin_rpc.sql` — undefined → 4021fc10ad6fc1d3be7a23d953c4eedc6c1830a0
- `supabase/migrations/20260815235000_kids_adventure_library.sql` — undefined → eb0dddbe304cbc2c2bba08b7de4c4e2825e85f0f
- `supabase/migrations/20260817074018_quran_expansion_schema.sql` — undefined → f21a5b8fec45091e37d9f0f002231d347bec7ba3
- `supabase/migrations/20260817074038_quran_tafsir_expansion_01.sql` — undefined → 6b0a1bab2b0d78571c75a6393b0ff4ce329cce5d
- `supabase/migrations/20260817074103_quran_tafsir_expansion_02.sql` — undefined → 27f4eaa05804401bdda96240554f7f474dbc0b14
- `supabase/migrations/20260817074131_quran_tafsir_expansion_03.sql` — undefined → c0b26ed36e0e6d9455d641d0693e1591c657ee82
- `supabase/migrations/20260817074153_quran_tafsir_expansion_04.sql` — undefined → ccec23e4018cd5e51dd3f6482e4c1d67f9eadafd
- `supabase/migrations/20260817074216_quran_tafsir_expansion_05.sql` — undefined → 12aec5e2bf2d47f58d0c649f3382628e5627a3a8
- `supabase/migrations/20260817074237_quran_tafsir_expansion_06.sql` — undefined → df5c95adb07ff197187af9cd8355d584f41d240b
- `supabase/migrations/20260817074304_quran_tafsir_expansion_07.sql` — undefined → 1cee5972d1b6bcd6cffaf2a40cf57a15037b3eb6
- `supabase/migrations/20260817074324_quran_tafsir_expansion_08.sql` — undefined → 932d3076686c05369b1129e2a069a1700fe03c51
- `supabase/migrations/20260817074342_quran_tafsir_expansion_09.sql` — undefined → 81080cf477c291f3d97c54b9f4d3e50c5f529dcf
- `supabase/migrations/20260817074401_quran_audio_expansion.sql` — undefined → 8fa2e9db3d6c5b35cd9d07db84b30a90fa326405
- `supabase/migrations/20260817075255_quranic_duas_expansion.sql` — undefined → 1a330e0a81b511aa727a0dbd7404656ecfc4cf00
- `supabase/migrations/20260817075724_articles_expansion.sql` — undefined → 916bf3e6e14d4155212b3c3900b4cba6529c7e13
- `supabase/migrations/20260817081135_hide_unverified_media.sql` — undefined → 603d6d8b17f9b7e2ad82001c97dfb0ab01560a46
- `supabase/migrations/20260817113003_dhikr_quran_articles.sql` — undefined → 68ec04f90d1aeaf0b302dfad39939b9975a4c44a
- `supabase/migrations/20260817114548_reconcile_companion_biographies.sql` — undefined → daad2f415dee2063e92d0501b54d5cfddec8780c
- `supabase/migrations/20260817114822_index_scholar_biography_sources.sql` — undefined → e6557f05d0c5a0f1d011e522d57ebf9c31ed5fdc
- `supabase/migrations/20260817210802_expand_prophet_stories_from_quran.sql` — undefined → 11b824e2380346da694f595258e0b89555c7696b
- `supabase/migrations/20260817210929_deduplicate_prophet_story_references.sql` — undefined → 90bb4ed305267aa98f103923f94e4da119691831
- `supabase/migrations/20260817211606_index_article_source_urls.sql` — undefined → 9108252c515f7eee99edd216ab08dd34e621257d
- `supabase/migrations/20260817213201_fix_prophet_story_newlines.sql` — undefined → ddb5d72d01d98a2ab10bbc815c7f4fca24a4a00b
- `supabase/migrations/20260817213758_replace_literal_newlines.sql` — undefined → 0dddaa51cb0ca1d97a32e6a6ea48082a3f05abd8
- `supabase/migrations/20260817220127_add_automation_dedup_keys.sql` — undefined → a8471f621a92645338b7da139d3a3f9f071e64c3
- `supabase/migrations/20260817222000_index_prophet_story_completeness.sql` — undefined → 2f688723d16835e4a992d104fe4fd421a5fa58c6
- `supabase/migrations/20260821175629_source_verified_content_agent.sql` — undefined → db4633567516f079e639c90adfcc0917f5970c7a
- `supabase/migrations/20260821175933_schedule_source_verified_content_agent.sql` — undefined → 4c49e04a74e65e10a8409c69340f9ac03d8bb4a7
- `supabase/migrations/20260821192434_tawasheeh_verified_audio_expansion.sql` — undefined → 19b3f162d1965d4e8ea26663f1b3e3ea9d271da6
- `supabase/migrations/20260822080822_verified_companions_scholars_content_pack_20260822.sql` — undefined → 4c88f5ab788d46064770c84e7b1b12d7ee4a174c
- `supabase/migrations/20260822081012_fix_verified_content_reference_shape_20260822.sql` — undefined → 1d14e4e36d511e574abc852660b5820134059469
- `supabase/migrations/20260822081106_normalize_companion_reference_types_20260822.sql` — undefined → e572f2a0735be4b0e9d125a91fab9c04f29c0ed8
- `supabase/migrations/20260822200947_grant_profiles_authenticated_table_privileges.sql` — undefined → 70399e3bc163e5dfcb25c81eb630b3a38dcd4c3d
- `supabase/migrations/20260827175416_kids_game_results.sql` — undefined → 7934c5597b84e2c5b91d7cde175fb5bbe97be224
- `supabase/migrations/20260827175605_optimize_kids_game_results_rls.sql` — undefined → ace6389b9aaab2c891f2f4e6ad92554018ee38cd
- `supabase/migrations/20260827182800_kids_world_progress.sql` — undefined → 2f4778f30150b48f8426e02784442a557a0bf6ae
- `supabase/migrations/20260827182831_seed_kids_world_games.sql` — undefined → 8768c6a4833f20cd4032319f20471f5213e90d71
- `supabase/migrations/20260827184319_kids_world_function_security.sql` — undefined → 1f436c8ca9ec5649b8c448e0164d8286499aeb61
- `supabase/migrations/20260827184749_index_kids_achievement_fk.sql` — undefined → 29bab6ed45db3d8b0254db4cecc1825f07b55595
- `supabase/migrations/20260827185900_kids_world_secure_result_processor.sql` — undefined → 5cfc11c496c1121f43f5d50eb7509a1dbeb3d7c4
- `supabase/migrations/20260828000000_site_audio_assets.sql` — undefined → a323a24606d2c9d9549ddcc566cc16f41f8658de
- `supabase/migrations/20260828000001_youtube_feed_cache_history.sql` — undefined → ad734c7b9eb4b32375d99efa316e60c22f1041bb
- `supabase/migrations/20260828000002_site_audio_assets.sql` — undefined → e9964951a5cbf2719d0ba9c9c5f29e486d42965d
- `supabase/migrations/20260828000003_youtube_feed_cache.sql` — undefined → 036761c629b34bb2c8bc549ec5f68d09e26cdb5b
- `supabase/migrations/20260828075228_harden_youtube_trigger_search_path.sql` — undefined → cc2b6f72420afc2f0a8c93ceed485720cb206acc
- `supabase/migrations/20260828111711_harden_youtube_trigger_search_path.sql` — undefined → 718e0a238fd9430bca18897bc45d042b4ede49e1
- `supabase/migrations/20260901012050_harden_youtube_trigger_search_path_final.sql` — undefined → 3b26db4d8b73b3f0b36837c3c8365925bdbebe17
- `supabase/migrations/20260901034914_youtube_facebook_native_sync_phase2.sql` — undefined → 95008589c605eda84d136326c7d92e45897bbef9
- `supabase/migrations/20260901035110_youtube_facebook_sync_scheduler_auth.sql` — undefined → 5af5a2d39446acdf87f18ccb40f64544d7a186a9
- `supabase/migrations/20260901035139_youtube_facebook_sync_state_seed.sql` — undefined → e1c854d79d89c92bd55782455c04c0ba35122d02
- `supabase/migrations/20260901041737_allow_direct_native_publish_without_storage.sql` — undefined → c2e7e6e07ef290015525ebd11819d51c72a04873
- `supabase/migrations/20260901043149_20260901090000_create_admin_actions_audit.sql` — undefined → 0296afa4337e7ccaf521da68dc2131bc2a7fc414
- `supabase/migrations/20260901051927_youtube_facebook_backfill_cursor_and_retry.sql` — undefined → 87527bd11abf050e58b9dd2dee221963dd61981c
- `supabase/migrations/20260901051946_youtube_facebook_backfill_cursor_v2.sql` — undefined → 2b02d64305efb29d7809e5082e7fa91a8c08dade
- `supabase/migrations/20260901051951_youtube_facebook_sync_retry_safety.sql` — undefined → 6e1e9ba7d90db9aa4f14fce4dc3e5a4e9badb7e8
- `supabase/migrations/20260901052054_protect_social_sync_publication_state.sql` — undefined → 38325d1970728290717026a2ebce03489e1c05d8
- `supabase/migrations/20260901053058_add_youtube_facebook_media_import.sql` — undefined → 4062ec35786a1ccb6228c77fae665cdf6148a3ca
- `supabase/migrations/20260901053451_add_youtube_facebook_media_cleanup_tracking.sql` — undefined → 83f09b5a910f7cddbca6cfb0340092e8ce74b2d9
- `supabase/migrations/20260901053510_schedule_youtube_facebook_media_cleanup.sql` — undefined → 88fdb4441c96cd7237d1cc31f9fb1da32c043d0c
- `supabase/migrations/20260901053559_schedule_youtube_facebook_media_cleanup.sql` — undefined → 32d7c448ab50ef173c42afe5e8dd807768e41a11
- `supabase/migrations/20260901055136_harden_admin_audit_rls_and_audio_fk_index.sql` — undefined → 1c06e668c0eece1f6e9322a36c0e4748f3f99882
- `supabase/migrations/20260901055404_document_current_hardening_state.sql` — undefined → b727754a4f29cbc5d92d428095213f237a7c9ad5
- `supabase/migrations/20260901090000_create_admin_actions_audit.sql` — undefined → 1b50775b127459174d6d538aba844dc67f379aa8
- `supabase/migrations/20260901103753_content_hub_admin_library_20260901.sql` — undefined → fe3bf7e33bcd625f6e5aa762860fb69494e9e211
- `supabase/migrations/20260901105000_rebuild_content_hub_schema.sql` — undefined → 573398f36166394b706b6e8391b0793d326c94d2
- `supabase/migrations/20260901105107_security_performance_hardening_20260901.sql` — undefined → 56eb78c61e5183e25e8d8db157c096d10f4c1306
- `supabase/migrations/20260901105124_dedupe_library_rls_select_policies_20260901.sql` — undefined → 326ec36d7923b850dcbd54da94745ae9c10bfb1c
- `supabase/migrations/20260901120955_compatibility_media_assets.sql` — undefined → 561f0573eee8416180719af0833d2a01f829fd20
- `supabase/migrations/20260901123902_final_rls_security_cleanup.sql` — undefined → 65060d8a2b36c6ba9b96874bb04b151ec94815bd
- `supabase/migrations/20260901124136_lock_admin_snapshot_rpc.sql` — undefined → c85030a8203f2292ace6b13aa696478646d01fdd
- `supabase/migrations/20260901124303_remove_remaining_content_hub_policy_duplicates.sql` — undefined → 8597d10aaa7d918f31d73d5dec2e3e6b77dd9929
- `supabase/migrations/20260901155000_remove_remaining_content_hub_policy_duplicates.sql` — undefined → cc360c9cf28c1dda38f7ed9f87cb1e9139c268b9
- `supabase/migrations/20260901160256_relax_social_sync_processing_recovery_safely.sql` — undefined → a2c8483eb3ba5640f45927e7388bac2d9de759f8
- `supabase/migrations/20260901160713_social_sync_state_processing_guard_v2.sql` — undefined → 4cfd176dc54c66641a6e41599792c53dea1cfdfd
- `supabase/migrations/20260901162000_move_pg_net_out_of_public.sql` — undefined → 89bd3e50b12771a9ce4af090dd4884fdcf21e552
- `supabase/migrations/20260901162535_document_pg_net_public_schema_limit.sql` — undefined → fc34ee521f2abdf3082abf10afbc8e3e76371201
- `supabase/migrations/20260901162840_document_pg_net_public_schema_limit_v2.sql` — undefined → 36711e233847763d2f3dbd4e082dcd41afe2e7b0
- `supabase/migrations/20260901165051_reconcile_remote_migration_history_20260901.sql` — undefined → 61d1b901928f25b1df57694e1e7ea649a4662a4a
- `supabase/migrations/20260901194900_reconcile_remote_migration_history_20260901.sql` — undefined → bc080b00b5ee7c331ca22061ec4a01340bae11f8
- `supabase/migrations/20260904174702_restore_admin_actions_audit_table_20260904.sql` — undefined → 93006adc0cbb4c01067542d8b99efd39d473799a
- `supabase/migrations/20260905000000_reconcile_remote_migration_history_final.sql` — undefined → ecce46b09e482d3267d623fea71bba6e4a90504a
- `supabase/migrations/20260905013955_adsense_content_quality_hotfix_2026_09_05.sql` — undefined → 42ad2b88fa94e2d303cd0f39221d47d4d2f96cf8
- `supabase/migrations/20260905014003_adsense_content_depth_hotfix_2026_09_05.sql` — undefined → 56f69891cf9b35fed4d2c20850adc792386382f3
- `supabase/migrations/20260905190421_unified_admin_audit_immutable.sql` — undefined → 44ca8bd335b44cdc17ffde1246a52704d2331119
- `supabase/migrations/20260905193000_unified_admin_audit_immutable.sql` — undefined → 3659502cf0a9c9e5b169a635522eeb9f3cb344e2
- `supabase/migrations/20260905195702_admin_platform_foundation_20260905.sql` — undefined → f5c638034c01883470d132a69152042ff0f32579
- `supabase/migrations/20260905201128_admin_security_controls_20260905.sql` — undefined → 57bdba580a97f42eee1f552c70d461e3361c63d9
- `supabase/migrations/20260906164530_security_hardening_20260906.sql` — undefined → 353520248fb4d435284f562840ced559bf21b73f
- `supabase/migrations/20260907022407_backfill_published_article_english_20260907.sql` — undefined → b04f4c23054f4610c5d8e3ba3399bb37a99e72ce
- `supabase/migrations/20260907050000_backfill_published_article_english_20260907.sql` — undefined → 31037e5b0869af71a494efc8998510bbba1d1599
- `supabase/migrations/20260911021025_harden_social_video_reels_and_cleanup.sql` — undefined → 5653d5f7aa1140023b3d2ab0d13b00af51e86113
- `supabase/migrations/20260911030000_harden_social_video_reels_and_cleanup_reconciliation.sql` — undefined → bc9da596265c5e680509dc55c0d8dc9382a7288f
- `supabase/migrations/20260911031229_harden_social_video_reels_and_cleanup_reconciliation.sql` — undefined → 5d8d9a1535688ea5b0fe9e0b395c1158e53c1246
- `supabase/migrations/20260911040038_harden_rls_policies_and_deduplicate_fts_indexes.sql` — undefined → 434ba22fca02ef9e359df75e34d3df73ad3f9442
- `supabase/migrations/20260911040944_relocate_pg_net_to_extensions.sql` — undefined → e3ae5a747f90539c4b34610412e8f8568519cfaf
- `supabase/migrations/20260911150920_admin_rbac_assignments_v1.sql` — undefined → 4f9cb9a03a3f5b2a3037aea9110327adf73dd81e
- `supabase/migrations/20260911154207_harden_admin_rls_and_indexes.sql` — undefined → 139e4074ab60909131512efe0617cbee9241f0b8
- `supabase/migrations/20260911181500_admin_rbac_assignments_v1.sql` — undefined → 482355448ddce685d9824468cac310fbf202998d
- `supabase/migrations/20260911181501_harden_admin_rls_and_indexes.sql` — undefined → 6ef62211255d04f5c0f23c96fb32cbf4e3cf88f7
- `supabase/migrations/20260914065256_audit_indexes_20260914.sql` — undefined → 079c5b4c5a43c5b3c648e546eb71f2a26a7e28be
- `supabase/migrations/20260914065331_repair_video_queue_indexes_20260914.sql` — undefined → 30d89e5a3247c7a577a10deaf57fae258d697144
- `supabase/migrations/20260914065344_repair_video_queue_heygen_index_20260914.sql` — undefined → 596147e6d6e2c7e319193932e08f0abd954b1c8d
- `supabase/migrations/20260914065607_repair_rest_request_defaults_20260914.sql` — undefined → 5ed8d0e0f58a7257708a8aadb71f05a1b59001d4
- `supabase/migrations/20260914070033_reconcile_remote_migration_history_checkpoint_20260914.sql` — undefined → 8ab75b495e22ca0a47b61c9331d2fa085b1b0a01
- `supabase/migrations/20260915004110_retire_vercel_video_processing_cron.sql` — undefined → d8ab7c42ad9332daf5b22b7cef48287d98206b20
- `supabase/migrations/20260919012921_cleanup_content_library_scaffolding.sql` — undefined → 143121fab1c86a13a66b7c0958fd2617d53417aa
- `supabase/migrations/20260919012923_cleanup_quran_catalog_agent_queue.sql` — undefined → 2a27b6f853a78e19a8248dc871f44c8e19a3300d
- `supabase/migrations/20260919013530_editorial_expansion_articles_20260919.sql` — undefined → 216133840dccb63ac2148abed7dae859d1d0e3b9
- `supabase/migrations/20260919013633_editorial_expansion_stories_20260919.sql` — undefined → ed759a0cf6859b539bfe6a433bb3ab6a3e4bd0ce
- `supabase/migrations/20260919020218_reconcile_remote_content_expansion_phase1.sql` — undefined → f0d746e1badbf8b79a83a7c3d08a30ad4739098e
- `supabase/migrations/20260919020228_reconcile_remote_content_expansion_deterministic.sql` — undefined → 57439c150e01a8ee25bd21d5e90108cccd026795
- `supabase/migrations/20260919021149_reconcile_remote_content_catalog_phase2.sql` — undefined → 06caf871a9f40eeb13e50cbedaf1bf6da9fe7cc4
- `supabase/migrations/20260919021225_reconcile_remote_editorial_expansion_phase2b.sql` — undefined → 66c012215f408276b304ae67e061b9001400471a
- `supabase/migrations/20260919021236_reconcile_remote_story_expansion_phase2.sql` — undefined → b488aa5c537e1bfccab931592f41eca8642200d4
- `supabase/migrations/20260919021330_reconcile_remote_kids_content_expansion_phase2d.sql` — undefined → 519455be72866e3e36e12be62d9576bdf7d6a745
- `supabase/migrations/20260919021452_reconcile_remote_cleanup_subscription_legacy_column.sql` — undefined → 8c7c48fca3d8868ed0a90a1033a98d224cee7b0f
- `supabase/migrations/20260919044739_reconcile_remote_retire_orphaned_legacy_tables.sql` — undefined → 1c670669b615326fbcbe9ef43069db8438d8ead5
- `supabase/migrations/20260919045742_retire_orphaned_legacy_tables.sql` — undefined → c1bcb0e8cd21aadcaf4f2eddf496282916f10588
- `supabase/migrations/20260919050000_content_expansion_phase1.sql` — undefined → db030780e5bf2b54e1a79bb652efa079f892b89d
- `supabase/migrations/20260919050125_remove_redundant_nonunique_indexes.sql` — undefined → 5323f3ab2d6d4e4ec07f48216b4327956b88e162
- `supabase/migrations/20260919050332_remove_redundant_prefix_indexes.sql` — undefined → 8120d48df9c2f131bf77eb5d150d261804f7b069
- `supabase/migrations/20260919051000_fix_content_expansion_deterministic_and_publish_approved_stories.sql` — undefined → e87f42f79289cb679e26a21d1fdd94c168d9831c
- `supabase/migrations/20260919053408_canonical_quran_surah_counts_20260919.sql` — undefined → 54401ca60645dc1597901b1096187e212c1ba585
- `supabase/migrations/20260919060000_retire_orphaned_legacy_tables.sql` — undefined → 11282d6cbcb222aab6aa71b95a783a3e881e8f39
- `supabase/migrations/20260919065535_quran_supabase_storage_20260919100000.sql` — undefined → 0ec08367b136aef9cfb438126831c4d05728bfa0
- `supabase/migrations/20260929000000_quran_audio_external_source_status.sql` — undefined → 340efa1f12495feef0da1c1c2b99fd1ae7569d39
- `supabase/migrations/20260929010000_seed_canonical_quran_catalog.sql` — undefined → 801573bc0d7fec39c417a2d4ca53df635b571e42
- `supabase/migrations/20260929025052_quran_schema_compatibility_20260929.sql` — undefined → cc6dc3421b25249fb055e58f0ba2ec4cdf9ac66f
- `supabase/migrations/20260929035722_security_performance_hardening_20260929.sql` — undefined → 2dafc58416a0ecf282c9a6c2090b09013048052b
- `supabase/migrations/20260929035746_tighten_video_category_public_read_20260929.sql` — undefined → 87e48e7c56c45b9418b08ff9262d5774aa54fb89
- `supabase/migrations/20260929035802_deduplicate_video_admin_policies_20260929.sql` — undefined → 339a1c20250f5d8d698f94bb4a17ff4d0ab6311e
- `supabase/migrations/20260929035817_revoke_public_profile_trigger_rpc_20260929.sql` — undefined → b830c4968105e9239c0a9d5d0669ab447c124376
- `supabase/migrations/20260929035845_dedupe_exact_public_read_policies_20260929.sql` — undefined → 9f7f305b94c55d651bf552883bdc969785892636
- `supabase/migrations/20260929041121_scholars_catalog_expansion_20260929.sql` — undefined → 936006d100c0150f7200783194775774cba00d39
- `supabase/migrations/20260929041133_normalize_scholar_categories_20260929.sql` — undefined → a493f657d05731abbfe1fc294f7cf55070e91ca1
- `supabase/migrations/20260929042104_content_sources_articles_20260929.sql` — undefined → 6f79d8c6ac6194ffc1a7aa40a22985f3ebeac341
- `supabase/migrations/20260929042122_expand_fictional_story_records_20260929.sql` — undefined → 09321062822279a510911708c83283e727a48c92
- `supabase/migrations/20260929042147_expand_prophet_bios_and_references_20260929.sql` — undefined → 3e1f82481abf91ec2211fee61f1d054bb2e03110
- `supabase/migrations/20260929042156_expand_scholar_bios_20260929.sql` — undefined → 565cfb1a9f68852ee9235200c44173e67be66f1d
- `supabase/migrations/20260929042215_expand_companion_profiles_20260929.sql` — undefined → 337a7a4e0d9899264f9539b622acea441b160b8a
- `supabase/migrations/20260929042234_content_source_quality_hardening_20260929.sql` — undefined → 59dd7d5cc5d008a51b009e11d8494f3b736ecc44
- `supabase/migrations/20260929042337_prophet_profile_depth_pass_20260929.sql` — undefined → b324d09ba3a333a99a5380f7221676cc92463132
- `supabase/migrations/20260929042442_prophet_short_profile_depth_20260929.sql` — undefined → b9a1d40801e10a0f47ef0f6fda5869cd211dcf35
- `supabase/migrations/20260929042450_companion_scholar_depth_followup_20260929.sql` — undefined → c8b42fbdcc742b4e745fe8199cad65dfb5cb876f
- `supabase/migrations/20260929042509_annotate_missing_hadith_grades_20260929.sql` — undefined → 79d261555c4956142bbe1980a951e29daa10f98f
- `supabase/migrations/20260929044232_add_video_url_to_video_generation_requests_20260929.sql` — undefined → 88b33236eff9d4a2337bf10f7bd602fb49062cbc
- `supabase/migrations/20260929045633_create_social_publish_queue_20260929.sql` — undefined → 1d84a3492b0bdb4903cdc308f05e223eba18e4e0
- `supabase/migrations/20260929062722_security_seo_hardening_20260929.sql` — undefined → 7f33f02be820e23dcc8965feee44d799c24e47fa
- `supabase/migrations/20260929063916_revert_internal_table_policies_20260929.sql` — undefined → 23e6cd2944572eaacf923c0d4e3b44b8335b4732
- `supabase/migrations/20260929070000_070000_kids_games_modernization.sql` — undefined → 246660b0588c4a6f0372bcc750c99c18e07e48d6
- `supabase/migrations/20261001212603_video_pipeline_hardening_20261002.sql` — undefined → 8467f67683f7f85eec281e208665e97b96b64b0c
- `supabase/migrations/20261001214711_kids_games_schema_reconciliation_20261002.sql` — undefined → 9b95bd990d8147822d86a53f4d9359e596354a8e
- `supabase/migrations/20261001221622_kids_games_history_repair.sql` — undefined → 81dedc72f5adb43c054e0d24e920e86a07e3aa81
- `supabase/migrations/20261001230711_media_assets_legacy_compat.sql` — undefined → fd1b31615b3eed9b59e636e738acc052a06b33c3
- `supabase/migrations/20261002000001_video_pipeline_hardening.sql` — undefined → 8467f67683f7f85eec281e208665e97b96b64b0c
- `supabase/migrations/20261002042321_expand_audio_kinds_and_repair_duplicate_kids_index.sql` — undefined → 17b7564420ff394b190c26ad30b38cd87c7f2d2b
- `supabase/migrations/20261002042816_optimize_rls_auth_initplans_20261002.sql` — undefined → 8d3e06fed4cf97647ea033ce283bd6402f7490d3
- `supabase/migrations/20261002042835_optimize_remaining_video_narrations_rls_20261002.sql` — undefined → 54324afea9fe8f0566770933ffabb04390099f1f
- `supabase/migrations/20261002042917_editorial_content_expansion_20261002.sql` — undefined → cdf661050453abaa57af734a0e03929c2f4bc7d0
- `supabase/migrations/20261002044747_harden_free_tier_view_and_function_search_path_20261002.sql` — undefined → 06e176653dffbceae4abdc665889655d2fccdf64
- `supabase/migrations/20261002050101_verified_video_content_pack.sql` — undefined → d3b7d3b46482e7392b1b63eb72612bde1488c9bc
- `supabase/migrations/20261002054010_finish_rls_overlap_cleanup_20261002.sql` — undefined → 6a58ead3672e0b855c4ccda98f25243718fdf951
- `supabase/migrations/20261002054042_finish_admin_public_policy_merge_20261002.sql` — undefined → 193bb356c114721bb4aca228cf492aaa5261d40b
- `supabase/migrations/20261002065000_unified_videos_social_sync.sql` — undefined → 4d7e53c2e4acf28eddde298b491dd7b114414a80
- `supabase/migrations/20261002073929_phase6_security_hardening_20261002.sql` — undefined → 4d6387d5a556fb7c5d9230d7515ae3281ef48540
- `supabase/migrations/20261002090000_verified_video_content_pack.sql` — undefined → bc12ecd7f7dd44512efd0608e025a01a7c5432b4
- `supabase/migrations/20261002092943_retire_coordinated_legacy_subsystems_20261002.sql` — undefined → 9fc843e0b13f15e55d8c0077db5caffaec6168b4
- `supabase/migrations/20261002093637_govern_retired_indexes_20261002.sql` — undefined → 0eec2638476424095085611bc64a52282d3da487
- `supabase/migrations/20261002100000_multi_provider_free_video_engine.sql` — undefined → aa3c1d5f8132e39bfa1efdf34d4d4232af3f62e5
- `supabase/migrations/20261002110000_consolidate_rls_policy_overlaps_20261002.sql` — undefined → 398997cc6bedea40296b53ca22fa18695e5ed2ee
- `supabase/migrations/20261002113000_scheduler_hardening_20261002.sql` — undefined → c63c49e0679216781f520b366511625161bbf64c
- `supabase/migrations/20261002114000_retire_dead_media_cleanup_cron_20261002.sql` — undefined → d4cf34b854f0f0b8f83bdf534e64c7488ce0c9c6
- `supabase/migrations/20261002125440_remote_history_marker_video_automation.sql` — undefined → e9f63db14a702896c2f7c9480715b6174b66fcdc
- `supabase/migrations/20261002125451_remote_history_marker_video_automation.sql` — undefined → e9f63db14a702896c2f7c9480715b6174b66fcdc
- `supabase/migrations/20261002130000_retire_coordinated_legacy_subsystems_20261002.sql` — undefined → 2b67676da7772d4feed9261249c5575c326d2bf0
- `supabase/migrations/20261002133000_govern_retired_indexes_20261002.sql` — undefined → 4b6edbca97ebfded201526fa54977cb43d53b6c3
- `supabase/migrations/20261002155139_android_release_control_seed.sql` — undefined → e47282dbd87f23a30becf92e75cc2a05b07a1418
- `supabase/migrations/20261002155316_unified_videos_social_sync_20261002.sql` — undefined → 7ff1915f4600685629a9f84661798e7e33db0721
- `supabase/migrations/20261002160000_video_automation_queue_defaults.sql` — undefined → 1a8c50662d1d9400da240e488db88ca3026d4ca0
- `supabase/migrations/20261002160440_human_audio_library_20261002.sql` — undefined → b4d50e6d5772abaa0d085473e200487400a9a1ee
- `supabase/migrations/20261002170000_android_release_control_seed.sql` — undefined → 2b2b98a5bb97eee2c10f34a8ff2265aed35dc0c7
- `supabase/migrations/20261002171223_offline_quran_profile_daily_reminders.sql` — undefined → f5794a3adf43cdc7541b3c151be9f356504ef1f4
- `supabase/migrations/20261002171549_content_hub_audio_cloudinary_seed_20261002.sql` — undefined → 6cda19733e1245b21c9c8b9b2108d59b0fbd1518
- `supabase/migrations/20261002172804_human_audio_library_expansion_20261002.sql` — undefined → c9ee7b8f20374fe828e07f9a00a3f380b82d2935
- `supabase/migrations/20261002172917_server_only_deny_policies_20261002.sql` — undefined → 91594c172473200d7d289622ad474130ca6b5712
- `supabase/migrations/20261002172946_index_unindexed_foreign_keys_20261002.sql` — undefined → ce79f86aab323ab0ef749a468a7b151c3471aef8
- `supabase/migrations/20261002173000_content_hub_audio_cloudinary_seed_20261002.sql` — undefined → 5952f9b1ce927424c6b7f124735bdf3069263e5f
- `supabase/migrations/20261002174500_human_audio_library_expansion_20261002.sql` — undefined → 6c3ffa17b7565073b107f3505eee7b8fcc9264e4
- `supabase/migrations/20261002211738_20261003010000_kids_games_level_catalog.sql` — undefined → 0018b4810b3a0668924a41d3ee411765bad0cf6b
- `supabase/migrations/20261002212922_20261003030000_kids_games_gameplay_visual_catalog.sql` — undefined → e98c8c83f3668c5f908ae0ed63bd81c82e0eddf0
- `supabase/migrations/20261003082439_content_translation_queue.sql` — undefined → 31f86f42db0cfcac26d34d032e94eadcfcaa86e4
- `supabase/migrations/20261003090000_content_translation_queue.sql` — undefined → ae9aef2a15379c25573003caf9caf0fe84c7273b
- `supabase/migrations/20261004180228_reconcile_content_library_summary_en.sql` — undefined → 65db065fb9c8d74215ccca4fc75b111b447355a9
- `supabase/migrations/20261004190000_content_library_summary_en.sql` — undefined → b66ae67de99a7d6fd331958753a41f784cc46736
- `supabase/migrations/20261008014118_repoint_production_cron_to_current_project_v2.sql` — undefined → 9c6392135cf8b936c260eb5ed2ccf74ed70ed7c8
- `supabase/migrations/20261008015328_retire_obsolete_cleanup_cron.sql` — undefined → deba0971730d95850e7231d9c9d82bc532003aa7
- `supabase/migrations/20261008015449_content_translation_queue.sql` — undefined → 6fbb18d9d8b2e84ccad9fe4e3e2dfac342a1fc74
- `supabase/migrations/20261008015452_content_library_summary_en.sql` — undefined → 7c84aaa5b57d8897952abc397fbce87361a18b27
- `supabase/migrations/20261008015534_harden_translation_queue_and_kids_timestamp_helpers.sql` — undefined → 498ec2f3fb9e9bfaa84c5fd759dd309707b15ef0
- `supabase/migrations/20261008030000_pause_unavailable_scheduler_workers.sql` — undefined → bf948a48c425f4f632c8e4dfd6617e3be7d0e8cb
- `supabase/migrations/20261008050000_repoint_production_cron_to_current_project.sql` — undefined → 9015afac4667bf8e8ac1a73a33778def1ad49ed1
- `supabase/migrations/20261008060000_retire_obsolete_cleanup_cron.sql` — undefined → 6bbcee7092c447f60b64a06b0428c3d9b61fcc4a
- `supabase/migrations/20261008070000_harden_translation_queue_and_kids_timestamp_helpers.sql` — undefined → 2623b501144615be46b9b6e0222b88fd83fd3291
- `supabase/migrations/20261008074605_reconcile_social_sync_cron_and_child_rls.sql` — undefined → 4dd110f0467794071167e947ffe416a4f3971d4b
- `supabase/migrations/20261008080000_set_primary_admin_mohamed_alaa.sql` — undefined → 1e742fc33afb221f1142ba362946cdb5c3f42880
- `supabase/migrations/20261008082029_20261008110000_restore_admin_rate_limit_contract.sql` — undefined → 5f286417d4a55681c87d9d70b5a344354f6b30fe
- `supabase/migrations/20261008082203_20261008120000_consolidate_duplicate_public_read_policies.sql` — undefined → e56b6047d0ea0fd4c8a8dbb90cb01d21455c89f0
- `supabase/migrations/20261008085309_20261008090000_tighten_rls_policy_role_scope_20261008.sql` — undefined → 74ba2f0a9325084ad0b9994e030b35b2cca9482c
- `supabase/migrations/20261008085550_20261008091000_remove_articles_admin_policy_overlap.sql` — undefined → 3395f9c6f48375f42cda6e115cb655d1e68c0fcf
- `supabase/migrations/20261009054919_kids_games_client_write_hardening_20261009.sql` — undefined → 84002c5490e5379567720f394d15e0557aa24289
- `supabase/migrations/20261009145051_android_releases_storage_bucket.sql` — undefined → 9ae9039aa16a74e58b7e710fe1d976f229f59ded
- `supabase/migrations/20261009160001_quran_ayahs_seed_chunk_02.sql` — undefined → 5c9a66fc53e1654d6892c92a461d1de5c7e64316
- `supabase/migrations/20261009160002_quran_ayahs_seed_chunk_03.sql` — undefined → 4edb74861cdd63229c3611e85b220c5a895bdfcb
- `supabase/migrations/20261009160003_quran_ayahs_seed_chunk_04.sql` — undefined → 65332d573a92958f56d4b7af7366328c0c2bf748
- `supabase/migrations/20261009160004_quran_ayahs_seed_chunk_05.sql` — undefined → af2b443324c509a8cc2dad09fce3ec719dfde49e
- `supabase/migrations/20261009160005_quran_ayahs_seed_chunk_06.sql` — undefined → 1c01ae1e8082ebff3aeaef59e1b4267deaf66862
- `supabase/migrations/20261009160006_quran_ayahs_seed_chunk_07.sql` — undefined → aa3882cce201853617dba24d8f393ae37046249f
- `supabase/migrations/20261009160007_quran_ayahs_seed_chunk_08.sql` — undefined → 8d96a4605e27c8742d6d3fafebe71324f3268a2c
- `supabase/migrations/20261009160008_quran_ayahs_seed_chunk_09.sql` — undefined → 388c5471b120707e7d719ab1ea748f1e4863a9c4
- `supabase/migrations/20261009160009_quran_ayahs_seed_chunk_10.sql` — undefined → 92da263a6704f98ecb1303b01d8ca4a127541efa
- `supabase/migrations/20261009160010_quran_ayahs_seed_chunk_11.sql` — undefined → bb13ac7498371277aba5f65c4471d7018e0a293f
- `supabase/migrations/20261009160011_quran_ayahs_seed_chunk_12.sql` — undefined → 8f23d4b8067314e16d98fe324c68294ba7138c7a
- `supabase/migrations/20261009160012_quran_ayahs_seed_chunk_13.sql` — undefined → 8c562a73190ec2303d3c93c6524b447343a2c3a5
- `supabase/migrations/20261009160013_quran_ayahs_seed_chunk_14.sql` — undefined → c93f597d63e755494a61838ad6fcb1c2565739f1
- `supabase/migrations/20261009180000_android_release_bucket_free_tier_limit.sql` — undefined → f4429ef89b81cc9f96425dde4cb1ad39fc56eebd
- `supabase/migrations/20261012200000_repoint_cron_to_zikrofficial_project.sql` — undefined → 1dc349dd4be00e144085c12fdbc3fe97e47c9928
- `supabase/migrations/20261012210000_repoint_cron_to_connected_project.sql` — undefined → b2dd4d5f12f38f7f42bbc2bed481d10b12233dd9
- `supabase/migrations/20261012220000_free_plan_cron_efficiency.sql` — undefined → 6b89d1816c771a4a660e93beecc99fbf6efd320d
- `supabase/migrations/20261014233233_retire_temporary_tafsir_seed_loader_access.sql` — undefined → 24f13563360ab4e2365d2c07da2cac737ebe17f8
- `supabase/migrations/20261015000001_reconcile_legacy_category_enum_labels.sql` — undefined → 8e8e7583742158101b322fa46ed07ecf4690b87d
- `supabase/migrations/20261015020000_remove_duplicate_nonunique_indexes.sql` — undefined → 97bc0dbff0caee222bcadb3072047fc9692dcc6a
- `supabase/migrations/20261015023317_remove_duplicate_nonunique_indexes.sql` — undefined → 97bc0dbff0caee222bcadb3072047fc9692dcc6a
- `supabase/migrations/20261015024511_remove_redundant_prefix_indexes.sql` — undefined → 20c73ae33d72c53a288657d01fc0f5cc173c69e2
- `supabase/migrations/20261015030550_seed_site_homepage_seo_social_defaults.sql` — undefined → 902aca130a4db70b0f6a3e52982f5e0328a1297f
- `supabase/migrations/20261015050000_secure_contact_submission.sql` — undefined → 86749b548b1ce78bc4c28c9c011bcff1d8b7b8e1
- `supabase/migrations/20261017100000_link_legacy_memory_content_to_runtime.sql` — undefined → b12fef0668c3ab9b4224183a1a41fc4b513e55b0
- `supabase/migrations/20261017110000_sync_kids_game_metadata_versions.sql` — undefined → bd3b79c069a6668ab777ed2e6049d189de3a4525
- `supabase/migrations/20261020224251_kids_games_level_catalog_extend_to_30.sql` — undefined → 02a4bcda3a71071545291277b4d5aa4bd7b0687e
- `supabase/migrations/20261020234239_social_facebook_oauth_credentials.sql` — undefined → 6860ad19f67cba2628ee2a75f08fc8f546d3e066
- `supabase/migrations/20261021094431_social_facebook_reels_rate_limit_cooldown.sql` — undefined → 4c50360b1ca44986c7ff70cbaec866021fd4e7cd
- `supabase/migrations/20261021200000_seed_letter_lab_kids_content.sql` — undefined → ffa4d08601dd0dfc0f275f9e057b1e18f3109755
- `supabase/migrations/20261021235117_admin_analytics_and_content_scheduler.sql` — undefined → 11284fb15246a16f1f27dc87c64d6b1fbf1cda35
- `supabase/migrations/20261022003101_add_missing_foreign_key_indexes.sql` — undefined → 6f4f5084c780a8939f5d0049babeb722be0284d9
- `supabase/migrations/20261022090000_add_letter_lab_to_kids_game_catalog.sql` — undefined → 6ba256700f10950ac68d43247e4fff72de4bd51a
- `supabase/migrations/20261027200748_video_render_metrics.sql` — undefined → 892b5d7deab81d475ceb30b753cf86fd767bf5d2
- `supabase/migrations/20261027212803_admin_queue_alert_deliveries.sql` — undefined → dd4a8c33561d255e6c514a2c177700d9057935f3
- `supabase/migrations/20261028112016_optimize_admin_queue_alert_rls_initplan.sql` — undefined → 78e9c9333091e399c49f0a65147d6bea5181d423
- `supabase/migrations/20261028112823_social_credentials_explicit_deny_policies.sql` — undefined → 4b047934470e1b23f08a0fe44548cc4c5f4700ef
- `supabase/migrations/20261028112833_social_credentials_explicit_deny_policies.sql` — undefined → 4b047934470e1b23f08a0fe44548cc4c5f4700ef
- `supabase/migrations/20261030043335_arabic_full_text_search_v2.sql` — undefined → 442cbd16714fbfd3839b00468fa2d0021c9897a0
- `supabase/migrations/20261030044153_arabic_search_surahs_and_content_library.sql` — undefined → 038a6e3101b506642c856c008dd1acdf832ff6f1
- `supabase/migrations/20261030050000_admin_rbac_permission_scope.sql` — undefined → ee955e2d4af1eed2bd88cdadf7d5cc6674815db7
- `supabase/migrations/20261030070000_retire_runtime_optional_indexes.sql` — undefined → c14cc9f0a368fbe75f47dbb3549ac4465d6d9002
- `supabase/migrations/20261030071426_admin_queue_observability_indexes.sql` — undefined → d2bcb5610efecd91401e848ace4353162df520c7
- `supabase/migrations/20261030082626_expand_public_content_catalog_20261030.sql` — undefined → fe1c5b6c37dd285f9cbc6cc69f04d48f580bd2e8
- `supabase/migrations/20261030090000_article_tags_and_english_search.sql` — undefined → 55514076720c266564c528d21bbf18635904d31c
- `supabase/migrations/20261030094823_content_depth_refresh_20261030.sql` — undefined → 4c4c2f2adb8e763fa9503440df875b2f88835c56
- `supabase/migrations/20261030100000_admin_public_rpc_invoker.sql` — undefined → c14538d8cc56190bf64d8fcd18ed02fa03d9d2cd
- `supabase/migrations/20261030110000_foreign_key_supporting_indexes.sql` — undefined → 2ae1ac38e99a2f92925e28018af1c08a17ba2381
- `supabase/migrations/20261030120000_remove_public_storage_listing_policies.sql` — undefined → 4b9e04859b937ebb9fd1f4c4d0ad2c8a475295da
- `supabase/migrations/20261030121229_video_storage_retention_rpc.sql` — undefined → 0d76a0a471f155da6edf95a45d78b12fbd5c7e54
- `supabase/migrations/20261030130000_video_storage_retention_rpc.sql` — undefined → d8757eb12605a90c154bbf18b8a3c260db78865f
- `supabase/migrations/20261101090000_harden_kids_game_result_insert_contract.sql` — undefined → 1453ca2bde681791335c0499debaaac320cf965c
- `supabase/migrations/20261101135000_revoke_anon_privileges_private_tables.sql` — undefined → af26670838364ab7a2c53f2334b031870071f11a
- `supabase/migrations/20261101170000_admin_atomic_role_update.sql` — undefined → e63f95826f828f8f6a5f06f16d82093078400893
- `supabase/migrations/20261101183804_sync_video_automation_setting_descriptions.sql` — undefined → d2f70e23c9a5c5f2c9888e9184869007d24795bd
- `supabase/migrations/20261101190000_admin_atomic_site_audio_primary.sql` — undefined → d9c3613b8c1bcc4083dbabe6f6a42664a3b47aae
- `supabase/migrations/20261106010000_admin_video_template_studio.sql` — undefined → 2836e8c9ae34ad907a5bc27d4615ac436ebb5a79
- `supabase/migrations/20261106020000_video_template_version_fk_indexes.sql` — undefined → a2a4545776589a277db79f7be114b81babb8759e
- `supabase/migrations/20261106061131_video_template_version_fk_indexes_reconcile.sql` — undefined → 53acd89c76aec48067f24a896791c45861efb334
- `supabase/migrations/20261106083147_youtube_oauth_credentials.sql` — undefined → ad3b5c86cba79133e93df331d97c6a940ea57f45
- `supabase/migrations/20261106090800_production_blockers_and_social_insights.sql` — undefined → 5b9f5cee8f2b7353d5893dda6728f32a567a1948
- `supabase/migrations/20261106160000_allow_internal_videos_in_content_publish_queue.sql` — undefined → 14d5985dc3191f880f2228ac5809fe295fc11a8d
- `supabase/migrations/20261106184415_allow_internal_videos_in_content_publish_queue.sql` — undefined → 92ead3d018bb8a24ba27ab95c0a4d796fa61a898
- `supabase/migrations/20261106184600_allow_internal_videos_in_content_publish_queue.sql` — undefined → a1b1e3123fb1d34fd2be050b68a2c5d250aa450c
- `supabase/migrations/20261106205519_revoke_public_execution_on_rls_auto_enable.sql` — undefined → adf810ee87f2a51ca28d5b231e4d9ec963d2dc23
- `supabase/migrations/20261106210440_repoint_active_cron_jobs_to_current_project.sql` — undefined → 3a7c0111d8484e2c72abed8659de5e39df7e7bc9
- `supabase/migrations/20261106210520_repoint_active_cron_jobs_to_current_project.sql` — undefined → 7f741dfc754b55cbb8f638a878ea8e469e43c073
- `supabase/migrations/20261106213918_video_likes.sql` — undefined → 8d6dce326f6ddf799bb0810ec635ef54f4de3190
- `supabase/migrations/20261106214309_secure_video_like_count_summary.sql` — undefined → b1d7d221b98c6274b99808493e77e3cb1d7207e8
- `supabase/migrations/20261110013646_video_automation_runtime_defaults_20261110.sql` — undefined → e722e55bc035464b460b1ead5edcc6b08654cfa5
- `supabase/migrations/20261110013832_restore_published_video_catalog_from_youtube_20261110.sql` — undefined → d8ab7ba0dc498fd13290cb76e7f95d437f77203d
- `supabase/migrations/20261110014132_optimize_video_likes_rls_20261110.sql` — undefined → 19209d60f3d996b2c7dd57d72e8e41e9f440f9be
- `supabase/migrations/20261110021309_kids_video_library_and_thumbnail_recovery.sql` — undefined → fd8f7725447cb5f99a0837054f7cba29f5c616ec
- `supabase/migrations/20261110021311_increase_video_ai_provider_attempt_budget.sql` — undefined → c383595a9022fb1003cc703ac1d9c4da52e0aecd
- `supabase/migrations/20261110022756_set_kids_video_public_paths.sql` — undefined → 161deaa428a040e25bb89e67605a892804fd489c
- `supabase/migrations/20261110025303_reconcile_published_youtube_ids_to_video_catalog.sql` — undefined → 87346d14069c169e9e04e11ba1744382e4255673
- `supabase/migrations/20261110030705_isolate_legacy_kids_series_and_require_kids_qa.sql` — undefined → 45f3742b2200a273eb55a5078c3e2c7cb2792175
- `supabase/migrations/20261110031431_retry_false_blocked_legacy_qa_source_url_parity.sql` — undefined → df4fae0eb9be825bc648367b9ea79d996acdf5a0
- `supabase/migrations_archive/20240705000001_create_category_type.sql` — undefined → 6b3d9fd189da43e55c4471a441d359608378def4
- `supabase/migrations_archive/20240705000001_missing_tables.sql` — undefined → 16434ffcbef3a8aa2674294f863d3b138a296638
- `supabase/migrations_archive/20240705000002_seed_content.sql` — undefined → 423e116d17acecc6ccd1d50b4724f1779e5394c5
- `supabase/migrations_archive/20240705000003_fix_duplicate_migration.sql` — undefined → 01a82876a9da4b2dba5e690010dd35039d0a0858
- `supabase/migrations_archive/20240705000003_seed_stories_articles.sql` — undefined → 79b927cd4e302b58379882d79fa0f07c310a49f2
- `supabase/migrations_archive/20250705000001_initial_schema.sql` — undefined → d0bdc54549a1df2ca3253bebd5cc1f50c35ffb67
- `supabase/migrations_archive/20250705000002_rls_triggers_storage.sql` — undefined → 380c34528733d0da51b5e836ce3f487a76fc5998
- `supabase/migrations_archive/20260530000000_0000_young_rattler.sql` — undefined → c98edfcd18a3ab8657bb91a289e2e72210761fea
- `supabase/migrations_archive/20260530000100_0001_wakeful_stepford_cuckoos.sql` — undefined → c29cb9ff1c866b2a9d6654d2d0ddb4e1453f0a12
- `supabase/migrations_archive/20260530000200_0002_noisy_nocturne.sql` — undefined → 29ac56c744848a0eaaa3e32695b46578ded8ff4f
- `supabase/migrations_archive/20260530000300_0003_glorious_vanisher.sql` — undefined → 532fe1de2cb50d22852a93ffcde6147887d25273
- `supabase/migrations_archive/20260530000400_0004_phase2_auth_foundation.sql` — undefined → 1d9702ee78abbfa202e915fde8d9095d9150c56a
- `supabase/migrations_archive/20260530000500_0005_phase3_content.sql` — undefined → 967a21ab29d3f60d74d204c10115f16bde9306b2
- `supabase/migrations_archive/20260530000600_0006_phase4_scholars_stories.sql` — undefined → ba229e38d66ccdf173c7850e7b440fc95d69869c
- `supabase/migrations_archive/20260530000700_0007_production_hardening.sql` — undefined → 17d06fef84d664a08437f0cc2d669d48e01ff0af
- `supabase/migrations_archive/20260530000800_0008_rls_hardening.sql` — undefined → 5857f0ca3143fbcd57fbbea49645a1a198360cb0
- `supabase/migrations_archive/20260530000900_0009_admin_memorization_youtube.sql` — undefined → 2223c433b1126e11e1aa5ec07a22fe9ad04518ce
- `supabase/migrations_archive/20260605000010_0010_missing_content_modules.sql` — undefined → 1fe88f247f23e07d1aaec3464b8ae206fff45874
- `supabase/migrations_archive/20260607050808_0011_videos_and_categories.sql` — undefined → f7a55d9e534f376faf5677bfc80f4c2e0112652e
- `supabase/migrations_archive/20260610000012_0012_prayer_times_system.sql` — undefined → a9e486d038d3eccbd2c9a881383114dbc6d5cd10
- `supabase/migrations_archive/20260610000013_0013_tawasheeh_and_reciters.sql` — undefined → 3c6ef94d5ce5515f16320781a9022f0c4e7b6928
- `supabase/migrations_archive/20260610000014_0014_content_modules.sql` — undefined → 03cbb8afa6f76d4a78988bf4878316c2efae1b37
- `supabase/migrations_archive/20260630000015_0015_comprehensive_rls.sql` — undefined → 833651acba042c951620d6aa93f46994f5056cdd
- `supabase/migrations_archive/20260630000017_0017_video_automation.sql` — undefined → 57a60fb66e02e195c450a835ee5f6f4d1994218d
- `supabase/migrations_archive/20260704000016_0016_auto_profile_creation.sql` — undefined → 02adffdd83bc3021d0580f80daf486e24bb9a916
- `supabase/migrations_archive/20260704000018_0018_complete_missing_tables.sql` — undefined → c3e2328cb296627a8946236cb44738b19e838065
- `supabase/migrations_archive/20260705000000_0019_safety_fixes.sql` — undefined → 84f8dd2dfefb9a117a0361d82f0720b272bdace2
- `supabase/migrations_archive/20260705000014_0014_tawasheeh_seed_data.sql` — undefined → 83bc92ba94acdd00cc62ca1002101249eebf1568
- `supabase/migrations_archive/20260705000019_0019_safe_guards.sql` — undefined → 81b13bf41f09de341878d1ae4225ec5bf9d229ef
- `supabase/migrations_archive/20260705070523_initial_schema.sql` — undefined → f1bc014ea352547f4983f3854ab1d9543d0b5bbb
- `supabase/migrations_archive/20260705070652_rls_triggers_storage.sql` — undefined → 2d0ca11a82b78286ddd0f85a8896f5c998abb03a
- `supabase/migrations_archive/20260706000020_0020_fts_catchall.sql` — undefined → abc7356adbae4e1beb5476dc9fddd183fc04d8fe
- `supabase/migrations_archive/20260710000001_video_error_columns.sql` — undefined → 2a3a6480532d9f84f423b8c6a29a421590f89f2d
- `supabase/migrations_archive/20260710000002_0021_drizzle_sync.sql` — undefined → 6552164e6ea7b177cce15408c41698e8e7aa2f22
- `supabase/migrations_archive/README.md` — undefined → 69a708fe7419595427721d0b9d3d23fe8b185079
- `tailwind.config.ts` — undefined → 6f87e37896a0c2b70fd01976564a5910292e09e4
- `tsconfig.json` — undefined → 7529525509a62ab7efe94916a37c5f436d5b9447
- `vercel.json` — undefined → b982abf1314b065612b6c12a541bd1e390fe3ddd

### Added files

- `docs/audits/ADMIN_CONSOLE_CLOSEOUT_2026-11-10.md` — c71ffe9eb270543c05431f7d188b002d11d0aa9e
- `src/features/admin/components/kids-content-manager.tsx` — 59d69d4533bf99ad74ee4137b66ca783706c6ce1
- `src/proxy.ts` — d736d5c493a445ffb667182404fa6bdd9c9e9bfe

## Mandatory handling rules

- `src/app/**/page.*`, `route.*`, `layout.*`, `loading.*`, and `error.*` repeated basenames are expected App Router conventions, not duplicate files.
- Android/iOS image and audio assets at different density/resolution/platform paths are not duplicates by basename.
- `supabase/migrations/**` is immutable history; never rename, reorder, merge or delete applied migration versions.
- `supabase/migrations_archive/**` and `supabase/legacy_migrations/**` are historical copies and require ledger/dependency proof before any retirement.
- Legacy redirect routes and exported compatibility modules stay until all known deep-links, dynamic route consumers and contract checks are traced.
- Each row may advance from REVIEW_REQUIRED only with explicit evidence (consumer tracing, contract checks, tests, and commit).

## Known findings from first comparison

- Previous matrix baseline inventoried 1,491 files and left 90 rows in `REVIEW_REQUIRED`; this inventory adds the 140 paths introduced/omitted since that baseline. The prior matrix is superseded for current path coverage.
- Duplicate basenames are numerous by design in Next.js routes and native asset variants; basename matching alone is not a safe duplicate detector.
- Both `docs/closeout/ZIKR_ALL_PLANS_CLOSEOUT_2026-10-30.md` and `docs/finalization/ZIKR_ALL_PLANS_CLOSEOUT_2026-10-30.md` exist and contain different historical snapshots. Retain both pending content ownership reconciliation.
- `src/lib/utils/companions.ts` is a compatibility re-export of `src/features/companions/utils/companions.ts`, not duplicated logic.
- `scripts/jobs/social-publishing.ts` is the background worker and `src/features/social/services/social-publishing.ts` is feature service code; they have separate consumers.
- Previous docs archive remains historical evidence. Do not purge without content/retention and link audits.