# تقرير أداء مسارات ZIKR الإنتاجية

**النطاق:** https://zikrmediaofficial.vercel.app  
**وقت القياس:** 2026-08-22T07:02:52.388Z  
**طريقة القياس:** طلب HTTP مباشر لكل مسار مع `redirect: manual` و`cache: no-store`، ويُقاس الزمن من بدء الطلب حتى قراءة جسم الاستجابة كاملًا. هذه ليست أرقام Lighthouse أو Real User Monitoring.

## الملخص التنفيذي

تم فحص **43 مسارًا**، ونجحت جميع الطلبات (**43 من 43**). تراوح زمن الاستجابة بين **63.91 ms** و**1759.82 ms**، وكان الوسيط **179.82 ms**. إجمالي البيانات المقروءة من الاستجابات بلغ **4.07 MB**.

| المقياس | القيمة |
|---|---:|
| عدد المسارات | 43 |
| الناجح | 43 |
| الفاشل | 0 |
| الحد الأدنى | 63.91 ms |
| الوسيط | 179.82 ms |
| الحد الأقصى | 1759.82 ms |
| إجمالي حجم الاستجابات | 4.07 MB |

## توزيع الحالات

| HTTP status | العدد | التفسير |
|---:|---:|---|
| 200 | 42 | استجابة ناجحة |
| 307 | 1 | تحتاج مراجعة حسب المسار |

## النتائج حسب الفئة

تم قياس **30 صفحة HTML** و**7 واجهة JSON** و**6 أصل ثابت/صوتي**.

| المسار | الحالة | النتيجة | الزمن | الحجم | نوع المحتوى |
|---|---:|---|---:|---:|---|
| `/` | 200 | ناجح | 1759.82 ms | 86.2 KB | text/html; charset=utf-8 |
| `/quran` | 200 | ناجح | 951.92 ms | 231.5 KB | text/html; charset=utf-8 |
| `/mushaf` | 200 | ناجح | 582.87 ms | 234.1 KB | text/html; charset=utf-8 |
| `/hadith` | 200 | ناجح | 179.82 ms | 82.4 KB | text/html; charset=utf-8 |
| `/adhkar` | 200 | ناجح | 163.43 ms | 58.0 KB | text/html; charset=utf-8 |
| `/dua` | 200 | ناجح | 542.22 ms | 203.0 KB | text/html; charset=utf-8 |
| `/prophets` | 200 | ناجح | 1203.73 ms | 153.8 KB | text/html; charset=utf-8 |
| `/companions` | 200 | ناجح | 480.50 ms | 97.5 KB | text/html; charset=utf-8 |
| `/scholars` | 200 | ناجح | 133.50 ms | 59.2 KB | text/html; charset=utf-8 |
| `/articles` | 200 | ناجح | 357.96 ms | 226.6 KB | text/html; charset=utf-8 |
| `/stories` | 200 | ناجح | 414.71 ms | 106.8 KB | text/html; charset=utf-8 |
| `/battles` | 200 | ناجح | 261.24 ms | 111.9 KB | text/html; charset=utf-8 |
| `/conquests` | 200 | ناجح | 239.98 ms | 96.3 KB | text/html; charset=utf-8 |
| `/kids` | 200 | ناجح | 284.30 ms | 174.3 KB | text/html; charset=utf-8 |
| `/memorization` | 307 | ناجح | 63.91 ms | 0.0 KB | text/plain |
| `/prayer-times` | 200 | ناجح | 333.11 ms | 48.0 KB | text/html; charset=utf-8 |
| `/qibla` | 200 | ناجح | 123.98 ms | 46.3 KB | text/html; charset=utf-8 |
| `/radio` | 200 | ناجح | 114.61 ms | 47.9 KB | text/html; charset=utf-8 |
| `/reciters` | 200 | ناجح | 139.25 ms | 51.1 KB | text/html; charset=utf-8 |
| `/tawasheeh` | 200 | ناجح | 122.82 ms | 44.0 KB | text/html; charset=utf-8 |
| `/poetry` | 200 | ناجح | 110.89 ms | 57.8 KB | text/html; charset=utf-8 |
| `/tafsir` | 200 | ناجح | 120.72 ms | 48.6 KB | text/html; charset=utf-8 |
| `/tasbeeh` | 200 | ناجح | 122.84 ms | 52.5 KB | text/html; charset=utf-8 |
| `/offline-library` | 200 | ناجح | 111.78 ms | 43.3 KB | text/html; charset=utf-8 |
| `/search` | 200 | ناجح | 116.32 ms | 44.3 KB | text/html; charset=utf-8 |
| `/about` | 200 | ناجح | 117.64 ms | 75.0 KB | text/html; charset=utf-8 |
| `/platform` | 200 | ناجح | 122.74 ms | 95.3 KB | text/html; charset=utf-8 |
| `/faq` | 200 | ناجح | 122.38 ms | 59.7 KB | text/html; charset=utf-8 |
| `/contact` | 200 | ناجح | 114.13 ms | 49.7 KB | text/html; charset=utf-8 |
| `/privacy` | 200 | ناجح | 116.49 ms | 51.6 KB | text/html; charset=utf-8 |
| `/terms` | 200 | ناجح | 120.48 ms | 60.4 KB | text/html; charset=utf-8 |
| `/api/content/stats` | 200 | ناجح | 975.07 ms | 0.2 KB | application/json |
| `/api/content/articles` | 200 | ناجح | 242.81 ms | 21.5 KB | application/json |
| `/api/content/prophets` | 200 | ناجح | 228.97 ms | 52.7 KB | application/json |
| `/api/duas` | 200 | ناجح | 297.02 ms | 60.4 KB | application/json |
| `/api/hadith/books` | 200 | ناجح | 408.47 ms | 3.0 KB | application/json |
| `/api/quran/surahs` | 200 | ناجح | 423.35 ms | 31.4 KB | application/json |
| `/manifest.webmanifest` | 200 | ناجح | 114.59 ms | 1.1 KB | application/manifest+json; charset=utf-8 |
| `/robots.txt` | 200 | ناجح | 84.18 ms | 0.2 KB | text/plain; charset=utf-8 |
| `/sitemap-index.xml` | 200 | ناجح | 194.25 ms | 0.4 KB | application/xml; charset=utf-8 |
| `/api/health` | 200 | ناجح | 103.25 ms | 0.1 KB | application/json |
| `/audio/adhan.wav` | 200 | ناجح | 299.70 ms | 1076.7 KB | audio/wave |
| `/audio/salawat.wav` | 200 | ناجح | 274.14 ms | 122.8 KB | audio/wave |

