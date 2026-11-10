# حوكمة لوحة إدارة ذِكر

**آخر مراجعة:** 6 نوفمبر 2026
**مصدر الحقيقة للتنقل:** `src/features/admin/config/navigation.ts`  
**مصدر الحقيقة للصلاحيات:** `src/features/admin/services/permissions.ts`

تعتمد اللوحة على 9 مناطق تنقل تشغيلية تضم 47 رابطًا إداريًا ظاهرًا بحسب مصدر التنقل الحالي. ملف التنقل هو المصدر المنفرد لترتيب الصفحات والأيقونات، بينما يرشّح `src/app/admin/layout.tsx` الروابط بحسب دور المستخدم. لا تُضاف روابط إلى قائمة الإدارة قبل وجود صفحة فعلية وفحص صلاحية خادمي.

### المسارات الرسمية المضافة في مركز التشغيل

أصبحت هذه المسارات هي نقاط الدخول الرسمية التي يجب استخدامها في الروابط الجديدة، مع إبقاء المسارات القديمة للتحويل التوافقي:

- مركز الطوابير: `/admin/queues` بصلاحية `dashboard.view`.
- مركز الفيديو والإنتاج: `/admin/video` بصلاحية `video.manage`.
- طلبات الفيديو والطابور: `/admin/video/requests` بصلاحية `video.manage`.
- استوديو الفيديو: `/admin/video/studio` بصلاحية `video.manage`.
- مكتبة المحتوى الموثق: `/admin/video/studio/curated` بصلاحية `video.manage`.
- مصادر الفيديو: `/admin/video/sources` بصلاحية `video.manage`.
- نصوص السرد: `/admin/video/scripts` بصلاحية `video.manage`.
- ملفات الأصوات: `/admin/video/voices` بصلاحية `video.manage`.
- العناصر المرئية: `/admin/video/visuals` بصلاحية `video.manage`.
- القوالب: `/admin/video/templates` بصلاحية `video.manage`.
- ضبط الجودة: `/admin/video/qa` بصلاحية `video.manage`.

جميع صفحات الفيديو السابقة تحت `/admin/video-factory/*` أصبحت تحويلات توافقية إلى مسارات مركز الفيديو الرسمية. صفحة الجدولة القديمة تحوّل إلى `/admin/automation` بصلاحية `system.manage`. مركز النشر الاجتماعي `/admin/social` أصبح مسارًا إداريًا فعّالًا ضمن مجموعة «الوسائط والصوت»، ومحميًا بصلاحية `social.manage`.

يوفر تخطيط الإدارة بحثًا سريعًا مفلترًا حسب الدور عبر `Ctrl+K`، بينما يحتفظ دليل الوحدات بالمفضلة والصفحات الأخيرة على الجهاز دون إرسال هذه التفضيلات إلى الخادم.

## 1. جرد المسارات والصلاحيات

هذا الجرد يطابق مجموعات التنقل التسع في لوحة الإدارة. يفحص `pnpm admin:governance:check` وجود كل مسار وصلاحيته، ويمنع انفصال التوثيق عن الكود.

### التشغيل والمراقبة

| المسار | الصفحة | الصلاحية المطلوبة |
|---|---|---|
| `/admin` | لوحة التحكم | `dashboard.view` |
| `/admin/queues` | مركز الطوابير | `dashboard.view` |
| `/admin/automation` | التشغيل الآلي | `system.manage` |
| `/admin/health` | صحة النظام | `system.manage` |
| `/admin/notifications` | التنبيهات | `notifications.manage` |

### إدارة المحتوى

| المسار | الصفحة | الصلاحية المطلوبة |
|---|---|---|
| `/admin/content` | إدارة المحتوى | `content.manage` |
| `/admin/library` | مكتبة المحتوى | `library.manage` |
| `/admin/editorial` | التحرير والنشر | `knowledge.manage` |
| `/admin/categories` | التصنيفات | `content.manage` |
| `/admin/sections` | الأقسام وترتيبها | `sections.manage` |
| `/admin/search` | البحث والفهرسة | `content.manage` |

