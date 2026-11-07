

# تحسين لوحة الإدارة والتحليلات (المهمة الحالية)

- [x] تطوير لوحة التحكم الرئيسية لتعرض مؤشرات التشغيل، الإجراءات السريعة، حالة الطوابير، وآخر نشاط إداري بصورة أكثر وضوحاً.
- [x] تحسين واجهة إدارة المحتوى بإضافة البحث والفلترة حسب النوع والحالة وفرز العناصر وإجراءات سريعة مفهومة.
- [x] إضافة أدوات جدولة النشر التلقائي للمحتوى مع إنشاء وإلغاء الجدولة، وعرض الحالة والموعد القادم.
- [x] إضافة لوحة تحليلات متقدمة تعرض نشاط المستخدمين، زيارات لوحة التحكم، أداء المحتوى، والاتجاهات الزمنية مع الحفاظ على تمييز البيانات غير المتاحة.
- [x] الحفاظ على صلاحيات الإدارة وسجل التدقيق وتحديث خريطة مسارات المعاينة عند إضافة مسار جديد.
- [x] تشغيل فحص TypeScript وLint وفحوصات العقود ذات الصلة بعد التنفيذ.

## ZIKR final closeout — owner and acceptance gates (2026-10-30)

The Admin dashboard/content scheduling/analytics task set above is implemented. The following are deliberately **not** marked complete until the named evidence exists:

- [ ] Decide whether to upgrade the Supabase organization from Free to Pro to enable leaked-password protection, or formally accept this Auth security warning as an exception; rerun Security Advisor after the decision.
- [ ] Complete qualified educator review for the 13 registered Kids games, including age suitability, literacy progression and Letter Lab.
- [ ] Complete qualified religious review of source-sensitive Quran, Hadith, dua, adhkar and wudu material.
- [ ] Pass browser E2E for public content detail, auth/OAuth, audio, prayer, Kids, offline/reconnect and privileged Admin flows.
- [ ] Complete physical-device acceptance on target Android phones for all games, audio, prayer/location, Qibla compass, notifications and airplane-mode/reconnect. Record iOS acceptance separately where supported.
- [x] Owner approval and automation policy completed (2026-11-01): the production backlog was integrity-checked (103 valid queued videos, all targeting YouTube + Facebook Reels; zero invalid source/status/media URL joins and zero partial queue rows). Automatic publishing is enabled on `main`, one queue item per 15-minute cycle, subject to YouTube OAuth + enabled/healthy OAuth-managed Facebook Page preflight and Meta cooldown handling.
- [x] AI visual provider and cost policy selected (2026-11-01): free-first Hugging Face LTX Fast and Wan with deterministic FFmpeg fallback; `VIDEO_FREE_ONLY=true`, no paid/custom provider or Gemini generation, two bounded AI attempts per run, maximum 20 generated videos/day.
- [ ] Choose/attach a custom domain and verify DNS, canonical/Auth redirects, CMP and legal requirements for target markets before AdSense reapplication.
- [ ] Select a revenue model and complete its payment, refund, privacy, tax and legal requirements before collecting money.
- [ ] Verify billed Storage Size GB-Hours and grace-period state in Supabase Usage. The latest read-only object metadata snapshot (2026-11-01) is 148 objects: 136 in `videos` and 12 in `android-releases`, totaling 680,006,097 metadata bytes (about 648.5 MiB). This is not a billing export; the earlier 1.874 GB snapshot is stale. Database size is currently 81.63 MiB against the 500 MB Free database-size quota. Do not delete assets until public links and Android release provenance are checked.
- [ ] Finish per-file and database dependency proof, backup and rollback plan before retiring legacy tables, functions, indexes or assets.
- [ ] Prepare the next semantic Android release from post-closeout main if the gold-crescent native launcher identity is to ship; v1.1.8 is immutable and was built from an older commit.
- [x] PR #159 merged to `main` at `1d753247382f99f0640444f7090f5e07d1333db6` after the full GitHub Quality Gate, CircleCI config guard, Vercel Preview build and 9-route HTTP smoke passed (2026-11-01).
- [ ] Run and verify the first scheduled production generation and social-publishing cycles on `main`; confirm provider success/fallback, Facebook and YouTube remote IDs, queue transitions, and no duplicate posts. A green CI build is not evidence that a social post was published.
- [ ] Execute the controlled Vercel production release for merge commit `1d753247382f99f0640444f7090f5e07d1333db6`. The `release-finalization.yml` workflow is manual-only and requires GitHub Actions production secrets `ZIKR_VERCEL_TOKEN` (or `VERCEL_DEPLOY_TOKEN`/`VERCEL_TOKEN`) and `POSTGRES_URL_NON_POOLING` (or `SUPABASE_DB_URL`); keep deployment → pre-migration smoke → database migration → schema reconciliation → post-migration smoke order. Vercel Git auto-deploy is disabled; the new Preview does not change the live production deployment.
- [ ] Complete route-by-route browser E2E and physical Android acceptance; the successful Preview HTTP smoke and zero recent Vercel runtime errors do not substitute for full E2E certification.

