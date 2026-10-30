-- Arabic-aware indexed search.
-- Keep source text untouched; normalize only the generated search vectors.
-- The same normalization rules are used by src/lib/search/arabic-normalization.ts.

create or replace function public.normalize_arabic_search_text(input text)
returns text
language sql
immutable
parallel safe
returns null on null input
set search_path = pg_catalog
as $$
  select lower(
    translate(
      regexp_replace(
        normalize(input, NFKC),
        '[' ||
          chr(1611) || '-' || chr(1619) ||
          chr(1620) || '-' || chr(1631) ||
          chr(1648) ||
          chr(1750) || '-' || chr(1773) ||
          chr(1600) ||
        ']',
        '',
        'g'
      ),
      'أإآٱىؤئ',
      'ااااي وي'
    )
  );
$$;

alter table public.articles
  add column if not exists searchable_normalized tsvector
  generated always as (
    to_tsvector('simple', public.normalize_arabic_search_text(
      coalesce(title, '') || ' ' || coalesce(content, '') || ' ' || coalesce(title_en, '') || ' ' || coalesce(content_en, '')
    ))
  ) stored;

alter table public.hadiths
  add column if not exists searchable_normalized tsvector
  generated always as (
    to_tsvector('simple', public.normalize_arabic_search_text(
      coalesce(text_ar, '') || ' ' || coalesce(text_en, '') || ' ' || coalesce(ref, '')
    ))
  ) stored;

alter table public.duas
  add column if not exists searchable_normalized tsvector
  generated always as (
    to_tsvector('simple', public.normalize_arabic_search_text(
      coalesce(title_ar, '') || ' ' || coalesce(text_ar, '') || ' ' ||
      coalesce(title_en, '') || ' ' || coalesce(text_en, '')
    ))
  ) stored;

alter table public.quran_ayahs
  add column if not exists searchable_normalized tsvector
  generated always as (
    to_tsvector('simple', public.normalize_arabic_search_text(
      coalesce(text_uthmani, '') || ' ' || coalesce(text_simple, '') || ' ' ||
      coalesce(text_ar, '') || ' ' || coalesce(text_en, '')
    ))
  ) stored;

create index if not exists articles_searchable_normalized_idx
  on public.articles using gin (searchable_normalized);
create index if not exists hadiths_searchable_normalized_idx
  on public.hadiths using gin (searchable_normalized);
create index if not exists duas_searchable_normalized_idx
  on public.duas using gin (searchable_normalized);
create index if not exists quran_ayahs_searchable_normalized_idx
  on public.quran_ayahs using gin (searchable_normalized);

-- content_library.searchable is trigger-maintained, so preserve its existing
-- column and trigger contract while refreshing the value with normalization.
create or replace function public.refresh_content_library_searchable()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
begin
  new.searchable := to_tsvector(
    'simple',
    public.normalize_arabic_search_text(
      coalesce(new.title_ar,'') || ' ' ||
      coalesce(new.summary_ar,'') || ' ' ||
      coalesce(new.body_ar,'') || ' ' ||
      coalesce(new.category,'') || ' ' ||
      array_to_string(coalesce(new.tags,'{}'::text[]),' ')
    )
  );
  return new;
end
$function$;

drop index if exists public.content_library_search_idx;
create index if not exists content_library_search_idx
  on public.content_library using gin (searchable);

update public.content_library
set searchable = to_tsvector(
  'simple',
  public.normalize_arabic_search_text(
    coalesce(title_ar,'') || ' ' ||
    coalesce(summary_ar,'') || ' ' ||
    coalesce(body_ar,'') || ' ' ||
    coalesce(category,'') || ' ' ||
    array_to_string(coalesce(tags,'{}'::text[]),' ')
  )
)
where published = true or searchable is not null;

comment on function public.normalize_arabic_search_text(text) is
  'NFKC + Arabic harakat/tatweel removal + common alef/ya/hamza normalization for search indexing only.';
