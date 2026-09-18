import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'العلماء',
  description: 'سير وتراجم كبار علماء الإسلام: ابن تيمية، ابن القيم، النووي وغيرهم من الأئمة الأعلام.',
  path: '/scholars',
});

export default function ScholarsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