A completed source task or green PR gate does not substitute for these owner, editorial, legal, browser or physical-device acceptance records.


## Current production follow-up — 2026-11-07

The 2026-11-01 queue count and 15-minute social-poller statement above are historical snapshots, not the current runtime. The current implementation uses a four-times-daily GitHub video worker, direct Cloudinary upload, and a separate event-driven social publisher after successful generation or manual dispatch.

- [x] Merge the partial-success and canonical Kids-story normalization fix: PR #232 merged to `main` at `f606dab52996c76c483cf8944e9b218e8c283d70` after its Quality Gate and CircleCI config validation succeeded.
- [x] Reconcile current production URL configuration without exposing secret values; canonical Supabase and site/Auth URLs matched Vercel Production.
- [x] Merge and certify the worker-audit/Run Now/release-documentation follow-up: PR #233 merged to `main` at `125c4eb59aeabf62117fca519b516e47f9f7007b`; GitHub Quality Gate and all three CircleCI statuses passed.
- [ ] Re-run the scheduled video worker after deployment; verify completed/failed counts, the Kids series canonical snapshot, Run Now consumption, and that `started_at <= finished_at` in the audit row.
- [ ] Verify a Facebook Reels post end-to-end from one eligible queue row and confirm the remote post ID is persisted. Seven Facebook-only queue rows were present in the 2026-11-07 snapshot; do not replay historical rows.
- [ ] Connect YouTube OAuth from Admin and verify `youtube.upload`, `youtube.readonly`, and `yt-analytics.readonly` scopes before enabling YouTube publishing.
- [ ] Resolve or formally accept the Free-plan Leaked Password Protection warning. Do not grant service_role access to `auth.users` to work around the historical video-template error.



## Quran tafsir data recovery — 2026-11-07

- [x] Identify why `public.quran_tafsir` is empty despite 6,236 ayahs: the original nine `ar.muyassar` seed migrations were guarded by surah existence and were marked applied before all surahs existed.
- [x] Verify the repository's original seed corpus contains exactly 6,236 unique ayah records across all 114 surahs, with explicit source URLs and retrieval metadata.
- [ ] Merge the guarded restoration/preflight PR and deploy it through `.github/workflows/release-finalization.yml`; the original seed files will be replayed atomically after `supabase db push`.
- [ ] Verify the live database has 6,236 non-empty `التفسير الميسر` rows, one per Quran ayah, and smoke-test `/tafsir` and verse-level tafsir lookup.
- [ ] After that release, verify a new video-worker run's accurate start/finish audit timestamps, partial-success semantics and Facebook Reels remote post IDs. YouTube remains disabled until channel OAuth is connected.

