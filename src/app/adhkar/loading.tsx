import { Container } from '@/components/ui/container';

export default function AdhkarLoading() {
  return (
    <Container className="py-12 space-y-8">
      <div className="text-center space-y-4">
        <div className="h-10 bg-brand-gold/10 rounded-lg w-48 mx-auto animate-pulse" />
        <div className="h-5 bg-brand-cream/5 rounded w-80 mx-auto animate-pulse" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-brand-gold/10 bg-black/20 p-6 space-y-4 animate-pulse">
            <div className="h-6 bg-brand-gold/10 rounded w-3/4" />
            <div className="h-4 bg-brand-cream/5 rounded w-1/2" />
          </div>
        ))}
      </div>
    </Container>
  );
}
