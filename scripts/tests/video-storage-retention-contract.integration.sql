\set ON_ERROR_STOP on

DO $contract$
DECLARE
  function_definition text;
BEGIN
  IF public.video_storage_retention_contract_ready() IS NOT TRUE THEN
    function_definition := pg_catalog.pg_get_functiondef(
      'public.update_video_storage_retention(uuid,uuid,text,jsonb,boolean)'::regprocedure
    );
    RAISE EXCEPTION 'The installed retention RPC did not pass its own contract check. Definition: %', function_definition;
  END IF;

  IF has_function_privilege('anon', 'public.update_video_storage_retention(uuid,uuid,text,jsonb,boolean)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Anonymous clients must not execute the video retention RPC.';
  END IF;
  IF has_function_privilege('authenticated', 'public.update_video_storage_retention(uuid,uuid,text,jsonb,boolean)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Authenticated clients must not execute the video retention RPC.';
  END IF;
  IF NOT has_function_privilege('service_role', 'public.update_video_storage_retention(uuid,uuid,text,jsonb,boolean)', 'EXECUTE') THEN
    RAISE EXCEPTION 'The service role must execute the video retention RPC.';
  END IF;
END
$contract$;
