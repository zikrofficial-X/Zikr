alter table public.hadiths
  add column if not exists chapter text;

comment on column public.hadiths.chapter is
  'Chapter or section label for the hadith entry, kept separate from the source reference.';

notify pgrst, 'reload schema';
