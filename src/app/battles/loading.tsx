import { PageSkeleton } from '@/components/ui/page-skeleton';

export default function Loading() {
  return <PageSkeleton title="الغزوات والفتوحات" cards={6} variant="grid" />;
}
