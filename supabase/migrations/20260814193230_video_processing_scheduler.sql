-- Run the durable video queue independently of GitHub-hosted runners.
-- The route uses the same security-definer scheduler secret as the push worker.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
     AND EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    EXECUTE $sql$
      select cron.unschedule(jobid)
      from cron.job
      where jobname = 'zikr-video-processing'
    $sql$;

    EXECUTE $sql$
      select cron.schedule(
        'zikr-video-processing',
        '* * * * *',
        $cron$
          select net.http_post(
            url := 'https://zikrmediaofficial.vercel.app/api/internal/video-processing',
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', 'Bearer ' || public.get_push_scheduler_secret()
            ),
            body := jsonb_build_object('source', 'pg_cron')
          );
        $cron$
      )
    $sql$;
  END IF;
END
$$;
