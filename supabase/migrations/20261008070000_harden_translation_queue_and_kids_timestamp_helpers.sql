-- Security/performance hardening for existing runtime helpers.
create or replace function public.update_kids_character_selection_timestamp()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.update_kids_game_progress_timestamp()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create index if not exists content_translation_queue_reviewed_by_idx
  on public.content_translation_queue(reviewed_by);
