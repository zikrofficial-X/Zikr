-- Phase: Tawasheeh and Anasheed Seed Data
-- Description: Populate tawasheeh categories and content with production-ready data

-- Insert Tawasheeh Categories
INSERT INTO tawasheeh_categories (name_ar, name_en, slug, description_ar, description_en, icon, order_num, published)
VALUES
  ('تواشيح دينية', 'Religious Tawasheeh', 'religious', 'التواشيح الدينية الكلاسيكية والحديثة', 'Classical and modern religious tawasheeh', '🎵', 1, true),
  ('مدائح نبوية', 'Prophetic Praise', 'prophetic', 'مدائح وتواشيح في مديح النبي محمد صلى الله عليه وسلم', 'Praises and tawasheeh in honor of Prophet Muhammad', '📿', 2, true),
  ('أناشيد إسلامية', 'Islamic Nasheeds', 'nasheeds', 'أناشيد إسلامية بدون موسيقى', 'Islamic vocal-only nasheeds without instruments', '🎤', 3, true),
  ('تواشيح رمضانية', 'Ramadan Tawasheeh', 'ramadan', 'تواشيح وأناشيد خاصة بشهر رمضان المبارك', 'Special tawasheeh and nasheeds for Ramadan', '🌙', 4, true),
  ('ابتهالات دينية', 'Religious Supplications', 'supplications', 'ابتهالات وأدعية دينية مأثورة', 'Traditional religious supplications and prayers', '🤲', 5, true),
  ('أناشيد الأطفال', 'Children Nasheeds', 'children', 'أناشيد إسلامية مخصصة للأطفال', 'Islamic nasheeds designed for children', '👶', 6, true)
ON CONFLICT (slug) DO NOTHING;

-- Get category IDs for insertion
WITH categories AS (
  SELECT id, slug FROM tawasheeh_categories WHERE slug IN ('religious', 'prophetic', 'nasheeds', 'ramadan', 'supplications', 'children')
)

-- Insert Tawasheeh Content
INSERT INTO tawasheeh (title_ar, title_en, slug, description_ar, description_en, artist_ar, artist_en, category_id, duration, featured, published, metadata)
SELECT
  'يا مؤنسي في وحدتي', 'My Companion in Solitude', 'ya-munsasi-fi-wahdati', 'من أجمل ابتهالات الشيخ نصر الدين طوبار', 'One of the most beautiful supplications by Sheikh Nasr El Din Tobar', 'الشيخ نصر الدين طوبار', 'Sheikh Nasr El Din Tobar', (SELECT id FROM categories WHERE slug = 'supplications'), 1740, true, true, '{"artist_bio": "الشيخ نصر الدين طوبار من أشهر المبتهلين المصريين", "era": "classical", "language": "arabic"}'::jsonb
UNION ALL
SELECT
  'أسماء الله الحسنى', 'The Beautiful Names of Allah', 'asma-allah-al-husna', 'تعظيم أسماء الله وصفاته بصوت الشيخ سيد النقشبندي', 'Glorification of Allah''s Beautiful Names by Sheikh Sayed Al-Naqshbandi', 'الشيخ سيد النقشبندي', 'Sheikh Sayed Al-Naqshbandi', (SELECT id FROM categories WHERE slug = 'religious'), 1620, true, true, '{"artist_bio": "الشيخ سيد النقشبندي أحد أشهر المنشدين الدينيين", "era": "classical", "language": "arabic"}'::jsonb
UNION ALL
SELECT
  'لبيك من سمعي', 'Here I Am With My Hearing', 'labbaik-min-samei', 'ابتهال عميق بصوت الشيخ نصر الدين طوبار', 'Deep supplication by Sheikh Nasr El Din Tobar', 'الشيخ نصر الدين طوبار', 'Sheikh Nasr El Din Tobar', (SELECT id FROM categories WHERE slug = 'supplications'), 1659, false, true, '{"artist_bio": "الشيخ نصر الدين طوبار من أشهر المبتهلين المصريين", "era": "classical", "language": "arabic"}'::jsonb
