import { PageSkeleton } from '@/components/ui/page-skeleton';

export default function Loading() {
  return <PageSkeleton title="الملف الشخصي" cards={6} variant="detail" />;
}
