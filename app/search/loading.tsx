import { PageSkeleton } from '@/components/ui/page-skeleton';

export default function Loading() {
  return <PageSkeleton title="البحث" cards={8} variant="list" />;
}
