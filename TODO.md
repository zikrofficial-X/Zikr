

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
- [ ] Review the current social backlog before any publisher activation: production has 103 `queued` records (all target YouTube + Facebook Reels; 98 have no `scheduled_at`, 5 have older explicit timestamps) and 286 `published` records. The current queue has no `partial` status rows. Keep `SOCIAL_PUBLISH_ENABLED=false` until the owner approves the backlog, cadence and provider cooldown state.
- [ ] Select AI visual provider, credential owner, quota, cost ceiling and approval process before enabling AI visual generation.
- [ ] Choose/attach a custom domain and verify DNS, canonical/Auth redirects, CMP and legal requirements for target markets before AdSense reapplication.
- [ ] Select a revenue model and complete its payment, refund, privacy, tax and legal requirements before collecting money.
- [ ] Verify billed Storage Size GB-Hours and grace-period state in Supabase Usage. The latest read-only object metadata snapshot (2026-11-01) is 148 objects: 136 in `videos` and 12 in `android-releases`, totaling 680,006,097 metadata bytes (about 648.5 MiB). This is not a billing export; the earlier 1.874 GB snapshot is stale. Database size is currently 81.63 MiB against the 500 MB Free database-size quota. Do not delete assets until public links and Android release provenance are checked.
- [ ] Finish per-file and database dependency proof, backup and rollback plan before retiring legacy tables, functions, indexes or assets.
- [ ] Prepare the next semantic Android release from post-closeout main if the gold-crescent native launcher identity is to ship; v1.1.8 is immutable and was built from an older commit.
- [ ] PR #150 has already merged. The current production deployment is READY on `main` at `9e429094ae9f296f1d2875d1d2a648148e7a7f9d`; Vercel reported no runtime errors in the latest 30-minute window. Complete route-by-route HTTP/browser smoke and physical Android acceptance; the 30-minute log window is not a substitute for full E2E certification.

A completed source task or green PR gate does not substitute for these owner, editorial, legal, browser or physical-device acceptance records.
