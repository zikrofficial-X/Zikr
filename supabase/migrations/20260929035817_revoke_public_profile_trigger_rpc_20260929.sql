-- The profile trigger is invoked by Postgres, not by PostgREST callers.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
