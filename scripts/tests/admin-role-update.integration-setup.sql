CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;

CREATE TYPE public.role AS ENUM ('user', 'admin');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  role public.role NOT NULL DEFAULT 'user',
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.admin_role_assignments (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.admin_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  action text NOT NULL,
  permission text,
  resource_type text,
  resource_id text,
  outcome text NOT NULL,
  request_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.site_audio_assets (
  id uuid PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('adhan', 'salawat', 'dhikr')),
  storage_path text NOT NULL UNIQUE,
  is_primary boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX site_audio_assets_one_primary_per_kind
  ON public.site_audio_assets(kind) WHERE is_primary;

GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_role_assignments TO service_role;
GRANT INSERT ON public.admin_audit_events TO service_role;
GRANT SELECT, UPDATE, INSERT, DELETE ON public.site_audio_assets TO service_role;

INSERT INTO public.profiles (id, role) VALUES
  ('11111111-1111-4111-8111-111111111111', 'admin'),
  ('22222222-2222-4222-8222-222222222222', 'user'),
  ('33333333-3333-4333-8333-333333333333', 'admin'),
  ('44444444-4444-4444-8444-444444444444', 'user');

INSERT INTO public.admin_role_assignments (user_id, role, created_by)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'super_admin', '11111111-1111-4111-8111-111111111111'),
  ('33333333-3333-4333-8333-333333333333', 'content_manager', '11111111-1111-4111-8111-111111111111');

INSERT INTO public.site_audio_assets (id, kind, storage_path, is_primary) VALUES
  ('55555555-5555-4555-8555-555555555555', 'adhan', 'audio/adhan-old.mp3', true),
  ('66666666-6666-4666-8666-666666666666', 'adhan', 'audio/adhan-new.mp3', false);
