const SITE_URL = 'https://zikrmediaofficial.vercel.app';

const content = `# ZIKR | ذِكرٌ

> منصة إسلامية رقمية تجمع القرآن الكريم والسنة والسيرة والعبادات والأدوات اليومية في تجربة عربية حديثة.

## Primary sections
- [القرآن الكريم](${SITE_URL}/quran): قراءة السور والآيات مع التفسير وروابط المصحف.
- [الأحاديث النبوية](${SITE_URL}/hadith): مكتبة حديثية وفهارس الكتب.
- [الأذكار](${SITE_URL}/adhkar): أذكار يومية وأذكار الصباح والمساء.
- [الأدعية](${SITE_URL}/dua): أدعية مصنفة حسب الاحتياج والسياق.
- [الورد](${SITE_URL}/wird): ورد يومي وخطط ختم القرآن.
- [قصص الأنبياء](${SITE_URL}/prophets): تراجم وقصص الأنبياء.
- [الصحابة](${SITE_URL}/companions): سير الصحابة وأمهات المؤمنين ومواد تعليمية مرتبطة بهم.
- [العلماء](${SITE_URL}/scholars): تراجم ومداخل تعريفية للعلماء.
- [الغزوات](${SITE_URL}/battles): صفحات تعليمية عن الغزوات والسرايا المرتبطة بها.
- [الفتوحات](${SITE_URL}/conquests): مواد تاريخية عن الفتوحات الإسلامية.
- [المقالات](${SITE_URL}/articles): مقالات إسلامية تعليمية طويلة ومراجعة.
- [الفيديوهات](${SITE_URL}/videos): مواد فيديو تعليمية وروابط داخلية مرتبطة بأقسام المنصة.
- [قسم الأطفال](${SITE_URL}/kids): محتوى مبسط وتعليمي للأطفال.
- [الشعر](${SITE_URL}/poetry): مواد شعرية إسلامية وأدبية.

## Daily tools
- [مواقيت الصلاة](${SITE_URL}/prayer-times)
- [القبلة](${SITE_URL}/qibla)
- [التسبيح](${SITE_URL}/tasbeeh)
- [الحفظ](${SITE_URL}/memorization)
- [الزكاة](${SITE_URL}/zakat)
- [الإذاعة](${SITE_URL}/radio)
- [البحث](${SITE_URL}/search)

## Editorial approach
ZIKR يقدّم المحتوى التعليمي بصياغة واضحة مع تفضيل الإحالات إلى القرآن والسنة والمراجع المعروفة، ويفصل قدر الإمكان بين النص الأصلي والتلخيص التحريري. الصفحات الفردية قد تحتوي على مواد إضافية من قاعدة البيانات أو مكتبات احتياطية محلية عند تعذر المصدر الخارجي.

## Site metadata
- Canonical site: ${SITE_URL}
- Public sitemap: ${SITE_URL}/sitemap.xml
- Robots: ${SITE_URL}/robots.txt
- Language: Arabic first, with selected English metadata and labels.
`;

export function GET() {
  return new Response(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
