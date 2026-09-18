import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAllScholars, getScholarBySlug } from "@/lib/services/scholars";
import { siteConfig } from "@/lib/site";
import { ContentReferences, getContentReferences } from "@/components/content/content-references";

type ScholarPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ScholarPageProps): Promise<Metadata> {
  const { slug } = await params;
  const scholar = await getScholarBySlug(slug);

  if (!scholar) {
    return { title: "العالم غير موجود" };
  }

  const description =
    scholar.bioAr ??
    scholar.bioEn ??
    `صفحة ${scholar.nameAr} ضمن قسم العلماء في ${siteConfig.shortName}.`;

  return {
    title: scholar.nameAr,
    description,
    alternates: { canonical: `/scholars/${scholar.slug}` },
    openGraph: {
      title: scholar.nameAr,
      description,
      type: "profile",
      url: `${siteConfig.url}/scholars/${scholar.slug}`,
      images: scholar.thumbnailUrl
        ? [{ url: scholar.thumbnailUrl }]
        : undefined,
    },
  };
}

export async function generateStaticParams() {
  const scholars = await getAllScholars();
  return scholars.map(scholar => ({ slug: scholar.slug }));
}

export default async function ScholarDetailPage({ params }: ScholarPageProps) {
  const { slug } = await params;
  const scholar = await getScholarBySlug(slug);

  if (!scholar) {
    notFound();
  }

  const references = getContentReferences(scholar.metadata);

  return (
    <Container className="max-w-4xl space-y-8 py-12">
      <Button href="/scholars" variant="ghost">
        العودة إلى العلماء
      </Button>

      <Card className="space-y-6">
        <div className="space-y-3 text-center">
          <Badge variant="outline">العلماء والدعاة</Badge>
          <h1 className="text-4xl font-bold text-brand-gold">
            {scholar.nameAr}
          </h1>
          <p className="text-lg text-brand-cream/70">{scholar.nameEn}</p>
        </div>

        {scholar.bioAr || scholar.bioEn ? (
          <div className="space-y-4 leading-8 arabic-muted">
            {scholar.bioAr && <p>{scholar.bioAr}</p>}
            {scholar.bioEn && (
              <p dir="ltr" className="text-left">
                {scholar.bioEn}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3 text-center leading-8 arabic-muted">
            <p>لا تتوفر في قاعدة البيانات الحالية سيرة موثقة منشورة لهذا العالم.</p>
            <p className="text-sm text-brand-cream/60">
              لن ننسب إليه أقوالًا أو مؤلفات غير موثقة. تُعرض هنا فقط البيانات والروابط الرسمية المتاحة.
            </p>
          </div>
        )}

        <ContentReferences references={references} />

        {(scholar.websiteUrl || scholar.youtubeUrl) && (
          <div className="flex flex-wrap justify-center gap-3 border-t border-brand-gold/20 pt-6">
            {scholar.websiteUrl && (
              <Button
                href={scholar.websiteUrl}
                variant="outline"
                target="_blank"
                rel="noreferrer"
              >
                الموقع الرسمي
              </Button>
            )}
            {scholar.youtubeUrl && (
              <Button
                href={scholar.youtubeUrl}
                variant="outline"
                target="_blank"
                rel="noreferrer"
              >
                قناة يوتيوب
              </Button>
            )}
          </div>
        )}
      </Card>
    </Container>
  );
}
