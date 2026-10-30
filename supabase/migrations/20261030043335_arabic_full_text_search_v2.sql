-- Canonical Arabic-normalized full-text search for the public content corpus.
-- This migration is already recorded in production as 20261030043335.
-- Search-only vectors preserve the original source text and use a single
-- normalization function for Quran, Hadith, articles, stories and biographies.

create schema if not exists private;

create or replace function private.normalize_arabic_search_text(input_text text)
returns text
language sql
immutable
parallel safe
set search_path = pg_catalog
as $function$
  select btrim(
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

alter table public.articles
  add column if not exists searchable_normalized tsvector generated always as (
    to_tsvector('simple', private.normalize_arabic_search_text(
      coalesce(title,'') || ' ' || coalesce(title_ar,'') || ' ' || coalesce(title_en,'') || ' ' ||
      coalesce(summary,'') || ' ' || coalesce(summary_ar,'') || ' ' || coalesce(summary_en,'') || ' ' ||
      coalesce(content,'') || ' ' || coalesce(content_ar,'') || ' ' || coalesce(content_en,'') || ' ' ||
      coalesce(author,'') || ' ' || coalesce(slug,'')
    ))
  ) stored;

alter table public.hadiths
  add column if not exists searchable_normalized tsvector generated always as (
    to_tsvector('simple', private.normalize_arabic_search_text(
      coalesce(text_ar,'') || ' ' || coalesce(text_en,'') || ' ' ||
      coalesce(hadith_number::text,'') || ' ' || coalesce(ref,'') || ' ' ||
      coalesce(narrator_ar,'') || ' ' || coalesce(narrator_en,'') || ' ' ||
      coalesce(grade_ar,'') || ' ' || coalesce(grade_en,'')
    ))
  ) stored;

alter table public.duas
  add column if not exists searchable_normalized tsvector generated always as (
    to_tsvector('simple', private.normalize_arabic_search_text(
      coalesce(title_ar,'') || ' ' || coalesce(title_en,'') || ' ' ||
      coalesce(text_ar,'') || ' ' || coalesce(text_en,'') || ' ' ||
      coalesce(occasion_ar,'') || ' ' || coalesce(occasion_en,'') || ' ' ||
      coalesce(source_ar,'') || ' ' || coalesce(source_en,'') || ' ' ||
      coalesce(benefits_ar,'') || ' ' || coalesce(benefits_en,'') || ' ' ||
      coalesce(slug,'')
    ))
  ) stored;

alter table public.quran_ayahs
  add column if not exists searchable_normalized tsvector generated always as (
    to_tsvector('simple', private.normalize_arabic_search_text(
      coalesce(text_uthmani,'') || ' ' || coalesce(text_simple,'') || ' ' ||
      coalesce(text_ar,'') || ' ' || coalesce(text_en,'')
    ))
  ) stored;

alter table public.stories
  add column if not exists searchable_normalized tsvector generated always as (
    to_tsvector('simple', private.normalize_arabic_search_text(
      coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' ||
      coalesce(content,'') || ' ' || coalesce(category,'') || ' ' || coalesce(slug,'')
    ))
  ) stored;

alter table public.scholars
  add column if not exists searchable_normalized tsvector generated always as (
    to_tsvector('simple', private.normalize_arabic_search_text(
      coalesce(name_ar,'') || ' ' || coalesce(name_en,'') || ' ' ||
      coalesce(bio_ar,'') || ' ' || coalesce(bio_en,'') || ' ' || coalesce(slug,'')
    ))
  ) stored;

alter table public.prophets
  add column if not exists searchable_normalized tsvector generated always as (
    to_tsvector('simple', private.normalize_arabic_search_text(
      coalesce(name_ar,'') || ' ' || coalesce(name_en,'') || ' ' ||
      coalesce(bio_ar,'') || ' ' || coalesce(bio_en,'') || ' ' ||
      coalesce(birth_place_ar,'') || ' ' || coalesce(birth_place_en,'') || ' ' ||
      coalesce(death_place_ar,'') || ' ' || coalesce(death_place_en,'') || ' ' ||
      coalesce(slug,'')
    ))
  ) stored;

alter table public.companions
  add column if not exists searchable_normalized tsvector generated always as (
    to_tsvector('simple', private.normalize_arabic_search_text(
      coalesce(name_ar,'') || ' ' || coalesce(name_en,'') || ' ' ||
      coalesce(title_ar,'') || ' ' || coalesce(bio_ar,'') || ' ' ||
      coalesce(bio_en,'') || ' ' || coalesce(category,'') || ' ' ||
      coalesce(birth_place_ar,'') || ' ' || coalesce(death_place_ar,'') || ' ' ||
      coalesce(death_year,'') || ' ' || coalesce(slug,'')
    ))
  ) stored;

create index if not exists articles_searchable_normalized_idx on public.articles using gin (searchable_normalized) where published is true;
create index if not exists hadiths_searchable_normalized_idx on public.hadiths using gin (searchable_normalized) where published is true;
create index if not exists duas_searchable_normalized_idx on public.duas using gin (searchable_normalized) where published is true;
create index if not exists quran_ayahs_searchable_normalized_idx on public.quran_ayahs using gin (searchable_normalized);
create index if not exists stories_searchable_normalized_idx on public.stories using gin (searchable_normalized) where published is true and is_approved is true and user_id is null;
create index if not exists scholars_searchable_normalized_idx on public.scholars using gin (searchable_normalized) where published is true;
create index if not exists prophets_searchable_normalized_idx on public.prophets using gin (searchable_normalized) where published is true;
create index if not exists companions_searchable_normalized_idx on public.companions using gin (searchable_normalized) where published is true;

comment on function private.normalize_arabic_search_text(text) is
  'Canonical search-only Arabic normalization: NFKC, diacritic/tatweel removal, alef and ya/hamza normalization.';
