-- Replace literal backslash+n sequences left by the original standard SQL string.
update public.prophet_sections
set content_ar = replace(content_ar, chr(92) || 'n', chr(10))
where strpos(content_ar, chr(92) || 'n') > 0;
