-- Track each server-issued signed site-audio upload before a client can upload bytes.
-- Expired, unregistered objects can then be reconciled without scanning or guessing
-- at arbitrary Storage paths. Only the service role may read or mutate these intents.
BEGIN;

CREATE TABLE IF NOT EXISTS public.site_audio_upload_intents (
  storage_path text PRIMARY KEY,
  owner_user_id uuid NOT NULL,
  mime_type text NOT NULL CHECK (char_length(trim(mime_type)) BETWEEN 1 AND 120),
  size_bytes integer NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 52428800),
  upload_expires_at timestamptz NOT NULL,
  cleanup_after timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'registered', 'deleting', 'cleaned')),
  asset_id uuid REFERENCES public.site_audio_assets(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_audio_upload_intents_cleanup_after_check
    CHECK (cleanup_after >= upload_expires_at + interval '24 hours')
);

CREATE INDEX IF NOT EXISTS site_audio_upload_intents_pending_cleanup_idx
  ON public.site_audio_upload_intents (cleanup_after, storage_path)
  WHERE status IN ('pending', 'deleting')
     OR (status = 'registered' AND asset_id IS NULL);

ALTER TABLE public.site_audio_upload_intents ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.site_audio_upload_intents FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.site_audio_upload_intents TO service_role;

COMMENT ON TABLE public.site_audio_upload_intents IS
  'Server-only signed-upload intents. Expired pending/deleting rows and detached registered rows may be reconciled only by the explicit reference-checked site-audio retention workflow.';

COMMIT;
