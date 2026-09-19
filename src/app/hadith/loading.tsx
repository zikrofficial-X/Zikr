import { Container } from '@/components/ui/container';

export default function HadithLoading() {
  return (
    <Container className="py-12 space-y-8">
      <div className="text-center space-y-4">
        <div className="h-10 bg-brand-gold/10 rounded-lg w-40 mx-auto animate-pulse" />
        <div className="h-5 bg-brand-cream/5 rounded w-80 mx-auto animate-pulse" />
      </div>
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-brand-gold/10 bg-black/20 p-6 space-y-4 animate-pulse">
            <div className="h-5 bg-brand-gold/10 rounded w-1/4" />
            <div className="space-y-2">
              <div className="h-4 bg-brand-cream/5 rounded w-full" />
              <div className="h-4 bg-brand-cream/5 rounded w-5/6" />
              <div className="h-4 bg-brand-cream/5 rounded w-4/6" />
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
