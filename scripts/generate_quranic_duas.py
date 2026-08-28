from pathlib import Path
import uuid

VERSES = [
    (2, 126, 'دعاء الأمن والرزق'),
    (2, 127, 'دعاء قبول العمل'),
    (2, 128, 'دعاء الاستسلام والهداية'),
    (2, 201, 'دعاء خير الدنيا والآخرة'),
    (2, 250, 'دعاء الصبر والثبات'),
    (2, 286, 'دعاء العفو والرحمة'),
    (3, 8, 'دعاء الثبات بعد الهداية'),
    (3, 9, 'دعاء اليقين بالبعث'),
    (3, 16, 'دعاء المغفرة والنجاة'),
    (3, 53, 'دعاء الإيمان والتصديق'),
    (3, 147, 'دعاء المغفرة والثبات'),
    (3, 191, 'دعاء التفكر والنجاة'),
    (7, 23, 'دعاء التوبة والرحمة'),
    (14, 40, 'دعاء إقامة الصلاة'),
    (14, 41, 'دعاء المغفرة للوالدين'),
    (18, 10, 'دعاء الرحمة والرشد'),
    (20, 25, 'دعاء شرح الصدر'),
    (23, 109, 'دعاء الإيمان والمغفرة'),
    (25, 65, 'دعاء النجاة من العذاب'),
    (25, 74, 'دعاء صلاح الأسرة'),
    (28, 24, 'دعاء طلب الخير'),
    (59, 10, 'دعاء سلامة القلب'),
    (60, 4, 'دعاء التوكل والرجوع'),
    (66, 8, 'دعاء تمام النور'),
]

def sql(value: str | None) -> str:
    return 'NULL' if value is None else "'" + value.replace("'", "''") + "'"

lines = [
    '-- Quranic duas copied from the canonical quran_ayahs table; no text is generated here.',
    '-- Each row retains its surah/ayah reference and a public Quran source URL in metadata.',
]
for surah, ayah, title in VERSES:
    slug = f'quran-dua-{surah}-{ayah}'
    row_id = uuid.uuid5(uuid.NAMESPACE_URL, slug)
    source_ar = f'القرآن الكريم — سورة {surah}، الآية {ayah}'
    source_en = f'The Quran — Surah {surah}, verse {ayah}'
    url = f'https://quran.com/{surah}/{ayah}'
    metadata = '{"source_type":"quran","source_url":' + __import__('json').dumps(url, ensure_ascii=False) + ',"source_ref":' + __import__('json').dumps(source_ar, ensure_ascii=False) + '}'
    lines.append(
        'INSERT INTO public.duas (id,title_ar,title_en,slug,text_ar,text_en,occasion_ar,occasion_en,source_ar,source_en,benefits_ar,benefits_en,published,metadata) '
        f'SELECT {sql(str(row_id))},{sql(title)},{sql("Quranic Supplication")},{sql(slug)},text_ar,NULL,{sql("دعاء قرآني يُقرأ في موضعه للتدبر والدعاء")},{sql("A Quranic supplication for reflection and prayer")},{sql(source_ar)},{sql(source_en)},{sql("نص قرآني منقول من سجل الآية؛ لا يُنسب إلى حديث")},{sql("Quran text copied from the stored verse; not attributed to a hadith")},true,{sql(metadata)}::jsonb '
        f'FROM public.quran_ayahs WHERE surah_id={surah} AND ayah_number={ayah} '
        f'ON CONFLICT (slug) DO UPDATE SET title_ar=excluded.title_ar,title_en=excluded.title_en,text_ar=excluded.text_ar,source_ar=excluded.source_ar,source_en=excluded.source_en,benefits_ar=excluded.benefits_ar,benefits_en=excluded.benefits_en,published=true,metadata=excluded.metadata,updated_at=now();'
    )

Path('supabase/migrations/20260817100000_quranic_duas_expansion.sql').write_text('\n'.join(lines) + '\n', encoding='utf-8')
print(f'generated={len(VERSES)}')
