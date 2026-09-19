import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'مواقيت الصلاة',
  description: 'مواقيت الصلاة اليوم حسب موقعك: الفجر والظهر والعصر والمغرب والعشاء مع العد التنازلي للصلاة القادمة.',
  path: '/prayer-times',
});

export default function PrayerTimesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
