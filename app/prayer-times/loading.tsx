import { Container } from '@/components/ui/container';

export default function PrayerTimesLoading() {
  return (
    <Container className="py-12 space-y-8">
      <div className="text-center space-y-4">
        <div className="h-10 bg-brand-gold/10 rounded-lg w-56 mx-auto animate-pulse" />
        <div className="h-5 bg-brand-cream/5 rounded w-72 mx-auto animate-pulse" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-brand-gold/10 bg-black/20 p-6 flex justify-between animate-pulse">
            <div className="h-6 bg-brand-gold/10 rounded w-24" />
            <div className="h-6 bg-brand-cream/5 rounded w-16" />
          </div>
        ))}
      </div>
    </Container>
  );
}
