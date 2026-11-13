\set ON_ERROR_STOP on

CREATE TABLE public.content_publish_queue (
  id uuid PRIMARY KEY,
  content_table text NOT NULL,
  content_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('queued', 'processing', 'published', 'cancelled', 'failed'))
);

-- Reproduce the pre-existing constraint: it prevents two queued rows but
-- leaves a processing row outside the uniqueness predicate.
CREATE UNIQUE INDEX content_publish_queue_one_queued_item
  ON public.content_publish_queue (content_table, content_id)
  WHERE status = 'queued';

INSERT INTO public.content_publish_queue (id, content_table, content_id, status)
VALUES (
  '71000000-0000-0000-0000-000000000001',
  'articles',
  '72000000-0000-0000-0000-000000000001',
  'processing'
);

\i /workspace/supabase/migrations/20261113230000_content_publish_queue_one_active_item.sql

DO $active_queue_contract$
BEGIN
  BEGIN
    INSERT INTO public.content_publish_queue (id, content_table, content_id, status)
    VALUES (
      '71000000-0000-0000-0000-000000000002',
      'articles',
      '72000000-0000-0000-0000-000000000001',
      'queued'
    );
    RAISE EXCEPTION 'queued duplicate must be rejected while the same content item is processing';
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;

  INSERT INTO public.content_publish_queue (id, content_table, content_id, status)
  VALUES (
    '71000000-0000-0000-0000-000000000003',
    'articles',
    '72000000-0000-0000-0000-000000000002',
    'queued'
  );

  UPDATE public.content_publish_queue
  SET status = 'processing'
  WHERE id = '71000000-0000-0000-0000-000000000003';

  BEGIN
    INSERT INTO public.content_publish_queue (id, content_table, content_id, status)
    VALUES (
      '71000000-0000-0000-0000-000000000004',
      'articles',
      '72000000-0000-0000-0000-000000000002',
      'processing'
    );
    RAISE EXCEPTION 'a second processing row must be rejected for the same content item';
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;

  UPDATE public.content_publish_queue
  SET status = 'published'
  WHERE id = '71000000-0000-0000-0000-000000000001';

  INSERT INTO public.content_publish_queue (id, content_table, content_id, status)
  VALUES (
    '71000000-0000-0000-0000-000000000005',
    'articles',
    '72000000-0000-0000-0000-000000000001',
    'queued'
  );
END
$active_queue_contract$;

SELECT 'CONTENT_PUBLISH_ACTIVE_QUEUE_INTEGRATION_PASSED' AS result;
