import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';

export default function QuranLoading() {
  return (
    <Container className='space-y-4 py-12'>
      <h1 className='text-3xl text-brand-gold'>القرآن الكريم</h1>
      <Card className='p-4 arabic-muted'>جاري تحميل المحتوى القرآني...</Card>
    </Container>
  );
}
