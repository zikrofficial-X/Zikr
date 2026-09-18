import { getAllSurahs } from "@/lib/services/quran";
import { getAllSurahsFromDb } from "@/lib/services/quran-server";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { SurahSearch } from "@/components/quran/surah-search";
import { Suspense } from "react";
import { SurahSkeleton } from "@/components/quran/surah-skeleton";
import { pageMetadata } from "@/lib/site";
import { QuranPageHeader } from "@/components/quran/quran-page-header";
import { ContinueReadingBanner } from "@/components/quran/continue-reading-banner";

// إجبار الصفحة على الرندرة الديناميكية لمنع أخطاء الـ Build مع الـ no-store fetch
export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "القرآن الكريم",
  description:
    "اقرأ واستمع إلى القرآن الكريم كاملاً: 114 سورة مع التفسير والتلاوات الصوتية بأصوات كبار القراء.",
  path: "/quran",
});

async function QuranContent() {
  try {
    // DB-First Strategy
    let surahs = await getAllSurahsFromDb("ar");

    // Fallback to API if DB is empty/fails
    if (!surahs || surahs.length === 0) {
      console.info("[quran-page] DB unavailable, falling back to external API");
      surahs = await getAllSurahs("ar");
    }

    if (!surahs || surahs.length === 0) {
      return (
        <Container className="space-y-4 py-12">
          <h1 className="text-3xl text-brand-gold mb-6">القرآن الكريم</h1>
          <Card className="p-4 arabic-muted text-center">
            لا توجد سور متاحة الآن. يرجى المحاولة لاحقًا.
          </Card>
        </Container>
      );
    }

    return (
      <Container className="space-y-8 py-12">
        <QuranPageHeader />

        {/* Reserve the optional banner slot so its async resolution cannot shift the list. */}
        <div className="min-h-[72px]">
          <Suspense fallback={<div className="h-[72px]" aria-hidden="true" />}>
            <ContinueReadingBanner />
          </Suspense>
        </div>

        <SurahSearch
          initialSurahs={surahs.map(s => ({
            number: s.number,
            name: s.name,
            numberOfAyahs: s.numberOfAyahs,
            revelationType: s.revelationType,
            englishName: s.englishName,
          }))}
        />
      </Container>
    );
  } catch (error) {
    console.error("[quran-page] Error loading surahs:", error);
    return (
      <Container className="space-y-4 py-12">
        <h1 className="text-3xl text-brand-gold mb-6">القرآن الكريم</h1>
        <Card className="p-4 text-center">
          <p className="text-red-300 mb-2">حدث خطأ في تحميل السور</p>
          <p className="text-xs arabic-muted">
            يرجى تحديث الصفحة والمحاولة مرة أخرى
          </p>
        </Card>
      </Container>
    );
  }
}

export default function QuranPage() {
  return (
    <Suspense fallback={<SurahSkeleton />}>
      <QuranContent />
    </Suspense>
  );
}
