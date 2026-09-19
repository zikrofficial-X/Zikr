import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookmarkButton } from "@/features/quran/components/bookmark-button";
import { MushafBookmark } from "@/features/quran/components/mushaf-bookmark";
import { QuranAudioPlayer } from "@/features/quran/components/audio-player";
import { MarkSurahRead } from "@/features/quran/components/mark-surah-read";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { getSurahById } from "@/features/quran/services/quran";
import {
  getSurahMetaFromDb,
  getSurahFromDb,
} from "@/features/quran/services/quran-server";
import { getFavoritedRefs } from "@/app/favorites/actions";
import { getReadingProgress } from "@/features/quran/actions";
import { Badge } from "@/components/ui/badge";
import { pageMetadata } from "@/lib/site";

export const revalidate = 3600; // Surah page cache

export async function generateMetadata({
  params,
}: {
  params: Promise<{ surah: string }>;
}): Promise<Metadata> {
  const p = await params;
  const id = Number.parseInt(p.surah, 10);
  if (Number.isNaN(id)) return { title: "سورة", description: "قراءة واستماع" };

  // Metadata must not load the complete ayah list. This keeps SEO requests cheap
  // and avoids a duplicate, timeout-prone Quran query before page rendering.
  let surahMeta = await getSurahMetaFromDb(id, "ar");

  // Fallback to API if DB metadata is unavailable.
  if (!surahMeta) {
    surahMeta = await getSurahById(id, "ar").then(
      apiResult => apiResult?.surah ?? null
    );
  }

  return pageMetadata({
    title: surahMeta ? `سورة ${surahMeta.name}` : `سورة ${id}`,
    description: "قراءة وتفسير واستماع",
    path: `/quran/${id}`,
    noindex: false,
  });
}

export default async function SurahPage({
  params,
}: {
  params: Promise<{ surah: string }>;
}) {
  const p = await params;
  const id = Number.parseInt(p.surah, 10);
  if (Number.isNaN(id)) return notFound();

  // DB-First Strategy
  let result = await getSurahFromDb(id, "ar");

  // Fallback to API if DB is empty/fails
  if (!result) {
    console.info(
      `[surah-page] DB unavailable for surah ${id}, falling back to external API`
    );
    result = await getSurahById(id, "ar");
  }

  if (!result) return notFound();

  // Batch-fetch all favorite states + reading progress in parallel
  const allRefs = result.ayahs.map(
    a => `quran:${result!.surah.number}:${a.numberInSurah}`
  );
  const [favoritedRefs, readingProgress] = await Promise.all([
    getFavoritedRefs(allRefs, "quran"),
    getReadingProgress(result.surah.number),
  ]);

  return (
    <Container className="space-y-6 py-12">
      <nav className="arabic-muted text-sm">
        <Link href="/">الرئيسية</Link> / <Link href="/quran">القرآن</Link> /{" "}
        {result.surah.name}
      </nav>

      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-brand-gold">
          سورة {result.surah.name}
        </h1>
        <Badge variant="outline" className="text-lg px-4 py-1">
          {result.surah.numberOfAyahs} آية
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <MarkSurahRead
          surahId={result.surah.number}
          lastAyah={result.surah.numberOfAyahs}
        />
        <Link href="/wird" className="text-sm text-brand-gold hover:underline">
          وردي اليومي وختمتي
        </Link>
      </div>

      <QuranAudioPlayer surahId={result.surah.number} />

      {result.ayahs.length === 0 ? (
        <Card className="p-8 text-center arabic-muted">
          لا توجد آيات متاحة لهذه السورة حاليًا.
        </Card>
      ) : (
        <div className="space-y-6">
          {result.ayahs.map(ayah => (
            <Card
              key={ayah.numberInSurah}
              id={`ayah-${ayah.numberInSurah}`}
              className="p-6 hover:shadow-md transition-shadow scroll-mt-24"
            >
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 text-right">
                    <p className="text-3xl leading-loose font-arabic" dir="rtl">
                      {ayah.text}
                      <span className="inline-flex items-center justify-center w-10 h-10 mr-4 rounded-full border-2 border-brand-gold text-sm font-bold text-brand-gold">
                        {ayah.numberInSurah}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-muted flex-wrap">
                  <BookmarkButton
                    keyRef={`quran:${result.surah.number}:${ayah.numberInSurah}`}
                    initialSaved={favoritedRefs.has(
                      `quran:${result.surah.number}:${ayah.numberInSurah}`
                    )}
                  />
                  <MushafBookmark
                    surahId={result.surah.number}
                    ayahNumber={ayah.numberInSurah}
                    surahName={result.surah.name}
                    isCurrentBookmark={
                      readingProgress?.ayah_number === ayah.numberInSurah
                    }
                  />
                  <Link
                    className="text-sm text-brand-gold hover:underline"
                    href={`/quran/${result.surah.number}/${ayah.numberInSurah}`}
                  >
                    التفسير والتفاصيل
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}
