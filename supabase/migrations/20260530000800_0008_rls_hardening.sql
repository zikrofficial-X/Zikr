-- Enable RLS on all tables. Guarded with IF EXISTS: several of these legacy
-- tables (users, payments, subscriptions, tasks, user_behavior, quran_audio,
-- generated_research, research_requests) were dropped in 0002_noisy_nocturne
-- and only some are recreated later (quran_audio returns in 0018).
ALTER TABLE IF EXISTS public.generated_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.quran_audio ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.research_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_behavior ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies for Profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_select_own' AND tablename = 'profiles') THEN
        CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_update_own' AND tablename = 'profiles') THEN
        CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;

-- Basic RLS Policies for Favorites
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'favorites_owner_all' AND tablename = 'favorites') THEN
        CREATE POLICY "favorites_owner_all" ON public.favorites FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Basic RLS Policies for Reading Progress
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'reading_progress_owner_all' AND tablename = 'reading_progress') THEN
        CREATE POLICY "reading_progress_owner_all" ON public.reading_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Basic RLS Policies for Reminders
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'reminders_owner_all' AND tablename = 'reminders') THEN
        CREATE POLICY "reminders_owner_all" ON public.reminders FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Public Read Policies for Content
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
END $$;
