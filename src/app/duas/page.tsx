import { permanentRedirect } from 'next/navigation';

export default function DuasAliasPage() {
  permanentRedirect('/dua');
}

export const dynamic = 'force-static';
export const revalidate = 3600;

export const metadata = {
  title: 'الأدعية الإسلامية | ذِكر',
  description: 'الانتقال إلى مجموعة الأدعية الإسلامية المأثورة في منصة ذِكر.',
};

