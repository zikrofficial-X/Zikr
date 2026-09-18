'use client';

import { Container } from '@/components/ui/container';

interface PageSkeletonProps {
  title?: string;
  cards?: number;
  variant?: 'grid' | 'list' | 'detail';
}

export function PageSkeleton({ title, cards = 6, variant = 'grid' }: PageSkeletonProps) {
  return (
    <Container className="py-10 space-y-8 animate-pulse">
      {/* Page title skeleton */}
      <div className="space-y-3">
        {title ? (
          <h1 className="text-3xl text-brand-gold font-amiri">{title}</h1>
        ) : (
          <div className="h-8 w-48 rounded-lg bg-brand-cream/10" />
        )}
        <div className="h-4 w-72 rounded bg-brand-cream/8" />
      </div>

      {/* Search / filter bar skeleton */}
      <div className="h-12 w-full max-w-lg rounded-xl bg-brand-cream/8" />

      {/* Cards grid or list */}
      {variant === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: cards }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-brand-cream/8 h-40" />
          ))}
        </div>
      ) : variant === 'list' ? (
        <div className="space-y-4">
          {Array.from({ length: cards }).map((_, i) => (
            <div key={i} className="rounded-xl bg-brand-cream/8 h-20 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl bg-brand-cream/8 h-64 w-full" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 rounded bg-brand-cream/8" style={{ width: `${90 - i * 10}%` }} />
            ))}
          </div>
        </div>
      )}
    </Container>
  );
}
