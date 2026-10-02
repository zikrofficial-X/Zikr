-- Phase 18: coordinated retirement of confirmed legacy/unused DB subsystems.
-- Preconditions established in Phase 17:
-- - all target tables except game_scenarios are empty;
-- - no active src/ runtime consumer exists;
-- - game_scenarios remains populated (12 rows) and is intentionally kept.

BEGIN;

-- Preserve historical audit rows in the canonical append-only audit stream.
INSERT INTO public.admin_audit_events (
  actor_user_id,
  action,
  resource_type,
  resource_id,
  permission,
  outcome,
  request_id,
  metadata,
  created_at
)
SELECT
  COALESCE(a.admin_id, a.user_id),
  a.action,
  a.entity_type,
  a.entity_id,
  NULL,
  'success',
  'legacy-admin-audit-log:' || a.id::text,
  jsonb_build_object(
    'legacy_table', 'admin_audit_log',
    'legacy_id', a.id,
    'details', a.details,
    'meta', a.meta
  ),
  a.created_at
FROM public.admin_audit_log a
WHERE NOT EXISTS (
  SELECT 1
  FROM public.admin_audit_events e
  WHERE e.request_id = 'legacy-admin-audit-log:' || a.id::text
);

INSERT INTO public.admin_audit_events (
  actor_user_id,
  action,
  resource_type,
  resource_id,
  permission,
  outcome,
  request_id,
  metadata,
  created_at
)
SELECT
  a.user_id,
  a.action,
  'legacy-admin-actions-audit',
  a.id::text,
  NULL,
  'success',
  'legacy-admin-actions-audit:' || a.id::text,
  jsonb_build_object(
    'legacy_table', 'admin_actions_audit',
    'legacy_id', a.id,
    'meta', COALESCE(a.meta, '{}'::jsonb)
  ),
  a.created_at
FROM public.admin_actions_audit a
WHERE NOT EXISTS (
  SELECT 1
  FROM public.admin_audit_events e
  WHERE e.request_id = 'legacy-admin-actions-audit:' || a.id::text
);

-- Retire the legacy narration subsystem as one unit.
DROP VIEW IF EXISTS public.free_tier_statistics;
DROP FUNCTION IF EXISTS public.track_free_tier_usage();
DROP TABLE IF EXISTS public.video_narrations;
DROP TABLE IF EXISTS public.free_tier_usage;
DROP FUNCTION IF EXISTS public.update_video_narrations_timestamp();

-- Retire the obsolete publication-config table.
DROP TABLE IF EXISTS public.video_publishing_config;

-- Retire the old duplicated audit tables after preserving their rows.
DROP TABLE IF EXISTS public.admin_actions_audit;
DROP TABLE IF EXISTS public.admin_audit_log;

-- Retire empty game asset metadata and its trigger function.
DROP TABLE IF EXISTS public.game_graphics;
DROP FUNCTION IF EXISTS public.update_game_graphics_timestamp();

-- Retire the empty legacy kids achievements compatibility table.
DROP TABLE IF EXISTS public.kids_achievements_legacy_20261002;

COMMIT;
