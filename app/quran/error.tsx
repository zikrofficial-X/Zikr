'use client';

import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';

export default function QuranError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error('[quran] route error:', error);
  }, [error]);

  return (
    <Container className='py-12'>
      <Card className='p-4 arabic-muted'>تعذر تحميل بيانات القرآن الآن. يرجى المحاولة لاحقًا.</Card>
    </Container>
  );
}
