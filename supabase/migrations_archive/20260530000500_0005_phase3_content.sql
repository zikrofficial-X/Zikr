create extension if not exists pg_trgm;

create table if not exists quran_surahs (
  id int primary key,
  name_ar text not null,
  name_en text not null,
  ayah_count int not null,
  revelation_place text not null,
  "order" int not null,
  slug text unique not null
);
create table if not exists quran_ayahs (
  id uuid primary key default gen_random_uuid(),
  surah_id int not null references quran_surahs(id) on delete cascade,
  ayah_number int not null,
  text_uthmani text not null,
  text_simple text not null,
  page int,juz int,hizb int,rub int,sajda boolean default false,
  searchable tsvector generated always as (to_tsvector('simple', coalesce(text_uthmani,'') || ' ' || coalesce(text_simple,''))) stored,
  unique(surah_id, ayah_number)
);
-- Guard: if quran_ayahs pre-existed without text_uthmani/text_simple (created
-- by an older Drizzle schema), the generated column cannot reference them yet.
-- Only add the column+index once both source columns are present.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quran_ayahs' AND column_name = 'text_uthmani'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quran_ayahs' AND column_name = 'text_simple'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'quran_ayahs' AND column_name = 'searchable'
    ) THEN
      ALTER TABLE public.quran_ayahs
        ADD COLUMN searchable tsvector GENERATED ALWAYS AS (
          to_tsvector('simple', coalesce(text_uthmani,'') || ' ' || coalesce(text_simple,''))
        ) STORED;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = 'quran_ayahs_search_idx' AND n.nspname = 'public'
    ) THEN
      CREATE INDEX quran_ayahs_search_idx ON public.quran_ayahs USING gin (searchable);
    END IF;
  END IF;
END $$;

create table if not exists quran_tafsir (
  id uuid primary key default gen_random_uuid(),
  surah_id int not null references quran_surahs(id) on delete cascade,
  ayah_number int not null,
  source text not null,
  text text not null,
  unique(surah_id, ayah_number, source)
);
create table if not exists quran_reciters (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text,
  code text unique not null,
  style text,
  base_url_template text not null
);
create table if not exists hadith_books (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_ar text not null,
  name_en text,
  source text not null
);
create table if not exists hadiths (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references hadith_books(id) on delete cascade,
  hadith_number text not null,
  text_ar text not null,
  narrator text,
  grade text,
  chapter text,
  ref text,
  searchable tsvector generated always as (to_tsvector('simple', coalesce(text_ar,''))) stored,
  unique(book_id, hadith_number)
);
-- Guard: ensure generated column and index exist on pre-existing hadiths tables.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hadiths' AND column_name = 'searchable'
  ) THEN
    ALTER TABLE public.hadiths
      ADD COLUMN searchable tsvector GENERATED ALWAYS AS (
        to_tsvector('simple', coalesce(text_ar,''))
      ) STORED;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'hadiths_search_idx' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX hadiths_search_idx ON public.hadiths USING gin (searchable);
  END IF;
END $$;
create table if not exists hadith_explanations (
  id uuid primary key default gen_random_uuid(),
  hadith_id uuid not null references hadiths(id) on delete cascade,
  source text not null,
  text text not null
);

alter table quran_surahs enable row level security;
alter table quran_ayahs enable row level security;
alter table quran_tafsir enable row level security;
alter table quran_reciters enable row level security;
alter table hadith_books enable row level security;
alter table hadiths enable row level security;
alter table hadith_explanations enable row level security;

create policy "quran_surahs_public_read" on quran_surahs for select using (true);
create policy "quran_ayahs_public_read" on quran_ayahs for select using (true);
create policy "quran_tafsir_public_read" on quran_tafsir for select using (true);
create policy "quran_reciters_public_read" on quran_reciters for select using (true);
create policy "hadith_books_public_read" on hadith_books for select using (true);
create policy "hadiths_public_read" on hadiths for select using (true);
create policy "hadith_explanations_public_read" on hadith_explanations for select using (true);

create policy "content_admin_write_surahs" on quran_surahs for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin')) with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin'));
create policy "content_admin_write_ayahs" on quran_ayahs for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin')) with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin'));
create policy "content_admin_write_tafsir" on quran_tafsir for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin')) with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin'));
create policy "content_admin_write_reciters" on quran_reciters for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin')) with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin'));
create policy "content_admin_write_books" on hadith_books for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin')) with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin'));
create policy "content_admin_write_hadiths" on hadiths for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin')) with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin'));
create policy "content_admin_write_hadith_explanations" on hadith_explanations for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin')) with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin'));
