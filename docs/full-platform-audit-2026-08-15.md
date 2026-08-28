# تقرير الجرد والتدقيق الكامل لمنصة ZIKR

**تاريخ التدقيق:** 15 أغسطس 2026

**النطاق:** GitHub، Supabase/PostgreSQL، RLS، Auth، Storage، Cron، Edge Functions، Vercel، الإنتاج الحي، الاختبارات المحلية، APIs، Sitemap، PWA، والـCI.

## الخلاصة التنفيذية

الحالة الحالية للمشروع **تشغيلية ومستقرة في الإنتاج مع بعض إعدادات الحوكمة والأمان التي ما زالت تحتاج إجراءً يدويًا من لوحة GitHub أو Supabase**. تم فحص المستودع الحالي، ومشروع Supabase الإنتاجي، وآخر deployment فعلي في Vercel، ثم أُصلحت مشكلات قابلة لإعادة الإنتاج بدل الاكتفاء بتوثيقها.

أُصلحت مشكلة pagination في `/api/tawasheeh` التي كانت تقبل قيمًا سالبة وتنتج خطأ PostgREST `PGRST103`. كما أُصلحت معالجة JSON غير الصالح في `/api/kids/track-share` بحيث يعيد HTTP 400 واضحًا دون تسجيل طلب العميل غير الصالح كخطأ داخلي 500. وفي Supabase أُغلقت صلاحية الكتابة العامة الواسعة على جدول `prayer_times_cache` legacy، مع الإبقاء على القراءة العامة، وأصبح جدول `prayer_schedule_cache` scheduler-only كما هو مقصود.

تم تفعيل Vulnerability Alerts وDependabot Security Updates في GitHub وإضافة إعداد Dependabot أسبوعي للـnpm وGitHub Actions. تم دفع الإصلاحات في `c262729` ثم محاذاة أسماء ملفات migrations مع أرقامها التي سجلها Supabase فعليًا في `be8dd9d`.

آخر deployment إنتاجي هو `dpl_13MdTuTMaxqratbyYVRAjhfw1gQp`، حالته **READY**، مبني من فرع `main` ومن commit `be8dd9d`. التدقيق الحي الأخير أعاد **0 issues**: 40 route معلنة، 40 صفحة ثابتة، 120 عينة dynamic، 12 API، 156 استجابة عامة HTTP 200، و68,760 رابط Sitemap في shardين.

> لا يصح إعلان أن كل فجوة تشغيلية أُغلقت؛ GitHub Actions ما زال متأثرًا بقفل billing على مستوى الحساب، وBranch Protection غير مفعّل، وSupabase Advisor ما زال يبلغ عن `pg_net` في schema العامة وتعطيل Leaked Password Protection. هذه ليست أخطاء runtime في النسخة الحالية، لكنها متطلبات حوكمة وأمان يجب إكمالها من لوحات الخدمات.

## حالة GitHub وCI

| المجال | الحالة الحالية | الدليل أو الملاحظة |
|---|---|---|
| المستودع | سليم ومتاح | `mohamedalaa7785-cpu/Zikr`، public، والفرع الافتراضي `main` |
| آخر commit | متزامن | `be8dd9d`، محاذاة أسماء migrations مع Supabase |
| GitHub Actions | مفعّل لكن runner محجوب | الفشل السابق `startup_failure` بسبب account billing lock، وليس YAML أو التطبيق |
| CircleCI | يعمل | Workflow `verify-on-change` وJob `verify` نجحا في الصورة المقدمة، ويشغلان `pnpm verify` |
| Vercel CI | يعمل | Vercel يشغّل build والتحقق عند deployments |
| Branch Protection | غير مفعّل | GitHub REST أعاد `Branch not protected` |
| Secret Scanning | مفعّل | Secret scanning وPush Protection مفعّلان |
| Vulnerability Alerts | مفعّل | تم تفعيله أثناء التدقيق |
| Dependabot Security Updates | مفعّل | تم تفعيله أثناء التدقيق، وبدأ بإنشاء PRs dependency منفصلة |
| Dependabot configuration | مضاف | `.github/dependabot.yml`، تحديث أسبوعي للـnpm وGitHub Actions |

ملف `.circleci/config.yml` يعمل الآن على صورة Node 22.13، يفعّل pnpm، يثبت dependencies باستخدام `--frozen-lockfile`، ثم يشغل `pnpm verify`. لا توجد فيه أسرار Supabase أو مفاتيح إنتاج. أما workflow الخلفي في GitHub فما زال manual-only عمدًا؛ مهام الإنتاج الحقيقية لا تعتمد عليه، بل تعمل من Supabase Cron وEdge Functions.

تم فحص تغيير CircleCI bot في PR #191. التغيير اقتصر على استبدال `corepack enable` بـ`sudo corepack enable` في صورة CircleCI، ثم دُمج إلى `main`. لم يُعثر على تغييرات سرية أو منطق إنتاجي داخل ذلك التغيير.

### ما يلزم يدويًا في GitHub

