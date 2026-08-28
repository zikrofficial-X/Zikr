-- Add transparent source pointers without replacing existing metadata such as video ids.
-- The links are research starting points; the UI explicitly explains that
-- historical summaries may require comparison between sources.

UPDATE public.prophets
SET metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
  'content_status', 'source_indexed',
  'references', jsonb_build_array(
    jsonb_build_object(
      'title_ar', 'القرآن الكريم — مواضع ذكر قصة ' || name_ar,
      'source_type', 'quran',
      'url', 'https://quran.com/search?page=1&q=' || replace(replace(name_ar, ' عليه السلام', ''), ' ﷺ', ''),
      'locator_ar', 'يُرجع إلى جميع المواضع ويُقرأ سياق الآيات كاملًا',
      'note_ar', 'رابط بحث ابتدائي في المصحف؛ لا يُفهم منه أن كل التفاصيل الواردة في كتب القصص ثابتة في الوحي.'
    )
  )
)
WHERE published = true;

UPDATE public.companions
SET metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
  'content_status', 'source_indexed',
  'references', jsonb_build_array(
    jsonb_build_object(
      'title_ar', 'صحيح البخاري — كتاب فضائل أصحاب النبي ﷺ',
      'source_type', 'hadith',
      'url', 'https://sunnah.com/bukhari/62',
      'locator_ar', 'يجب الرجوع إلى رقم الحديث المحدد عند نقل رواية بعينها',
      'note_ar', 'هذا فهرس موضوعي عام، وليس حكمًا بأن كل تفصيل في الترجمة حديث صحيح.'
    )
  )
)
WHERE published = true;

UPDATE public.battles
SET metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
  'content_status', case when slug in ('badr', 'uhud', 'khandaq', 'fath-makka') then 'primary_indexed' else 'editorial_review_required' end,
  'references', jsonb_build_array(
    jsonb_build_object(
      'title_ar', 'تنبيه منهجي في قراءة السيرة والغزوات',
      'source_type', 'editorial',
      'locator_ar', 'تُراجع التواريخ والأعداد والروايات بالمصادر الأصلية قبل استخدامها في بحث مدرسي',
      'note_ar', 'التلخيص الحالي تعليمي، وقد تختلف بعض التواريخ والأعداد بين كتب السيرة والتاريخ.'
    )
  )
)
WHERE published = true;

UPDATE public.battles
SET metadata = metadata || jsonb_build_object(
  'references', (
    coalesce(metadata->'references', '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object(
        'title_ar', 'القرآن الكريم — السورة ذات الصلة بالحدث',
        'source_type', 'quran',
        'url', case slug
          when 'badr' then 'https://quran.com/8'
          when 'uhud' then 'https://quran.com/3'
          when 'khandaq' then 'https://quran.com/33'
          when 'fath-makka' then 'https://quran.com/48'
          else 'https://quran.com/search?page=1&q=' || replace(name_ar, 'غزوة ', '')
        end,
        'locator_ar', 'تُقرأ السورة والآيات في سياقها الكامل',
        'note_ar', 'القرآن يذكر جوانب من الأحداث ولا يغني وحده عن مراجعة كتب السيرة عند دراسة التسلسل التاريخي.'
      )
    )
  )
)
WHERE published = true;
