-- Keep public video-category reads limited to active + published categories.
drop policy if exists video_categories_public_read on public.video_categories;
drop policy if exists allow_public_read on public.video_categories;
create policy video_categories_public_read on public.video_categories for select to public
  using (is_active = true and published = true);
