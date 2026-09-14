# ZIKR 1.4.21

## ملخص الإصدار

إصدار تصحيح مخصص للتجهيز للنشر، يثبت سلامة المشروع بعد تدقيق شامل، يرفع إصدار Android إلى `versionCode=52` و`versionName=1.4.21`، ويزيل إعداد pnpm القديم من `package.json` حتى لا تظهر تحذيرات إعداد غير مدعوم أثناء التثبيت أو البناء. بقيت إعدادات overrides في `pnpm-workspace.yaml`، وهو الموضع المدعوم من pnpm.

## التحقق البرمجي

| الفحص | النتيجة |
|---|---|
| TypeScript (`pnpm check`) | ناجح |
| ESLint (`pnpm lint`) | ناجح |
| اختبارات الوحدة والتكامل (`pnpm test`) | 75 ناجحة، 0 فاشلة |
| سلامة المشروع | ناجحة، 294 مسار offline و16 dataset |
| سلامة المسارات | ناجحة، 76 مسارًا مطلوبًا |
| Local imports | ناجحة |
| Placeholder media | ناجحة |
| Mobile readiness | ناجحة |
| Offline content | ناجحة |
| Production verification (`pnpm verify`) | ناجح، وبناء Next.js الإنتاجي ناجح |

## ملفات Android الناتجة

تم البناء باستخدام Android SDK API 36 وBuild Tools 36.0.0 وJDK 21.0.12:

| الملف | الحجم | SHA-256 | الحالة |
|---|---:|---|---|
| `app-debug.apk` | 37,368,990 bytes | `d8bab162a341f07f9a76db622a6dc5c125ad29ee1401208ef048cbf81ae6e4d5` | موقع debug، تحقق v2 ناجح |
| `app-release-unsigned.apk` | 34,777,650 bytes | `bebe29ff6d30f8d5c89d2bb47d223995497178c08d0d3e5d0def2c0f5feb52a9` | release غير موقع |
| `app-release.aab` | 29,773,605 bytes | `4a2c3cf6cf8aef84fe72a2c3029615331be74454fe5f1b618e2f7f45ffdd714e` | AAB release غير موقع |

أظهر فحص metadata أن `applicationId=com.zikr.app` و`versionCode=52` و`versionName=1.4.21` و`minSdk=24` و`targetSdk=36`. لا يجوز استخدام APK/AAB غير الموقعين للنشر العام على Google Play؛ يلزم توفير keystore الأصلي للمشروع وملف `android/keystore.properties` السري خارج المستودع لإنتاج ملفات release موقعة.

## GitHub وVercel

تم تثبيت الإصدار ودفعه إلى GitHub في commit `842dfb7358668dd67a20ecf02990ba3996f87528` على `main`، والمستودع نظيف بعد استبعاد الملفات المولدة.

مشروع Vercel `zikr` مرتبط بمستودع GitHub `Zikrmediaofficial/Zikr` ضمن فريق `zikrmediaofficial-project`. بدأ النشر تلقائيًا بعد الدفع، لكن Vercel سجّل الحالة `BLOCKED` للـ commit الحالي، مع رابط خطأ `https://vercel.com/docs/deployments/troubleshoot-project-collaboration#account-configuration`. تمت محاولة إعادة تشغيل النشر عبر موصل Vercel، فأعاد Vercel الخطأ `402 payment_required`: حد النشر المجاني `api-deployments-free-per-day` مستنفد، والمتبقي `0`، ويعاد الضبط خلال 24 ساعة. لذلك لا يمكن وصف نشر 1.4.21 بأنه ناجح قبل انتهاء الحد ومعالجة إعداد الحساب/الحماية.

## التغييرات

- رفع إصدار npm وAndroid إلى `1.4.21`.
- رفع Android `versionCode` من 51 إلى 52.
- إزالة إعداد pnpm القديم من `package.json` وlockfile، مع إبقاء overrides في `pnpm-workspace.yaml`.
- استبعاد ملفات vendor الثنائية التي تُنزّل وقت البناء من Git.
- إضافة هذا السجل لتوثيق نتائج التدقيق والبناء ومتطلبات التوقيع وحالة Vercel.