### المصادر والمعرفة

| المسار | الصفحة | الصلاحية المطلوبة |
|---|---|---|
| `/admin/sources` | مصادر المحتوى | `sources.manage` |
| `/admin/knowledge` | المعرفة الإسلامية | `knowledge.manage` |
| `/admin/prophets` | الأنبياء | `prophets.manage` |
| `/admin/battles` | الغزوات | `battles.manage` |

### مصنع الفيديوهات

| المسار | الصفحة | الصلاحية المطلوبة |
|---|---|---|
| `/admin/video` | مركز الفيديو والإنتاج | `video.manage` |
| `/admin/video/requests` | طلبات الفيديو والطابور | `video.manage` |
| `/admin/video/studio` | استوديو الفيديو | `video.manage` |
| `/admin/video/studio/curated` | المحتوى الموثق للفيديو | `video.manage` |
| `/admin/video/sources` | مصادر الفيديو | `video.manage` |
| `/admin/video/scripts` | نصوص السرد | `video.manage` |
| `/admin/video/voices` | الأصوات | `video.manage` |
| `/admin/video/visuals` | العناصر المرئية | `video.manage` |
| `/admin/video/templates` | استوديو القوالب | `video.manage` |
| `/admin/video/qa` | ضبط الجودة | `video.manage` |

### الذاكرة والمكتبة

| المسار | الصفحة | الصلاحية المطلوبة |
|---|---|---|
| `/admin/memory` | ذاكرة ملفات المشروع ومخرجات الفيديو المولّدة | `media.manage` |

مركز النشر الاجتماعي `/admin/social` ومصنع المنشورات المكتوبة لفيسبوك `/admin/social/written-studio` ظاهران ضمن مجموعة «الوسائط والصوت» ومحميان بصلاحية `social.manage`. يتطلب النشر الخارجي اكتمال OAuth وجاهزية القناة؛ تخضع الفيديوهات لفحوص QA الآلية، بينما تخضع المنشورات المكتوبة للتحقق من المصدر وجودة النص، دون خلط النوعين.

### الوسائط والصوت

| المسار | الصفحة | الصلاحية المطلوبة |
|---|---|---|
| `/admin/media` | مكتبة الوسائط | `media.manage` |
| `/admin/audio` | مركز الصوت | `audio.manage` |
| `/admin/audio/quran` | تلاوات القرآن | `audio.manage` |
| `/admin/audio/adhan` | الأذان | `audio.manage` |
| `/admin/audio/tts` | تحويل النص إلى صوت | `audio.manage` |
| `/admin/site-audio` | صوت الموقع والتذكيرات | `audio.manage` |
| `/admin/social` | مركز النشر الاجتماعي | `social.manage` |
| `/admin/social/written-studio` | مصنع المنشورات المكتوبة لفيسبوك | `social.manage` |

### عالم الأطفال

| المسار | الصفحة | الصلاحية المطلوبة |
|---|---|---|
| `/admin/kids` | لوحة الأطفال | `kids.manage` |
| `/admin/kids/content` | محتوى الأطفال | `kids.manage` |
| `/admin/kids/games` | الألعاب | `kids.manage` |
| `/admin/kids/levels` | المستويات | `kids.manage` |
| `/admin/kids/assets` | الأصول | `kids.manage` |
| `/admin/kids/analytics` | تحليلات الأطفال | `kids.manage` |

### النمو والتحليلات

| المسار | الصفحة | الصلاحية المطلوبة |
|---|---|---|
| `/admin/analytics` | تحليلات المنصة | `analytics.read` |
| `/admin/seo` | تحسين الظهور | `settings.manage` |

### النظام والأمان