UNION ALL
SELECT
  'الضحى من نور من', 'The Morning Light', 'al-dhuha-min-nur', 'من روائع الابتهالات الرمضانية للشيخ نصر الدين طوبار', 'From the finest Ramadan supplications by Sheikh Nasr El Din Tobar', 'الشيخ نصر الدين طوبار', 'Sheikh Nasr El Din Tobar', (SELECT id FROM categories WHERE slug = 'ramadan'), 1800, true, true, '{"artist_bio": "الشيخ نصر الدين طوبار من أشهر المبتهلين المصريين", "era": "classical", "language": "arabic", "season": "ramadan"}'::jsonb
UNION ALL
SELECT
  'قصدتك يا إله العرش', 'I Seek You O Lord', 'qasdtuk-ya-ilah', 'تواشيح دينية بصوت الشيخ سيد النقشبندي', 'Religious tawasheeh by Sheikh Sayed Al-Naqshbandi', 'الشيخ سيد النقشبندي', 'Sheikh Sayed Al-Naqshbandi', (SELECT id FROM categories WHERE slug = 'religious'), 1350, false, true, '{"artist_bio": "الشيخ سيد النقشبندي أحد أشهر المنشدين الدينيين", "era": "classical", "language": "arabic"}'::jsonb
UNION ALL
SELECT
  'يا من له ستر على جميل', 'O You Who Conceals All Faults', 'ya-man-lahu-sitr', 'ابتهال مؤثر من الابتهالات القديمة', 'Touching supplication from classical tawasheeh', 'الشيخ نصر الدين طوبار', 'Sheikh Nasr El Din Tobar', (SELECT id FROM categories WHERE slug = 'supplications'), 1560, false, true, '{"artist_bio": "الشيخ نصر الدين طوبار من أشهر المبتهلين المصريين", "era": "classical", "language": "arabic"}'::jsonb
UNION ALL
SELECT
  'عظمت ذنوبي', 'My Sins Have Grown', 'azhamat-dhunubi', 'ابتهال تائب من أجمل الابتهالات الدينية', 'A repentant supplication from the finest religious tawasheeh', 'محمد أبو زيد', 'Mohamed Abu Zaid', (SELECT id FROM categories WHERE slug = 'supplications'), 1437, true, true, '{"artist_bio": "محمد أبو زيد منشد ديني معاصر", "era": "modern", "language": "arabic"}'::jsonb
UNION ALL
SELECT
  'الليل أقبل والوجود سكون', 'The Night Has Come and Silence Reigns', 'al-layl-aqbal', 'تواشيح دينية هادئة وروحانية', 'Calm and spiritual religious tawasheeh', 'محمد أبو زيد', 'Mohamed Abu Zaid', (SELECT id FROM categories WHERE slug = 'religious'), 2151, true, true, '{"artist_bio": "محمد أبو زيد منشد ديني معاصر", "era": "modern", "language": "arabic"}'::jsonb
UNION ALL
SELECT
  'تبارك اسمك', 'Blessed Be Your Name', 'tabaarak-asmuk', 'تسبيح وتعظيم لله تعالى', 'Glorification and exaltation of Allah', 'محمد أبو زيد', 'Mohamed Abu Zaid', (SELECT id FROM categories WHERE slug = 'religious'), 600, false, true, '{"artist_bio": "محمد أبو زيد منشد ديني معاصر", "era": "modern", "language": "arabic"}'::jsonb
UNION ALL
SELECT
  'يا صاحب الهم', 'O You With Sorrows', 'ya-sahib-al-hamm', 'أنشودة تواسي أصحاب الهموم والأحزان', 'A nasheed that comforts those with worries and sorrows', 'فرقة الأطفال الإسلامية', 'Islamic Children Group', (SELECT id FROM categories WHERE slug = 'children'), 1200, true, true, '{"artist_bio": "فرقة متخصصة في أناشيد الأطفال الإسلامية", "era": "modern", "language": "arabic", "audience": "children"}'::jsonb
ON CONFLICT (slug) DO NOTHING;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS tawasheeh_artist_idx ON tawasheeh(artist_ar, artist_en);
CREATE INDEX IF NOT EXISTS tawasheeh_featured_published_idx ON tawasheeh(featured, published);
CREATE INDEX IF NOT EXISTS tawasheeh_categories_order_idx ON tawasheeh_categories(order_num, published);
