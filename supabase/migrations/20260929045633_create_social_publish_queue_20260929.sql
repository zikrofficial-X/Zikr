CREATE TABLE IF NOT EXISTS public.social_publish_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_id text,
  title text NOT NULL,
  body text,
  image_url text,
  video_url text,
  target_platforms text[] NOT NULL DEFAULT ARRAY[]::text[],
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','processing','published','partial','failed')),
  scheduled_at timestamptz,
  published_at timestamptz,
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  automation_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.social_publish_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS social_publish_queue_admin_read ON public.social_publish_queue;
CREATE POLICY social_publish_queue_admin_read
  ON public.social_publish_queue
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.admin_role_assignments a
    WHERE a.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

DROP POLICY IF EXISTS social_publish_queue_admin_write ON public.social_publish_queue;
CREATE POLICY social_publish_queue_admin_write
  ON public.social_publish_queue
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.admin_role_assignments a
    WHERE a.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.admin_role_assignments a
    WHERE a.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

CREATE INDEX IF NOT EXISTS idx_social_publish_queue_status_scheduled
  ON public.social_publish_queue(status, scheduled_at, created_at);

CREATE INDEX IF NOT EXISTS idx_social_publish_queue_content
  ON public.social_publish_queue(content_type, content_id);

CREATE INDEX IF NOT EXISTS idx_social_publish_queue_created_at
  ON public.social_publish_queue(created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_social_publish_queue_automation_key
  ON public.social_publish_queue(automation_key)
  WHERE automation_key IS NOT NULL;
