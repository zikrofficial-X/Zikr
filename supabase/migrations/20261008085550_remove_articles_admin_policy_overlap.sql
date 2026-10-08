-- Remove the final redundant broad admin policy on articles.
-- Explicit admin_all_* policies already cover INSERT/UPDATE/DELETE,
-- while articles_public_read remains the only public/authenticated SELECT path.
drop policy if exists "articles_admin_write" on public.articles;
