-- The result processor writes private aggregate tables whose direct grants are intentionally revoked.
-- SECURITY DEFINER is required; the function still derives auth.uid() and rejects anonymous callers.
alter function public.kids_record_game_result(text, text, integer, integer, integer, text, smallint, smallint, integer, boolean, jsonb)
  security definer;

alter function public.kids_record_game_result(text, text, integer, integer, integer, text, smallint, smallint, integer, boolean, jsonb)
  set search_path = public;

revoke all on function public.kids_record_game_result(text, text, integer, integer, integer, text, smallint, smallint, integer, boolean, jsonb) from public, anon;
grant execute on function public.kids_record_game_result(text, text, integer, integer, integer, text, smallint, smallint, integer, boolean, jsonb) to authenticated;
