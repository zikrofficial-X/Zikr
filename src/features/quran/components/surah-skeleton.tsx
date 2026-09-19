import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';

export function SurahSkeleton() {
  return (
    <Container className='space-y-4 py-12'>
      <div className='h-10 w-48 animate-pulse rounded-lg bg-brand-gold/20' />
      <div className='space-y-3'>
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className='p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-4'>
                <div className='h-8 w-8 animate-pulse rounded-full bg-brand-gold/20' />
                <div className='h-6 w-32 animate-pulse rounded-lg bg-brand-gold/20' />
              </div>
              <div className='h-6 w-20 animate-pulse rounded-lg bg-brand-gold/20' />
            </div>
          </Card>
        ))}
      </div>
    </Container>
  );
}

export function AyahSkeleton() {
  return (
    <Container className='space-y-6 py-12'>
      <div className='space-y-2'>
        <div className='h-10 w-48 animate-pulse rounded-lg bg-brand-gold/20' />
        <div className='h-6 w-32 animate-pulse rounded-lg bg-brand-gold/20' />
      </div>
      
      {/* Audio Player Skeleton */}
      <Card className='space-y-4 p-4'>
        <div className='h-10 w-full animate-pulse rounded-lg bg-brand-gold/20' />
        <div className='h-2 w-full animate-pulse rounded-full bg-brand-gold/20' />
        <div className='h-6 w-24 animate-pulse rounded-lg bg-brand-gold/20' />
      </Card>

      {/* Ayahs Skeleton */}
      <div className='space-y-4'>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className='space-y-4 p-6'>
            <div className='space-y-2'>
              <div className='h-8 w-full animate-pulse rounded-lg bg-brand-gold/20' />
              <div className='h-8 w-5/6 animate-pulse rounded-lg bg-brand-gold/20' />
            </div>
            <div className='h-6 w-32 animate-pulse rounded-lg bg-brand-gold/20' />
          </Card>
        ))}
      </div>
    </Container>
  );
}