| المسار | الصفحة | الصلاحية المطلوبة |
|---|---|---|
| `/admin/audit` | سجل التدقيق | `audit.read` |
| `/admin/release` | مركز الإصدار | `release.manage` |
| `/admin/users` | المستخدمون والأدوار | `users.read` |
| `/admin/security` | أمن لوحة الإدارة | `security.manage` |
| `/admin/android` | إصدار أندرويد | `android.manage` |
| `/admin/settings` | إعدادات الإدارة | `settings.manage` |

## 2. نطاق الأدوار

| الدور | نطاق العمل |
|---|---|
| `super_admin` | كل الصلاحيات؛ الدور الأعلى الوحيد المسموح له بتعيين `super_admin` للغير. |
| `admin` | الصلاحيات الإدارية المعرّفة في النظام. |
| `content_manager` | المحتوى والمعرفة والمكتبة والمصادر والأطفال والأقسام والوسائط والتحليلات وسجل التدقيق؛ لا تمنحه المصفوفة صلاحيات النشر الاجتماعي أو إدارة النظام/الأمن. |
| `editor` | تحرير المحتوى ونشره ضمن مسارات التحرير المسموحة، دون حذف المحتوى أو صلاحيات النظام الحساسة. |
| `video_manager` | إدارة الفيديو والوسائط وحذف عمليات الفيديو والتحليلات وسجل التدقيق. |
| `social_manager` | إدارة مركز النشر الاجتماعي ومصنع المنشورات المكتوبة، وتشغيل التوليد والنشر بصلاحيتَي `social.manage` و`social.publish`؛ لا تمنحه المصفوفة صلاحيات إدارة أو حذف الفيديوهات. |
| `moderator` | المحتوى والمكتبة ومحتوى الأطفال والتحليلات وسجل التدقيق. |
| `seo_manager` | إعدادات الموقع المرتبطة بالظهور والمحتوى والتحليلات وسجل التدقيق. |
| `analyst` | القراءة التحليلية وسجل التدقيق فقط. |
| `support` | قراءة المستخدمين والتحليلات وإدارة تنبيهات الإدارة. |
| `user` | لا يملك صلاحيات إدارة. |

التفاصيل الدقيقة لكل صلاحية في مصفوفة `ADMIN_ROLE_PERMISSIONS` هي المرجع التنفيذي؛ هذا الجدول ملخص تشغيلي لا يحل محل التحقق البرمجي.

## 3. حدود البيانات

| المجال | صفحات الإدارة | الجداول/الموارد ذات الصلة | القاعدة التشغيلية |
|---|---|---|---|
| الحسابات والصلاحيات | `/admin/users`, `/admin/security` | `profiles`, `admin_role_assignments` | تغيير الأدوار عبر Server Actions المحمية، مع MFA للعمليات الحساسة وسجل تدقيق. |
| التدقيق والإعدادات | `/admin/audit`, `/admin/settings` | `admin_audit_events`, `admin_settings`, `admin_rate_limits` | أحداث الإدارة تضاف عبر خدمة التدقيق؛ لا تسجل الرموز أو كلمات المرور أو مفاتيح السر. |
| المحتوى والمعرفة | `/admin/content`, `/admin/library`, `/admin/editorial`, `/admin/knowledge` | `content_library`, `content_revisions`, `articles`, `stories`, `hadiths`, `duas`, `prophets`, `companions`, `scholars` | تُراجع صلاحية القراءة/التعديل/النشر مستقلة، ولا يكفي إخفاء الرابط من القائمة. |
| الفيديو والوسائط | `/admin/video`, `/admin/video/requests`, `/admin/video/studio`, `/admin/video/sources`, `/admin/video/scripts`, `/admin/video/voices`, `/admin/video/visuals`, `/admin/video/templates`, `/admin/video/qa`, `/admin/media` | `videos`, `video_generation_requests`, `media_assets` وموارد التخزين | لا يُعلن عن تنفيذ فوري إذا كانت العملية قد دخلت طابور عامل مجدول. |
| بيانات النشر الاجتماعي | تظهر من خلال مركز النشر الاجتماعي المحمي | `social_publish_queue`, `social_sync_jobs`, `social_platform_credentials` | طابور موحد للفيديوهات والمنشورات المكتوبة؛ تبقى بيانات OAuth خادمية ومحكومة بـ RLS ولا تُعرض مفاتيحها في الواجهة. |
| الأطفال والألعاب | `/admin/kids` وما يتفرع عنها | `kids_content` وجداول الألعاب والتقدم والنتائج | تعديلات اللعب ونتائج الأطفال تُفحص بعقود الاختبار وسياسات RLS الخاصة بالمجال. |
| الصوت | `/admin/audio`, `/admin/site-audio` | `site_audio_assets` ومصادر الصوت | تُختبر روابط الأصول وحالات فشل التحميل؛ لا تُعرض حالة نجاح وهمية عند فشل القراءة. |
| النشر والإصدار | `/admin/seo`, `/admin/release`, `/admin/android`, `/admin/health` | إعدادات الموقع وبيانات الإصدار وعمليات الفحص | إعدادات SEO والنشر لا تتجاوز التحقق من الروابط أو سجل التدقيق. |

