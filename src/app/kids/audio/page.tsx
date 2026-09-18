import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';
import KidsAudioHub from '@/features/kids/components/kids-audio-hub';

export const dynamic = 'force-static';

export const metadata: Metadata = pageMetadata({
  title: 'صوتيات الأطفال | ذكر',
  description: 'قصص وأناشيد وأذكار صوتية للأطفال مع تسجيل محلي آمن.',
  path: '/kids/audio',
});

export default function KidsAudioPage() {
  return <KidsAudioHub />;
}
