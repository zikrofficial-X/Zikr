export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/site";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/ui/section-header";
import { createClient } from "@/lib/supabase/server";
import {
  companionCategoryLabel,
  uniqueCompanionSummaries,
} from "@/lib/utils/companions";
import { COMPANIONS } from "@/lib/data/companions";

export const metadata: Metadata = pageMetadata({
  title: "الصحابة رضي الله عنهم",
  description: "سير أصحاب النبي محمد ﷺ المنشورة بعد مراجعتها في منصة ذِكر.",
  path: "/companions",
});

export const revalidate = 3600;

type Companion = {
  id: string;
  name_ar: string;
  name_en: string | null;
  title_ar: string | null;
  bio_ar: string | null;
  slug: string;
  category: string | null;
};

const STATIC_COMPANION_SLUGS: Record<string, string> = {
  "أبو بكر الصديق": "abu-bakr",
  "عمر بن الخطاب": "umar-ibn-khattab",
  "علي بن أبي طالب": "ali-ibn-abi-talib",
};

const STATIC_COMPANIONS: Companion[] = COMPANIONS.map(companion => ({
  id: `static-${companion.id}`,
  name_ar: companion.name_ar,
  name_en: companion.name_en,
  title_ar: companion.title_ar,
  bio_ar: companion.biography_ar,
  slug: STATIC_COMPANION_SLUGS[companion.name_ar] ?? `static-${companion.id}`,
  category: "الخلفاء الراشدون",
}));

export default async function CompanionsPage() {
  let companions: Companion[] = [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("companions")
      .select("id, name_ar, name_en, title_ar, bio_ar, slug, category")
      .eq("published", true)
      .order("name_ar", { ascending: true });

    if (error) throw error;
    companions = uniqueCompanionSummaries((data ?? []) as Companion[]);
  } catch (error) {
    console.error("[companions] Failed to load published content:", error);
  }

  const displayCompanions = uniqueCompanionSummaries([
    ...companions,
    ...STATIC_COMPANIONS,
  ]);
  const grouped = displayCompanions.reduce<Record<string, Companion[]>>(
    (acc, companion) => {
      const category = companionCategoryLabel(companion.category);
      (acc[category] ??= []).push(companion);
      return acc;
    },
    {}
  );

  return (
    <Container className="py-12 space-y-12">
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-brand-gold text-balance">
          الصحابة رضي الله عنهم
        </h1>
        <p className="max-w-3xl mx-auto text-lg leading-8 arabic-muted text-pretty">
          تراجم ومواقف أصحاب النبي محمد ﷺ مع نبذة المصدر والمراجع التعليمية. هذا
          فهرس معرفي متدرج يُضاف إليه المحتوى على دفعات مراجعة، ولا يدّعي حصر
          جميع من ثبتت لهم الصحبة في سجل واحد.
        </p>
      </section>

      {displayCompanions.length === 0 ? (
        <Card className="p-8 text-center space-y-3">
          <h2 className="text-xl font-bold text-brand-gold">
            لا تتوفر تراجم منشورة حاليًا
          </h2>
          <p className="arabic-muted leading-7">
            ستظهر التراجم هنا بعد إضافتها ومراجعتها من فريق المحتوى.
          </p>
        </Card>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <section key={category} className="space-y-6">
            <SectionHeader
              title={category}
              subtitle={`${items.length} صحابي`}
            />
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {items.map(companion => (
                <Link key={companion.id} href={`/companions/${companion.slug}`}>
                  <Card className="h-full flex flex-col hover:border-brand-gold/50 transition-colors cursor-pointer">
                    <div className="flex items-start gap-4 mb-3">
                      <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-emerald/20 flex items-center justify-center">
                        <span className="text-brand-gold font-bold text-sm font-arabic">
                          {companion.name_ar.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-brand-gold leading-snug">
                          {companion.name_ar}
                        </h2>
                        {companion.title_ar && (
                          <p className="text-xs text-brand-gold/60 mt-0.5">
                            {companion.title_ar}
                          </p>
                        )}
                        {companion.name_en && (
                          <p
                            className="text-xs text-brand-cream/40 mt-0.5"
                            dir="ltr"
                          >
                            {companion.name_en}
                          </p>
                        )}
                      </div>
                    </div>
                    {companion.bio_ar && (
                      <p className="text-sm leading-relaxed arabic-muted line-clamp-3 flex-1">
                        {companion.bio_ar}
                      </p>
                    )}
                    <Badge
                      variant="outline"
                      className="mt-3 self-start text-xs"
                    >
                      {category}
                    </Badge>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}

      <section>
        <Card className="p-8 text-center space-y-4 bg-brand-gold/5 border-brand-gold/20">
          <p className="text-sm leading-7 text-brand-cream/70">
            للبحث المدرسي: افتح ترجمة الصحابي، ثم اقرأ قسم «المراجع والمنهجية»
            وارجع إلى النص الأصلي قبل نقل أي رواية أو تاريخ. التلخيص التعليمي
            ليس بديلًا عن كتب الحديث والسيرة المحققة.
          </p>
          <p
            className="text-2xl font-arabic leading-loose text-brand-cream"
            dir="rtl"
          >
            &quot;وَالسَّابِقُونَ الْأَوَّلُونَ مِنَ الْمُهَاجِرِينَ
            وَالْأَنصَارِ وَالَّذِينَ اتَّبَعُوهُم بِإِحْسَانٍ رَّضِيَ اللَّهُ
            عَنْهُمْ وَرَضُوا عَنْهُ&quot;
          </p>
          <p className="text-brand-gold/70 text-sm">سورة التوبة - الآية 100</p>
        </Card>
      </section>
    </Container>
  );
}
