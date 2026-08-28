import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BookmarkButton } from '@/components/quran/bookmark-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { getHadithByNumber } from '@/lib/services/hadith';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Share2 } from 'lucide-react';
import Link from 'next/link';

interface HadithDetailPageProps {
  params: Promise<{ book: string; id: string }>;
}

export async function generateMetadata({ params }: HadithDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `حديث رقم ${id}`, description: 'قراءة الحديث النبوي الشريف' };
}

export default async function HadithDetail({ params }: HadithDetailPageProps) {
  const { book: bookSlug, id: hadithNumber } = await params;
  const num = parseInt(hadithNumber, 10);
  
  if (isNaN(num)) return notFound();
  
  const h = await getHadithByNumber(bookSlug, num);
  
  if (!h) return notFound();

  return (
    <Container className='py-12 max-w-4xl'>
      <Link href={`/hadith/${bookSlug}`}>
        <Button variant="ghost" className="mb-6">
          <ChevronLeft className="ml-2 h-4 w-4" />
          العودة للكتاب
        </Button>
      </Link>

      <Card className="shadow-lg">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className='text-2xl text-brand-gold text-center'>حديث رقم {h.number}</CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-8">
            <p className='text-3xl leading-relaxed text-right font-arabic' dir="rtl">
              {h.arab}
            </p>
            
            <div className='flex items-center justify-between pt-6 border-t'>
              <div className="flex gap-4">
                <BookmarkButton keyRef={`hadith:${bookSlug}:${h.number}`} />
                <Button variant="outline" size="sm" className="gap-2">
                  <Share2 className="h-4 w-4" />
                  مشاركة
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                المصدر: {bookSlug}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}