ينبغي تفعيل **Branch Protection** على `main` بعد التأكد من اسم check الفعلي في CircleCI، ثم جعل check `verify-on-change` مطلوبًا قبل الدمج. يجب عدم جعل Dependabot PRs ذات التحديثات الكبرى تُدمج تلقائيًا؛ خصوصًا تحديثات Tailwind أو TypeScript أو مكتبات production، إذ يجب أن تمر عبر `pnpm verify` ومراجعة توافق منفصلة.

قفل GitHub Actions billing لا يمكن إصلاحه من المستودع. يجب مراجعة GitHub Billing، Payment/Invoices، Actions usage، Budgets، وActions settings للحساب المالك، ثم فتح دعم GitHub إذا بقي القفل بعد معالجة السبب.

## حالة Supabase

| المجال | النتيجة |
|---|---|
| المشروع | `eydxvcamhjhajxjrsgym`، Zikr، `ACTIVE_HEALTHY` |
| المنطقة | `eu-west-1` |
| قاعدة البيانات | PostgreSQL 17.6.1 |
| ملفات migrations المحلية | 123 ملفًا في `supabase/migrations`، مع 34 ملفًا مؤرشفًا |
| سجل Supabase | يتضمن الإصدارين الجديدين `20260815104409` و`20260815104455` |
| Edge Functions | `health` ACTIVE v7، `spiritual-ai` ACTIVE v7، `prayer-notification-worker` ACTIVE v37 |
| Cron | وظيفتان نشطتان كل دقيقة، وآخر 3 تشغيلات لكل منهما `succeeded` |
| RLS | مفعّل ومفحوص على الجداول العامة الرئيسية |
| Storage | buckets وسياسات القراءة والرفع مفحوصة دون كشف ملفات أو أسرار |

### RLS والإصلاح المطبق

معظم الجداول المملوكة للمستخدم تستخدم شروطًا مبنية على `auth.uid() = user_id`، وجداول المحتوى المنشور تستخدم شروط `published = true`، وعمليات الإدارة تستخدم `private.is_admin_user()`. وُجدت سياسات مالك متداخلة في بعض الجداول القديمة مثل `reading_progress` و`reminders` و`tawasheeh_playlists`؛ لم تُحذف عشوائيًا لأن حذف policy قد يغيّر سلوكًا قائمًا. تحتاج هذه السياسات إلى migration تنظيف مستقلة مع اختبار actor matrix قبل إزالة أي منها.

كان جدول `prayer_times_cache` يحتوي policy مصادقًا عليه من نوع `ALL` مع `qual=true`، مع أن التطبيق الحالي لا يستخدمه كجدول user-owned. أُزيلت صلاحية الكتابة وأُبقيت policy واحدة فقط:

```text
prayer_times_cache_public_read_only — FOR SELECT TO public USING (true)
```

أما `prayer_schedule_cache` فظل محميًا بـ`FOR ALL TO public USING(false) WITH CHECK(false)`. تم التحقق من السياسات بعد التطبيق، كما تم التحقق من استمرار تشغيل worker والـcron بعد الإصلاح.

### Cron والمهام الخلفية

آخر تشغيلات `zikr-prayer-push-dispatch` و`zikr-video-processing` في 10:48 و10:49 و10:50 UTC كلها `succeeded` بزمن تنفيذ قصير وreturn message `1 row`. هذا يؤكد أن تذكيرات الصلاة ومعالجة الفيديو لا تعتمد على CircleCI ولا تتأثر بتفعيله أو تعطيله.

### ملاحظات Supabase المتبقية

يعرض Supabase Advisor تحذيرين يحتاجان قرارًا من لوحة Supabase. الأول أن `pg_net` موجود في schema العامة؛ لا يُنقل تلقائيًا لأن cron يستخدم `net.http_post` ونقل الامتداد دون خطة rollback قد يوقف scheduling. والثاني أن **Leaked Password Protection** معطل في Auth؛ يُستحسن تفعيله من Auth settings بعد التأكد من سياسة التسجيل الحالية.

كما تظهر توصيات أداء خاصة بفهرسة غير مستخدمة. لم تُحذف الفهارس، لأن حذفها دون تحليل workload ووقت الاستعلام قد يسبب regression. سجل PostgREST التاريخي احتوى timeouts، لكن cron الحالي ينجح، وسجلات Vercel للـdeployment الحالي خالية من أخطاء؛ لذلك لم يتم تغيير endpoint scheduler عشوائيًا.

## حالة Vercel والإنتاج

| المجال | النتيجة |
|---|---|
| المشروع | `zikr`، Next.js، Node 24.x |
| domains | `zikrmediaofficial.vercel.app`، `zikr-zikr.vercel.app`، وGit main alias |
| آخر production deployment | `dpl_13MdTuTMaxqratbyYVRAjhfw1gQp` |
| الحالة | READY |
| المصدر | GitHub `main`، commit `be8dd9d` |
| runtime errors الحالية | لا توجد في آخر 30 دقيقة بعد deployment |
| deployment protection | password وtrusted IP غير مفعّلين؛ SSO مستثنى عن custom domains |

