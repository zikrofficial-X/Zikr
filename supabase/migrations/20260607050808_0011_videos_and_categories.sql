
-- NOTE: video_categories and videos are also created by
-- 0010_missing_content_modules (which runs first). All statements here are
-- guarded so this migration is a safe no-op/seed on top of 0010.
CREATE TABLE IF NOT EXISTS video_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon text,
  published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  youtube_id text,
  thumbnail_url text,
  category_id uuid REFERENCES video_categories(id),
  duration integer,
  views integer DEFAULT 0,
  published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE video_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_video_categories" ON video_categories;
CREATE POLICY "select_video_categories" ON video_categories FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_video_categories" ON video_categories;
CREATE POLICY "insert_video_categories" ON video_categories FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_video_categories" ON video_categories;
CREATE POLICY "update_video_categories" ON video_categories FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "delete_video_categories" ON video_categories;
CREATE POLICY "delete_video_categories" ON video_categories FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "select_videos" ON videos;
CREATE POLICY "select_videos" ON videos FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_videos" ON videos;
CREATE POLICY "insert_videos" ON videos FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_videos" ON videos;
CREATE POLICY "update_videos" ON videos FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "delete_videos" ON videos;
CREATE POLICY "delete_videos" ON videos FOR DELETE TO authenticated USING (true);

-- Also add public read access for anon users
DROP POLICY IF EXISTS "select_video_categories_anon" ON video_categories;
CREATE POLICY "select_video_categories_anon" ON video_categories FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "select_videos_anon" ON videos;
CREATE POLICY "select_videos_anon" ON videos FOR SELECT TO anon USING (true);

-- Seed video categories
INSERT INTO video_categories (name_ar, name_en, slug, icon, published) VALUES
('تفسير القرآن', 'Quran Tafsir', 'quran-tafsir', '📖', true),
('محاضرات إسلامية', 'Islamic Lectures', 'islamic-lectures', '🎤', true),
('قصص الأنبياء', 'Prophets Stories', 'prophets-stories', '🕌', true),
('أدعية وأذكار', 'Duas & Adhkar', 'duas-adhkar', '🤲', true)
ON CONFLICT (slug) DO NOTHING;

-- Seed sample videos
INSERT INTO videos (title, slug, description, youtube_id, category_id, duration, views, published) VALUES
('تفسير سورة الفاتحة - الشعراوي', 'tafsir-al-fatihah-shaarawi', 'تفسير خواطر الشعراوي لسورة الفاتحة الكريمة', '8DdBmNP4PNA', (SELECT id FROM video_categories WHERE slug='quran-tafsir'), 1800, 1250, true),
('تفسير سورة البقرة - ابن عثيمين', 'tafsir-al-baqarah-uthaymin', 'شرح الشيخ ابن عثيمين لسورة البقرة', 'aJ2fVM8fcGU', (SELECT id FROM video_categories WHERE slug='quran-tafsir'), 3600, 890, true),
('تفسير سورة يس - الشعراوي', 'tafsir-ya-sin-shaarawi', 'خواطر الشعراوي في تفسير سورة يس', 'KxW0jQY3F3Q', (SELECT id FROM video_categories WHERE slug='quran-tafsir'), 2400, 2100, true),
('قصة موسى عليه السلام كاملة', 'story-of-musa-full', 'القصة الكاملة لنبي الله موسى عليه السلام من الولادة إلى مناجاة الطور', 'HqWQ6kzN4C8', (SELECT id FROM video_categories WHERE slug='prophets-stories'), 2700, 3400, true),
('قصة يوسف عليه السلام', 'story-of-yusuf-full', 'أحسن القصص: قصة نبي الله يوسف عليه السلام من الجب إلى الملك', 'WpLqF4S8g2E', (SELECT id FROM video_categories WHERE slug='prophets-stories'), 3200, 4100, true),
('أدعية من القرآن الكريم', 'quran-duas-collection', 'مجموعة من أدعية القرآن الكريم المستجابة', '5gG3QkN7dR4', (SELECT id FROM video_categories WHERE slug='duas-adhkar'), 600, 1800, true),
('أذكار الصباح والمساء', 'morning-evening-adhkar', 'أذكار الصباح والمساء من السنة النبوية الصحيحة', 'T3Yv4zKMp9g', (SELECT id FROM video_categories WHERE slug='duas-adhkar'), 900, 2500, true),
('محاضرة عن التوكل على الله', 'lecture-tawakkul', 'محاضرة عن التوكل على الله وأثره في حياة المسلم', '9nF2xq8dK1E', (SELECT id FROM video_categories WHERE slug='islamic-lectures'), 1500, 750, true),
('أهمية الصلاة في حياة المسلم', 'importance-of-prayer', 'محاضرة عن أهمية الصلاة وأثرها في حياة المسلم اليومي', 'v4Dq8zNm7yA', (SELECT id FROM video_categories WHERE slug='islamic-lectures'), 1200, 980, true)
ON CONFLICT (slug) DO NOTHING;
