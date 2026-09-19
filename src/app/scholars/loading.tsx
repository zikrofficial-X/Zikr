import { PageSkeleton } from '@/components/ui/page-skeleton';

export default function Loading() {
  return <PageSkeleton title="العلماء والمشايخ" cards={9} variant="grid" />;
}
