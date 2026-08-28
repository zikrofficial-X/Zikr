-- Source-verified content agent foundation.
-- This migration stores source metadata and reviewable queue items only.
-- It never publishes machine-generated religious text.

CREATE TABLE IF NOT EXISTS public.content_agent_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  base_url text NOT NULL,
  fetch_url text,
  api_key_secret_name text,
  source_type text NOT NULL CHECK (source_type IN ('quran', 'hadith', 'dua', 'tafsir', 'article')),
  parser_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  requires_api_key boolean NOT NULL DEFAULT true,
  last_checked_at timestamptz,
  next_run_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (base_url)
);

CREATE TABLE IF NOT EXISTS public.content_agent_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.content_agent_sources(id) ON DELETE RESTRICT,
  external_id text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('quran', 'hadith', 'dua', 'tafsir', 'article')),
  title text,
  body text,
  source_url text NOT NULL,
  source_retrieved_at timestamptz NOT NULL,
  content_hash text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'published', 'rejected', 'failed')),
  is_machine_generated boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_id, external_id),
  UNIQUE (content_hash)
);

CREATE TABLE IF NOT EXISTS public.content_agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'succeeded', 'partial', 'failed')),
  fetched_count integer NOT NULL DEFAULT 0,
  queued_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  details jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS content_agent_sources_due_idx
  ON public.content_agent_sources (enabled, next_run_at);
CREATE INDEX IF NOT EXISTS content_agent_queue_status_idx
  ON public.content_agent_queue (status, created_at DESC);
CREATE INDEX IF NOT EXISTS content_agent_queue_source_idx
  ON public.content_agent_queue (source_id, external_id);

ALTER TABLE public.content_agent_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_agent_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_agent_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS content_agent_sources_service_role ON public.content_agent_sources;
CREATE POLICY content_agent_sources_service_role
  ON public.content_agent_sources FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS content_agent_queue_service_role ON public.content_agent_queue;
CREATE POLICY content_agent_queue_service_role
  ON public.content_agent_queue FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS content_agent_runs_service_role ON public.content_agent_runs;
CREATE POLICY content_agent_runs_service_role
  ON public.content_agent_runs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

INSERT INTO public.content_agent_sources
  (name, base_url, fetch_url, api_key_secret_name, source_type, parser_key, enabled, requires_api_key)
VALUES
  ('Quran Foundation Content API', 'https://api-docs.quran.foundation/', 'https://api.quran.foundation/content/api/v4/chapters', 'QURAN_FOUNDATION_API_KEY', 'quran', 'quran_foundation_v4', false, true),
  ('Sunnah.com API', 'https://sunnah.com/developers', 'https://api.sunnah.com/v1/collections', 'SUNNAH_API_KEY', 'hadith', 'sunnah_api', false, true),
  ('Al Quran Cloud API', 'https://api.alquran.cloud/', 'https://api.alquran.cloud/v1/surah', NULL, 'quran', 'alquran_cloud', false, false)
ON CONFLICT (base_url) DO UPDATE SET
  name = EXCLUDED.name,
  source_type = EXCLUDED.source_type,
  parser_key = EXCLUDED.parser_key,
  requires_api_key = EXCLUDED.requires_api_key;

COMMENT ON TABLE public.content_agent_sources IS
  'Allowlisted source registry for the source-verified content agent. Sources are disabled until reviewed and configured.';
COMMENT ON TABLE public.content_agent_queue IS
  'Review queue. Machine-generated religious text is never publishable; source snapshots require explicit approval.';
COMMENT ON TABLE public.content_agent_runs IS
  'Auditable execution history for source-verified content ingestion.';
