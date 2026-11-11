begin;

-- The admin Kids manager already exposes these content types. Keep the database
-- constraint aligned so valid form submissions are not rejected by PostgreSQL.
alter table public.kids_content
  drop constraint if exists kids_content_type_check;

alter table public.kids_content
  add constraint kids_content_type_check
  check (
    type in (
      'story',
      'prayer',
      'wudu',
      'quiz',
      'game',
      'puzzle',
      'coloring',
      'matching',
      'video',
      'memorize'
    )
  );

commit;
