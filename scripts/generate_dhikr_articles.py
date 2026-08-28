from __future__ import annotations

import json
import uuid
from pathlib import Path

ARTICLES = [
    {
        'slug': 'dhikr-virtue-quran-meaning',
        'title': 'فضل الذكر في القرآن: معنى التذكر والشكر',
        'content': 'يظهر الذكر في القرآن بوصفه صلة واعية بالله، لا مجرد ترديد سريع منفصل عن السلوك. تربط الآية 2:152 بين ذكر الله وشكره، ولذلك يمكن للقارئ أن يسأل نفسه بعد الذكر: هل ازداد وعيه بالنعم؟ وهل انعكس ذلك على كلامه وقراراته؟ وتوجه آيات الأحزاب إلى كثرة الذكر والتسبيح صباحًا ومساءً، فيفهم المسلم أن الاستمرار أهم من الحماس المؤقت. هذا المقال شرح تعليمي عام، ولا يضيف عددًا أو وقتًا أو فضيلة خاصة خارج النصوص المشار إليها. المراجع: https://quran.com/2/152 و https://quran.com/33/41-42.',
        'summary': 'شرح تعليمي لمعنى الذكر في القرآن وصلته بالشكر والاستمرار، مع إحالات مباشرة للآيات.',
        'tags': ['الأذكار', 'القرآن', 'الشكر'],
        'sources': ['https://quran.com/2/152', 'https://quran.com/33/41-42'],
    },
    {
        'slug': 'dhikr-quiet-heart-not-cure',
        'title': 'ذكر الله وطمأنينة القلب: قراءة مسؤولة للآية',
        'content': 'تذكر سورة الرعد أن القلوب تطمئن بذكر الله. تعطي الآية معنى إيمانيًا عميقًا، لكنها لا تسمح للمنصة بأن تشخّص القلق أو تعد بزوال مرض نفسي أو جسدي بمجرد قراءة نص. يمكن للمسلم أن يجعل الذكر جزءًا من عبادته وتهدئة يومه، مع طلب المساعدة الطبية والنفسية عند استمرار الأعراض أو وجود خطر. ومن المفيد تسجيل ما يساعد على حضور القلب، مثل تقليل المشتتات وفهم المعنى، دون تحويل التجربة الشخصية إلى حكم شرعي عام. المراجع: https://quran.com/13/28 و https://quran.com/2/286.',
        'summary': 'تفسير تربوي غير علاجي لآية طمأنينة القلب، مع احترام حدود المحتوى الديني والصحي.',
        'tags': ['الأذكار', 'الطمأنينة', 'الصحة النفسية'],
        'sources': ['https://quran.com/13/28', 'https://quran.com/2/286'],
    },
    {
        'slug': 'dhikr-and-prayer-remembrance',
        'title': 'الصلاة وذكر الله: كيف يحافظ الطالب على حضور المعنى؟',
        'content': 'تربط سورة طه إقامة الصلاة بذكر الله، وهذا يفتح بابًا عمليًا للطالب والموظف: لا تكون الصلاة مجرد مهمة زمنية، بل لحظة يعود فيها إلى المعنى والنية. يساعد على ذلك فهم ما يقرأه، والاستعداد قبل الأذان، وإبعاد الهاتف، ثم العودة إلى العمل بهدوء بعد الصلاة. لا يقدم المقال حكمًا فقهيًا في مسائل الأعذار أو الجمع أو القضاء؛ فهذه مسائل تتغير بتغير الحال ويُسأل فيها أهل العلم. المقصود هو بناء عادة حضور وتوازن، لا تقييم الناس أو ادعاء أن طريقة واحدة تناسب الجميع. المرجع: https://quran.com/20/14.',
        'summary': 'تطبيقات يومية لربط الصلاة بذكر الله دون تحويل المقال إلى فتوى شخصية.',
        'tags': ['الأذكار', 'الصلاة', 'الطلاب'],
        'sources': ['https://quran.com/20/14'],
    },
    {
        'slug': 'morning-evening-adhkar-source',
        'title': 'أذكار الصباح والمساء: تنظيم القراءة وحفظ المصدر',
        'content': 'تذكر آيات الأحزاب التسبيح بكرة وأصيلًا، وتضم مصادر الأذكار الحديثية أبوابًا للصباح والمساء. لذلك ينبغي أن يعرض التطبيق نص الذكر، ومرجعه، والوقت أو العدد إذا كان مثبتًا في المصدر نفسه، وألا يضيف عبارة مثل "مضمون الإجابة" أو "حماية مؤكدة" دون دليل. يستطيع المستخدم إنشاء قائمة شخصية من مواد موثقة، ثم يراجعها بدل نسخ صور مجهولة من الشبكات الاجتماعية. صفحة Hisn al-Muslim في Sunnah.com تعرض مراجع مرقمة للأذكار، وتبقى الإحالة إلى الصفحة الأصلية أفضل من إعادة نشر نص بلا تخريج. المراجع: https://quran.com/33/41-42 و https://sunnah.com/hisn و https://sunnah.com/hisn:92.',
        'summary': 'منهج عملي لعرض أذكار الصباح والمساء مع النص والمرجع والعدد المثبت فقط.',
        'tags': ['أذكار الصباح', 'أذكار المساء', 'التوثيق'],
        'sources': ['https://quran.com/33/41-42', 'https://sunnah.com/hisn', 'https://sunnah.com/hisn:92'],
    },
    {
        'slug': 'dhikr-gratitude-practical-life',
        'title': 'الذكر والشكر: تحويل المعنى إلى سلوك يومي',
        'content': 'تجمع الآية 2:152 بين ذكر الله وشكره، فيستفيد القارئ من الجمع بين اللسان والعمل. بعد الذكر يمكن أن يختار فعلًا صغيرًا يناسب النعمة: رد حق، شكر والدين، مساعدة محتاج، أو ترك أذى. لا يعني ذلك أن كل تجربة دنيوية ستتغير فورًا، ولا أن الشكر يلغي الحزن أو المسؤولية. المقصود أن يصبح الذكر سببًا لمراجعة السلوك، وأن تُقاس الاستفادة بصدق العمل لا بعدد المنشورات أو التسجيلات. المراجع: https://quran.com/2/152 و https://quran.com/14/7.',
        'summary': 'مقال تربوي عن صلة الذكر بالشكر والعمل الصالح دون وعود دنيوية غير موثقة.',
        'tags': ['الأذكار', 'الشكر', 'الأخلاق'],
        'sources': ['https://quran.com/2/152', 'https://quran.com/14/7'],
    },
    {
        'slug': 'quran-verses-dhikr-reflection',
        'title': 'قراءة آيات الذكر بتدبر لا بسرعة فقط',
        'content': 'تعرض آيات القرآن موضوع الذكر في سياقات متعددة، ولذلك لا يكفي جمع الآيات في قائمة ثم قراءتها بلا فهم للسياق. يبدأ التدبر بقراءة الآية في موضعها، ومعرفة السورة، والرجوع إلى تفسير موثوق عند الحاجة، ثم كتابة معنى عملي لا ينسب إلى الآية أكثر مما تحتمل. يمكن للقارئ أن يقارن بين الأمر بالذكر، وذكر الشكر، وذكر الصباح والمساء، مع ترك التفاصيل التي لم يثبتها المصدر. هذه الطريقة تمنع تحويل الآيات إلى عبارات تسويقية وتساعد الطالب على إعداد بحث واضح المراجع. المراجع: https://quran.com/2/152 و https://quran.com/33/41-42 و https://quran.com/7/205.',
        'summary': 'خطوات تدبر وبحث في آيات الذكر مع الحفاظ على السياق وعدم تحميل الآية ما لا تثبته.',
        'tags': ['القرآن', 'التدبر', 'البحث المدرسي'],
        'sources': ['https://quran.com/2/152', 'https://quran.com/33/41-42', 'https://quran.com/7/205'],
    },
    {
        'slug': 'dhikr-work-and-responsibility',
        'title': 'الذكر أثناء العمل والسعي: عبادة لا تعني ترك المسؤولية',
        'content': 'تذكر سورة الجمعة أنه بعد قضاء الصلاة ينتشر الناس في الأرض ويبتغون من فضل الله، مع الأمر بذكر الله كثيرًا. يفيد هذا السياق في تصحيح تصور شائع: الذكر لا يعني الانسحاب من الدراسة والعمل، كما أن الانشغال لا يبرر الغفلة الدائمة. يمكن تنظيم فواصل قصيرة للذكر دون تعطيل حقوق العملاء أو الزملاء، وحفظ الأمانة في الوقت والمال والبيانات. لا يحدد المقال حكمًا تفصيليًا لكل مهنة أو عقد، لكنه يوضح أن العبادة والأسباب والمسؤولية يمكن أن تجتمع. المراجع: https://quran.com/62/10 و https://quran.com/4/58.',
        'summary': 'شرح توازن الذكر مع العمل والمسؤولية المهنية مستندًا إلى سياق سورة الجمعة.',
        'tags': ['الأذكار', 'العمل', 'الأمانة'],
        'sources': ['https://quran.com/62/10', 'https://quran.com/4/58'],
    },
    {
        'slug': 'verify-dhikr-virtues',
        'title': 'كيف نتحقق من فضائل الأذكار قبل نشرها؟',
        'content': 'تنتشر في الرسائل عبارات تنسب إلى ذكر معين عددًا محددًا أو ثوابًا ضخمًا أو أثرًا مضمونًا. المنهج الآمن هو البحث عن النص في مصدر حديثي معروف، تسجيل الكتاب أو الباب أو رقم المرجع، ثم التفريق بين نص الذكر وشرح العلماء والتجربة الشخصية. إذا لم نجد مصدرًا واضحًا، ننشره بوصفه دعاءً عامًا إن كان معناه سليمًا، ولا ننسب إليه سنة أو فضيلة خاصة. كما لا يجوز للمنصة أن تستبدل المصدر بنص مولد آليًا؛ فالذكاء الاصطناعي قد يساعد في الفهرسة لكنه ليس مرجعًا دينيًا. المراجع: https://sunnah.com/hisn و https://sunnah.com/developers و https://quran.com/49/6.',
        'summary': 'سياسة تحقق عملية تمنع نشر فضائل مجهولة أو نسبتها إلى السنة دون مرجع محدد.',
        'tags': ['الأذكار', 'الحديث', 'التحقق الرقمي'],
        'sources': ['https://sunnah.com/hisn', 'https://sunnah.com/developers', 'https://quran.com/49/6'],
    },
]

