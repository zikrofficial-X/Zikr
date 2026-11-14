-- Site-audio objects are uploaded with a short-lived signed URL issued by the
-- server-admin route and deleted only by the step-up-protected server route.
-- Direct authenticated Storage policies bypass those application controls and
-- can create orphan objects or remove files while leaving database rows behind.
BEGIN;

DROP POLICY IF EXISTS site_audio_admin_insert ON storage.objects;
DROP POLICY IF EXISTS site_audio_admin_delete ON storage.objects;

COMMIT;
