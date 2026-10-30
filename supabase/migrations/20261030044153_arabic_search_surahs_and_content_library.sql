-- Adds indexed Quran-surah and approved public content-library search
-- and aligns the SECURITY INVOKER RPC with the production schema.
-- This exact migration version is already recorded in production.

alter table public.quran_surahs
  add column if not exists searchable_normalized tsvector generated always as (
    to_tsvector('simple'::regconfig, private.normalize_arabic_search_text(
      coalesce(name_ar,'') || ' ' || coalesce(name_en,'') || ' ' || coalesce(name_translation,'')
    ))
  ) stored;

alter table public.content_library
  add column if not exists searchable_normalized tsvector generated always as (
    to_tsvector('simple'::regconfig, private.normalize_arabic_search_text(
      coalesce(title_ar,'') || ' ' || coalesce(title_en,'') || ' ' ||
      coalesce(summary_ar,'') || ' ' || coalesce(summary_en,'') || ' ' ||
      coalesce(body_ar,'') || ' ' || coalesce(body_en,'') || ' ' ||
      coalesce(category,'') || ' ' || coalesce(content_type,'') || ' ' ||
      coalesce(author,'') || ' ' || coalesce(slug,'')
    ))
  ) stored;

create index if not exists quran_surahs_searchable_normalized_idx
  on public.quran_surahs using gin (searchable_normalized);

create index if not exists content_library_searchable_normalized_idx
  on public.content_library using gin (searchable_normalized)
  where published is true and review_status = 'approved';

