import { Container } from '@/components/ui/container';

export default function RootLoading() {
  return (
    <Container className="py-20 flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-brand-gold/30 border-t-brand-gold animate-spin" />
        <p className="text-brand-cream/60 text-sm">جاري التحميل...</p>
      </div>
    </Container>
  );
}
