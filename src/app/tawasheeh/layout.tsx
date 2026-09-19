import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'التواشيح',
  description: 'دليل تفاعلي للاستماع إلى التواشيح والابتهالات مع إظهار مصادر التسجيلات.',
  path: '/tawasheeh',
  noindex: true,
});

export default function TawasheehLayout({ children }: { children: React.ReactNode }) {
  return children;
}
