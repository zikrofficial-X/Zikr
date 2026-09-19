-- Quran chapter catalog is already stored in quran_surahs/quran_ayahs.
-- Remove stale content-agent queue rows created by the old catalog parser.
delete from public.content_agent_queue
where source_id = '44cbddbd-46ab-436e-996c-e830a806a0da'
  and content_type = 'quran'
  and external_id like 'surah:%'
  and status = 'pending';

