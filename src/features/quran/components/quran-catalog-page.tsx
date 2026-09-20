import { Suspense } from "react";
import { getAllSurahsFromDb } from "@/features/quran/services/quran-server";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { SurahSearch } from "@/features/quran/components/surah-search";
import { QuranPageHeader } from "@/features/quran/components/quran-page-header";
import { ContinueReadingBanner } from "@/features/quran/components/continue-reading-banner";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export async function QuranCatalogPage({ showHeader = true }: { showHeader?: boolean }) {
  try {
    const surahs = await getAllSurahsFromDb("ar");

    if (!surahs || surahs.length !== 114) {
      return (
        <Container className="space-y-4 py-12">
          <h1 className="mb-6 text-3xl text-brand-gold">القرآن الكريم</h1>
          <Card className="p-4 text-center arabic-muted">
            لا توجد سور متاحة الآن. يرجى المحاولة لاحقًا.
          </Card>
        </Container>
      );
    }

    return (
      <Container className="space-y-8 py-12">
        {showHeader ? <QuranPageHeader /> : null}

        {isSupabaseConfigured() ? (
          <div className="min-h-[72px]">
            <Suspense fallback={<div className="h-[72px]" aria-hidden="true" />}>
              <ContinueReadingBanner />
            </Suspense>
          </div>
        ) : null}

        <SurahSearch
          initialSurahs={surahs.map((surah) => ({
            number: surah.number,
            name: surah.name,
            numberOfAyahs: surah.numberOfAyahs,
            revelationType: surah.revelationType,
            englishName: surah.englishName,
          }))}
        />
      </Container>
    );
  } catch (error) {
    console.error("[quran-catalog] Error loading surahs:", error);
    return (
      <Container className="space-y-4 py-12">
        <h1 className="mb-6 text-3xl text-brand-gold">القرآن الكريم</h1>
        <Card className="p-4 text-center">
          <p className="mb-2 text-red-300">حدث خطأ في تحميل السور</p>
          <p className="text-xs arabic-muted">
            يرجى تحديث الصفحة والمحاولة مرة أخرى
          </p>
        </Card>
      </Container>
    );
  }
}
