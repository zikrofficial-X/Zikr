-- Comprehensive RLS Hardening for All Tables

-- 1. Content Tables (Public Read, Admin Write)
ALTER TABLE IF EXISTS public.quran_surahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.quran_ayahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hadith_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hadiths ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.scholars ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.quran_tafsir ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hadith_explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.quran_reciters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.quran_audio ENABLE ROW LEVEL SECURITY;

-- 2. User-Specific Tables (Owner Only)
ALTER TABLE IF EXISTS public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.saved_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.story_progress ENABLE ROW LEVEL SECURITY;

-- 3. Admin-Only Tables
ALTER TABLE IF EXISTS public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.memorization_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pinned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.episodes ENABLE ROW LEVEL SECURITY;

-- 4. Subscription/Payment Tables (Admin Only)
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_behavior ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.generated_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.research_requests ENABLE ROW LEVEL SECURITY;

-- Content Tables - Public Read
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_quran_surahs' AND tablename = 'quran_surahs') THEN
        CREATE POLICY "public_read_quran_surahs" ON public.quran_surahs FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_quran_ayahs' AND tablename = 'quran_ayahs') THEN
        CREATE POLICY "public_read_quran_ayahs" ON public.quran_ayahs FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_hadith_books' AND tablename = 'hadith_books') THEN
        CREATE POLICY "public_read_hadith_books" ON public.hadith_books FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_hadiths' AND tablename = 'hadiths') THEN
        CREATE POLICY "public_read_hadiths" ON public.hadiths FOR SELECT USING (published = true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_scholars' AND tablename = 'scholars') THEN
        CREATE POLICY "public_read_scholars" ON public.scholars FOR SELECT USING (published = true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_stories' AND tablename = 'stories') THEN
        CREATE POLICY "public_read_stories" ON public.stories FOR SELECT USING (published = true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_tafsir' AND tablename = 'quran_tafsir') THEN
        CREATE POLICY "public_read_tafsir" ON public.quran_tafsir FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_hadith_explanations' AND tablename = 'hadith_explanations') THEN
        CREATE POLICY "public_read_hadith_explanations" ON public.hadith_explanations FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_reciters' AND tablename = 'quran_reciters') THEN
        CREATE POLICY "public_read_reciters" ON public.quran_reciters FOR SELECT USING (true);
    END IF;
    -- quran_audio may not exist yet (dropped in 0002, recreated in 0018)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='quran_audio')
       AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_audio' AND tablename = 'quran_audio') THEN
        CREATE POLICY "public_read_audio" ON public.quran_audio FOR SELECT USING (true);
    END IF;
END $$;

-- Admin Write Policies for Content
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_write_quran_surahs' AND tablename = 'quran_surahs') THEN
        CREATE POLICY "admin_write_quran_surahs" ON public.quran_surahs FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_write_quran_ayahs' AND tablename = 'quran_ayahs') THEN
        CREATE POLICY "admin_write_quran_ayahs" ON public.quran_ayahs FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;
END $$;

-- User-Specific Tables (guarded: saved_stories/story_progress were dropped in
-- 0002 and may not exist on all environments)
DO $$ 
BEGIN
    IF to_regclass('public.saved_stories') IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'saved_stories_owner_all' AND tablename = 'saved_stories') THEN
        CREATE POLICY "saved_stories_owner_all" ON public.saved_stories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
    IF to_regclass('public.story_progress') IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'story_progress_owner_all' AND tablename = 'story_progress') THEN
        CREATE POLICY "story_progress_owner_all" ON public.story_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Admin-Only Tables (guarded: each table may not exist on all environments)
DO $$ 
BEGIN
    IF to_regclass('public.site_settings') IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_only_site_settings' AND tablename = 'site_settings') THEN
        CREATE POLICY "admin_only_site_settings" ON public.site_settings FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;
    IF to_regclass('public.competitions') IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_only_competitions' AND tablename = 'competitions') THEN
        CREATE POLICY "admin_only_competitions" ON public.competitions FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;
    IF to_regclass('public.memorization_plans') IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_only_memorization_plans' AND tablename = 'memorization_plans') THEN
        CREATE POLICY "admin_only_memorization_plans" ON public.memorization_plans FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;
    IF to_regclass('public.pinned_messages') IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_only_pinned_messages' AND tablename = 'pinned_messages') THEN
        CREATE POLICY "admin_only_pinned_messages" ON public.pinned_messages FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;
END $$;

-- Create indexes for performance. Each is wrapped so that a missing table or
-- column on a given environment skips just that index instead of aborting the
-- migration (e.g. quran_surahs has no "number" column in the canonical chain).
DO $$
DECLARE
    stmt text;
BEGIN
    FOREACH stmt IN ARRAY ARRAY[
        'CREATE INDEX IF NOT EXISTS idx_quran_surahs_number ON public.quran_surahs(number)',
        'CREATE INDEX IF NOT EXISTS idx_quran_ayahs_surah ON public.quran_ayahs(surah_id)',
        'CREATE INDEX IF NOT EXISTS idx_hadiths_book ON public.hadiths(book_id)',
        'CREATE INDEX IF NOT EXISTS idx_hadiths_published ON public.hadiths(published)',
        'CREATE INDEX IF NOT EXISTS idx_scholars_published ON public.scholars(published)',
        'CREATE INDEX IF NOT EXISTS idx_stories_published ON public.stories(published)',
        'CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_reading_progress_user ON public.reading_progress(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_reminders_user ON public.reminders(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_saved_stories_user ON public.saved_stories(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_story_progress_user ON public.story_progress(user_id)'
    ]
    LOOP
        BEGIN
            EXECUTE stmt;
        EXCEPTION WHEN undefined_table OR undefined_column THEN
            RAISE NOTICE 'index skipped (missing table/column): %', stmt;
        END;
    END LOOP;
END $$;
