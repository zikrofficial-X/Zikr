-- Complete normalized search coverage for Quran surah names and approved
-- public content-library records. Production records this as 20261030044153.

alter table public.quran_surahs
  add column if not exists searchable_normalized tsvector generated always as (
    to_tsvector('simple', private.normalize_arabic_search_text(
      coalesce(name_ar,'') || ' ' || coalesce(name_en,'') || ' ' || coalesce(name_translation,'')
    ))
  ) stored;

alter table public.content_library
  add column if not exists searchable_normalized tsvector generated always as (
    to_tsvector('simple', private.normalize_arabic_search_text(
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
