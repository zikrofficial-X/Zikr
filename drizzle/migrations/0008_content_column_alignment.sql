-- Align content table columns with drizzle/schema.ts and the import scripts.
-- This migration is intentionally explicit so existing databases created from
-- 0003_phase3_content.sql converge on the canonical column names instead of
-- relying on implicit drift between migrations, Drizzle schema, and import SQL.

-- quran_surahs canonical columns:
-- id, name_ar, name_en, name_translation, revelation_place, ayahs_count, order, slug, created_at, updated_at
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quran_surahs' and column_name = 'ayah_count'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quran_surahs' and column_name = 'ayahs_count'
  ) then
    alter table quran_surahs rename column ayah_count to ayahs_count;
  end if;
end $$;

alter table quran_surahs add column if not exists ayahs_count int;
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quran_surahs' and column_name = 'ayah_count'
  ) then
    execute 'update quran_surahs set ayahs_count = ayah_count where ayahs_count is null';
  end if;
end $$;
update quran_surahs set ayahs_count = 0 where ayahs_count is null;
alter table quran_surahs alter column ayahs_count set not null;
alter table quran_surahs add column if not exists name_translation text;
alter table quran_surahs add column if not exists created_at timestamptz not null default now();
alter table quran_surahs add column if not exists updated_at timestamptz not null default now();

-- quran_ayahs canonical columns:
-- id, surah_id, ayah_number, text_ar, text_en, audio_url, text_uthmani, text_simple, page, juz, hizb, rub, sajda, created_at, updated_at
alter table quran_ayahs add column if not exists text_ar text;
update quran_ayahs set text_ar = coalesce(text_ar, text_uthmani, text_simple) where text_ar is null;
alter table quran_ayahs alter column text_ar set not null;
alter table quran_ayahs add column if not exists text_en text;
alter table quran_ayahs add column if not exists audio_url text;
alter table quran_ayahs add column if not exists created_at timestamptz not null default now();
alter table quran_ayahs add column if not exists updated_at timestamptz not null default now();

-- quran_tafsir canonical columns:
-- id, surah_id, ayah_number, tafsir_ar, tafsir_en, author, created_at, updated_at
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quran_tafsir' and column_name = 'source'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quran_tafsir' and column_name = 'author'
  ) then
    alter table quran_tafsir rename column source to author;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quran_tafsir' and column_name = 'text'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quran_tafsir' and column_name = 'tafsir_ar'
  ) then
    alter table quran_tafsir rename column text to tafsir_ar;
  end if;
end $$;

alter table quran_tafsir add column if not exists author text;
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quran_tafsir' and column_name = 'source'
  ) then
    execute 'update quran_tafsir set author = source where author is null';
  end if;
end $$;
update quran_tafsir set author = coalesce(author, 'unknown') where author is null;
alter table quran_tafsir add column if not exists tafsir_ar text;
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quran_tafsir' and column_name = 'text'
  ) then
    execute 'update quran_tafsir set tafsir_ar = text where tafsir_ar is null';
  end if;
end $$;
update quran_tafsir set tafsir_ar = coalesce(tafsir_ar, '') where tafsir_ar is null;
alter table quran_tafsir alter column tafsir_ar set not null;
alter table quran_tafsir add column if not exists tafsir_en text;
alter table quran_tafsir add column if not exists created_at timestamptz not null default now();
alter table quran_tafsir add column if not exists updated_at timestamptz not null default now();

-- quran_reciters canonical columns:
-- id, name_ar, name_en, code, style, base_url_template, thumbnail_url, metadata, created_at, updated_at
alter table quran_reciters add column if not exists code text;
update quran_reciters set code = coalesce(code, lower(regexp_replace(name_en, '[^a-zA-Z0-9]+', '-', 'g')), id::text) where code is null;
alter table quran_reciters alter column code set not null;
alter table quran_reciters add column if not exists base_url_template text;
update quran_reciters set base_url_template = coalesce(base_url_template, '') where base_url_template is null;
alter table quran_reciters alter column base_url_template set not null;
update quran_reciters set name_en = coalesce(name_en, name_ar) where name_en is null;
alter table quran_reciters alter column name_en set not null;
alter table quran_reciters add column if not exists thumbnail_url text;
alter table quran_reciters add column if not exists metadata jsonb default '{}'::jsonb;
alter table quran_reciters add column if not exists created_at timestamptz not null default now();
alter table quran_reciters add column if not exists updated_at timestamptz not null default now();
create unique index if not exists quran_reciters_code_unique on quran_reciters (code);

-- hadith_books canonical columns:
-- id, slug, name_ar, name_en, source, author_ar, author_en, hadith_count, created_at, updated_at
alter table hadith_books add column if not exists source text;
update hadith_books set source = coalesce(source, slug) where source is null;
alter table hadith_books alter column source set not null;
update hadith_books set name_en = coalesce(name_en, name_ar) where name_en is null;
alter table hadith_books alter column name_en set not null;
alter table hadith_books add column if not exists author_ar text;
alter table hadith_books add column if not exists author_en text;
alter table hadith_books add column if not exists hadith_count int;
alter table hadith_books add column if not exists created_at timestamptz not null default now();
alter table hadith_books add column if not exists updated_at timestamptz not null default now();

-- hadiths canonical columns:
-- id, book_id, hadith_number, text_ar, text_en, narrator_ar, narrator_en, grade_ar, grade_en, chapter, ref, published, created_at, updated_at
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'hadiths' and column_name = 'narrator'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'hadiths' and column_name = 'narrator_ar'
  ) then
    alter table hadiths rename column narrator to narrator_ar;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'hadiths' and column_name = 'grade'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'hadiths' and column_name = 'grade_ar'
  ) then
    alter table hadiths rename column grade to grade_ar;
  end if;
end $$;

alter table hadiths add column if not exists text_en text;
alter table hadiths add column if not exists narrator_ar text;
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'hadiths' and column_name = 'narrator'
  ) then
    execute 'update hadiths set narrator_ar = narrator where narrator_ar is null';
  end if;
end $$;
alter table hadiths add column if not exists narrator_en text;
alter table hadiths add column if not exists grade_ar text;
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'hadiths' and column_name = 'grade'
  ) then
    execute 'update hadiths set grade_ar = grade where grade_ar is null';
  end if;
end $$;
alter table hadiths add column if not exists grade_en text;
alter table hadiths add column if not exists chapter text;
alter table hadiths add column if not exists ref text;
alter table hadiths add column if not exists published boolean not null default true;
alter table hadiths add column if not exists created_at timestamptz not null default now();
alter table hadiths add column if not exists updated_at timestamptz not null default now();
