import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'التواشيح',
  description: 'استمع إلى التواشيح والابتهالات الدينية بأصوات كبار المنشدين والمبتهلين.',
  path: '/tawasheeh',
});

export default function TawasheehLayout({ children }: { children: React.ReactNode }) {
  return children;
}
