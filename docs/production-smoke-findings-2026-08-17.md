# Production smoke findings — 2026-08-17

- `https://zikrmediaofficial.vercel.app/articles` loaded successfully after commit `99f6f2d` and displayed the new educational articles, including the eight-article dhikr/Quran package; the page reported 52 published articles in the rendered UI.
- Before commit `4c3f14c`, `https://zikrmediaofficial.vercel.app/search?q=الذكر` loaded without a runtime error but returned no results because the client search only searched static Quran/hadith/prophet data and did not query the articles table.
- Commit `4c3f14c` adds a bounded article-search API query and client rendering of article results. Vercel and CircleCI #35 both passed for this commit; a post-deployment search smoke test remains to be performed.

## بعد إصلاح البحث

بعد نشر `4c3f14c` ونجاح Vercel وCircleCI #35، أعاد `/search?q=الذكر` تحميل الصفحة دون أخطاء وأظهر 12 نتيجة، منها مقالات الأذكار الثمانية وروابطها الصحيحة تحت `/articles/[slug]`. هذا يثبت أن مسار المقالات أصبح مفهرسًا في البحث الإنتاجي.

## Smoke test السير

بعد نشر commit `154e125` نجحت صفحة `/companions` في production وعرضت 12 سجلًا أساسيًا دون النسخ المكررة المخفية. كما نجحت صفحة `/scholars` وعرضت 8 سجلات منشورة، مع استمرار التمييز الداخلي لحالة المصدر في metadata.
