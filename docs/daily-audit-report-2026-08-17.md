# تقرير المراجعة اليومية لمشروع ZIKR

**التاريخ:** 17 أغسطس 2026

## النتيجة التنفيذية

اكتملت المراجعة اليومية لمشروع ZIKR والموقع الإنتاجي `https://zikrmediaofficial.vercel.app` ومستودع GitHub وSupabase وVercel. لم يتم نشر محتوى ديني جديد في هذه الدورة لأن المراجعة لم تتحقق من مصدر جديد محدد يمكن إضافته بأمان. هذا قرار نجاح آمن وليس نقصًا في التنفيذ؛ لا يجوز ملء الأقسام بآيات أو أحاديث أو سير أو أحكام مولدة بلا مصدر.

أُصلح خلال هذه الدورة مسار استرداد Google OAuth عند وصول callback قديم أو عند فقدان PKCE verifier. يبدأ OAuth حاليًا بـ PKCE challenge من نوع S256 ويرسل verifier cookies، بينما يعيد callback المتصفح إلى صفحة تسجيل الدخول برسالة عربية واضحة تطلب إعادة بدء Google من نفس المتصفح بدل تسجيل الحالة المتوقعة كخطأ داخلي.

## فحوص الإنتاج

| الفحص | النتيجة |
|---|---:|
| صفحات ومسارات الإنتاج التي فحصها `audit-production-pages.mjs` | 156 صفحة عامة بحالة 200 |
| المشاكل في production audit | 0 |
| روابط sitemap | 68,766 |
| المسارات الحرجة المختبرة يدويًا | 22/22 بحالة 200 |
| `/api/prayer-times` بإحداثيات صحيحة | 200، `application/json` |
| `/auth/google` | 307 إلى Supabase Google authorize مع PKCE S256 وverifier cookies |
| Runtime logs للنشر الحالي خلال 24 ساعة | لا توجد سجلات error/fatal |

شملت المسارات الحرجة القرآن والمصحف والتفسير والحديث والدعاء والأذكار والأنبياء والصحابة والغزوات والعلماء والمقالات والفيديو والراديو والصلاة والقبلة والتسبيح والحفظ والمفضلة والملف الشخصي والذكاء الروحي وPWA وSEO عبر `manifest.webmanifest` و`sitemap-index.xml` و`robots.txt`.

## Supabase وCron

أظهر Security Advisor تحذيرين خارجيين فقط: وجود `pg_net` في schema `public`، وتعطيل حماية كلمات المرور المسربة. لم أغيّر `pg_net` لأن وظائف `net.http_post` والـ cron الحالية تعتمد على schema `net` ويجب إجراء نقل تجريبي شامل قبل أي تغيير. حماية كلمات المرور المسربة إعداد Auth خارجي من لوحة Supabase ويتطلب خطة تدعم الميزة؛ لم يتم تجاوز التحذير عبر SQL.

أظهر Performance Advisor **97 ملاحظة INFO** من نوع `unused_index` فقط، مع **صفر** من `multiple_permissive_policies`. لا توجد ملاحظة WARN أداء جديدة، ولذلك لم تُحذف فهارس اعتمادًا على advisor وحده قبل قياس workload حقيقي.

آخر تشغيلات `zikr-prayer-push-dispatch` و`zikr-video-processing` كانت نشطة وناجحة، وكل السجلات العشرين الأخيرة أعادت `succeeded` و`1 row`.

## GitHub وVercel والاختبارات

| النظام | الدليل | الحالة |
|---|---|---|
| GitHub main | commit `4baecd0` | منشور ونظيف |
| Branch protection | `ci/circleci: verify` مطلوب، وforce-push والحذف ممنوعان | سليم |
| CircleCI | job #30 | نجح |
| Vercel ZIKR | deployment المرتبط بالـ commit | نجح |
| Vercel v0-project | status المرتبط بالـ commit | نجح |
| Migration check | 127 migration canonical، بلا duplicate versions | نجح |
| Migration replay | 127/127 | نجح |
| Routes/imports/mobile/lint/TypeScript | `pnpm verify` | نجح |
| الاختبارات | 58/58، 0 failures | نجح |
| Production build | Next.js 16.3.1 | نجح |

يظهر فحص mobile readiness تحذيرين غير مانعين للإطلاق: قيم Android App Links وiOS Associated Domains ما زالت placeholders، وهما مطلوبان فقط قبل نشر تطبيقات المتاجر، وليسَا عطلًا في PWA الويب الحالية.

## التغيير المنشور

| الملف | التغيير |
|---|---|
| `lib/auth-enhanced.ts` | إضافة `isPkceVerifierError` لتصنيف verifier المفقود/المنتهي دون تسريب بيانات |
| `app/auth/callback/route.ts` | إعادة توجيه حالة PKCE القابلة للاسترداد إلى `auth_pkce_expired` مع `console.warn` بدل `console.error` |
| `app/auth/login/page.tsx` | رسالة عربية تشرح إعادة بدء Google OAuth من نفس المتصفح |
| `__tests__/integration/auth.test.ts` | اختبار تصنيف PKCE واختبار عدم تصنيف أخطاء OAuth العامة كـ PKCE |

## المحتوى والمصادر

لم يُضف محتوى جديد في هذه الدورة لعدم وجود مادة جديدة تم التحقق منها أثناء الفحص. يبقى التحديث اليومي ملتزمًا بالمصادر الأصلية أو الناشرين الموثوقين، مع تخزين رابط المصدر وتاريخ الجلب عند كل إضافة. توثيق Quran Foundation يوضح أن عميل `@supabase/ssr` يستخدم PKCE افتراضيًا ويحفظ معلومات الجلسة في cookies، وأن تبادل `exchangeCodeForSession` يتطلب مشاركة verifier بين طرفي العميل والخادم [1].

## المشكلات المتبقية

المشكلات المتبقية ليست أعطالًا حرجة في نشر ZIKR الحالي. وهي: تحذير `pg_net` الخارجي، تعطيل leaked-password protection بحسب إعداد Supabase الحالي، 97 ملاحظة INFO لفهارس غير مستخدمة تحتاج قياسًا قبل الحذف، وحقول mobile store placeholders قبل إطلاق تطبيقات iOS/Android. كما أن خطأ PKCE الذي ظهر في سجلات Vercel كان callback قديمًا أو بدأ من متصفح/جهاز مختلف؛ أصبح له الآن مسار استرداد واضح، ولم تظهر أخطاء error/fatal في deployment الحالي بعد الإصلاح.

## المراجع

[1]: https://supabase.com/docs/guides/auth/server-side/advanced-guide "Supabase Advanced SSR Auth Guide"
[2]: https://api-docs.quran.foundation/ "Quran Foundation API Documentation"
