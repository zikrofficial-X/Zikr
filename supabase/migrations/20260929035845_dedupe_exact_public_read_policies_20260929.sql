-- Remove exact duplicate public-read policies left by historical migrations.
drop policy if exists public_read_reciters on public.quran_reciters;
drop policy if exists quran_reciters_public_read on public.quran_reciters;
drop policy if exists public_read_hadith_books on public.hadith_books;
drop policy if exists public_read_hadith_explanations on public.hadith_explanations;
drop policy if exists prophet_sections_public_read on public.prophet_sections;
drop policy if exists quran_ayahs_public_read on public.quran_ayahs;
drop policy if exists quran_surahs_public_read on public.quran_surahs;
drop policy if exists quran_tafsir_public_read on public.quran_tafsir;
