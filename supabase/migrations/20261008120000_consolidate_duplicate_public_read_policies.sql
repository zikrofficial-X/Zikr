-- Consolidate accidental duplicate public SELECT policies while preserving
-- public published reads and privileged admin reads/writes.

do $$
begin
  if to_regclass('public.hadiths') is not null then
    drop policy if exists "content_admin_write_hadiths" on public.hadiths;
    drop policy if exists "hadiths_public_read" on public.hadiths;
    drop policy if exists "public_read_hadiths" on public.hadiths;
    create policy "public_read_hadiths"
      on public.hadiths
      as permissive
      for select
      to public
      using ((published = true) or private.is_admin_user());
  end if;

  if to_regclass('public.scholars') is not null then
    drop policy if exists "content_admin_write_scholars" on public.scholars;
    drop policy if exists "public_read_scholars" on public.scholars;
    drop policy if exists "scholars_public_read" on public.scholars;
    create policy "public_read_scholars"
      on public.scholars
      as permissive
      for select
      to public
      using ((published = true) or private.is_admin_user());
  end if;

  if to_regclass('public.stories') is not null then
    drop policy if exists "content_admin_write_stories" on public.stories;
    drop policy if exists "public_read_stories" on public.stories;
    drop policy if exists "stories_public_read" on public.stories;
    create policy "public_read_stories"
      on public.stories
      as permissive
      for select
      to public
      using ((published = true) or private.is_admin_user());
  end if;
end $$;
