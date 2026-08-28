-- Phase 5: Production Hardening - Timestamps, Indexes, Metadata

-- Add timestamps to content tables
alter table quran_surahs add column if not exists created_at timestamptz default now() not null;
alter table quran_surahs add column if not exists updated_at timestamptz default now() not null;

alter table quran_ayahs add column if not exists created_at timestamptz default now() not null;
alter table quran_ayahs add column if not exists updated_at timestamptz default now() not null;

alter table quran_tafsir add column if not exists created_at timestamptz default now() not null;
alter table quran_tafsir add column if not exists updated_at timestamptz default now() not null;

alter table quran_reciters add column if not exists created_at timestamptz default now() not null;
alter table quran_reciters add column if not exists updated_at timestamptz default now() not null;

alter table hadith_books add column if not exists created_at timestamptz default now() not null;
alter table hadith_books add column if not exists updated_at timestamptz default now() not null;

alter table hadiths add column if not exists created_at timestamptz default now() not null;
alter table hadiths add column if not exists updated_at timestamptz default now() not null;
alter table hadiths add column if not exists published boolean default true not null;

alter table hadith_explanations add column if not exists created_at timestamptz default now() not null;
alter table hadith_explanations add column if not exists updated_at timestamptz default now() not null;

alter table scholars add column if not exists created_at timestamptz default now() not null;
alter table scholars add column if not exists updated_at timestamptz default now() not null;
alter table scholars add column if not exists published boolean default true not null;

alter table stories add column if not exists created_at timestamptz default now() not null;
alter table stories add column if not exists updated_at timestamptz default now() not null;

-- Add metadata JSONB columns for extensibility
alter table scholars add column if not exists metadata jsonb default '{}'::jsonb;
alter table stories add column if not exists metadata jsonb default '{}'::jsonb;
alter table quran_reciters add column if not exists metadata jsonb default '{}'::jsonb;

-- Add foreign key indexes for performance
create index if not exists quran_ayahs_surah_id_idx on quran_ayahs(surah_id);
create index if not exists quran_tafsir_surah_id_idx on quran_tafsir(surah_id);
create index if not exists hadiths_book_id_idx on hadiths(book_id);
create index if not exists hadith_explanations_hadith_id_idx on hadith_explanations(hadith_id);

-- Add slug indexes for URL lookups
create index if not exists quran_surahs_slug_idx on quran_surahs(slug);
create index if not exists scholars_slug_idx on scholars(slug);
create index if not exists stories_slug_idx on stories(slug);
create index if not exists hadith_books_slug_idx on hadith_books(slug);

-- Add published status indexes
create index if not exists scholars_published_idx on scholars(published);
create index if not exists stories_published_idx on stories(published);
create index if not exists hadiths_published_idx on hadiths(published);

-- Create composite indexes for common queries
create index if not exists scholars_published_created_idx on scholars(published, created_at desc);
create index if not exists stories_published_created_idx on stories(published, created_at desc);

-- Update RLS policies to filter by published status for public users
drop policy if exists "scholars_public_read" on scholars;
create policy "scholars_public_read" on scholars for select using (
  published = true or
  (auth.role() = 'authenticated' and exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
  ))
);

drop policy if exists "stories_public_read" on stories;
create policy "stories_public_read" on stories for select using (
  published = true or
  (auth.role() = 'authenticated' and exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
  ))
);

drop policy if exists "hadiths_public_read" on hadiths;
create policy "hadiths_public_read" on hadiths for select using (
  published = true or
  (auth.role() = 'authenticated' and exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
  ))
);

-- Add UPDATE/DELETE policies for scholars
drop policy if exists "content_admin_write_scholars" on scholars;
create policy "content_admin_write_scholars" on scholars for all
using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Add UPDATE/DELETE policies for stories
drop policy if exists "content_admin_write_stories" on stories;
create policy "content_admin_write_stories" on stories for all
using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Add UPDATE/DELETE policies for hadiths
drop policy if exists "content_admin_write_hadiths" on hadiths;
create policy "content_admin_write_hadiths" on hadiths for all
using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Full-text search GIN indexes already exist as quran_ayahs_search_idx and
-- hadiths_search_idx (created in 0005_phase3_content). The *_search_text_idx
-- variants were exact duplicates on the same column and have been removed.
-- Drop them if they were ever created on an existing environment.
drop index if exists quran_ayahs_search_text_idx;
drop index if exists hadiths_search_text_idx;

-- Trigger to auto-update updated_at columns
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_quran_surahs_updated_at on quran_surahs;
create trigger update_quran_surahs_updated_at before update on quran_surahs
for each row execute function public.update_updated_at_column();

drop trigger if exists update_quran_ayahs_updated_at on quran_ayahs;
create trigger update_quran_ayahs_updated_at before update on quran_ayahs
for each row execute function public.update_updated_at_column();

drop trigger if exists update_quran_tafsir_updated_at on quran_tafsir;
create trigger update_quran_tafsir_updated_at before update on quran_tafsir
for each row execute function public.update_updated_at_column();

drop trigger if exists update_quran_reciters_updated_at on quran_reciters;
create trigger update_quran_reciters_updated_at before update on quran_reciters
for each row execute function public.update_updated_at_column();

drop trigger if exists update_hadith_books_updated_at on hadith_books;
create trigger update_hadith_books_updated_at before update on hadith_books
for each row execute function public.update_updated_at_column();

drop trigger if exists update_hadiths_updated_at on hadiths;
create trigger update_hadiths_updated_at before update on hadiths
for each row execute function public.update_updated_at_column();

drop trigger if exists update_hadith_explanations_updated_at on hadith_explanations;
create trigger update_hadith_explanations_updated_at before update on hadith_explanations
for each row execute function public.update_updated_at_column();

drop trigger if exists update_scholars_updated_at on scholars;
create trigger update_scholars_updated_at before update on scholars
for each row execute function public.update_updated_at_column();

drop trigger if exists update_stories_updated_at on stories;
create trigger update_stories_updated_at before update on stories
for each row execute function public.update_updated_at_column();
