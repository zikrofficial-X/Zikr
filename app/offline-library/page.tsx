import { pageMetadata } from '@/lib/site';
import type { Metadata } from 'next';
import OfflineLibraryClient from './offline-library-client';

export const metadata: Metadata = pageMetadata({
  title: 'مكتبة ذِكر الأوفلاين',
  description:
    'مكتبة ذِكر الأوفلاين للمحتويات العامة المتاحة بدون اتصال بالإنترنت مع دعم PWA وCache Storage وIndexedDB.',
  path: '/offline-library',
});

export default function OfflineLibraryPage() {
  return <OfflineLibraryClient />;
}
