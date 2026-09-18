import { SiteAudioManager } from '@/features/admin/components/site-audio-manager';

export default function SiteAudioAdminPage() {
  return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-7 sm:py-10"><div className="mb-7"><p className="text-sm text-brand-gold/70">إدارة الصوت</p><h1 className="mt-1 text-3xl font-bold text-brand-gold">مقاطع الأذان والتذكير</h1><p className="mt-2 text-brand-cream/60">إدارة الصوت الذي يسمعه مستخدمو منصة ذِكر.</p></div><SiteAudioManager /></div>;
}
