-- Seed non-secret public settings required by the homepage, root metadata and social cards.
-- Preserve existing administrator values; this migration is safe to re-run.
INSERT INTO public.site_settings (key, value, updated_at)
VALUES
  (
    'homepage',
    jsonb_build_object(
      'title', 'ذِكرٌ',
      'body', 'منصة إسلامية مرتبة للقراءة والذكر والتعلّم والعمل.',
      'showQuran', true,
      'showHadith', true,
      'showPrayerTimes', true
    ),
    now()
  ),
  (
    'seo',
    jsonb_build_object(
      'title', 'ZIKR | ذِكرٌ',
      'description', 'منصة إسلامية شاملة للقرآن الكريم والأحاديث النبوية والأذكار ومواقيت الصلاة والتعلّم.',
      'keywords', jsonb_build_array('القرآن الكريم', 'الأذكار', 'الحديث النبوي', 'مواقيت الصلاة', 'ذِكر')
    ),
    now()
  ),
  (
    'social',
    jsonb_build_object(
      'ogTitle', 'ZIKR | ذِكرٌ',
      'ogDescription', 'منصة إسلامية مرتبة للقراءة والذكر والتعلّم والعمل.',
      'ogImageUrl', '/branding/og-image.png',
      'facebookPageUrl', 'https://www.facebook.com/zikrmediaofficial1',
      'youtubeChannelUrl', 'https://www.youtube.com/@zikrmediaofficial',
      'instagramUrl', '',
      'xUrl', ''
    ),
    now()
  )
ON CONFLICT (key) DO NOTHING;
