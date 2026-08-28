-- Run the source-verified agent daily through Supabase pg_cron.
-- The function authenticates using the existing scheduler secret RPC.

UPDATE public.content_agent_sources
SET enabled = CASE WHEN parser_key = 'alquran_cloud' THEN true ELSE false END,
    next_run_at = now()
WHERE parser_key IN ('alquran_cloud', 'quran_foundation_v4', 'sunnah_api');

DO $$
BEGIN
  IF to_regclass('cron.job') IS NOT NULL THEN
    EXECUTE $schedule$
      DO $inner$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'zikr-source-verified-content-agent') THEN
          PERFORM cron.schedule(
            'zikr-source-verified-content-agent',
            '0 3 * * *',
            $job$
              SELECT net.http_post(
                url := 'https://eydxvcamhjhajxjrsgym.supabase.co/functions/v1/source-verified-content-agent',
                headers := jsonb_build_object(
                  'Content-Type', 'application/json',
                  'Authorization', 'Bearer ' || public.get_push_scheduler_secret()
                ),
                body := jsonb_build_object('source', 'pg_cron')
              );
            $job$
          );
        END IF;
      END
      $inner$;
    $schedule$;
  END IF;
END $$;
