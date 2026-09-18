import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';
import KidsAchievementsBoard from '@/components/kids/kids-achievements-board';

export const dynamic = 'force-static';

export const metadata: Metadata = pageMetadata({
  title: 'إنجازات الأطفال | ذكر',
  description: 'نجوم وشارات ولوحة شرف محلية تشجع الأطفال على التعلم والذكر.',
  path: '/kids/achievements',
});

export default function KidsAchievementsPage() {
  return <KidsAchievementsBoard />;
}
