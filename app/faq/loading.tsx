import { PageSkeleton } from '@/components/ui/page-skeleton';

export default function Loading() {
  return <PageSkeleton title="الأسئلة الشائعة" cards={6} variant="list" />;
}
