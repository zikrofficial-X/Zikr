export const dynamic = "force-dynamic";
import Link from "next/link";
import { supabaseServerAnonRequest } from "@/lib/supabase/server";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Castle } from "lucide-react";
import { pageMetadata } from "@/lib/site";
import { FALLBACK_CONQUESTS } from "@/lib/data/conquests-fallback";
import { mergePublishedBySlug } from "@/lib/data/content-merge";

export const metadata = pageMetadata({
  title: "الفتوحات الإسلامية",
  description:
    "استكشف الفتوحات الإسلامية الكبرى وقادتها وتواريخها ومواقعها عبر التاريخ الإسلامي.",
  path: "/conquests",
});

type Conquest = {
  id: string;
  name_ar: string;
  slug: string;
  name_en?: string;
  date_hijri: string | null;
  date_gregorian: string | null;
  location_ar: string | null;
  location_en?: string | null;
  leader_ar: string | null;
  leader_en?: string | null;
  description_ar: string | null;
  description_en?: string | null;
  thumbnail_url: string | null;
  featured_image_url: string | null;
};

export default async function ConquestsPage() {
  let conquests: Conquest[] = [];
  try {
    const data = await supabaseServerAnonRequest<Conquest[]>(
      "/rest/v1/conquests?select=id,slug,name_ar,name_en,date_hijri,date_gregorian,location_ar,location_en,leader_ar,leader_en,description_ar,description_en,thumbnail_url,featured_image_url&published=eq.true&order=order_num.asc"
    );
    conquests = data || [];
  } catch (error) {
    console.error("Failed to fetch conquests:", error);
    conquests = [];
  }

  const displayConquests = mergePublishedBySlug(conquests, FALLBACK_CONQUESTS);

  return (
    <Container className="space-y-8 py-10 text-right">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold text-brand-gold">الفتوحات</h1>
        <p className="max-w-3xl leading-8 arabic-muted">
          الفتوحات الإسلامية التي نشرت الإسلام في العالم.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {displayConquests.map(c => (
          <Link
            key={c.id}
            href={`/conquests/${c.slug}`}
            className="group block"
          >
            <Card className="h-full space-y-3 transition-colors group-hover:border-brand-gold/40">
              <div className="flex items-center gap-3">
                <Castle className="h-7 w-7 text-brand-gold/60 shrink-0" />
                <div>
                  <h2 className="text-lg text-brand-gold">{c.name_ar}</h2>
                  {c.date_hijri && (
                    <p className="text-xs text-emerald-200">{c.date_hijri}</p>
                  )}
                </div>
              </div>
              {c.leader_ar && (
                <p className="text-sm arabic-muted">القائد: {c.leader_ar}</p>
              )}
              {c.location_ar && (
                <p className="text-sm arabic-muted">المكان: {c.location_ar}</p>
              )}
              {c.description_ar && (
                <p className="text-sm leading-7 arabic-muted line-clamp-3">
                  {c.description_ar}
                </p>
              )}
            </Card>
          </Link>
        ))}
        {!displayConquests.length && (
          <Card className="md:col-span-2 lg:col-span-3">
            لا توجد فتوحات حالياً.
          </Card>
        )}
      </section>
    </Container>
  );
}