قد تختلف تفاصيل الأعمدة حسب مخطط قاعدة البيانات الحالي؛ راجع ملفات `supabase/migrations` قبل إضافة استعلام أو migration جديد.

## 4. ثوابت الأمان

1. كل صفحة إدارية يجب أن تستدعي `requireAdminPermission(...)` أو `requireAdmin()` أو تقوم بتحويل صريح لمسارها القياسي.
2. كل Server Action حساسة تتحقق من الصلاحية بنفسها؛ إخفاء عنصر التنقل ليس حاجز أمان.
3. قراءة إعداد MFA للعمليات الحساسة تفشل بصورة مغلقة: إذا تعذرت قراءة السياسة، يظل التحقق الإضافي مطلوبًا.
4. بيانات التدقيق تنقّي مفاتيح مثل `token`, `secret`, `password`, `cookie`, `authorization`, `key`.
5. جدول `social_platform_credentials` مُعرّف كمورد خادمي فقط، مع RLS ومنع امتيازات `anon` و`authenticated`. تنبيه Advisor بشأن عدم وجود سياسة قراءة لهذا الجدول مقصود لمنع الوصول إلى أسرار OAuth؛ لا تضف سياسة عامة لإزالة التنبيه.
6. لا تنفذ تعديلات DDL على الإنتاج لتجميل لوحة الإدارة فقط. أي تغيير مخطط مطلوب يجب أن يبدأ بملف migration متعقب، ومراجعة أثره، ثم تطبيقه والتحقق منه.

### تصحيح P0: توحيد RBAC مع RLS (30 أكتوبر 2026)

أضيفت طبقة قاعدة بيانات واحدة لحل الدور الفعلي للمستخدم من `profiles.role` و`admin_role_assignments.role`:

- `private.current_admin_role()` تعيد الدور المعيّن، ولا تحول كل دور مفوض إلى مدير كامل لمجرد أن `profiles.role = 'admin'`.
- `private.is_admin_user()` و`public.is_admin_user()` تعتبران فقط المدير القديم غير المفوض أو `super_admin` مديرًا عامًا على مستوى RLS.
- قراءة تعيينات الأدوار للآخرين محصورة في `admin` و`super_admin`. الكتابة المباشرة على جدول التعيينات محصورة في `super_admin`، والمدير العادي يستخدم Server Action محميًا بـMFA وسجل تدقيق للأدوار المفوضة فقط. منح دور `admin` أو `super_admin` للغير، أو تعديل حساب مدير كامل، يتطلب `super_admin`. لا يمكن تعديل حساب `super_admin` إلا بواسطة `super_admin` نفسه.
- قراءة سجل التدقيق، وتنبيهات الطوابير، وإدارة طابور النشر الاجتماعي تستخدم قوائم أدوار صريحة مطابقة لمصفوفة `ADMIN_ROLE_PERMISSIONS`.
- تظل أدوار `content_manager` و`editor` و`video_manager` و`social_manager` و`moderator` و`seo_manager` و`analyst` و`support` محكومة بصلاحياتها المحددة في التطبيق؛ لا تمنحها سياسات RLS امتياز المدير العام.
- يظل تغيير الدور من خلال Server Action محميًا بـMFA وسجل التدقيق، ويُرفض تعديل حساب `super_admin` من أي دور آخر.