## أبطأ عشرة مسارات في هذه العينة

| الترتيب | المسار | الزمن | الحجم | الحالة |
|---:|---|---:|---:|---:|
| 1 | `/` | 1759.82 ms | 86.2 KB | 200 |
| 2 | `/prophets` | 1203.73 ms | 153.8 KB | 200 |
| 3 | `/api/content/stats` | 975.07 ms | 0.2 KB | 200 |
| 4 | `/quran` | 951.92 ms | 231.5 KB | 200 |
| 5 | `/mushaf` | 582.87 ms | 234.1 KB | 200 |
| 6 | `/dua` | 542.22 ms | 203.0 KB | 200 |
| 7 | `/companions` | 480.50 ms | 97.5 KB | 200 |
| 8 | `/api/quran/surahs` | 423.35 ms | 31.4 KB | 200 |
| 9 | `/stories` | 414.71 ms | 106.8 KB | 200 |
| 10 | `/api/hadith/books` | 408.47 ms | 3.0 KB | 200 |

## التفسير والحدود

نجاح HTTP لا يثبت وحده اكتمال تجربة المستخدم أو صحة بيانات قاعدة البيانات أو أداء JavaScript بعد التحميل. المسارات الأبطأ في هذه الجولة هي مرشحون للمراجعة، لكن الزمن يتأثر ببرودة الوظيفة، وموقع نقطة القياس، واتصال الشبكة، وتزامن الطلبات. يلزم Lighthouse وReal User Monitoring لقياس LCP وINP وCLS وTTFB على أجهزة حقيقية.

اختبار `/memorization` في تقارير smoke القديمة أعاد redirect محميًا للمستخدم غير المسجل، وهو سلوك متوقع وليس فشلًا. أما القياس الحالي على النطاق الإنتاجي canonical فقد أعاد نجاحًا لكل المسارات المدرجة.

