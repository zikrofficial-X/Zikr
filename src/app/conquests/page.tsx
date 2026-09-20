import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Castle } from "lucide-react";
import { pageMetadata } from "@/lib/site";
import { getConquests } from "@/features/conquests/services/conquests";

export const metadata: Metadata = pageMetadata({
  title: "الفتوحات الإسلامية",
  description:
    "فهرس الفتوحات والحملات التاريخية في مكتبة ذِكر مع التواريخ والمواقع والقادة والمحتوى التعليمي المتاح.",
  path: "/conquests",
});

export const revalidate = 3600;

export default async function ConquestsPage() {
  const conquests = await getConquests();

  return (
    <Container className="space-y-8 py-10 text-right" dir="rtl">
      <section className="space-y-3">
        <p className="text-sm text-brand-gold/60">المكتبة التاريخية</p>
        <h1 className="text-3xl font-bold text-brand-gold">الفتوحات الإسلامية</h1>
        <p className="max-w-3xl leading-8 arabic-muted">
          سجلات تاريخية مرتبة مع عرض مختصر للسياق والتاريخ والقائد والموقع،
          دون اختزال الأحداث المعقدة في سرد واحد غير موثق.
        </p>
        <p className="text-sm text-brand-cream/45">
          {conquests.length.toLocaleString("ar-EG")} سجلًا متاحًا في الكتالوج.
        </p>
      </section>

      {conquests.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {conquests.map((conquest) => (
            <Link
              key={conquest.id}
              href={"/conquests/" + conquest.slug}
              className="group block"
            >
              <Card className="h-full space-y-3 transition-colors group-hover:border-brand-gold/40">
                <div className="flex items-center gap-3">
                  <Castle className="h-7 w-7 shrink-0 text-brand-gold/60" />
                  <div className="min-w-0">
                    <h2 className="text-lg text-brand-gold">
                      {conquest.name_ar}
                    </h2>
                    {conquest.date_hijri && (
                      <p className="text-xs text-emerald-200">
                        {conquest.date_hijri}
                      </p>
                    )}
                  </div>
                </div>

                {conquest.leader_ar && (
                  <p className="text-sm arabic-muted">
                    القائد: {conquest.leader_ar}
                  </p>
                )}

                {conquest.location_ar && (
                  <p className="text-sm arabic-muted">
                    المكان: {conquest.location_ar}
                  </p>
                )}

                {conquest.description_ar && (
                  <p className="line-clamp-3 text-sm leading-7 arabic-muted">
                    {conquest.description_ar}
                  </p>
                )}

                <div className="pt-1 text-xs text-brand-gold/55 transition-colors group-hover:text-brand-gold/90">
                  اقرأ السجل ←
                </div>
              </Card>
            </Link>
          ))}
        </section>
      ) : (
        <Card className="p-8 text-center">
          لا توجد سجلات منشورة حاليًا.
        </Card>
      )}
    </Container>
  );
}
