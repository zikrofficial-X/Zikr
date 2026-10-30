

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
- [ ] Approve or permanently disposition the five partial Facebook Reels queue records; do not retry or unfreeze publishing without explicit approval and verified Meta credentials/cooldown.
- [ ] Select AI visual provider, credential owner, quota, cost ceiling and approval process before enabling AI visual generation.
- [ ] Choose/attach a custom domain and verify DNS, canonical/Auth redirects, CMP and legal requirements for target markets before AdSense reapplication.
- [ ] Select a revenue model and complete its payment, refund, privacy, tax and legal requirements before collecting money.
- [ ] Urgent storage owner decision: live `storage.objects` inventory is 1.874 GB across `videos` and `android-releases` against the 1 GB Free allowance. Check billed Storage Size GB-Hours and grace-period state in Supabase Usage; then upgrade to Pro or approve reference-safe retention cleanup. Do not delete assets until public links and Android release provenance are checked. Database size is 80.37 MiB against a 500 MB Free database-size quota.
- [ ] Finish per-file and database dependency proof, backup and rollback plan before retiring legacy tables, functions, indexes or assets.
- [ ] Prepare the next semantic Android release from post-closeout main if the gold-crescent native launcher identity is to ship; v1.1.8 is immutable and was built from an older commit.
- [ ] After PR #150 merges, run the post-merge full main gate, deploy the exact verified main SHA, pass the production route smoke suite and recheck Vercel runtime errors on article/dua routes.

A completed source task or green PR gate does not substitute for these owner, editorial, legal, browser or physical-device acceptance records.
