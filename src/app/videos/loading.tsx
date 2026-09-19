import { Container } from '@/components/ui/container';

export default function VideosLoading() {
  return (
    <Container className="py-12 space-y-8">
      <div className="text-center space-y-4">
        <div className="h-10 bg-brand-gold/10 rounded-lg w-44 mx-auto animate-pulse" />
        <div className="h-5 bg-brand-cream/5 rounded w-72 mx-auto animate-pulse" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-brand-gold/10 bg-black/20 overflow-hidden animate-pulse">
            <div className="aspect-video bg-brand-gold/5" />
            <div className="p-4 space-y-2">
              <div className="h-5 bg-brand-gold/10 rounded w-3/4" />
              <div className="h-4 bg-brand-cream/5 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
