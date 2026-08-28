# تقرير اختبار E2E وترقية Node/Auth — 15 أغسطس 2026

## الملخص التنفيذي

تم تنفيذ اختبار تكامل End-to-End محدود ومراقب بين Supabase `pg_cron` وSupabase Edge Function وVercel production endpoint. الاختبار لم ينشئ فيديوهات أو social items جديدة، ولم تكن هناك notification deliveries مستحقة وقت البدء؛ كان هناك اشتراك push نشط واحد فقط، و0 due deliveries، و0 processing deliveries، كما كانت طوابير الفيديو والنشر الاجتماعي بلا عناصر pending/queued. لذلك كان الاختبار مناسبًا للتحقق من المصادقة والتكامل والضغط المحدود دون side effects إنتاجية غير مقصودة.

تم تحديث `@supabase/supabase-js` من `2.110.7` إلى `2.112.3` في تطبيق Next.js وEdge worker، وتحديث `@supabase/ssr` إلى `0.12.4`. أضيف قيد Node `>=22.13.0` إلى `package.json`. بيئة GitHub Actions تستخدم Node 22، وإعداد Vercel الحالي هو Node `24.x`، لذلك لا يوجد مسار نشر يستخدم Node 20 أو أقدم.

## نتائج اختبار التكامل والضغط المحدود

| الجولة | prayer worker | Vercel video endpoint | النتيجة |
|---|---:|---:|---|
| الجولة الأولى قبل الترقية | 8 طلبات | 8 طلبات | 16/16 HTTP 200، بلا timeout أو error |
| الجولة النهائية بعد الترقية | 4 طلبات | 4 طلبات | 8/8 HTTP 200، بلا timeout أو error |

أُطلقت الطلبات من داخل Supabase باستخدام `net.http_post` و`public.get_push_scheduler_secret()`، أي بنفس مسار المصادقة الذي تستخدمه cron jobs الفعلية. أرقام الطلبات في الجولة النهائية كانت `2059–2066`، وكلها عادت `status_code = 200` و`timed_out = false` و`error_msg = null`.

يحمي مسار الصلاة التكرار عبر unique delivery key والـ conditional claiming، ويحمي مسار الفيديو التكرار عبر optimistic queue claims وHeyGen idempotency key. وبما أن الطوابير كانت فارغة من العناصر القابلة للمعالجة، لم ينتج الاختبار provider submission أو نشر اجتماعي.

## حالة Cron وسجلات التشغيل بعد الاختبار

آخر 12 تشغيلًا لـ `zikr-prayer-push-dispatch` و`zikr-video-processing` كانت كلها `succeeded` مع `return_message = 1 row`. سجلات Vercel أظهرت الطلبات الأربعة الخاصة باختبار الفيديو في `06:40:44 UTC` بحالة 200، إضافة إلى التشغيل الدوري في `06:41:00 UTC` بحالة 200. فحص Vercel runtime errors خلال آخر ساعة أعاد `No runtime errors found`.

## نتيجة تحديث Node/Supabase client

نُشرت Edge Function `prayer-notification-worker` بنجاح في Supabase كـ version 16 مع `verify_jwt=false`، وهو الإعداد المقصود لأن الكود يطبق bearer authentication مخصصًا عبر `get_push_scheduler_secret`. في سجلات version 15 ظهر تحذير Node.js 20 أو أقل، بينما لم يظهر أي `function_logs` warning في نافذة `06:35–06:42 UTC` بعد تشغيل version 16. هذا يثبت أن تحديث dependency أزال التحذير المتكرر في التشغيل الفعلي.

التحقق المحلي نجح بعد التحديث:

| الفحص | النتيجة |
|---|---|
| `pnpm install --frozen-lockfile` | Passed |
| `pnpm verify` | Passed |
| الاختبارات | 56 passed، 0 failed |
| TypeScript وESLint وNext.js build | Passed |
| Vercel deployment `dpl_BG7DZLarcC8f9AtEG5Bu4XKTjtNK` | READY |

## تحذيرات Supabase Auth

بقي تحذيرا GoTrue التاليان في سجلات Auth السابقة: `GOTRUE_JWT_DEFAULT_GROUP_NAME not supported` و`GOTRUE_JWT_ADMIN_GROUP_NAME not supported`. البحث في repository و`supabase/config.toml` لم يجد أي إعداد بهذه الأسماء، كما أن أدوات إدارة Supabase المتاحة للمشروع لا تعرض endpoint مدعومًا لتعديل متغيرات GoTrue الداخلية. لذلك لا يمكن إصلاحهما بأمان عبر migration أو كود التطبيق؛ محاولة إضافة مفاتيح غير مدعومة قد تزيد المشكلة بدل حلها.

هذه تحذيرات deprecation من خدمة Auth المُدارة، وليست فشل مصادقة أو فشل cron. يجب متابعة إزالة هذه المفاتيح من إعدادات المشروع عبر Supabase Dashboard/Support إذا ظهرت كإعدادات قابلة للإدارة، لكن لم يتم تغيير إعدادات Auth عشوائيًا أو تعطيل حماية قائمة.

## الملفات والـ commits

التغييرات البرمجية موجودة في commit `8d62609` وتشمل `package.json` و`pnpm-lock.yaml` و`supabase/functions/prayer-notification-worker/deno.json`. نُشرت Edge Function version 16 في Supabase، وأصبح deployment production الحالي في Vercel READY.

## حدود الاختبار

هذا اختبار ضغط تكاملي محدود على الإنتاج وليس benchmark لتحديد أقصى RPS؛ تم تقييده عمدًا لتجنب side effects مثل إرسال push حقيقي أو إنشاء HeyGen jobs. قياس السعة القصوى ينبغي أن يتم على Supabase branch وVercel Preview مع بيانات اختبار ومفاتيح provider غير إنتاجية.

## المراجع

[1]: https://supabase.com/docs/guides/functions/deploy "Supabase Edge Functions deployment"  
[2]: https://supabase.com/docs/guides/auth/architecture "Supabase Auth architecture"  
[3]: https://vercel.com/docs/functions/runtimes/node-js "Vercel Node.js runtime documentation"  
[4]: https://nodejs.org/en/about/previous-releases "Node.js release and support policy"
