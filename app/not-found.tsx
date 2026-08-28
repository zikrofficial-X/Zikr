import { Card } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <Container className="py-16">
      <Card className="max-w-md mx-auto space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-brand-gold">404</h1>
          <p className="text-lg text-brand-cream">الصفحة غير موجودة</p>
          <p className="text-sm arabic-muted">
            عذراً، الصفحة التي تبحث عنها غير موجودة أو تم حذفها
          </p>
        </div>
        <div className="space-y-3">
          <Button href="/" className="w-full">
            العودة للرئيسية
          </Button>
          <Button href="/search" variant="secondary" className="w-full">
            البحث
          </Button>
        </div>
      </Card>
    </Container>
  );
}
