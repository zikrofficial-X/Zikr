import { PageSkeleton } from '@/components/ui/page-skeleton';

export default function Loading() {
  return <PageSkeleton title="المفضلة" cards={6} variant="grid" />;
}
