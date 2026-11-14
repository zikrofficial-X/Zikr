-- A scheduled content item may be queued or actively processing, but never both.
-- Refuse to apply if legacy active duplicates already exist; do not auto-delete queue rows.
BEGIN;

DO $preflight$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.content_publish_queue
    WHERE status IN ('queued', 'processing')
    GROUP BY content_table, content_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot enforce one active content publication per item: duplicate queued/processing rows require manual reconciliation.';
  END IF;
END
$preflight$;

CREATE UNIQUE INDEX IF NOT EXISTS content_publish_queue_one_active_item
  ON public.content_publish_queue (content_table, content_id)
  WHERE status IN ('queued', 'processing');

COMMIT;
