import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookmarkButton } from '@/features/quran/components/bookmark-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { getAyahFromDb, getSurahMetaFromDb, getTafsirRecordFromDb } from '@/features/quran/services/quran-server';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Share2 } from 'lucide-react';
import { pageMetadata } from '@/lib/site';

export const revalidate = 3600;

interface AyahPageProps {
  params: Promise<{ surah: string; ayah: string }>;
}

export async function generateMetadata({ params }: AyahPageProps): Promise<Metadata> {
  const p = await params;
  const surahId = Number.parseInt(p.surah, 10);
  const ayahId = Number.parseInt(p.ayah, 10);

  const surahMeta = Number.isNaN(surahId) ? null : await getSurahMetaFromDb(surahId, 'ar');
  
  return pageMetadata({
    title: surahMeta ? `سورة ${surahMeta.name} - الآية ${ayahId}` : `الآية ${p.ayah}`,
    description: 'عرض الآية وتفسيرها من داخل صفحة السورة في منصة ذِكرٌ.',
    path: `/quran/${p.surah}/${p.ayah}`,
    // Individual verses are useful detail screens, but the complete surah is
    // the public SEO landing page. Avoid flooding the index with thousands of
    // near-duplicate detail URLs.
    noindex: true,
  });
}

export default async function AyahPage({ params }: AyahPageProps) {
  const p = await params;
  const surahId = Number.parseInt(p.surah, 10);
  const ayahId = Number.parseInt(p.ayah, 10);

  if (Number.isNaN(surahId) || Number.isNaN(ayahId)) return notFound();

  const [dbSurahMeta, dbAyah, dbTafsirRecord] = await Promise.all([
    getSurahMetaFromDb(surahId, 'ar'),
    getAyahFromDb(surahId, ayahId, 'ar'),
    getTafsirRecordFromDb(surahId, ayahId),
  ]);

  const surahMeta = dbSurahMeta;
  const ayah = dbAyah;
  const tafsir = dbTafsirRecord?.tafsir_ar ?? null;
  const tafsirSource = dbTafsirRecord?.source_url ?? null;
  const tafsirAuthor = dbTafsirRecord?.author ?? 'التفسير الميسر';
  const tafsirRetrievedAt = dbTafsirRecord?.retrieved_at ?? null;

  
  if (!surahMeta || !ayah) return notFound();

  return (
    <Container className='space-y-8 py-12 max-w-4xl'>
      <div className="flex justify-between items-center">
        <nav className='arabic-muted text-sm'>
          <Link href='/'>الرئيسية</Link> / <Link href='/quran'>القرآن</Link> /{' '}
          <Link href={`/quran/${surahMeta.number}`}>سورة {surahMeta.name}</Link> / الآية {ayah.numberInSurah}
        </nav>
        <Link href={`/quran/${surahMeta.number}`}>
          <Button variant="ghost" size="sm">
            <ChevronLeft className="ml-2 h-4 w-4" />
            العودة للسورة
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg border-brand-gold/20">
        <CardHeader className="text-center bg-muted/30 border-b">
          <CardTitle className="text-2xl text-brand-gold">
            سورة {surahMeta.name} — الآية {ayah.numberInSurah}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-10">
          <p className='text-4xl leading-loose text-right font-arabic' dir="rtl">
            {ayah.text}
          </p>

          <div className='mt-8 flex items-center justify-between pt-6 border-t'>
            <div className="flex gap-4">
              <BookmarkButton keyRef={`quran:${surahId}:${ayah.numberInSurah}`} />
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="h-4 w-4" />
                مشاركة
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              الجزء {ayah.juz} | الصفحة {ayah.page}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-brand-gold border-r-4 border-brand-gold pr-4">التفسير الميسر</h2>
        <Card>
          <CardContent className="p-8">
            {tafsir ? (
              <>
                <p className="text-xl leading-relaxed text-right arabic-muted" dir="rtl">
                  {tafsir}
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-end gap-x-4 gap-y-2 border-t pt-4 text-xs text-muted-foreground" dir="rtl">
                  <span>المؤلف: {tafsirAuthor}</span>
                  {tafsirRetrievedAt ? <span>تاريخ الجلب: {new Date(tafsirRetrievedAt).toLocaleDateString('ar-EG')}</span> : null}
                  {tafsirSource ? (
                    <a href={tafsirSource} target="_blank" rel="noreferrer" className="text-brand-gold underline underline-offset-4">
                      رابط المصدر
                    </a>
                  ) : null}
                </div>
              </>
            ) : (
              <p className="text-center text-muted-foreground italic">جاري تحميل التفسير...</p>
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
