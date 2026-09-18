"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/ui/section-header";
import type { Scholar } from "@/features/scholars/types/scholars";

type Props = { scholars: Scholar[] };

const categories = ["الكل", "متقدمين", "معاصرين"] as const;

function getCategory(scholar: Scholar): string {
  const value = scholar.metadata?.category;
  return typeof value === "string" && value.trim() ? value : "غير مصنف";
}

function getField(scholar: Scholar): string {
  const value = scholar.metadata?.field;
  return typeof value === "string" && value.trim() ? value : "علوم شرعية";
}

export default function ScholarsPageView({ scholars }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>("الكل");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredScholars = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return scholars.filter(scholar => {
      const matchesCategory =
        selectedCategory === "الكل" || getCategory(scholar) === selectedCategory;
      const haystack = [
        scholar.nameAr,
        scholar.nameEn,
        scholar.slug,
        scholar.bioAr ?? "",
        scholar.bioEn ?? "",
        getField(scholar),
      ].join(" ").toLowerCase();
      return matchesCategory && (!q || haystack.includes(q));
    });
  }, [scholars, searchQuery, selectedCategory]);

  return (
    <Container className="py-12 space-y-10" dir="rtl">
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-brand-gold">العلماء والدعاة</h1>
        <p className="max-w-2xl mx-auto text-lg leading-8 arabic-muted">
          ملفات تعريفية تعتمد على البيانات المنشورة في قاعدة المحتوى، مع فصل البيانات عن واجهة العرض.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "primary" : "outline"}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        <div className="max-w-md mx-auto">
          <label className="sr-only" htmlFor="scholar-search">البحث عن عالم</label>
          <input
            id="scholar-search"
            type="search"
            placeholder="ابحث عن عالم..."
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            className="w-full rounded-lg border border-brand-gold/20 bg-black/20 p-3 text-brand-cream placeholder:text-brand-cream/40 focus:border-brand-gold focus:outline-none"
            dir="rtl"
          />
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeader
          title={`علماء ${selectedCategory === "الكل" ? "الإسلام" : selectedCategory}`}
          subtitle={`عدد النتائج: ${filteredScholars.length}`}
        />

        {filteredScholars.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="arabic-muted">لا توجد نتائج للبحث.</p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredScholars.map(scholar => (
              <Link key={scholar.id} href={`/scholars/${scholar.slug}`}>
                <Card className="space-y-4 hover:border-brand-gold/50 transition-colors cursor-pointer h-full">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-brand-gold">{scholar.nameAr}</h2>
                      <p className="text-sm text-brand-cream/60">{scholar.nameEn}</p>
                    </div>
                    <Badge variant="outline">{getCategory(scholar)}</Badge>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary">{getField(scholar)}</Badge>
                  </div>

                  <p className="text-sm leading-7 arabic-muted line-clamp-5">
                    {scholar.bioAr || scholar.bioEn || "لا تتوفر سيرة منشورة حالياً."}
                  </p>

                  <div className="border-t border-brand-gold/20 pt-3 text-xs text-brand-cream/50">
                    فتح الملف والمصادر
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Card className="text-center py-6 bg-brand-gold/5">
        <p className="arabic-muted leading-7">
          الصفحة تعرض البيانات المنشورة دون ترتيب تفضيلي بين الشخصيات، مع إحالة القارئ إلى المصادر الأصلية عند توفرها.
        </p>
      </Card>
    </Container>
  );
}
