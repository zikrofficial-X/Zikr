-- Arabic-normalized PostgreSQL full-text search.
-- Uses stored generated tsvectors and GIN indexes; no existing source content is changed.
-- Public RPC is SECURITY INVOKER and all content tables retain their existing RLS policies.

CREATE OR REPLACE FUNCTION private.normalize_arabic_search_text(input_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = pg_catalog
AS $function$
  SELECT btrim(
    regexp_replace(
      translate(
        regexp_replace(
          normalize(lower(coalesce(input_text, '')), NFKC),
          U&'[\0610-\061A\064B-\065F\0670\06D6-\06ED\0640]',
          '',
          'g'
        ),
        U&'\0622\0623\0625\0671\0649\0626\0624',
        U&'\0627\0627\0627\0627\064A\064A\0648'
      ),
      '[[:space:]]+',
      ' ',
      'g'
    )
  );
$function$;

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS searchable_normalized tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple'::regconfig, private.normalize_arabic_search_text(
      coalesce(title,'') || ' ' || coalesce(title_ar,'') || ' ' ||
      coalesce(title_en,'') || ' ' || coalesce(summary,'') || ' ' ||
      coalesce(summary_ar,'') || ' ' || coalesce(summary_en,'') || ' ' ||
      coalesce(content,'') || ' ' || coalesce(content_ar,'') || ' ' ||
      coalesce(content_en,'') || ' ' || coalesce(author,'') || ' ' ||
      coalesce(slug,'')
    ))
  ) STORED;

ALTER TABLE public.hadiths
  ADD COLUMN IF NOT EXISTS searchable_normalized tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple'::regconfig, private.normalize_arabic_search_text(
      coalesce(text_ar,'') || ' ' || coalesce(text_en,'') || ' ' ||
      coalesce(hadith_number,'') || ' ' || coalesce(ref,'') || ' ' ||
      coalesce(narrator_ar,'') || ' ' || coalesce(narrator_en,'') || ' ' ||
      coalesce(grade_ar,'') || ' ' || coalesce(grade_en,'')
    ))
  ) STORED;

ALTER TABLE public.duas
  ADD COLUMN IF NOT EXISTS searchable_normalized tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple'::regconfig, private.normalize_arabic_search_text(
      coalesce(title_ar,'') || ' ' || coalesce(title_en,'') || ' ' ||
      coalesce(text_ar,'') || ' ' || coalesce(text_en,'') || ' ' ||
      coalesce(occasion_ar,'') || ' ' || coalesce(occasion_en,'') || ' ' ||
      coalesce(source_ar,'') || ' ' || coalesce(source_en,'') || ' ' ||
      coalesce(benefits_ar,'') || ' ' || coalesce(benefits_en,'') || ' ' ||
      coalesce(slug,'')
    ))
  ) STORED;

ALTER TABLE public.quran_ayahs
  ADD COLUMN IF NOT EXISTS searchable_normalized tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple'::regconfig, private.normalize_arabic_search_text(
      coalesce(text_uthmani,'') || ' ' || coalesce(text_simple,'') || ' ' ||
      coalesce(text_ar,'') || ' ' || coalesce(text_en,'')
    ))
  ) STORED;

ALTER TABLE public.prophets
  ADD COLUMN IF NOT EXISTS searchable_normalized tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple'::regconfig, private.normalize_arabic_search_text(
      coalesce(name_ar,'') || ' ' || coalesce(name_en,'') || ' ' ||
      coalesce(bio_ar,'') || ' ' || coalesce(bio_en,'') || ' ' ||
      coalesce(birth_place_ar,'') || ' ' || coalesce(birth_place_en,'') || ' ' ||
      coalesce(death_place_ar,'') || ' ' || coalesce(death_place_en,'') || ' ' ||
      coalesce(slug,'')
    ))
  ) STORED;

ALTER TABLE public.companions
  ADD COLUMN IF NOT EXISTS searchable_normalized tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple'::regconfig, private.normalize_arabic_search_text(
      coalesce(name_ar,'') || ' ' || coalesce(name_en,'') || ' ' ||
      coalesce(title_ar,'') || ' ' || coalesce(bio_ar,'') || ' ' ||
      coalesce(bio_en,'') || ' ' || coalesce(category,'') || ' ' ||
      coalesce(birth_place_ar,'') || ' ' || coalesce(death_place_ar,'') || ' ' ||
      coalesce(death_year,'') || ' ' || coalesce(slug,'')
    ))
  ) STORED;

ALTER TABLE public.scholars
  ADD COLUMN IF NOT EXISTS searchable_normalized tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple'::regconfig, private.normalize_arabic_search_text(
      coalesce(name_ar,'') || ' ' || coalesce(name_en,'') || ' ' ||
      coalesce(bio_ar,'') || ' ' || coalesce(bio_en,'') || ' ' ||
      coalesce(slug,'')
    ))
  ) STORED;

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS searchable_normalized tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple'::regconfig, private.normalize_arabic_search_text(
      coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' ||
      coalesce(content,'') || ' ' || coalesce(category,'') || ' ' ||
      coalesce(slug,'')
    ))
  ) STORED;

CREATE INDEX IF NOT EXISTS articles_searchable_normalized_idx
  ON public.articles USING gin (searchable_normalized) WHERE published IS TRUE;
CREATE INDEX IF NOT EXISTS hadiths_searchable_normalized_idx
  ON public.hadiths USING gin (searchable_normalized) WHERE published IS TRUE;
CREATE INDEX IF NOT EXISTS duas_searchable_normalized_idx
  ON public.duas USING gin (searchable_normalized) WHERE published IS TRUE;
CREATE INDEX IF NOT EXISTS quran_ayahs_searchable_normalized_idx
  ON public.quran_ayahs USING gin (searchable_normalized);
CREATE INDEX IF NOT EXISTS prophets_searchable_normalized_idx
  ON public.prophets USING gin (searchable_normalized) WHERE published IS TRUE;
CREATE INDEX IF NOT EXISTS companions_searchable_normalized_idx
  ON public.companions USING gin (searchable_normalized) WHERE published IS TRUE;
CREATE INDEX IF NOT EXISTS scholars_searchable_normalized_idx
  ON public.scholars USING gin (searchable_normalized) WHERE published IS TRUE;
CREATE INDEX IF NOT EXISTS stories_searchable_normalized_idx
  ON public.stories USING gin (searchable_normalized)
  WHERE published IS TRUE AND is_approved IS TRUE AND user_id IS NULL;

GRANT USAGE ON SCHEMA private TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.normalize_arabic_search_text(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.search_public_content(
  p_query text,
  p_limit integer DEFAULT 40
)
RETURNS TABLE (id text, type text, label_ar text, title text, subtitle text, href text)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog
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
$function$;

REVOKE ALL ON FUNCTION public.search_public_content(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_public_content(text, integer) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';