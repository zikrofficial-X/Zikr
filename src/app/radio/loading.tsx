import { PageSkeleton } from '@/components/ui/page-skeleton';

export default function Loading() {
  return <PageSkeleton title="الراديو الإسلامي" cards={6} variant="grid" />;
}
