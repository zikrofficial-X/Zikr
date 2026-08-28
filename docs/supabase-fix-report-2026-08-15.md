# تقرير إصلاح Supabase — 15 أغسطس 2026

## النتيجة

تم إصلاح السبب الجذري للتحذيرات الظاهرة في سجل workflow المرفق، ودُفعت التغييرات إلى GitHub في commit `67cde6f146be3577b82b6b4f0c017c1ad955fc77`. كان السبب أن 28 migration محلية تحتوي على `BEGIN;` و`COMMIT;` صريحة رغم أن مشغّل Supabase يدير transaction لكل migration. بعض الملفات كانت تفتح المعاملة مرتين، وبعضها يغلقها مرتين، وهو ما يفسر رسائل `there is already a transaction in progress` و`there is no transaction in progress`.

أزيلت أسطر transaction-control العلوية فقط، مع الحفاظ على كل أوامر DDL وINSERT ومحتوى الحديث والبيانات. لم يتم حذف جدول أو إعادة ضبط قاعدة الإنتاج، ولم تُطبّق عملية destructive على Supabase. أضيف أيضًا guard إلى `scripts/check-supabase-migrations.mjs` يمنع عودة هذه المشكلة في أي migration مستقبلية.

## الأدلة والتحقق

| الفحص | النتيجة |
|---|---|
| عدد migrations المحلية | 121 migration canonical |
| migration checker | Passed؛ لا توجد نسخ مكررة ولا transaction controls علوية |
| migration replay | `ALL_MIGRATIONS_PASSED` |
| الاختبارات الآلية | 56 passed، 0 failed |
| TypeScript وESLint وNext.js build | Passed عبر `pnpm verify` |
| migration ledger الإنتاجي | 121 إصدارًا؛ آخر إصدار `20260815235000` متطابق مع المصدر المحلي |
| `zikr-prayer-push-dispatch` | Active، كل دقيقة، وآخر التشغيلات `succeeded` |
| `zikr-video-processing` | Active، كل دقيقة، وآخر التشغيلات `succeeded` |
| Vercel deployment للـ fix | READY على commit `67cde6f` |
| production smoke | `/`, Quran، Hadith، Dua، prayer-times، Qibla، push public key أعادت HTTP 200 |
| حدود الأمان | POST غير مصادق إلى push subscription وvideo-processing أعاد HTTP 401 |

## الملفات المهمة

تم تعديل `supabase/migrations/` في سلسلة seed والـ content expansions لإزالة transaction boundaries التي يديرها Supabase. كما تم تعديل `scripts/check-supabase-migrations.mjs` لإظهار خطأ صريح إذا احتوت migration جديدة على `BEGIN` أو `COMMIT` أو `ROLLBACK` أو `START TRANSACTION` في سطر علوي.

بقيت كتل `BEGIN ... END` داخل PL/pgSQL كما هي؛ فهي جزء من منطق الدوال وليست transaction-control statements مستقلة. كذلك لم تتغير أي بيانات حديث أو Quran أو schema semantics.

## حالة Supabase الحالية

المشروع الإنتاجي `eydxvcamhjhajxjrsgym` healthy. سجل migration البعيد متطابق عدديًا مع السلسلة المحلية، والـ cron jobs الفعالة تعمل بنجاح. هذا الإصلاح يستهدف workflow/Preview replay؛ migrations التي سبق تطبيقها في الإنتاج لا تحتاج إلى إعادة تطبيق لأن التغيير حذف transaction wrappers فقط ولم يغيّر version أو SQL semantics.

ما زال Supabase security advisor يعرض تحذيرين مستقلين. الأول أن `pg_net` مثبت في `public`. توثيق Supabase يوضح أن `pg_net` يستخدم namespace `net` و`net.http_post`; كما أن محاولة `ALTER EXTENSION pg_net SET SCHEMA extensions` في هذا المشروع رفضها PostgreSQL برسالة أن الامتداد لا يدعم `SET SCHEMA`. لم يتم إسقاط وإعادة إنشاء الامتداد، لأن ذلك قد يقطع cron requests وحالة `pg_net` الداخلية.

والثاني أن leaked-password protection في Auth معطل. تم فحص صفحة Attack Protection، لكنها لا تعرض toggle قابلًا للتفعيل لهذا المشروع؛ المفتاح الظاهر كان CAPTCHA فقط، وأُعيد إلى وضعه الأصلي دون حفظ تغيير غير مقصود. لا توجد طريقة SQL آمنة لتفعيل إعداد Auth هذا من خلال migration عادية، لذلك بقي كإجراء مالك/لوحة Supabase وليس كإصلاح وهمي داخل repository.

Performance advisors الحالية تعرض unused-index INFO فقط، وليست أخطاء تشغيل. لم تُحذف الفهارس عشوائيًا لأن إحصاء الاستخدام قد يتغير مع حركة الإنتاج، ولأن حذف index قد يضر مسارات Quran/audio/content أو سياسات المستخدمين.

## المراجع

[1]: https://supabase.com/docs/guides/database/extensions/pg_net "Supabase pg_net documentation"  
[2]: https://supabase.com/docs/guides/database/extensions "Supabase database extensions"  
[3]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Row Level Security"  
[4]: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection "Supabase leaked-password protection"
