import type { Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/ui/section-header";
import { getHadithBooks } from "@/features/hadith/services/hadith";
import { pageMetadata } from "@/lib/site";
import { getRequestLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return pageMetadata({
    title: locale === "en" ? "Prophetic Hadith" : "الأحاديث النبوية",
    description:
      locale === "en"
        ? "Browse Hadith collections and available English translations in ZIKR."
        : "فهرس كتب الحديث النبوي مع تصفح النصوص العربية المتاحة في كل كتاب داخل منصة ذِكر.",
    path: "/hadith",
  });
}

const featuredHadiths = [
  {
    text: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى، فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى دُنْيَا يُصِيبُهَا، أَوْ إِلَى امْرَأَةٍ يَنْكِحُهَا، فَهِجْرَتُهُ إِلَى مَا هَاجَرَ إِلَيْهِ.",
    narrator: "عمر بن الخطاب رضي الله عنه",
    source: "صحيح البخاري",
    reference: "الحديث رقم 1",
  },
  {
    text: "الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ، وَالْمُهَاجِرُ مَنْ هَجَرَ مَا نَهَى اللَّهُ عَنْهُ.",
    narrator: "عبد الله بن عمرو رضي الله عنهما",
    source: "صحيح البخاري",
    reference: "الحديث رقم 10",
  },
  {
    text: "لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ.",
    narrator: "أنس بن مالك رضي الله عنه",
    source: "صحيح البخاري",
    reference: "الحديث رقم 13",
  },
  {
    text: "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ، وَمَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيُكْرِمْ جَارَهُ، وَمَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيُكْرِمْ ضَيْفَهُ.",
    narrator: "أبو هريرة رضي الله عنه",
    source: "صحيح البخاري",
    reference: "الحديث رقم 6018",
  },
];

export default async function HadithPage() {
  const locale = await getRequestLocale();
  const isEnglish = locale === "en";
  const books = await getHadithBooks(locale);

  return (
    <Container className="space-y-12 py-12" dir={isEnglish ? "ltr" : "rtl"}>
      <section className="space-y-4 text-center">
        <h1 className="text-4xl font-bold text-brand-gold">
          {isEnglish ? "Prophetic Hadith" : "الأحاديث النبوية الشريفة"}
        </h1>
        <p className="mx-auto max-w-2xl text-lg leading-8 arabic-muted">
          {isEnglish ? "An index of Hadith collections with direct links to available material for reading and research." : "فهرس كتب السنة مع روابط مباشرة إلى المواد المتاحة للقراءة والبحث."}
        </p>
      </section>

      <section className="space-y-6" aria-labelledby="featured-hadith">
        <SectionHeader
          title={isEnglish ? "Featured selections" : "نماذج مختارة"}
          subtitle={isEnglish ? "Selected Hadith from the Sunnah collections" : "أحاديث مشهورة من كتب السنة"}
        />

        {isEnglish ? (
          <Card className="p-6 text-center text-brand-cream/65">
            English translations for the featured sample cards are not available in the current canonical content source.
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {featuredHadiths.map((hadith) => (
              <Card key={hadith.reference} className="space-y-4">
                <p className="font-arabic text-xl leading-loose text-brand-cream" dir="rtl">
                  &quot;{hadith.text}&quot;
                </p>
                <div className="space-y-1 border-t border-brand-gold/20 pt-3">
                  <p className="text-sm text-brand-gold">
                    الراوي: {hadith.narrator}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{hadith.source}</Badge>
                    <span className="text-xs arabic-muted">
                      {hadith.reference}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-6" aria-labelledby="hadith-books">
        <SectionHeader
title={isEnglish ? "Hadith collections" : "كتب الحديث"}
          subtitle={
            books.length > 0
              ? `${books.length.toLocaleString("en-US")} ${isEnglish ? "collections listed in the index" : "كتب مدرجة في الفهرس"}`
              : (isEnglish ? "The index is currently unavailable" : "الفهرس غير متاح حاليًا")
          }
        />

        {books.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <Card
                key={book.slug ?? book.id}
                className="space-y-3 transition-colors hover:border-brand-gold/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold text-brand-gold">
                      {book.name}
                    </h2>
                    <p className="mt-1 text-xs text-brand-cream/45">
                      {book.slug}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {book.available.toLocaleString(isEnglish ? "en-US" : "ar-EG")}
                  </Badge>
                </div>

                <p className="text-sm leading-7 text-brand-cream/60">
                  {isEnglish ? "The collection count recorded in the catalog source." : "العدد المسجل للكتاب في مصدر الفهرس."}
                </p>

                <Button
                  variant="ghost"
                  href={`/hadith/${book.slug ?? book.id}`}
                  className="w-full"
                >
                  {isEnglish ? "Browse Hadith" : "تصفح الأحاديث"}
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center text-brand-cream/65">
            {isEnglish ? "Unable to load the collection index. Please try again." : "تعذر تحميل فهرس الكتب الآن. حاول فتح الصفحة مرة أخرى."}
          </Card>
        )}
      </section>

      <section className="space-y-4 text-center">
        <Card className="space-y-4 bg-brand-gold/5 py-8">
          <h2 className="text-2xl text-brand-gold">{isEnglish ? "Search the content" : "ابحث في المحتوى"}</h2>
          <p className="mx-auto max-w-xl leading-7 arabic-muted">
            {isEnglish ? "Search Hadith and the rest of the ZIKR library from the unified search page." : "يمكنك البحث في الأحاديث وبقية مكتبة ذِكر من صفحة البحث الموحدة."}
          </p>
          <Button href="/search" variant="secondary">
            {isEnglish ? "Go to search" : "الذهاب للبحث"}
          </Button>
        </Card>
      </section>

      <section className="text-center">
        <p className="text-sm leading-7 text-brand-cream/45">
          {isEnglish
            ? "Texts and data are displayed according to the catalog source. Refer to the original source for study or verification."
            : "النصوص والبيانات تُعرض بحسب المصدر المتاح في الكتالوج، ويُنصح بالرجوع إلى الأصل عند الدراسة أو التحقق من الرواية."}
        </p>
        <Link
          href="/editorial-policy"
          className="mt-2 inline-flex text-sm text-brand-gold hover:text-brand-gold/80"
        >
          {isEnglish ? "Source and review standards" : "معايير المصادر والمراجعة"}
        </Link>
      </section>
    </Container>
  );
}
