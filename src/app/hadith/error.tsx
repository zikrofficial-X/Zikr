'use client';

import { PageError } from '@/components/ui/page-error';

export default function HadithError({ reset }: { error: Error; reset: () => void }) {
  return <PageError reset={reset} title="تعذّر تحميل الأحاديث" />;
}
