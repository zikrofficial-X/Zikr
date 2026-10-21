# حوكمة لوحة إدارة ذِكر

**آخر مراجعة:** 21 أكتوبر 2026  
**مصدر الحقيقة للتنقل:** `src/features/admin/config/navigation.ts`  
**مصدر الحقيقة للصلاحيات:** `src/features/admin/services/permissions.ts`

تعتمد اللوحة على 8 مجموعات تنقل و45 مسارًا إداريًا ظاهرًا. ملف التنقل هو المصدر المنفرد لترتيب الصفحات، بينما يرشّح `src/app/admin/layout.tsx` الروابط بحسب دور المستخدم. لا تُضاف روابط إلى قائمة الإدارة قبل وجود صفحة فعلية وفحص صلاحية خادمي.

## 1. جرد المسارات والصلاحيات

هذا الجرد يعكس عناصر التنقل المعرّفة في الفرع وقت المراجعة. يفحص `pnpm admin:governance:check` وجود كل مسار، والصلاحية المناظرة، وظهور كل زوج (مسار/صلاحية) هنا كي لا ينفصل التوثيق عن الكود.


### التشغيل والمراقبة

| المسار | الصفحة | الصلاحية المطلوبة |
|---|---|---|
| `/admin` | لوحة التحكم | `dashboard.view` |
| `/admin/automation` | التشغيل الآلي | `system.manage` |
| `/admin/health` | صحة النظام | `system.manage` |
| `/admin/notifications` | التنبيهات | `notifications.manage` |
| `/admin/audit` | سجل التدقيق | `audit.read` |
| `/admin/release` | مركز الإصدار | `release.manage` |


### المحتوى والمعرفة

| المسار | الصفحة | الصلاحية المطلوبة |
|---|---|---|
| `/admin/content` | إدارة المحتوى | `content.manage` |
| `/admin/library` | مكتبة المحتوى | `library.manage` |
| `/admin/sources` | مصادر المحتوى | `sources.manage` |
| `/admin/editorial` | التحرير والنشر | `knowledge.manage` |
| `/admin/knowledge` | المعرفة الإسلامية | `knowledge.manage` |
| `/admin/prophets` | الأنبياء | `prophets.manage` |
| `/admin/battles` | الغزوات | `battles.manage` |
| `/admin/categories` | التصنيفات | `content.manage` |
| `/admin/sections` | الأقسام وترتيبها | `sections.manage` |
| `/admin/search` | البحث والفهرسة | `content.manage` |


### الفيديو والوسائط

| المسار | الصفحة | الصلاحية المطلوبة |
|---|---|---|
| `/admin/video-factory` | مصنع الفيديو | `video.manage` |
| `/admin/video-factory/queue` | قائمة طلبات الفيديو | `video.manage` |
| `/admin/ai-video` | استوديو إنشاء الفيديو | `video.manage` |
| `/admin/ai-video/curated` | المحتوى الموثق للفيديو | `video.manage` |
| `/admin/video-factory/sources` | مصادر الفيديو | `video.manage` |
| `/admin/video-factory/scripts` | نصوص السرد | `video.manage` |
| `/admin/video-factory/voices` | الأصوات | `video.manage` |
| `/admin/video-factory/visuals` | العناصر المرئية | `video.manage` |
| `/admin/video-factory/templates` | القوالب | `video.manage` |
| `/admin/video-factory/qa` | ضبط الجودة | `video.manage` |
| `/admin/media` | مكتبة الوسائط | `media.manage` |


### الصوت

| المسار | الصفحة | الصلاحية المطلوبة |
|---|---|---|
| `/admin/audio` | مركز الصوت | `audio.manage` |
| `/admin/audio/quran` | تلاوات القرآن | `audio.manage` |
| `/admin/audio/adhan` | الأذان | `audio.manage` |
| `/admin/audio/tts` | تحويل النص إلى صوت | `audio.manage` |
| `/admin/site-audio` | صوت الموقع والتذكيرات | `audio.manage` |


### النشر الاجتماعي

| المسار | الصفحة | الصلاحية المطلوبة |
|---|---|---|
| `/admin/social` | مركز النشر الاجتماعي | `social.manage` |


### قسم الأطفال

| المسار | الصفحة | الصلاحية المطلوبة |
|---|---|---|
| `/admin/kids` | لوحة الأطفال | `kids.manage` |
| `/admin/kids/content` | محتوى الأطفال | `kids.manage` |
| `/admin/kids/games` | الألعاب | `kids.manage` |
| `/admin/kids/levels` | المستويات | `kids.manage` |
| `/admin/kids/assets` | الأصول | `kids.manage` |
| `/admin/kids/analytics` | تحليلات الأطفال | `kids.manage` |


### المستخدمون والتحليلات

| المسار | الصفحة | الصلاحية المطلوبة |
|---|---|---|
| `/admin/users` | المستخدمون والأدوار | `users.read` |
| `/admin/analytics` | تحليلات المنصة | `analytics.read` |


### الأمن والإعدادات

| المسار | الصفحة | الصلاحية المطلوبة |
|---|---|---|
| `/admin/security` | أمن لوحة الإدارة | `security.manage` |
| `/admin/seo` | تحسين الظهور | `settings.manage` |
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
| `social_manager` | إدارة الفيديو/الوسائط والنشر الاجتماعي والتحليلات والتنبيهات وسجل التدقيق. |
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
| الفيديو والوسائط | `/admin/video-factory`, `/admin/ai-video`, `/admin/media` | `videos`, `video_generation_requests`, `media_assets` وموارد التخزين | لا يُعلن عن تنفيذ فوري إذا كانت العملية قد دخلت طابور عامل مجدول. |
| النشر الاجتماعي | `/admin/social` | `social_publish_queue`, `social_sync_jobs`, `social_platform_credentials` | بيانات OAuth ورموز الصفحات Server-only؛ لا تضاف سياسات قراءة للـanon أو authenticated على جدول الاعتمادات. |
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

## 5. عناصر متابعة خارج الكود

في فحص Supabase بتاريخ 21 أكتوبر 2026 ظهر تنبيه بأن **Leaked Password Protection** معطلة. لم تتوفر عبر اتصال المشروع الحالي أداة لتعديل إعداد Auth هذا مباشرة. الإجراء المتبقي هو تفعيله من إعدادات Supabase Auth ثم إعادة تشغيل Security Advisor. لا يعدّ هذا التنبيه مشكلة في ترتيب الصفحات، لكنه عنصر أمان يجب إغلاقه على مستوى إعدادات المشروع.

## 6. أوامر التحقق

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
