import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'الرفيق الروحاني',
  description: 'مساعد ذكي يجيب على أسئلتك الإيمانية ويقترح أذكارًا وأدعية مناسبة لحالتك.',
  path: '/spiritual-ai',
});

export default function SpiritualAiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
