-- Cover foreign keys used by admin page-view tracking and scheduled content publishing.
-- These indexes improve parent-row delete/update checks without changing application data.
CREATE INDEX IF NOT EXISTS admin_page_views_actor_user_id_idx
  ON public.admin_page_views (actor_user_id);

CREATE INDEX IF NOT EXISTS content_publish_queue_created_by_idx
  ON public.content_publish_queue (created_by);