التحقق البرمجي: `pnpm admin:rbac:check`. هذا الاختبار يفحص عقد migration وصلاحيات الأدوار، ولا يستبدل اختبار قبول RLS الفعلي بعد تطبيق migration على قاعدة البيانات.

## 5. عناصر متابعة خارج الكود

في فحص Supabase بتاريخ 21 أكتوبر 2026 ظهر تنبيه بأن **Leaked Password Protection** معطلة. لم تتوفر عبر اتصال المشروع الحالي أداة لتعديل إعداد Auth هذا مباشرة. الإجراء المتبقي هو تفعيله من إعدادات Supabase Auth ثم إعادة تشغيل Security Advisor. لا يعدّ هذا التنبيه مشكلة في ترتيب الصفحات، لكنه عنصر أمان يجب إغلاقه على مستوى إعدادات المشروع.

## 6. قواعد تنظيم الواجهة وتجربة الهاتف

- الصفحة الرئيسية تعرض إجراءات سريعة مسموحة للدور الحالي فقط؛ روابط التنقل لا تتجاوز فحص الصلاحية على الخادم.
- تعرض مراكز الإدارة كبطاقات مجموعات، مع ثلاث روابط رئيسية ومحتوى إضافي قابل للفتح. لا تُكرر قائمة روابط الإدارة الستة والأربعين كبطاقات متساوية داخل لوحة العمليات.
- قائمة الهاتف تختار المجموعة من قائمة واحدة قابلة للمس، بدل شريط فئات أفقي ضيق يضغط أسماء المجموعات.
- تحليلات المحتوى تستخدم عمودين على الهاتف وتسمح بتمرير جدول الترتيب أفقيًا عند الحاجة.
- لا تظهر مقالة في «الأكثر مشاهدة» قبل وجود مشاهدة مسجلة أكبر من صفر؛ غياب البيانات ليس ترتيبًا حقيقيًا.
- التنقل العام مسؤول عن الوصول إلى الصفحات؛ صفحات التحليلات لا تعيد إنشاء مجموعة ثانية من روابط الإدارة في أسفلها.
- يجب أن تكون المسميات والروابط مباشرة، ولا تعرض لوحة التحكم أرقامًا مصطنعة بدل القيم غير المتاحة.

## 7. أوامر التحقق

تتضمن بوابة `verify` و`verify:pr` الآن `pnpm admin:api:check`، الذي يجرد كل ملفات API تحت `src/app/api/admin` وكل ملفات Server Actions ضمن `src/app/admin` و`src/features/admin/actions`، ويتحقق من وجود حارس صلاحيات أو MFA step-up قبل قراءة البيانات أو تنفيذ العمل الحساس. يُسمح فقط بوحدات HTTP التي ترفض الطريقة صراحةً بـ405 دون تنفيذ أي عملية.

```bash
pnpm admin:architecture:check
pnpm admin:pages:check
pnpm admin:video:check
pnpm admin:governance:check
pnpm security:check
pnpm check
pnpm lint
```

النجاح في فحوص العقد الثابتة لا يساوي نجاح البناء النهائي وحده؛ يلزم نجاح CI وPreview deployment بعد تغيير الواجهة.
