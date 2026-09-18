'use client';

import { PageError } from '@/components/ui/page-error';

export default function AdhkarError({ reset }: { error: Error; reset: () => void }) {
  return <PageError reset={reset} title="تعذّر تحميل الأذكار" />;
}
