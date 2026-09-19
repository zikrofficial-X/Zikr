export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/ui/section-header';
import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'المفضلة',
  description: 'قائمة المحتوى المفضل لديك في منصة ZIKR.',
  path: '/favorites',
  noindex: true,
});

type Favorite = {
  id: string;
  item_type: string;
  item_ref: string;
  created_at: string;
};

export default async function FavoritesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login?next=/favorites');

  const { data: favorites } = await supabase
    .from('favorites')
    .select('id, item_type, item_ref, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const favList: Favorite[] = favorites ?? [];

  const quranFavorites = favList.filter((f) => f.item_type === 'quran');
  const hadithFavorites = favList.filter((f) => f.item_type === 'hadith');
  const storyFavorites = favList.filter((f) => f.item_type === 'story');
  const otherFavorites = favList.filter(
    (f) => !['quran', 'hadith', 'story'].includes(f.item_type),
  );

  const typeLabels: Record<string, string> = {
    quran: 'القرآن الكريم',
    hadith: 'الحديث الشريف',
    story: 'القصص',
    scholar: 'العلماء',
    dua: 'الأدعية',
    article: 'المقالات',
    video: 'الفيديوهات',
  };

  const getLink = (type: string, ref: string) => {
    if (type === 'quran') {
      const clean = ref.replace('quran:', '');
      const [surah, ayah] = clean.split(':');
      return ayah ? `/quran/${surah}/${ayah}` : `/quran/${surah}`;
    }
    if (type === 'story') return `/stories/${ref.replace('story:', '')}`;
    if (type === 'hadith') return `/hadith`;
    if (type === 'article') return `/articles/${ref.replace('article:', '')}`;
    return '#';
  };

  const formatRef = (type: string, ref: string) => {
    if (type === 'quran') {
      const clean = ref.replace('quran:', '');
      const [surah, ayah] = clean.split(':');
      return ayah ? `سورة ${surah} — آية ${ayah}` : `سورة ${surah}`;
    }
    return ref.replace(/^\w+:/, '');
  };

  return (
    <Container className="py-12 space-y-10">
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-brand-gold">المفضلة</h1>
        <p className="max-w-2xl mx-auto text-lg leading-8 arabic-muted">
          جميع العناصر التي قمت بحفظها من القرآن والأحاديث والقصص
        </p>
        {favList.length > 0 && (
          <Badge variant="outline" className="text-lg px-4 py-2">
            {favList.length} عنصر محفوظ
          </Badge>
        )}
      </section>

      {favList.length === 0 ? (
        <Card className="text-center py-12 space-y-4">
          <p className="text-5xl text-brand-gold/30" aria-hidden>&#9733;</p>
          <h2 className="text-2xl text-brand-gold">لا توجد عناصر محفوظة بعد</h2>
          <p className="arabic-muted max-w-md mx-auto leading-7">
            أضف الآيات والأحاديث والقصص إلى مفضلتك أثناء التصفح للرجوع إليها لاحقاً.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Button href="/quran">تصفح القرآن</Button>
            <Button href="/hadith" variant="secondary">تصفح الأحاديث</Button>
            <Button href="/stories" variant="ghost">تصفح القصص</Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-10">
          {quranFavorites.length > 0 && (
            <section className="space-y-4">
              <SectionHeader title="آيات قرآنية" subtitle={`${quranFavorites.length} آية`} />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {quranFavorites.map((fav) => (
                  <Link href={getLink(fav.item_type, fav.item_ref)} key={fav.id}>
                    <Card className="hover:border-brand-gold/50 transition-colors space-y-2">
                      <Badge variant="secondary">القرآن</Badge>
                      <p className="text-brand-cream text-sm">{formatRef(fav.item_type, fav.item_ref)}</p>
                      <p className="text-xs arabic-muted">{new Date(fav.created_at).toLocaleDateString('ar-EG')}</p>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {hadithFavorites.length > 0 && (
            <section className="space-y-4">
              <SectionHeader title="أحاديث" subtitle={`${hadithFavorites.length} حديث`} />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {hadithFavorites.map((fav) => (
                  <Link href={getLink(fav.item_type, fav.item_ref)} key={fav.id}>
                    <Card className="hover:border-brand-gold/50 transition-colors space-y-2">
                      <Badge variant="secondary">الحديث</Badge>
                      <p className="text-brand-cream text-sm">{formatRef(fav.item_type, fav.item_ref)}</p>
                      <p className="text-xs arabic-muted">{new Date(fav.created_at).toLocaleDateString('ar-EG')}</p>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {storyFavorites.length > 0 && (
            <section className="space-y-4">
              <SectionHeader title="قصص" subtitle={`${storyFavorites.length} قصة`} />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {storyFavorites.map((fav) => (
                  <Link href={getLink(fav.item_type, fav.item_ref)} key={fav.id}>
                    <Card className="hover:border-brand-gold/50 transition-colors space-y-2">
                      <Badge variant="secondary">القصص</Badge>
                      <p className="text-brand-cream text-sm">{formatRef(fav.item_type, fav.item_ref)}</p>
                      <p className="text-xs arabic-muted">{new Date(fav.created_at).toLocaleDateString('ar-EG')}</p>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {otherFavorites.length > 0 && (
            <section className="space-y-4">
              <SectionHeader title="عناصر أخرى" subtitle={`${otherFavorites.length} عنصر`} />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {otherFavorites.map((fav) => (
                  <Link href={getLink(fav.item_type, fav.item_ref)} key={fav.id}>
                    <Card className="hover:border-brand-gold/50 transition-colors space-y-2">
                      <Badge variant="outline">{typeLabels[fav.item_type] ?? fav.item_type}</Badge>
                      <p className="text-brand-cream text-sm">{formatRef(fav.item_type, fav.item_ref)}</p>
                      <p className="text-xs arabic-muted">{new Date(fav.created_at).toLocaleDateString('ar-EG')}</p>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </Container>
  );
}
