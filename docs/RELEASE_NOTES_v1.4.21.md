# ZIKR v1.4.21 — توثيق الإصدار

## ملخص

إصدار Android مبني من نسخة ZIKR الحالية `1.4.21`، مع الحفاظ على تطبيق Next.js وCapacitor الحالي ومساراته وتكاملاته. تم إنشاء ملفات APK وAAB بعد تثبيت JDK الكامل وAndroid SDK Platform 36، ثم فحص سلامة الحزم والبناء.

- **اسم التطبيق:** ZIKR | ذِكرٌ
- **معرّف الحزمة:** `com.zikr.app`
- **Version name:** `1.4.21`
- **Version code:** `52`
- **Minimum SDK:** `24`
- **Target/compile SDK:** `36`
- **Capacitor Android:** `7.4.3`
- **Commit المصدر:** `e34f7f2461140c0e2791b19d9e4a4dc476dc530d`

## ملفات الإصدار

| الملف | الحالة | الحجم | SHA-256 |
|---|---|---:|---|
| `zikr-v1.4.21-debug.apk` | موقّع بتوقيع Android Debug، مناسب للاختبار فقط | 37,386,098 bytes | `d8187dbd69815b22d425e0cd8ba7b6a89d90d8ba4592b1669f322d44d2e9459a` |
| `zikr-v1.4.21-debug.aab` | موقّع بتوقيع Android Debug، مناسب للاختبار فقط | 30,886,071 bytes | `b004dfab83fa4a73261d2130f88284feb22846c39c2fb9768c30b6307025b7c4` |
| `zikr-v1.4.21-release-unsigned.apk` | Release غير موقّع؛ يحتاج keystore الإنتاج قبل التوزيع العام | 34,784,226 bytes | `492fc507f5828b4a73d5e01293648a64178cb3e592ecf840739366f89c87d38c` |
| `zikr-v1.4.21-release-unsigned.aab` | Release غير موقّع؛ يحتاج keystore الإنتاج قبل رفعه إلى Google Play | 29,780,180 bytes | `e3f766e97f3085f9ad12fc1be6993de91560b8698cd2cb148b9dee172317890b` |

## نتائج التحقق

| الفحص | النتيجة |
|---|---|
| Web production build | ناجح |
| Capacitor sync Android | ناجح، مع اكتشاف 15 إضافة Capacitor |
| Gradle `assembleDebug` | ناجح |
| Gradle `assembleRelease` | ناجح |
| Gradle `bundleDebug` | ناجح |
| Gradle `bundleRelease` | ناجح |
| APK package identity | ناجح: `com.zikr.app` |
| Version metadata | ناجح: `versionName=1.4.21`, `versionCode=52` |
| APK debug signature | ناجح باستخدام APK Signature Scheme v2 |
| APK release signature | غير موقّع عمدًا لغياب keystore الإنتاج |
| AAB archive integrity | ناجحة عبر `unzip -tq` |

## توقيع Android

نسخة debug موقّعة بشهادة Android Debug التالية، ولا يجوز استخدامها كتوقيع production:

- **SHA-256:** `e81914f945c29f2f09fee90c99eafccdf776e6d9d50755db14a4cf0562f066b2`
- **SHA-1:** `0a1cef218a27c313c0944d337e8a8d7ad74cb051`

لم يوجد `android/keystore.properties` أو keystore إنتاج موثوق في البيئة. لذلك تم إبقاء ملفات release غير موقّعة، ولم يتم إنشاء مفتاح بديل؛ إنشاء مفتاح جديد قد يقطع تحديثات التطبيق المنشور سابقًا. قبل النشر العام يجب توفير keystore الأصلي، ثم إعادة بناء `assembleRelease` و`bundleRelease`، وفحص شهادة التوقيع وتحديث بصمة App Links في `assetlinks.json` و`ANDROID_APP_LINKS_SHA256`.

## ملاحظات البناء

ظهرت تحذيرات غير مانعة من تبعيات Capacitor/Kotlin المتعلقة بواجهات deprecated وعمليات unchecked. لم تؤدِّ هذه التحذيرات إلى فشل البناء، ولا تم تعديل كود التبعيات الخارجية لمعالجتها.

هذا الإصدار يثبت سلامة عملية البناء والحزم، لكنه لا يثبت وحده صحة كل خدمة خارجية وقت التشغيل؛ يلزم اختبار بيئة الإنتاج مع قيم Supabase وGoogle OAuth وYouTube وواجهات Quran/Hadith قبل النشر النهائي.

## تعليمات التثبيت للاختبار

يمكن تثبيت ملف debug APK على جهاز اختبار Android فقط. لا تستخدم ملفات debug في الإنتاج، ولا ترفع ملفات release غير الموقعة إلى Google Play قبل توقيعها بالـ keystore الأصلي للمشروع.

## سجل الإصدار

- **Tag المقترح:** `v1.4.21`
- **Release title:** `ZIKR v1.4.21`
- **نوع الإصدار:** Android build verification release
- **حالة النشر العام:** غير جاهز حتى توفير توقيع production الأصلي

تم إعداد هذا المستند ليُرفق مع GitHub Release ويظل مرجعًا قابلًا للتدقيق لكل ملف وبصمة وقرار توقيع.

---

## English summary

ZIKR v1.4.21 Android artifacts were built successfully from the current source. Debug APK/AAB artifacts are signed with the Android debug key for testing only. Release APK/AAB artifacts are valid but unsigned because no production keystore was available. Do not publish the unsigned artifacts to Google Play; provide the original production keystore, rebuild, and update App Links fingerprints first.
