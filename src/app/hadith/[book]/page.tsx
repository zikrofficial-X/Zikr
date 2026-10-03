import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { getHadithBook } from '@/features/hadith/services/hadith';
import { Badge } from '@/components/ui/badge';

import { pageMetadata } from '@/lib/site';
import type { Metadata } from 'next';

interface BookPageProps {
  params: Promise<{ book: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  const { book: slug } = await params;
  const locale = await getRequestLocale();
  const isEnglish = locale === "en";
  const result = await getHadithBook(slug, 1, 1, locale).catch(() => null);
  const name = result?.name ?? 'كتاب الحديث';
  return pageMetadata({
    title: name,
    description: isEnglish ? `Browse ${name} with Hadith numbers and English translations where available.` : `تصفح أحاديث ${name} كاملة مع أرقام الأحاديث والنصوص العربية.`,
    path: `/hadith/${slug}`,
  });
}

export default async function BookPage({ params, searchParams }: BookPageProps) {
  const { book: slug } = await params;
  const { page: pageStr } = await searchParams;
  const page = pageStr ? parseInt(pageStr, 10) : 1;
  
  const locale = await getRequestLocale();
  const isEnglish = locale === "en";
  const result = await getHadithBook(slug, page, 20, locale);
  
  if (!result || result.data.length === 0) {
    return notFound();
  }

  return (
    <Container className='py-12 space-y-6' dir={isEnglish ? "ltr" : "rtl"}>
      <div className="flex justify-between items-center">
        <h1 className='text-4xl font-bold text-brand-gold'>{result.name}</h1>
        <Badge variant="outline">{result.total} {isEnglish ? "Hadith" : "حديث"}</Badge>
      </div>

      <div className="grid gap-4">
        {result.data.map((h) => (
          <Link href={`/hadith/${slug}/${h.number}`} key={h.number}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-brand-gold">{isEnglish ? `Hadith ${h.number}` : `حديث رقم ${h.number}`}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='arabic-muted line-clamp-3 text-lg leading-relaxed' dir={isEnglish ? "ltr" : "rtl"}>
                  {isEnglish ? (h.english ?? "English translation unavailable.") : h.arab}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {result.pagination && result.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {page > 1 && (
            <Link href={`/hadith/${slug}?page=${page - 1}`}>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted p-2 px-4">{isEnglish ? "Previous" : "السابق"}</Badge>
            </Link>
          )}
          <Badge variant="secondary" className="p-2 px-4">{isEnglish ? `Page ${page} of ${result.pagination.totalPages}` : `صفحة ${page} من ${result.pagination.totalPages}`}</Badge>
          {page < result.pagination.totalPages && (
            <Link href={`/hadith/${slug}?page=${page + 1}`}>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted p-2 px-4">{isEnglish ? "Next" : "التالي"}</Badge>
            </Link>
          )}
        </div>
      )}
    </Container>
  );
}
