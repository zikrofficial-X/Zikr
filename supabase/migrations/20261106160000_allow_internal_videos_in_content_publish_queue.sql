-- Allow the internal ZIKR video catalog to use the same site-owned
-- publication queue as articles and stories. No external provider delivery
-- is enabled by this constraint change.
ALTER TABLE public.content_publish_queue
  DROP CONSTRAINT IF EXISTS content_publish_queue_content_table_check;

ALTER TABLE public.content_publish_queue
  ADD CONSTRAINT content_publish_queue_content_table_check
  CHECK (
    content_table = ANY (
      ARRAY[
        'articles',
        'stories',
        'competitions',
        'memorization_plans',
        'pinned_messages',
        'videos'
      ]::text[]
    )
  );
