# ZIKR 1.4.21 — Release Notes

**تاريخ الإصدار:** 15 سبتمبر 2026

**نوع الإصدار:** Patch Release / Android Distribution Build

**حالة المصدر:** مستودع GitHub نظيف ومتزامن مع `origin/main`

## روابط التحميل

### Android APK

- [تحميل APK Debug الموقع](file:///home/ubuntu/zikr-release-1.4.21/zikr-1.4.21-debug.apk)
- [تحميل APK Release غير الموقع](file:///home/ubuntu/zikr-release-1.4.21/zikr-1.4.21-release-unsigned.apk)

### Android App Bundle

- [تحميل AAB Release غير الموقع](file:///home/ubuntu/zikr-release-1.4.21/zikr-1.4.21-release-unsigned.aab)

### التحقق من الملفات

- [تحميل ملف SHA-256](file:///home/ubuntu/zikr-release-1.4.21/SHA256SUMS.txt)

> روابط `file://` أعلاه تشير إلى ملفات الإصدار الموجودة في بيئة التسليم الحالية. قبل نشرها للمستخدمين النهائيين، يُنصح برفعها إلى GitHub Release أو تخزين ملفات عام موثوق.

## معلومات الإصدار

| العنصر | القيمة |
|---|---|
| اسم التطبيق | ZIKR / ذِكرٌ |
| إصدار التطبيق | `1.4.21` |
| Android versionCode | `52` |
| Application ID | `com.zikr.app` |
| Minimum SDK | `24` |
| Target SDK | `36` |
| Compile SDK | `36` |
| منصة البناء | Android SDK API 36 |
| Build Tools | `36.0.0` |
| Java / JDK | `21.0.12` |
| Capacitor | `7.4.3` |
| Next.js | `16.3.4` |
| Node.js | `22.x` |
| Package manager | `pnpm 9.15.0` |

## الملفات والبصمات

| الملف | الحجم | SHA-256 | التوقيع والحالة |
|---|---:|---|---|
| `zikr-1.4.21-debug.apk` | 37,368,990 bytes | `d8bab162a341f07f9a76db622a6dc5c125ad29ee1401208ef048cbf81ae6e4d5` | Debug signed، تحقق APK v2 ناجح |
| `zikr-1.4.21-release-unsigned.apk` | 34,777,650 bytes | `bebe29ff6d30f8d5c89d2bb47d223995497178c08d0d3e5d0def2c0f5feb52a9` | Release unsigned |
| `zikr-1.4.21-release-unsigned.aab` | 29,773,605 bytes | `4a2c3cf6cf8aef84fe72a2c3029615331be74454fe5f1b618e2f7f45ffdd714e` | Release unsigned |

تمت إعادة حساب SHA-256 والتحقق من الملفات بنجاح باستخدام `sha256sum -c SHA256SUMS.txt`.

## التوقيع الأمني

تم التحقق من APK debug باستخدام Android `apksigner`، وكانت النتيجة:

- APK Signature Scheme v2: **ناجح**.
- عدد الموقّعين: **1**.
- التوقيع v1/v3/v4: غير مستخدم في هذه النسخة debug.

ملفات release APK وAAB غير موقعة لأن keystore الإنتاج الأصلي وملف `android/keystore.properties` غير موجودين في بيئة البناء. لا ينبغي رفع هذه الملفات إلى Google Play قبل توفير keystore الأصلي. إنشاء keystore جديد غير موصى به لأنه سيمنع تحديث التطبيق المثبت والموقّع بالمفتاح السابق.

## ملخص التغييرات

- رفع إصدار التطبيق وAndroid إلى `1.4.21`.
- رفع `versionCode` من `51` إلى `52`.
- إزالة إعداد pnpm القديم غير المدعوم من `package.json`.
- مزامنة lockfile مع إعدادات الاعتماديات الحالية.
- استبعاد ملفات `vendor` الثنائية التي تُنزّل أثناء البناء من Git.
- الحفاظ على `applicationId=com.zikr.app` ومسارات التطبيق الحالية.
- توثيق قيود التوقيع والنشر بدل اعتبار الملفات غير الموقعة أو النشر المحجوب إنتاجًا نهائيًا.

## نتائج الاختبارات والتحقق

| الفحص | النتيجة |
|---|---|
| TypeScript — `pnpm check` | ناجح |
| ESLint — `pnpm lint` | ناجح |
| Unit & integration tests — `pnpm test` | **75 ناجحة، 0 فاشلة** |
| Project integrity | ناجح؛ 294 offline routes و16 datasets |
| Platform routes | ناجح؛ 76 route/assets مطلوبة |
| Local imports | ناجح |
| Placeholder media | ناجح |
| Mobile readiness | ناجح |
| Offline content | ناجح |
| Production verification — `pnpm verify` | ناجح |
| Next.js production build | ناجح |
| Android debug APK build | ناجح |
| Android release APK build | ناجح، غير موقع |
| Android release AAB build | ناجح، غير موقع |
| SHA-256 artifact verification | ناجح |

## GitHub وسجل الإصدار

- المستودع: [Zikrmediaofficial/Zikr](https://github.com/Zikrmediaofficial/Zikr)
- الفرع: `main`
- commit الإصدار: [`842dfb7`](https://github.com/Zikrmediaofficial/Zikr/commit/842dfb7358668dd67a20ecf02990ba3996f87528)
- آخر commit توثيقي: [`c4d98d8`](https://github.com/Zikrmediaofficial/Zikr/commit/c4d98d809840165ad8a5bfe80041bcd0ec4f37e0)
- آخر commit لتصحيح هوية النشر: [`9252f60`](https://github.com/Zikrmediaofficial/Zikr/commit/9252f60dd93528f48d98ec45a46504b681152f9c)
- هوية Git الحالية: `Zikrmediaofficial <zikrmediaofficial.vercel.app@gmail.com>`
- حالة Git الأخيرة: `main` متزامن مع `origin/main` دون تغييرات محلية.

## Vercel Deployment

المشروع المرتبط هو `zikr` ضمن فريق `zikrmediaofficial-project`.

تم تشغيل نشر GitHub تلقائيًا، لكن Vercel سجّل النشر الحالي بحالة `BLOCKED` بسبب إعدادات حساب/حماية المشروع. كما تمت محاولة إعادة النشر عبر موصل Vercel، وأعاد Vercel الخطأ `402 payment_required` بسبب استنفاد حد النشر المجاني اليومي `api-deployments-free-per-day`، مع `remaining=0` وإعادة ضبط خلال 24 ساعة.

- [تفاصيل نشر Vercel](https://vercel.com/zikrmediaofficial/zikr/EEx1xqpjoTRANWfqNAAaHR4QRrna)
- [توثيق معالجة account configuration](https://vercel.com/docs/deployments/troubleshoot-project-collaboration#account-configuration)

لذلك لا يُعد نشر `1.4.21` إنتاجيًا ناجحًا حتى ينتهي حد Vercel وتُعالج إعدادات الحساب/الحماية.

## تعليمات التثبيت

### تثبيت APK Debug

1. نزّل ملف `zikr-1.4.21-debug.apk`.
2. فعّل تثبيت التطبيقات من مصادر غير معروفة على جهاز الاختبار.
3. ثبّت APK يدويًا.
4. تحقق من `applicationId` والإصدار عبر معلومات التطبيق.

### نشر Google Play

قبل نشر الإصدار على Google Play، يجب:

1. توفير keystore الإنتاج الأصلي.
2. إنشاء `android/keystore.properties` خارج Git وعدم رفعه للمستودع.
3. إعادة بناء `assembleRelease` و`bundleRelease` مع التوقيع الأصلي.
4. التحقق من توقيع APK/AAB والبصمات.
5. رفع AAB الموقع فقط إلى Google Play.

## ملاحظات مهمة

- APK debug مناسب للاختبار وليس للنشر العام.
- APK release وAAB release الحاليان غير موقعين.
- لا توجد تغييرات مدمرة على قاعدة البيانات ضمن هذا الإصدار.
- ملفات build وvendor المؤقتة غير مضافة إلى Git.
- يجب عدم استخدام رابط `file://` لتوزيع عام؛ استخدم GitHub Releases أو تخزينًا عامًا بعد توقيع ملفات release.
