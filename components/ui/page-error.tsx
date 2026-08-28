'use client';

import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';

interface PageErrorProps {
  reset: () => void;
  title?: string;
  description?: string;
}

export function PageError({
  reset,
  title = 'حدث خطأ',
  description = 'تعذّر تحميل هذه الصفحة. يرجى المحاولة مرة أخرى.',
}: PageErrorProps) {
  return (
    <Container className="py-20 flex items-center justify-center min-h-[50vh]">
      <Card className="max-w-md w-full text-center space-y-6 p-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-brand-gold">{title}</h2>
          <p className="text-brand-cream/70 leading-relaxed">{description}</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="primary">
            أعد المحاولة
          </Button>
          <Button href="/" variant="outline">
            الرئيسية
          </Button>
        </div>
      </Card>
    </Container>
  );
}