تم فصل أخطاء runtime التاريخية عن النسخة الحالية. ظهرت أخطاء قديمة في `/battles/[slug]` بسبب dereference لسجل غير موجود، وأخطاء DNS إلى Supabase project قديم، وطلبات JSON غير صالحة، و`PGRST103` في tawasheeh، وPKCE verifier مفقود في callback. الكود الحالي يعالج fallback في battles، ويعالج JSON غير الصالح وpagination في الإصلاحات المنشورة. لم تظهر هذه الأخطاء في runtime الحالي بعد deployment الأخير.

## الاختبارات المنفذة

| الاختبار | النتيجة |
|---|---:|
| `pnpm verify` المحلي على main الحالي | ناجح |
| TypeScript | ناجح |
| ESLint | ناجح |
| production build | ناجح، `Compiled successfully` |
| اختبارات المشروع | 56 ناجحة، 0 فشل |
| تدقيق production السابق بعد c262729 | 0 issues |
| تدقيق production النهائي بعد be8dd9d | 0 issues |
| صفحات route المعلنة | 40/40 |
| APIs المدققة | 12/12 |
| صفحات عامة HTTP 200 | 156 |
| عينات dynamic | 120 |
| Sitemap | 68,760 URL في shardين |
| `tawasheeh?limit=-1&offset=-5` | HTTP 200، تم تحويل القيم إلى `limit=20, offset=0` |
| JSON غير صالح في `/api/kids/track-share` | HTTP 400 متوقع |
| `/robots.txt` و`/sitemap-index.xml` و`manifest.webmanifest` و`/api/quran/surahs` | HTTP 200 |
| Vercel runtime errors بعد الإصلاح | لا توجد في آخر 30 دقيقة |
| Supabase prayer/video cron | آخر 3 تشغيلات لكل job ناجحة |
| Slow 3G PWA/Push | ناجح في التدقيق السابق: Service Worker active/controlling، Push وnotificationclick يعملان |

## الملفات والتغييرات المهمة

تمت إضافة `.github/dependabot.yml`، وإضافة migration حماية `prayer_times_cache` وmigration إزالة policy المكررة، وإصلاح `/app/api/tawasheeh/route.ts` و`/app/api/kids/track-share/route.ts`. كما أضيف ملف الأدلة `docs/audit-evidence-2026-08-15.md`.

الـcommits المرتبطة بهذه الجولة هي `c262729` للإصلاحات الأمنية وAPI والتوثيق، و`be8dd9d` لمحاذاة أسماء migration مع سجل Supabase. آخر deployment الإنتاجي المبني منهما هو `dpl_13MdTuTMaxqratbyYVRAjhfw1gQp`.

## النواقص المتبقية وخطة الإكمال

| الأولوية | النقص | الإجراء المطلوب |
|---|---|---|
| عالية | GitHub Actions billing lock | معالجة Billing/Actions من الحساب أو فتح GitHub Support؛ لا يمكن إصلاحه من YAML |
| عالية | Branch Protection غير مفعّل | تفعيل حماية `main` وطلب CircleCI check بعد التأكد من اسمه |
| متوسطة | Leaked Password Protection معطل | تفعيله من Supabase Auth settings واختبار التسجيل وكلمة المرور |
| متوسطة | `pg_net` في public schema | تخطيط migration آمن فقط بعد تأكيد توافق cron وrollback |
| متوسطة | سياسات RLS متداخلة قديمة | تنظيفها في migration منفصلة مع actor matrix، لا حذف يدوي |
| متوسطة | تحديثات Dependabot الكبرى | مراجعة كل PR وتشغيل verify قبل الدمج، وعدم auto-merge |
| منخفضة | مصادر المحتوى الديني الثابتة | إجراء مراجعة provenance بشرية للمحتوى الثابت، وعدم اعتبار وجود النص وحده إثباتًا لمصدره |

## روابط المراجعة

[المستودع على GitHub](https://github.com/mohamedalaa7785-cpu/Zikr) متاح لمراجعة commits وPRs. كما يمكن مراجعة [ملف CircleCI](https://github.com/mohamedalaa7785-cpu/Zikr/blob/main/.circleci/config.yml)، و[ملف Dependabot](https://github.com/mohamedalaa7785-cpu/Zikr/blob/main/.github/dependabot.yml)، و[آخر deployment في Vercel](https://vercel.com/zikr/zikr/13MdTuTMaxqratbyYVRAjhfw1gQp).

## المراجع

[1]: https://github.com/mohamedalaa7785-cpu/Zikr "ZIKR GitHub repository"

[2]: https://github.com/mohamedalaa7785-cpu/Zikr/blob/main/.circleci/config.yml "ZIKR CircleCI configuration"

[3]: https://docs.github.com/en/code-security/dependabot/dependabot-security-updates/about-dependabot-security-updates "GitHub Dependabot security updates"

[4]: https://supabase.com/docs/guides/database/database-advisors "Supabase Database Advisors"

[5]: https://vercel.com/docs/deployments "Vercel Deployments documentation"
