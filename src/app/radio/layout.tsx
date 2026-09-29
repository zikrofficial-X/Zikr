import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'إذاعة ذِكرٌ — القرآن والتلاوات',
  description: 'استمع مباشرة إلى مجموعة موسعة من إذاعات القرآن الكريم والتلاوات، مع بحث وفلاتر ومحطة حالية وتحكم في الصوت.',
  path: '/radio',
});

export default function RadioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