def sql(value: str | None) -> str:
    return 'NULL' if value is None else "'" + value.replace("'", "''") + "'"

lines = [
    '-- Original educational articles about dhikr and Quran verses.',
    '-- These rows are editorial explanations, not Quran/hadith quotations or fatwas.',
]
for article in ARTICLES:
    row_id = uuid.uuid5(uuid.NAMESPACE_URL, article['slug'])
    metadata = json.dumps({
        'editorial': True,
        'not_hadith_quote': True,
        'not_fatwa': True,
        'source_urls': article['sources'],
        'source_note': 'Original educational explanation; primary sources are linked for verification.',
    }, ensure_ascii=False)
    tags = 'ARRAY[' + ','.join(sql(tag) for tag in article['tags']) + ']'
    lines.append(
        'INSERT INTO public.articles (id,title,title_ar,title_en,slug,content,content_ar,content_en,summary,summary_ar,summary_en,author,tags,featured,published,views,metadata) '
        f'VALUES ({sql(str(row_id))},{sql(article["title"])},{sql(article["title"])},{sql("Dhikr and Quran Educational Article")},{sql(article["slug"])},{sql(article["content"])},{sql(article["content"])},NULL,{sql(article["summary"])},{sql(article["summary"])},NULL,{sql("فريق تحرير ذِكر")},{tags},false,true,0,{sql(metadata)}::jsonb) '
        'ON CONFLICT (slug) DO UPDATE SET title=excluded.title,title_ar=excluded.title_ar,title_en=excluded.title_en,content=excluded.content,content_ar=excluded.content_ar,content_en=excluded.content_en,summary=excluded.summary,summary_ar=excluded.summary_ar,summary_en=excluded.summary_en,author=excluded.author,tags=excluded.tags,published=true,metadata=excluded.metadata,updated_at=now();'
    )

Path('supabase/migrations/20260817120000_dhikr_quran_articles.sql').write_text('\n'.join(lines) + '\n', encoding='utf-8')
print(f'generated={len(ARTICLES)}')
