-- Keep video admin writes on the authenticated-role policies only.
-- The broader public-role admin policies were redundant because public includes authenticated.
drop policy if exists videos_admin_write on public.videos;
drop policy if exists video_categories_admin_write on public.video_categories;
