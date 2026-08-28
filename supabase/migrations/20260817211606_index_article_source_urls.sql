-- Normalize article source_urls into the shared references format used by the UI.
-- Existing source URLs are preserved; no article content is rewritten here.
update public.articles a
set metadata = coalesce(a.metadata, '{}'::jsonb) || jsonb_build_object(
  'references', (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'url', source_url,
          'title_ar', 'مصدر المقال للتحقق والمراجعة',
          'source_type', case
            when source_url like '%quran.com%' then 'quran'
            when source_url like '%sunnah.com%' then 'hadith'
            else 'external'
          end
        ) order by source_url
      ),
      '[]'::jsonb
    )
    from jsonb_array_elements_text(a.metadata->'source_urls') as urls(source_url)
  )
)
where jsonb_typeof(a.metadata->'source_urls') = 'array'
  and jsonb_array_length(a.metadata->'source_urls') > 0;
