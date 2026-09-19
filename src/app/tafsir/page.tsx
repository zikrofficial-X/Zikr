import { getTafsirSourcesFromDb } from '@/features/quran/services/quran-server';
import TafsirLibrary from '@/features/quran/components/tafsir-library';
import { pageMetadata } from '@/lib/site';

export const dynamic = 'force-dynamic';

export const metadata = pageMetadata({
  title: 'تفسير القرآن الكريم',
  description: 'مصادر التفسير المتاحة فعليًا داخل خدمة القرآن في منصة ذِكر.',
  path: '/tafsir',
});

export default async function TafsirPage() {
  const sources = await getTafsirSourcesFromDb();
  return <TafsirLibrary sources={sources} />;
}
