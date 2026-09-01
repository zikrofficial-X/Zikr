-- Keep publication state immutable once a job is published.
-- Allow an explicit processing -> failed transition so stale jobs can be
-- recovered without remaining permanently locked in processing.
create or replace function public.protect_social_sync_job_state()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if old.status = 'published' then
      new.status := old.status;
      new.facebook_post_id := old.facebook_post_id;
      new.published_at_facebook := old.published_at_facebook;
      new.retryable := false;
      new.locked_at := null;
      new.publish_request_id := old.publish_request_id;
      new.next_attempt_at := old.next_attempt_at;
      new.last_error := null;
    elsif old.status = 'processing' then
      if new.status not in ('processing', 'failed') then
        new.status := old.status;
      end if;
      new.facebook_post_id := old.facebook_post_id;
      new.published_at_facebook := old.published_at_facebook;
      if new.status = 'processing' then
        new.locked_at := old.locked_at;
        new.publish_request_id := old.publish_request_id;
      elsif new.status = 'failed' then
        new.locked_at := null;
        new.publish_request_id := old.publish_request_id;
        new.facebook_post_id := null;
      end if;
    end if;

    if old.source_media_url is not null and new.source_media_url is null then
      new.source_media_url := old.source_media_url;
      if new.status = 'waiting_media' then
        new.status := old.status;
      end if;
    end if;
  end if;
  return new;
end;
$$;