CREATE OR REPLACE FUNCTION public.search_public_content(p_query text, p_limit integer DEFAULT 40)
 RETURNS TABLE(id text, type text, label_ar text, title text, subtitle text, href text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'pg_catalog'
AS $function$
  WITH normalized_query AS (
    SELECT private.normalize_arabic_search_text(left(coalesce(p_query,''), 100)) AS normalized
  ),
  query_terms AS (
    SELECT normalized, plainto_tsquery('simple'::regconfig, normalized) AS query
    FROM normalized_query
  ),
  candidates AS (
    SELECT
      ('quran-' || a.surah_id::text || '-' || a.ayah_number::text) AS id,
      'surah'::text AS type,
      'آية'::text AS label_ar,
      left(coalesce(a.text_uthmani, a.text_ar), 120) AS title,
      ('القرآن الكريم — ' || coalesce(s.name_ar, 'سورة') || ' — آية ' || a.ayah_number::text) AS subtitle,
      ('/quran/' || a.surah_id::text || '/' || a.ayah_number::text) AS href,
      ts_rank_cd(a.searchable_normalized, q.query) AS score
    FROM public.quran_ayahs a
    JOIN public.quran_surahs s ON s.id = a.surah_id
    CROSS JOIN query_terms q
    WHERE char_length(q.normalized) >= 2
      AND numnode(q.query) > 0
      AND a.searchable_normalized @@ q.query

    UNION ALL

    SELECT
      ('quran-surah-' || qs.id::text),
      'surah'::text,
      'سورة'::text,
      qs.name_ar,
      coalesce(nullif(qs.name_en,''), nullif(qs.name_translation,''), 'سورة'),
      ('/quran/' || qs.id::text),
      ts_rank_cd(qs.searchable_normalized, q.query)
    FROM public.quran_surahs qs
    CROSS JOIN query_terms q
    WHERE char_length(q.normalized) >= 2
      AND numnode(q.query) > 0
      AND qs.searchable_normalized @@ q.query

    UNION ALL

    SELECT
      h.id::text,'hadith'::text,'حديث'::text,left(h.text_ar,120),
      concat_ws(' — ', b.name_ar, 'حديث ' || h.hadith_number, nullif(h.grade_ar,'')),
      ('/hadith/' || b.slug || '/' || h.hadith_number),
      ts_rank_cd(h.searchable_normalized,q.query)
    FROM public.hadiths h
    JOIN public.hadith_books b ON b.id=h.book_id
    CROSS JOIN query_terms q
    WHERE h.published IS TRUE AND char_length(q.normalized)>=2
      AND numnode(q.query)>0 AND h.searchable_normalized @@ q.query

    UNION ALL

    SELECT d.id::text,'dua'::text,'دعاء'::text,d.title_ar,
      coalesce(nullif(d.occasion_ar,''),nullif(d.source_ar,''),'دعاء مأثور من مكتبة ذِكر'),
      ('/dua/' || d.slug),
      ts_rank_cd(d.searchable_normalized,q.query)
    FROM public.duas d
    CROSS JOIN query_terms q
    WHERE d.published IS TRUE AND char_length(q.normalized)>=2
      AND numnode(q.query)>0 AND d.searchable_normalized @@ q.query

    UNION ALL

    SELECT a.id::text,'article'::text,'مقال'::text,
      coalesce(nullif(a.title_ar,''),nullif(a.title,''),a.title_en,a.slug),
      coalesce(nullif(a.summary_ar,''),nullif(a.summary,''),nullif(a.author,''),'مقال تعليمي من مكتبة ذِكر'),
      ('/articles/' || a.slug),
      ts_rank_cd(a.searchable_normalized,q.query)
    FROM public.articles a
    CROSS JOIN query_terms q
    WHERE a.published IS TRUE AND char_length(coalesce(a.content_ar,a.content,''))>=1800
      AND char_length(q.normalized)>=2 AND numnode(q.query)>0
      AND a.searchable_normalized @@ q.query

    UNION ALL

    SELECT
      cl.id::text,
      'content'::text,
      'مادة'::text,
      coalesce(nullif(cl.title_ar,''), nullif(cl.title_en,''), cl.slug),
      coalesce(nullif(cl.summary_ar,''), nullif(cl.summary_en,''), nullif(cl.category,''), nullif(cl.content_type,''), 'مادة من مكتبة ذِكر'),
      ('/content/' || cl.slug),
      ts_rank_cd(cl.searchable_normalized, q.query)
    FROM public.content_library cl
    CROSS JOIN query_terms q
    WHERE cl.published IS TRUE
      AND cl.review_status = 'approved'
      AND char_length(q.normalized) >= 2
      AND numnode(q.query) > 0
      AND cl.searchable_normalized @@ q.query

    UNION ALL

    SELECT p.id::text,'prophet'::text,'نبي'::text,p.name_ar,
      coalesce(nullif(p.name_en,''),'قصة نبي'),
      ('/prophets/' || p.slug),
      ts_rank_cd(p.searchable_normalized,q.query)
    FROM public.prophets p
    CROSS JOIN query_terms q
    WHERE p.published IS TRUE AND char_length(q.normalized)>=2
      AND numnode(q.query)>0 AND p.searchable_normalized @@ q.query

    UNION ALL

    SELECT c.id::text,'companion'::text,'صحابي'::text,c.name_ar,
      coalesce(nullif(c.title_ar,''),'من أعلام الصحابة'),
      ('/companions/' || c.slug),
      ts_rank_cd(c.searchable_normalized,q.query)
    FROM public.companions c
    CROSS JOIN query_terms q
    WHERE c.published IS TRUE AND char_length(q.normalized)>=2
      AND numnode(q.query)>0 AND c.searchable_normalized @@ q.query

    UNION ALL

    SELECT s.id::text,'scholar'::text,'عالم'::text,s.name_ar,
      coalesce(nullif(s.name_en,''),'من علماء المسلمين'),
      ('/scholars/' || s.slug),
      ts_rank_cd(s.searchable_normalized,q.query)
    FROM public.scholars s
    CROSS JOIN query_terms q
    WHERE s.published IS TRUE AND char_length(q.normalized)>=2
      AND numnode(q.query)>0 AND s.searchable_normalized @@ q.query

    UNION ALL

    SELECT st.id::text,'story'::text,'قصة'::text,st.title,
      coalesce(nullif(st.summary,''),nullif(st.category,''),'قصة من مكتبة ذِكر'),
      ('/stories/' || st.slug),
      ts_rank_cd(st.searchable_normalized,q.query)
    FROM public.stories st
    CROSS JOIN query_terms q
    WHERE st.published IS TRUE AND st.is_approved IS TRUE AND st.user_id IS NULL
      AND char_length(q.normalized)>=2 AND numnode(q.query)>0
      AND st.searchable_normalized @@ q.query
  ),
  deduplicated AS (
    SELECT DISTINCT ON (href) id,type,label_ar,title,subtitle,href,score
    FROM candidates
    ORDER BY href,score DESC,title
  ),
  ranked AS (
    SELECT id,type,label_ar,title,subtitle,href,score,
      row_number() OVER (PARTITION BY type ORDER BY score DESC,title) AS type_rank
    FROM deduplicated
  )
  SELECT id,type,label_ar,title,subtitle,href
  FROM ranked
  WHERE type_rank<=6
  ORDER BY score DESC,title
  LIMIT least(greatest(coalesce(p_limit,40),1),40);
$function$
;

revoke all on function public.search_public_content(text, integer) from public;
grant execute on function public.search_public_content(text, integer) to anon, authenticated;
notify pgrst, 'reload schema';
