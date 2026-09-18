import { PageSkeleton } from '@/components/ui/page-skeleton';

export default function Loading() {
  return <PageSkeleton title="الفتوحات الإسلامية" cards={6} variant="grid" />;
}
