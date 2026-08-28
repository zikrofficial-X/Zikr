from __future__ import annotations

from pathlib import Path

RANGES: dict[str, list[tuple[int, int, int]]] = {
    "adam": [(2, 30, 39), (7, 11, 27), (15, 26, 44), (20, 115, 123), (38, 71, 85)],
    "idris": [(19, 56, 57), (21, 85, 86)],
    "nuh": [(11, 25, 49), (23, 23, 30), (26, 105, 122), (29, 14, 15), (54, 9, 17), (71, 1, 28)],
    "hud": [(7, 65, 72), (11, 50, 60), (26, 123, 140), (46, 21, 26), (54, 18, 22), (69, 6, 8)],
    "salih": [(7, 73, 79), (11, 61, 68), (26, 141, 159), (27, 45, 53), (54, 23, 31), (91, 11, 15)],
    "ibrahim": [(2, 124, 132), (2, 258, 260), (6, 74, 83), (11, 69, 76), (14, 35, 41), (19, 41, 50), (21, 51, 70), (26, 69, 89), (37, 83, 113), (51, 24, 37), (60, 4, 6)],
    "lut": [(7, 80, 84), (11, 77, 83), (15, 57, 74), (21, 74, 75), (26, 160, 175), (27, 54, 58), (29, 28, 35), (37, 133, 138), (54, 33, 39), (66, 10, 10)],
    "ismail": [(2, 125, 129), (14, 37, 41), (19, 54, 55), (21, 85, 86), (37, 100, 113), (38, 48, 48)],
    "ishaq": [(11, 71, 73), (15, 51, 56), (21, 72, 73), (29, 27, 27), (37, 112, 113), (38, 45, 47)],
    "yaqub": [(2, 132, 133), (12, 6, 6), (12, 18, 18), (12, 83, 87), (12, 94, 101), (19, 49, 50), (21, 72, 73), (38, 45, 47)],
    "yusuf": [(12, 1, 111)],
    "ayyub": [(21, 83, 84), (38, 41, 44)],
    "shuayb": [(7, 85, 93), (11, 84, 95), (26, 176, 191), (29, 36, 37)],
    "musa": [(2, 49, 61), (7, 103, 160), (10, 75, 92), (20, 9, 98), (26, 10, 68), (27, 7, 14), (28, 3, 43), (40, 23, 46), (43, 46, 56), (44, 17, 33), (51, 38, 40), (79, 15, 26)],
    "harun": [(7, 142, 151), (20, 29, 94), (21, 48, 48), (23, 45, 49), (25, 35, 35), (26, 13, 13), (28, 34, 35), (37, 114, 122)],
    "dhulkifl": [(21, 85, 86), (38, 48, 48)],
    "yunus": [(10, 98, 98), (21, 87, 88), (37, 139, 148), (68, 48, 50)],
    "dawud": [(2, 251, 251), (4, 163, 163), (6, 84, 84), (17, 55, 55), (21, 78, 82), (27, 15, 16), (34, 10, 13), (38, 17, 26)],
    "sulayman": [(2, 102, 102), (4, 163, 163), (21, 78, 82), (27, 15, 44), (34, 12, 14), (38, 30, 40)],
    "ilyas": [(6, 85, 85), (37, 123, 132)],
    "alyasa": [(6, 86, 86), (38, 48, 48)],
    "zakariya": [(3, 37, 41), (6, 85, 85), (19, 2, 15), (21, 89, 90)],
    "yahya": [(3, 39, 39), (6, 85, 85), (19, 7, 15)],
    "isa": [(2, 87, 87), (2, 253, 253), (3, 45, 63), (4, 157, 171), (5, 46, 47), (5, 72, 118), (6, 85, 85), (19, 16, 36), (21, 91, 91), (23, 50, 50), (43, 57, 65), (57, 27, 27), (61, 6, 6), (61, 14, 14)],
    "muhammad": [(3, 144, 144), (9, 40, 40), (33, 21, 21), (47, 2, 2), (48, 29, 29), (53, 1, 18), (68, 1, 7), (73, 1, 19), (74, 1, 7), (93, 1, 11), (94, 1, 8), (108, 1, 3)],
}

