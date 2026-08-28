import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { getHadithBook } from '@/lib/services/hadith';
import { Badge } from '@/components/ui/badge';

import { pageMetadata } from '@/lib/site';
import type { Metadata } from 'next';

interface BookPageProps {
  params: Promise<{ book: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  const { book: slug } = await params;
  const result = await getHadithBook(slug, 1, 1).catch(() => null);
  const name = result?.name ?? 'كتاب الحديث';
  return pageMetadata({
    title: name,
    description: `تصفح أحاديث ${name} كاملة مع أرقام الأحاديث والنصوص العربية.`,
    path: `/hadith/${slug}`,
  });
}

export default async function BookPage({ params, searchParams }: BookPageProps) {
  const { book: slug } = await params;
  const { page: pageStr } = await searchParams;
  const page = pageStr ? parseInt(pageStr, 10) : 1;
  
  const result = await getHadithBook(slug, page, 20);
  
  if (!result || result.data.length === 0) {
    return notFound();
  }

  return (
    <Container className='py-12 space-y-6'>
      <div className="flex justify-between items-center">
        <h1 className='text-4xl font-bold text-brand-gold'>{result.name}</h1>
        <Badge variant="outline">{result.total} حديث</Badge>
      </div>

      <div className="grid gap-4">
        {result.data.map((h) => (
          <Link href={`/hadith/${slug}/${h.number}`} key={h.number}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-brand-gold">حديث رقم {h.number}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='arabic-muted line-clamp-3 text-lg leading-relaxed' dir="rtl">
                  {h.arab}
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
              <Badge variant="outline" className="cursor-pointer hover:bg-muted p-2 px-4">السابق</Badge>
            </Link>
          )}
          <Badge variant="secondary" className="p-2 px-4">صفحة {page} من {result.pagination.totalPages}</Badge>
          {page < result.pagination.totalPages && (
            <Link href={`/hadith/${slug}?page=${page + 1}`}>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted p-2 px-4">التالي</Badge>
            </Link>
          )}
        </div>
      )}
    </Container>
  );
}
