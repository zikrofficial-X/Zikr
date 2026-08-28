-- The original story migration used a standard SQL string for newlines,
-- which preserved the two-character sequence \\n instead of a line break.
update public.prophet_sections
set content_ar = replace(content_ar, E'\\\\n\\\\n', E'\n\n')
where content_ar like '%\\n\\n%';