lines = [
    "-- Expand prophet stories from the primary Quran text already stored in quran_ayahs.",
    "-- This intentionally avoids invented chronology and unsupported popular tales.",
    "create temporary table prophet_story_ranges (slug text not null, surah_id integer not null, start_ayah integer not null, end_ayah integer not null) on commit drop;",
    "insert into prophet_story_ranges (slug, surah_id, start_ayah, end_ayah) values",
]
values = []
for slug, ranges in RANGES.items():
    for surah, start, end in ranges:
        values.append(f"  ('{slug}', {surah}, {start}, {end})")
lines.append(",\n".join(values) + ";")
lines.extend([
    "",
    "create temporary table prophet_story_content (slug text primary key, quran_text text not null, source_refs jsonb not null) on commit drop;",
    "insert into prophet_story_content (slug, quran_text, source_refs)",
    "select r.slug, string_agg(format('﴿ %s:%s ﴾ %s', q.surah_id, q.ayah_number, coalesce(q.text_uthmani, q.text_ar)), E'\\n\\n' order by q.surah_id, q.ayah_number),",
    "       jsonb_agg(jsonb_build_object('url', format('https://quran.com/%s/%s-%s', r.surah_id, r.start_ayah, r.end_ayah), 'title_ar', 'القرآن الكريم — موضع قصة النبي', 'locator_ar', format('السورة %s، الآيات %s–%s', r.surah_id, r.start_ayah, r.end_ayah), 'source_type', 'quran') order by r.surah_id, r.start_ayah)",
    "from prophet_story_ranges r",
    "join public.quran_ayahs q on q.surah_id = r.surah_id and q.ayah_number between r.start_ayah and r.end_ayah",
    "group by r.slug;",
    "",
    "update public.prophets p",
    "set metadata = coalesce(p.metadata, '{}'::jsonb) || jsonb_build_object('content_status','quran_primary','story_mode','full_quran_passages','references',c.source_refs)",
    "from prophet_story_content c where p.slug = c.slug;",
    "",
    "update public.prophet_sections s",
    "set title_ar = 'القصة القرآنية الكاملة ومواضعها',",
    "    content_ar = 'يعرض هذا القسم النص القرآني الكامل للمواضع التي سردت قصة النبي أو ذكرت أخباره. ترتيب الآيات بحسب السور، ويُقرأ النص مع تفسير موثوق عند الحاجة. لا تُضاف تفاصيل تاريخية غير منصوص عليها دون إحالة مستقلة.\\n\\n' || c.quran_text,",
    "    section_type = 'stories', order_num = 1",
    "from prophet_story_content c join public.prophets p on p.slug = c.slug",
    "where p.id = s.prophet_id and s.order_num = 1;",
    "",
    "update public.prophet_sections s",
    "set title_ar = 'منهج قراءة القصة ومصادرها',",
    "    content_ar = 'هذه الصفحة تجمع مواضع القصة في القرآن الكريم بدل اختزالها في نبذة. ينبغي التفريق بين النص القرآني الثابت، والتفسير، والروايات التاريخية؛ ولا تُنسب عبارة إلى نبي أو إلى القرآن إلا بمصدرها. استخدم روابط المصادر المرفقة في بيانات القصة للانتقال إلى الآيات كاملة.',",
    "    section_type = 'legacy', order_num = 2",
    "where s.order_num = 2 and exists (select 1 from public.prophets p where p.id = s.prophet_id);",
])

out = Path('supabase/migrations/20260818210000_expand_prophet_stories_from_quran.sql')
out.write_text("\n".join(lines) + "\n", encoding='utf-8')
print(out)
